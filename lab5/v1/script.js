const STORAGE_KEY = "hangmanPlayers";
const SESSION_COOKIE = "hangmanPlayer";
const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
const DRAWINGS = [
  "data/images/stage0.png",
  "data/images/stage1.png",
  "data/images/stage2.png",
  "data/images/stage3.png",
  "data/images/stage4.png",
  "data/images/stage5.png",
  "data/images/stage6.png"
];

let players = loadPlayers();
let currentPlayer = null;
let currentWord = null;
let guessedLetters = [];
let mistakes = 0;
let roundScore = 0;
let roundActive = false;
let roundDifficulty = "easy";
let hintUsed = false;

const $ = (id) => document.getElementById(id);

function loadPlayers() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; }
  catch { return []; }
}
function savePlayers() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(players));
}
function setCookie(name, value, days = 7) {
  const expires = new Date(Date.now() + days * 86400000).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
}
function getCookie(name) {
  const entry = document.cookie.split("; ").find(row => row.startsWith(name + "="));
  return entry ? decodeURIComponent(entry.split("=").slice(1).join("=")) : "";
}
function clearCookie(name) {
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Lax`;
}
function showAuthMessage(message) { $("authMessage").textContent = message; }
function showGameMessage(message) { $("gameMessage").textContent = message; }

function enterPlayer(player) {
  currentPlayer = player;
  setCookie(SESSION_COOKIE, player.username);
  $("authPanel").classList.add("hidden");
  $("gamePanel").classList.remove("hidden");
  $("sessionArea").classList.remove("hidden");
  $("welcomeText").textContent = `Hello, ${player.username}`;
  $("totalPoints").textContent = player.totalPoints || 0;
  renderLeaderboards();
  showGameMessage("Choose a difficulty and start a round.");
}

function createPlayer() {
  const username = $("username").value.trim();
  const passcode = $("passcode").value;
  const confirmation = $("confirmPasscode").value;
  if (!username || !passcode) return showAuthMessage("Enter a username and passcode.");
  if (passcode !== confirmation) return showAuthMessage("The passcodes do not match.");
  if (players.some(p => p.username.toLowerCase() === username.toLowerCase())) {
    return showAuthMessage("That username already exists. Sign in instead.");
  }
  const player = { username, passcode, totalPoints: 0, easyPoints: 0, normalPoints: 0 };
  players.push(player);
  savePlayers();
  enterPlayer(player);
}

function signIn() {
  const username = $("username").value.trim();
  const passcode = $("passcode").value;
  const player = players.find(p => p.username.toLowerCase() === username.toLowerCase() && p.passcode === passcode);
  if (!player) return showAuthMessage("Username or passcode is incorrect.");
  enterPlayer(player);
}

function logout() {
  currentPlayer = null;
  clearCookie(SESSION_COOKIE);
  $("gamePanel").classList.add("hidden");
  $("sessionArea").classList.add("hidden");
  $("authPanel").classList.remove("hidden");
  $("authForm").reset();
  showAuthMessage("You have logged out.");
  finishRoundUI();
}

function restoreSession() {
  const remembered = getCookie(SESSION_COOKIE);
  if (remembered) {
    const player = players.find(p => p.username === remembered);
    if (player) enterPlayer(player);
  }
}

async function startGame() {
  if (!currentPlayer) return;
  roundDifficulty = $("difficulty").value;
  try {
    const response = await fetch(`data/${roundDifficulty}.json`);
    if (!response.ok) throw new Error("Word list not found");
    const wordList = await response.json();
    if (!Array.isArray(wordList) || wordList.length === 0) throw new Error("Word list is empty");
    currentWord = wordList[Math.floor(Math.random() * wordList.length)];
    if (!currentWord.word || !currentWord.hint) throw new Error("Word list has invalid data");
    guessedLetters = [];
    mistakes = 0;
    roundScore = 0;
    hintUsed = false;
    roundActive = true;
    $("difficultyBadge").textContent = roundDifficulty[0].toUpperCase() + roundDifficulty.slice(1);
    $("hintText").textContent = "Available";
    $("hintBtn").disabled = false;
    $("endBtn").disabled = false;
    showGameMessage("Game started. Guess a letter.");
    renderGame();
  } catch (error) {
    showGameMessage("Could not load the word list. Check that the JSON file exists and use a local server.");
  }
}

function renderGame() {
  $("hangmanDrawing").src = DRAWINGS[Math.min(mistakes, 6)];
  $("mistakes").textContent = mistakes;
  $("roundScore").textContent = roundScore;
  $("wordDisplay").textContent = currentWord
    ? currentWord.word.toUpperCase().split("").map(letter => guessedLetters.includes(letter) ? letter : "_").join(" ")
    : "_ _ _ _ _";
  $("keyboard").innerHTML = "";
  LETTERS.forEach(letter => {
    const button = document.createElement("button");
    button.textContent = letter;
    button.type = "button";
    button.disabled = !roundActive || guessedLetters.includes(letter);
    if (guessedLetters.includes(letter)) button.classList.add("used");
    button.addEventListener("click", () => guessLetter(letter));
    $("keyboard").appendChild(button);
  });
}

function guessLetter(letter) {
  if (!roundActive || guessedLetters.includes(letter)) return;
  guessedLetters.push(letter);
  const word = currentWord.word.toUpperCase();
  if (word.includes(letter)) {
    roundScore += word.split("").filter(ch => ch === letter).length;
    showGameMessage("Correct guess!");
  } else {
    mistakes++;
    showGameMessage("Not in the word.");
  }
  renderGame();
  if (word.split("").every(ch => guessedLetters.includes(ch))) endGame("won");
  else if (mistakes >= 6) endGame("lost");
}

function useHint() {
  if (!roundActive || hintUsed) return;
  hintUsed = true;
  roundScore = Math.max(0, roundScore - 1);
  $("hintText").textContent = currentWord.hint;
  $("hintBtn").disabled = true;
  $("roundScore").textContent = roundScore;
  showGameMessage("Hint revealed. One point was deducted if available.");
}

function endRound() {
  if (roundActive) endGame("ended");
}

function endGame(result) {
  if (!roundActive) return;
  roundActive = false;
  currentPlayer.totalPoints = (currentPlayer.totalPoints || 0) + roundScore;
  if (result === "won") {
    const key = roundDifficulty === "easy" ? "easyPoints" : "normalPoints";
    currentPlayer[key] = (currentPlayer[key] || 0) + roundScore;
  }
  savePlayers();
  $("totalPoints").textContent = currentPlayer.totalPoints;
  $("hintBtn").disabled = true;
  $("endBtn").disabled = true;
  renderGame();
  renderLeaderboards();
  if (result === "won") showGameMessage(`You won! The word was ${currentWord.word.toUpperCase()}. You earned ${roundScore} points.`);
  else if (result === "lost") showGameMessage(`You ran out of guesses. The word was ${currentWord.word.toUpperCase()}. You earned ${roundScore} points.`);
  else showGameMessage(`Round ended. The word was ${currentWord.word.toUpperCase()}. Your earned points were saved.`);
}

function renderLeaderboards() {
  ["easy", "normal"].forEach(level => {
    const scoreKey = level === "easy" ? "easyPoints" : "normalPoints";
    const list = [...players].sort((a, b) => (b[scoreKey] || 0) - (a[scoreKey] || 0)).slice(0, 3);
    const target = $(level === "easy" ? "easyBoard" : "normalBoard");
    target.innerHTML = "";
    if (!list.length) {
      const li = document.createElement("li"); li.textContent = "No scores yet"; target.appendChild(li);
    } else {
      list.forEach(player => {
        const li = document.createElement("li");
        li.textContent = `${player.username} - ${player[scoreKey] || 0} points`;
        target.appendChild(li);
      });
    }
  });
}
function finishRoundUI() {
  roundActive = false;
  $("hintBtn").disabled = true;
  $("endBtn").disabled = true;
}

$("authForm").addEventListener("submit", event => {
  event.preventDefault();
  createPlayer();
});
$("signinBtn").addEventListener("click", signIn);
$("logoutBtn").addEventListener("click", logout);
$("startBtn").addEventListener("click", startGame);
$("hintBtn").addEventListener("click", useHint);
$("endBtn").addEventListener("click", endRound);
$("confirmPasscode").addEventListener("input", () => { });
$("confirmWrap").classList.remove("hidden");

restoreSession();
renderGame();
