const STORAGE_KEY = "hangmanPlayers";
const SESSION_COOKIE = "hangmanPlayer";
const MAX_PHOTO_BYTES = 500 * 1024;
const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
// Seven supplied images represent zero through six incorrect guesses.
const HANGMAN_IMAGES = [
  "hangman/stage1.png",
  "hangman/stage2.png",
  "hangman/stage3.png",
  "hangman/stage4.png",
  "hangman/stage5.png",
  "hangman/stage6.png",
  "hangman/stage7.png"
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
let roundSaved = false;
let authMode = "create";

const $ = (id) => document.getElementById(id);

function loadPlayers() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return Array.isArray(saved) ? saved : [];
  } catch (error) {
    return [];
  }
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
  return entry ? decodeURIComponent(entry.substring(name.length + 1)) : "";
}
function clearCookie(name) {
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Lax`;
}
function showAuthMessage(message) { $("authMessage").textContent = message; }
function showGameMessage(message) { $("gameMessage").textContent = message; }

function setAuthMode(mode) {
  authMode = mode;
  const creating = mode === "create";
  $("authTitle").textContent = creating ? "Create your player" : "Welcome back";
  $("createBtn").textContent = creating ? "Create player" : "Create a new player";
  $("signinBtn").textContent = creating ? "I already have an account" : "Sign in instead";
  $("confirmWrap").classList.toggle("hidden", !creating);
  $("confirmPasscode").required = creating;
  $("passcode").autocomplete = creating ? "new-password" : "current-password";
  showAuthMessage("");
}

function createPlayer() {
  const username = $("username").value.trim();
  const passcode = $("passcode").value;
  const confirmation = $("confirmPasscode").value;
  if (!username || !passcode) return showAuthMessage("Enter a username and passcode.");
  if (username.length < 2) return showAuthMessage("Username must contain at least two characters.");
  if (passcode !== confirmation) return showAuthMessage("The passcodes do not match.");
  if (players.some(player => player.username.toLowerCase() === username.toLowerCase())) {
    return showAuthMessage("That username already exists. Sign in instead.");
  }
  const player = {
    username,
    passcode,
    theme: "light",
    photo: "",
    totalPoints: 0,
    easyPoints: 0,
    normalPoints: 0
  };
  players.push(player);
  savePlayers();
  enterPlayer(player);
  $("authForm").reset();
}

function signIn() {
  const username = $("username").value.trim();
  const passcode = $("passcode").value;
  const player = players.find(item =>
    item.username.toLowerCase() === username.toLowerCase() && item.passcode === passcode
  );
  if (!player) return showAuthMessage("Username or passcode is incorrect.");
  enterPlayer(player);
  $("authForm").reset();
}

function enterPlayer(player) {
  currentPlayer = player;
  setCookie(SESSION_COOKIE, player.username);
  $("authPanel").classList.add("hidden");
  $("gamePanel").classList.remove("hidden");
  $("sessionArea").classList.remove("hidden");
  $("welcomeText").textContent = player.username;
  $("profileName").textContent = player.username;
  $("themeSelect").value = player.theme || "light";
  applyTheme(player.theme || "light");
  renderAvatar();
  updateScoreDisplay();
  renderLeaderboards();
  showGameMessage("Choose a difficulty and start a round.");
}

function logout() {
  if (roundActive) {
    showGameMessage("End the current round before logging out so your points can be saved.");
    return;
  }
  currentPlayer = null;
  clearCookie(SESSION_COOKIE);
  $("gamePanel").classList.add("hidden");
  $("sessionArea").classList.add("hidden");
  $("authPanel").classList.remove("hidden");
  $("authForm").reset();
  setAuthMode("create");
  showAuthMessage("You have logged out.");
}

function restoreSession() {
  const rememberedUsername = getCookie(SESSION_COOKIE);
  if (!rememberedUsername) return;
  const player = players.find(item => item.username === rememberedUsername);
  if (player) enterPlayer(player);
  else clearCookie(SESSION_COOKIE);
}

function applyTheme(theme) {
  document.body.classList.toggle("dark-theme", theme === "dark");
}
function saveTheme() {
  if (!currentPlayer) return;
  currentPlayer.theme = $("themeSelect").value;
  applyTheme(currentPlayer.theme);
  savePlayers();
}
function renderAvatar() {
  const targets = [$("profileAvatar"), $("headerAvatar")];
  targets.forEach(target => {
    target.innerHTML = "";
    if (currentPlayer && currentPlayer.photo) {
      const img = document.createElement("img");
      img.src = currentPlayer.photo;
      img.alt = `${currentPlayer.username}'s profile picture`;
      target.appendChild(img);
    } else {
      target.textContent = currentPlayer ? currentPlayer.username.charAt(0).toUpperCase() : "?";
    }
  });
}
function uploadPhoto(event) {
  const file = event.target.files[0];
  if (!file) return;
  if (!file.type.startsWith("image/")) {
    $("photoMessage").textContent = "Please choose an image file.";
    event.target.value = "";
    return;
  }
  if (file.size > MAX_PHOTO_BYTES) {
    $("photoMessage").textContent = "Image is too large. Please choose a file smaller than 500 KB.";
    event.target.value = "";
    return;
  }
  const reader = new FileReader();
  reader.onload = () => {
    try {
      currentPlayer.photo = reader.result;
      savePlayers();
      renderAvatar();
      $("photoMessage").textContent = "Profile picture saved.";
    } catch (error) {
      $("photoMessage").textContent = "The picture could not be saved. Try a smaller image.";
    }
  };
  reader.onerror = () => {
    $("photoMessage").textContent = "The picture could not be read.";
  };
  reader.readAsDataURL(file);
}

