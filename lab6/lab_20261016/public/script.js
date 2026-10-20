const STORAGE_KEY = 'hangmanPlayers';
const SESSION_COOKIE = 'hangmanPlayer';
const MAX_PHOTO_BYTES = 500 * 1024;
const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const HANGMAN_IMAGES = [
  'hangman/stage1.png','hangman/stage2.png','hangman/stage3.png',
  'hangman/stage4.png','hangman/stage5.png','hangman/stage6.png','hangman/stage7.png'
];
let players = loadPlayers();
let currentPlayer = null;
let gameId = null;
let maskedWord = '';
let answerWord = '';
let hintText = 'Start a game to reveal a hint.';
let guessedLetters = [];
let mistakes = 0;
let roundScore = 0;
let roundActive = false;
let roundDifficulty = 'easy';
let hintUsed = false;
let roundSaved = false;
let authMode = 'create';
const $ = id => document.getElementById(id);

function loadPlayers() {
  try { const value = JSON.parse(localStorage.getItem(STORAGE_KEY)); return Array.isArray(value) ? value : []; }
  catch { return []; }
}
function savePlayers() { localStorage.setItem(STORAGE_KEY, JSON.stringify(players)); }
function setCookie(name, value, days = 7) {
  const expires = new Date(Date.now() + days * 86400000).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
}
function getCookie(name) {
  const entry = document.cookie.split('; ').find(row => row.startsWith(name + '='));
  return entry ? decodeURIComponent(entry.substring(name.length + 1)) : '';
}
function clearCookie(name) { document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Lax`; }
function showAuthMessage(message) { $('authMessage').textContent = message; }
function showGameMessage(message) { $('gameMessage').textContent = message; }
function setAuthMode(mode) {
  authMode = mode;
  const creating = mode === 'create';
  $('authTitle').textContent = creating ? 'Create your player' : 'Welcome back';
  $('createBtn').textContent = creating ? 'Create player' : 'Create a new player';
  $('signinBtn').textContent = creating ? 'I already have an account' : 'Sign in instead';
  $('confirmWrap').classList.toggle('hidden', !creating);
  $('confirmPasscode').required = creating;
  $('passcode').autocomplete = creating ? 'new-password' : 'current-password';
  showAuthMessage('');
}
function createPlayer() {
  const username = $('username').value.trim();
  const passcode = $('passcode').value;
  if (!username || !passcode) return showAuthMessage('Enter a username and passcode.');
  if (username.length < 2) return showAuthMessage('Username must contain at least two characters.');
  if (passcode !== $('confirmPasscode').value) return showAuthMessage('The passcodes do not match.');
  if (players.some(p => p.username.toLowerCase() === username.toLowerCase())) return showAuthMessage('That username already exists. Sign in instead.');
  const player = { username, passcode, theme:'light', photo:'', totalPoints:0, easyPoints:0, normalPoints:0 };
  players.push(player); savePlayers(); enterPlayer(player); $('authForm').reset();
}
function signIn() {
  const username = $('username').value.trim();
  const passcode = $('passcode').value;
  const player = players.find(p => p.username.toLowerCase() === username.toLowerCase() && p.passcode === passcode);
  if (!player) return showAuthMessage('Username or passcode is incorrect.');
  enterPlayer(player); $('authForm').reset();
}
function enterPlayer(player) {
  currentPlayer = player; setCookie(SESSION_COOKIE, player.username);
  $('authPanel').classList.add('hidden'); $('gamePanel').classList.remove('hidden'); $('sessionArea').classList.remove('hidden');
  $('welcomeText').textContent = player.username; $('profileName').textContent = player.username;
  $('themeSelect').value = player.theme || 'light'; applyTheme(player.theme || 'light'); renderAvatar(); updateScoreDisplay(); renderLeaderboards();
  showGameMessage('Choose a difficulty and start a round.');
}
function logout() {
  if (roundActive) return showGameMessage('End the current round before logging out so your points can be saved.');
  currentPlayer = null; clearCookie(SESSION_COOKIE); $('gamePanel').classList.add('hidden'); $('sessionArea').classList.add('hidden'); $('authPanel').classList.remove('hidden'); $('authForm').reset(); setAuthMode('create'); showAuthMessage('You have logged out.');
}
function restoreSession() {
  const username = getCookie(SESSION_COOKIE);
  if (!username) return;
  const player = players.find(p => p.username === username);
  if (player) enterPlayer(player); else clearCookie(SESSION_COOKIE);
}
function applyTheme(theme) { document.body.classList.toggle('dark-theme', theme === 'dark'); }
function saveTheme() { if (!currentPlayer) return; currentPlayer.theme = $('themeSelect').value; applyTheme(currentPlayer.theme); savePlayers(); }
function renderAvatar() {
  [$('profileAvatar'), $('headerAvatar')].forEach(target => {
    target.innerHTML = '';
    if (currentPlayer?.photo) { const img = document.createElement('img'); img.src = currentPlayer.photo; img.alt = `${currentPlayer.username}'s profile picture`; target.appendChild(img); }
    else target.textContent = currentPlayer ? currentPlayer.username.charAt(0).toUpperCase() : '?';
  });
}
function uploadPhoto(event) {
  const file = event.target.files[0]; if (!file) return;
  if (!file.type.startsWith('image/')) { $('photoMessage').textContent = 'Please choose an image file.'; event.target.value = ''; return; }
  if (file.size > MAX_PHOTO_BYTES) { $('photoMessage').textContent = 'Image is too large. Please choose a file smaller than 500 KB.'; event.target.value = ''; return; }
  const reader = new FileReader();
  reader.onload = () => { try { currentPlayer.photo = reader.result; savePlayers(); renderAvatar(); $('photoMessage').textContent = 'Profile picture saved.'; } catch { $('photoMessage').textContent = 'The picture could not be saved. Try a smaller image.'; } };
  reader.onerror = () => { $('photoMessage').textContent = 'The picture could not be read.'; };
  reader.readAsDataURL(file);
}
async function postJson(route, payload) {
  const response = await fetch(route, { method:'POST', headers:{ 'Content-Type':'application/json' }, body:JSON.stringify(payload) });
  let data;
  try { data = await response.json(); } catch { throw new Error('The server returned an unreadable response.'); }
  if (!response.ok) throw new Error(data.error || `Request failed (${response.status}).`);
  return data;
}
async function startGame() {
  if (!currentPlayer) return;
  if (roundActive) return showGameMessage('Finish the current round before starting another.');
  roundDifficulty = $('difficulty').value;
  try {
    const state = await postJson('/api/start', { difficulty:roundDifficulty });
    gameId = state.gameId; maskedWord = state.maskedWord; answerWord = ''; guessedLetters = [];
    mistakes = state.mistakes; roundScore = state.score; hintUsed = state.hintUsed; hintText = state.hint;
    roundActive = true; roundSaved = false;
    $('difficultyBadge').textContent = roundDifficulty === 'easy' ? 'Easy' : 'Normal';
    $('hintText').textContent = hintText; $('hintBtn').disabled = false; $('endBtn').disabled = false;
    $('startBtn').disabled = true; $('difficulty').disabled = true;
    showGameMessage('Round started. Choose a letter.'); renderGame();
  } catch (error) { showGameMessage(`Could not start the round: ${error.message} Check that both JSON files exist in the server's data folder.`); }
}
function applyGameState(state) {
  maskedWord = state.maskedWord ?? maskedWord; mistakes = state.mistakes ?? mistakes; roundScore = state.score ?? roundScore;
  hintUsed = state.hintUsed ?? hintUsed; if (state.hint && hintUsed) hintText = state.hint;
  if (state.answer) answerWord = state.answer;
}
function renderGame() {
  const stage = Math.min(mistakes, HANGMAN_IMAGES.length - 1);
  $('hangmanDrawing').src = HANGMAN_IMAGES[stage]; $('hangmanDrawing').alt = `Hangman stage ${stage + 1}; ${mistakes} incorrect guesses`;
  $('mistakes').textContent = mistakes; $('roundScore').textContent = roundScore;
  $('wordDisplay').textContent = maskedWord || '_ _ _ _ _';
  $('hintText').textContent = hintText;
  $('guessedLetters').textContent = guessedLetters.length ? guessedLetters.join(', ') : 'None yet';
  $('keyboard').innerHTML = '';
  LETTERS.forEach(letter => { const button = document.createElement('button'); button.type = 'button'; button.textContent = letter; button.disabled = !roundActive || guessedLetters.includes(letter); button.setAttribute('aria-label', `Guess ${letter}`); button.addEventListener('click', () => guessLetter(letter)); $('keyboard').appendChild(button); });
}
async function guessLetter(letter) {
  if (!roundActive || guessedLetters.includes(letter)) return;
  try {
    const state = await postJson('/api/guess', { gameId, letter });
    guessedLetters.push(letter); applyGameState(state); renderGame();
    if (state.correct) showGameMessage(`Correct! ${letter} appears ${state.occurrences} time${state.occurrences === 1 ? '' : 's'}.`);
    else showGameMessage('That letter is not in the word.');
    if (state.status === 'won' || state.status === 'lost') await finishGame(state.status, state.answer);
  } catch (error) { showGameMessage(`Could not check that guess: ${error.message}`); }
}
async function useHint() {
  if (!roundActive || hintUsed) return;
  try {
    const state = await postJson('/api/hint', { gameId }); applyGameState(state); hintText = state.hint; $('hintBtn').disabled = true; renderGame();
    showGameMessage('Hint revealed. One point was deducted if you had a point available.');
  } catch (error) { showGameMessage(`Could not use hint: ${error.message}`); }
}
async function endRound() {
  if (!roundActive) return;
  try { const state = await postJson('/api/end', { gameId }); applyGameState(state); await finishGame('ended', state.answer); }
  catch (error) { showGameMessage(`Could not end the round: ${error.message}`); }
}
async function finishGame(result, answer = '') {
  if (!roundActive || roundSaved) return;
  roundActive = false; roundSaved = true; answerWord = answer || answerWord;
  currentPlayer.totalPoints = (currentPlayer.totalPoints || 0) + roundScore;
  const key = roundDifficulty === 'easy' ? 'easyPoints' : 'normalPoints';
  currentPlayer[key] = (currentPlayer[key] || 0) + roundScore; savePlayers(); updateScoreDisplay(); renderLeaderboards();
  $('hintBtn').disabled = true; $('endBtn').disabled = true; $('startBtn').disabled = false; $('difficulty').disabled = false; renderGame();
  if (result === 'won') showGameMessage(`You won! The word was ${answerWord}. You earned ${roundScore} points.`);
  else if (result === 'lost') showGameMessage(`No guesses left. The word was ${answerWord}. You kept ${roundScore} points.`);
  else showGameMessage(`Round ended. The word was ${answerWord}. Your ${roundScore} earned points were saved.`);
}
function updateScoreDisplay() { $('totalPoints').textContent = currentPlayer ? currentPlayer.totalPoints || 0 : 0; }
function renderLeaderboards() {
  ['easy','normal'].forEach(level => {
    const scoreKey = level === 'easy' ? 'easyPoints' : 'normalPoints';
    const list = [...players].sort((a,b) => ((b[scoreKey] || 0) - (a[scoreKey] || 0)) || a.username.localeCompare(b.username)).slice(0,3);
    const target = $(level === 'easy' ? 'easyBoard' : 'normalBoard'); target.innerHTML = '';
    if (!list.length) { const li = document.createElement('li'); li.textContent = 'No scores yet'; target.appendChild(li); return; }
    list.forEach(player => { const li = document.createElement('li'); li.textContent = `${player.username} - ${player[scoreKey] || 0} points`; target.appendChild(li); });
  });
}
$('authForm').addEventListener('submit', event => { event.preventDefault(); if (authMode === 'create') createPlayer(); else signIn(); });
$('signinBtn').addEventListener('click', () => setAuthMode(authMode === 'create' ? 'signin' : 'create'));
$('logoutBtn').addEventListener('click', logout); $('startBtn').addEventListener('click', startGame);
$('hintBtn').addEventListener('click', useHint); $('endBtn').addEventListener('click', endRound);
$('themeSelect').addEventListener('change', saveTheme); $('photoInput').addEventListener('change', uploadPhoto);
setAuthMode('create'); renderGame(); restoreSession();
