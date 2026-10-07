const wordBank = [
  { word: "JAVASCRIPT", category: "Programming" },
  { word: "BROWSER", category: "Web" },
  { word: "COMPUTER", category: "Technology" },
  { word: "KEYBOARD", category: "Hardware" },
  { word: "WEBSITE", category: "Web" },
  { word: "PROGRAMMING", category: "Programming" },
  { word: "FUNCTION", category: "Programming" },
  { word: "VARIABLE", category: "Programming" },
  { word: "DATABASE", category: "Technology" },
  { word: "INTERNET", category: "Web" },
  { word: "ALGORITHM", category: "Computer Science" },
  { word: "SOFTWARE", category: "Technology" },
  { word: "HARDWARE", category: "Technology" },
  { word: "DEVELOPER", category: "Programming" },
  { word: "NETWORK", category: "Networking" },
  { word: "APPLICATION", category: "Software" },
  { word: "FRAMEWORK", category: "Programming" },
  { word: "CODING", category: "Programming" },
  { word: "PYTHON", category: "Programming" },
  { word: "LAPTOP", category: "Hardware" },
  { word: "MOBILE", category: "Technology" },
  { word: "SERVER", category: "Networking" },
  { word: "DIGITAL", category: "Technology" },
  { word: "TECHNOLOGY", category: "Technology" },
  { word: "PROGRAM", category: "Programming" },
  { word: "HTML", category: "Web" },
  { word: "STUDENT", category: "Education" },
  { word: "SCHOOL", category: "Education" },
  { word: "UNIVERSITY", category: "Education" },
  { word: "INFORMATION", category: "Technology" }
];

const maxWrongGuesses = 6;
let currentWord;
let guessedLetters = [];
let wrongGuesses = 0;
let score = 0;
let gameOver = false;

const wordElement = document.getElementById("word");
const keyboardElement = document.getElementById("keyboard");
const messageElement = document.getElementById("message");
const guessedElement = document.getElementById("guessed");
const categoryElement = document.getElementById("category");
const mistakesElement = document.getElementById("mistakes");
const scoreElement = document.getElementById("score");
const hangmanImage = document.getElementById("hangmanImage");
const resetButton = document.getElementById("resetButton");

function chooseWord() {
  const randomIndex = Math.floor(Math.random() * wordBank.length);
  currentWord = wordBank[randomIndex];
}

function displayWord() {
  wordElement.textContent = currentWord.word
    .split("")
    .map(letter => guessedLetters.includes(letter) ? letter : "_")
    .join(" ");
}

function createKeyboard() {
  keyboardElement.innerHTML = "";

  for (let code = 65; code <= 90; code++) {
    const letter = String.fromCharCode(code);
    const button = document.createElement("button");

    button.textContent = letter;
    button.setAttribute("aria-label", `Guess ${letter}`);
    button.addEventListener("click", () => makeGuess(letter, button));
    keyboardElement.appendChild(button);
  }
}

function makeGuess(letter, button) {
  if (gameOver || guessedLetters.includes(letter)) {
    return;
  }

  guessedLetters.push(letter);
  button.disabled = true;

  if (currentWord.word.includes(letter)) {
    messageElement.textContent = "Correct guess!";
  } else {
    wrongGuesses++;
    messageElement.textContent = "Wrong guess.";
    updateHangman();
  }

  updateStatus();
  displayWord();
  checkGameEnd();
}

function updateHangman() {
  const stage = wrongGuesses + 1;
  hangmanImage.src = `images/hangman_stage_${stage}.png`;
  hangmanImage.alt = `Hangman stage ${stage}`;
}

function updateStatus() {
  mistakesElement.textContent = `${wrongGuesses} / ${maxWrongGuesses}`;
  scoreElement.textContent = score;

  guessedElement.textContent = guessedLetters.length === 0
    ? "Guessed letters: none"
    : `Guessed letters: ${guessedLetters.join(", ")}`;
}

function checkGameEnd() {
  const wordComplete = currentWord.word
    .split("")
    .every(letter => guessedLetters.includes(letter));

  if (wordComplete) {
    gameOver = true;
    score++;
    scoreElement.textContent = score;
    messageElement.textContent = `You won! The word was ${currentWord.word}.`;
    disableKeyboard();
  } else if (wrongGuesses >= maxWrongGuesses) {
    gameOver = true;
    messageElement.textContent = `You lost! The word was ${currentWord.word}.`;
    disableKeyboard();
  }
}

function disableKeyboard() {
  const buttons = keyboardElement.querySelectorAll("button");
  buttons.forEach(button => button.disabled = true);
}

function startGame() {
  chooseWord();
  guessedLetters = [];
  wrongGuesses = 0;
  gameOver = false;

  categoryElement.textContent = currentWord.category;
  messageElement.textContent = "Choose a letter.";
  hangmanImage.src = "images/hangman_stage_1.png";
  hangmanImage.alt = "Hangman stage 1";

  updateStatus();
  displayWord();
  createKeyboard();
}

resetButton.addEventListener("click", startGame);

// Allow the player to guess using the physical keyboard as well.
document.addEventListener("keydown", event => {
  const letter = event.key.toUpperCase();

  if (!/^[A-Z]$/.test(letter) || gameOver || guessedLetters.includes(letter)) {
    return;
  }

  const buttons = keyboardElement.querySelectorAll("button");
  buttons.forEach(button => {
    if (button.textContent === letter && !button.disabled) {
      makeGuess(letter, button);
    }
  });
});

startGame();