async function startGame() {
  if (!currentPlayer) return;
  if (roundActive) {
    showGameMessage("Finish the current round before starting another.");
    return;
  }
  roundDifficulty = $("difficulty").value;
  try {
    const response = await fetch(`data/${roundDifficulty}.json`);
    if (!response.ok) throw new Error("Word list could not be loaded.");
    const wordList = await response.json();
    if (!Array.isArray(wordList) || wordList.length === 0) throw new Error("Word list is empty.");
    const validWords = wordList.filter(item =>
      item && typeof item.word === "string" && item.word.trim() &&
      typeof item.hint === "string" && item.hint.trim()
    );
    if (validWords.length === 0) throw new Error("Word list has no valid entries.");
    currentWord = validWords[Math.floor(Math.random() * validWords.length)];
    currentWord.word = currentWord.word.trim().toUpperCase();
    guessedLetters = [];
    mistakes = 0;
    roundScore = 0;
    hintUsed = false;
    roundActive = true;
    roundSaved = false;
    $("difficultyBadge").textContent = roundDifficulty === "easy" ? "Easy" : "Normal";
    $("hintText").textContent = "Use the hint button when you need help.";
    $("hintBtn").disabled = false;
    $("endBtn").disabled = false;
    $("startBtn").disabled = true;
    $("difficulty").disabled = true;
    showGameMessage("Round started. Choose a letter.");
    renderGame();
  } catch (error) {
    showGameMessage(`Could not load the ${roundDifficulty} word list. Check that data/${roundDifficulty}.json exists and that you opened the game through a local server.`);
  }
}

function renderGame() {
  const imageIndex = Math.min(mistakes, HANGMAN_IMAGES.length - 1);
  $("hangmanDrawing").src = HANGMAN_IMAGES[imageIndex];
  $("hangmanDrawing").alt = `Hangman stage ${imageIndex + 1}; ${mistakes} incorrect guesses`;
  $("mistakes").textContent = mistakes;
  $("roundScore").textContent = roundScore;
  if (currentWord) {
    $("wordDisplay").textContent = currentWord.word.split("").map(letter =>
      guessedLetters.includes(letter) ? letter : "_"
    ).join(" ");
  }
  $("guessedLetters").textContent = guessedLetters.length ? guessedLetters.join(", ") : "None yet";
  $("keyboard").innerHTML = "";
  LETTERS.forEach(letter => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = letter;
    button.disabled = !roundActive || guessedLetters.includes(letter);
    button.setAttribute("aria-label", `Guess ${letter}`);
    button.addEventListener("click", () => guessLetter(letter));
    $("keyboard").appendChild(button);
  });
}

