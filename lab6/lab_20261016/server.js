import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PUBLIC_DIR = path.join(__dirname, 'public');
const DATA_DIR = path.join(__dirname, 'data');
const PORT = 3000;
const games = new Map();
const MIME_TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.svg': 'image/svg+xml', '.ico': 'image/x-icon' };

function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(data));
}
async function readRequestBody(req) {
  let raw = '';
  for await (const chunk of req) { raw += chunk; if (raw.length > 100_000) throw new Error('Request body too large'); }
  if (!raw) return {};
  return JSON.parse(raw);
}
async function loadWordList(difficulty) {
  if (!['easy', 'normal'].includes(difficulty)) { const e = new Error('Invalid difficulty'); e.statusCode = 400; throw e; }
  const text = await readFile(path.join(DATA_DIR, `${difficulty}.json`), 'utf8');
  const words = JSON.parse(text);
  if (!Array.isArray(words)) throw new Error('Invalid word list');
  const valid = words.filter(item => item && typeof item.word === 'string' && item.word.trim() && typeof item.hint === 'string' && item.hint.trim());
  if (!valid.length) throw new Error('Empty word list');
  return valid;
}
function publicGameState(game) {
  return { gameId: game.id, difficulty: game.difficulty, maskedWord: game.word.split('').map(c => game.guessedLetters.includes(c) ? c : '_').join(' '), hint: game.hintUsed ? game.hint : 'Use the hint button when you need help.', mistakes: game.mistakes, score: game.score, status: game.status, hintUsed: game.hintUsed };
}
async function handleApi(req, res, url) {
  let body;
  try { body = await readRequestBody(req); } catch { return sendJson(res, 400, { error: 'Invalid JSON request body.' }); }
  try {
    if (req.method === 'POST' && url.pathname === '/api/start') {
      const difficulty = String(body.difficulty || '').toLowerCase();
      const words = await loadWordList(difficulty);
      const selected = words[Math.floor(Math.random() * words.length)];
      const game = { id: randomUUID(), difficulty, word: selected.word.trim().toUpperCase(), hint: selected.hint, guessedLetters: [], mistakes: 0, score: 0, hintUsed: false, status: 'playing' };
      games.set(game.id, game);
      return sendJson(res, 200, publicGameState(game));
    }
    if (req.method === 'POST' && url.pathname === '/api/guess') {
      const game = games.get(String(body.gameId || ''));
      const letter = String(body.letter || '').toUpperCase();
      if (!game) return sendJson(res, 404, { error: 'Game not found. Start a new round.' });
      if (game.status !== 'playing') return sendJson(res, 409, { error: 'This round has already ended.' });
      if (!/^[A-Z]$/.test(letter)) return sendJson(res, 400, { error: 'Guess must be one letter from A to Z.' });
      if (game.guessedLetters.includes(letter)) return sendJson(res, 400, { error: 'That letter has already been guessed.' });
      game.guessedLetters.push(letter);
      const occurrences = game.word.split('').filter(c => c === letter).length;
      if (occurrences) game.score += occurrences; else game.mistakes++;
      if (game.word.split('').every(c => game.guessedLetters.includes(c))) game.status = 'won';
      else if (game.mistakes >= 6) game.status = 'lost';
      return sendJson(res, 200, { ...publicGameState(game), correct: occurrences > 0, occurrences, answer: game.status === 'playing' ? undefined : game.word });
    }
    if (req.method === 'POST' && url.pathname === '/api/hint') {
      const game = games.get(String(body.gameId || ''));
      if (!game) return sendJson(res, 404, { error: 'Game not found. Start a new round.' });
      if (game.status !== 'playing') return sendJson(res, 409, { error: 'This round has already ended.' });
      if (game.hintUsed) return sendJson(res, 409, { error: 'The hint has already been used.' });
      game.hintUsed = true; game.score = Math.max(0, game.score - 1);
      return sendJson(res, 200, publicGameState(game));
    }
    if (req.method === 'POST' && url.pathname === '/api/end') {
      const game = games.get(String(body.gameId || ''));
      if (!game) return sendJson(res, 404, { error: 'Game not found.' });
      if (game.status === 'playing') game.status = 'ended';
      return sendJson(res, 200, { ...publicGameState(game), finalScore: game.score, answer: game.word });
    }
    return sendJson(res, 404, { error: 'API route not found.' });
  } catch (error) {
    console.error('API error:', error.message);
    if (error.statusCode) return sendJson(res, error.statusCode, { error: error.message });
    if (error.code === 'ENOENT') return sendJson(res, 500, { error: 'The server could not find the selected word list.' });
    return sendJson(res, 500, { error: 'The server could not process the request. Check the word-list JSON files.' });
  }
}
async function serveStatic(req, res, url) {
  let pathname;
  try { pathname = decodeURIComponent(url.pathname); } catch { res.writeHead(400); return res.end('Bad request'); }
  if (pathname === '/') pathname = '/index.html';
  const requestedPath = path.resolve(PUBLIC_DIR, `.${pathname}`);
  if (requestedPath !== PUBLIC_DIR && !requestedPath.startsWith(PUBLIC_DIR + path.sep)) { res.writeHead(403); return res.end('Forbidden'); }
  try {
    const content = await readFile(requestedPath);
    res.writeHead(200, { 'Content-Type': MIME_TYPES[path.extname(requestedPath).toLowerCase()] || 'application/octet-stream', 'X-Content-Type-Options': 'nosniff' });
    res.end(content);
  } catch (error) {
    res.writeHead(error.code === 'ENOENT' ? 404 : 500, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end(error.code === 'ENOENT' ? 'File not found' : 'Could not read requested file');
  }
}
const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  if (url.pathname.startsWith('/api/')) return handleApi(req, res, url);
  if (req.method !== 'GET' && req.method !== 'HEAD') { res.writeHead(405, { Allow: 'GET, HEAD' }); return res.end('Method not allowed'); }
  return serveStatic(req, res, url);
});
server.listen(PORT, '127.0.0.1', () => {
  console.log(`Hangman server running at http://localhost:${PORT}`);
  console.log('Private word lists are stored in ./data and are not served as static files.');
});
