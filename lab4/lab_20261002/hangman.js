const words = [
  "JAVASCRIPT",
  "BROWSER",
  "COMPUTER",
  "KEYBOARD",
  "WEBSITE",
  "PROGRAMMING",
  "FUNCTION",
  "VARIABLE",
  "DATABASE",
  "INTERNET",
  "ALGORITHM",
  "SOFTWARE",
  "HARDWARE",
  "DEVELOPER",
  "NETWORK",
  "APPLICATION",
  "FRAMEWORK",
  "CODING",
  "PYTHON",
  "LAPTOP",
  "MOBILE",
  "SERVER",
  "DIGITAL",
  "TECHNOLOGY",
  "PROGRAM",
  "HTML",
  "STUDENT",
  "SCHOOL",
  "UNIVERSITY",
  "INFORMATION"
];

const word = words[Math.floor(Math.random() * words.length)];
let guessedLetters = [];
let wrongGuesses = 0;
const maxWrongGuesses = 6;

const wordElement = document.getElementById("word");
const keyboardElement = document.getElementById("keyboard");
const messageElement = document.getElementById("message");
const hangmanImage = document.getElementById("hangmanImage");
const resetButton = document.getElementById("resetButton");

function displayWord() {
  wordElement.textContent = word
    .split("")
    .map(letter => guessedLetters.includes(letter) ? letter : "_")
    .join(" ");
}

function createKeyboard() {
  for (let code = 65; code <= 90; code++) {
    const letter = String.fromCharCode(code);
    const button = document.createElement("button");

    button.textContent = letter;
    button.addEventListener("click", () => makeGuess(letter, button));
    keyboardElement.appendChild(button);
  }
}

function makeGuess(letter, button) {
  guessedLetters.push(letter);
  button.disabled = true;

  if (word.includes(letter)) {
    messageElement.textContent = "Correct!";
  } else {
    wrongGuesses++;
    messageElement.textContent = "Wrong guess.";
    hangmanImage.src = `images/hangman_stage_${wrongGuesses + 1}.png`;
    hangmanImage.alt = `Hangman stage ${wrongGuesses + 1}`;
  }

  displayWord();
  checkGameEnd();
}

function checkGameEnd() {
  const wordComplete = word.split("").every(letter => guessedLetters.includes(letter));

  if (wordComplete) {
    messageElement.textContent = "You won!";
    disableKeyboard();
  } else if (wrongGuesses >= maxWrongGuesses) {
    messageElement.textContent = `You lost! The word was ${word}.`;
    disableKeyboard();
  }
}

function disableKeyboard() {
  const buttons = keyboardElement.querySelectorAll("button");
  buttons.forEach(button => button.disabled = true);
}

resetButton.addEventListener("click", () => {
  location.reload();
});

displayWord();
createKeyboard();