function guessLetter(letter) {
  if (!roundActive || guessedLetters.includes(letter)) return;
  guessedLetters.push(letter);
  if (currentWord.word.includes(letter)) {
    const occurrences = currentWord.word.split("").filter(character => character === letter).length;
    roundScore += occurrences;
    showGameMessage(`Correct! ${letter} appears ${occurrences} time${occurrences === 1 ? "" : "s"}.`);
  } else {
    mistakes += 1;
    showGameMessage("That letter is not in the word.");
  }
  renderGame();
  const wordComplete = currentWord.word.split("").every(character => guessedLetters.includes(character));
  if (wordComplete) finishGame("won");
  else if (mistakes >= 6) finishGame("lost");
}

function useHint() {
  if (!roundActive || hintUsed) return;
  hintUsed = true;
  roundScore = Math.max(0, roundScore - 1);
  $("hintText").textContent = currentWord.hint;
  $("hintBtn").disabled = true;
  $("roundScore").textContent = roundScore;
  showGameMessage("Hint revealed. One point was deducted if you had a point available.");
}

function endRound() {
  if (roundActive) finishGame("ended");
}

function finishGame(result) {
  if (!roundActive || roundSaved) return;
  roundActive = false;
  roundSaved = true;
  currentPlayer.totalPoints = (currentPlayer.totalPoints || 0) + roundScore;
  const scoreKey = roundDifficulty === "easy" ? "easyPoints" : "normalPoints";
  currentPlayer[scoreKey] = (currentPlayer[scoreKey] || 0) + roundScore;
  savePlayers();
  updateScoreDisplay();
  renderLeaderboards();
  $("hintBtn").disabled = true;
  $("endBtn").disabled = true;
  $("startBtn").disabled = false;
  $("difficulty").disabled = false;
  renderGame();
  if (result === "won") showGameMessage(`You won! The word was ${currentWord.word}. You earned ${roundScore} points.`);
  else if (result === "lost") showGameMessage(`No guesses left. The word was ${currentWord.word}. You kept ${roundScore} points.`);
  else showGameMessage(`Round ended. The word was ${currentWord.word}. Your ${roundScore} earned points were saved.`);
}
function updateScoreDisplay() {
  $("totalPoints").textContent = currentPlayer ? currentPlayer.totalPoints || 0 : 0;
}
function renderLeaderboards() {
  ["easy", "normal"].forEach(level => {
    const scoreKey = level === "easy" ? "easyPoints" : "normalPoints";
    const list = [...players].sort((a, b) => {
      const scoreDifference = (b[scoreKey] || 0) - (a[scoreKey] || 0);
      return scoreDifference || a.username.localeCompare(b.username);
    }).slice(0, 3);
    const target = $(level === "easy" ? "easyBoard" : "normalBoard");
    target.innerHTML = "";
    if (!list.length) {
      const li = document.createElement("li");
      li.textContent = "No scores yet";
      target.appendChild(li);
      return;
    }
    list.forEach(player => {
      const li = document.createElement("li");
      li.textContent = `${player.username} - ${player[scoreKey] || 0} points`;
      target.appendChild(li);
    });
  });
}

$("authForm").addEventListener("submit", event => {
  event.preventDefault();
  if (authMode === "create") createPlayer();
  else signIn();
});
$("signinBtn").addEventListener("click", () => {
  setAuthMode(authMode === "create" ? "signin" : "create");
});
$("logoutBtn").addEventListener("click", logout);
$("startBtn").addEventListener("click", startGame);
$("hintBtn").addEventListener("click", useHint);
$("endBtn").addEventListener("click", endRound);
$("themeSelect").addEventListener("change", saveTheme);
$("photoInput").addEventListener("change", uploadPhoto);

setAuthMode("create");
renderGame();
restoreSession();
