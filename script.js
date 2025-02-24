// ===================== Global Variables =====================
const themes = ["dark", "light", "blue", "green", "purple"];
let currentThemeIndex = 0; // starting with "dark"

let gameMode = 'player'; // 'player' for 2-player or 'computer' for vs Computer
let gridSize = 3; // grid size: 3 or 5
let board = [];
let currentPlayer = 'X';
let scores = { 'X': 0, 'O': 0 };
let player1Name = 'Player 1';
let player2Name = 'Player 2';

// Sound effect URL for click (replace with your preferred URL)
const clickSoundUrl = 'https://www.myinstants.com/en/instant/mouse-click-84937/?utm_source=copy&utm_medium=share';

// ===================== Game Functions =====================
function setGameMode(mode) {
  gameMode = mode;
  document.querySelectorAll('.mode-btn').forEach(btn => btn.classList.remove('active'));
  event.target.classList.add('active');
  if (mode === 'computer') {
    document.getElementById('player2Input').value = 'Computer';
    document.getElementById('player2Input').disabled = true;
  } else {
    document.getElementById('player2Input').disabled = false;
  }
}

function setGridSize(size) {
  gridSize = size;
  document.querySelector('.board').style.gridTemplateColumns = `repeat(${size}, 1fr)`;
  document.querySelectorAll('.size-btn').forEach(btn => btn.classList.remove('active'));
  event.target.classList.add('active');
}

function initializeGame() {
  player1Name = document.getElementById('player1Input').value.trim() || 'Player 1';
  player2Name = document.getElementById('player2Input').value.trim() || (gameMode === 'computer' ? 'Computer' : 'Player 2');
  updateScoreboard();
  board = Array(gridSize).fill(null).map(() => Array(gridSize).fill(null));
  currentPlayer = 'X';
  document.getElementById('gameMessage').innerText = '';
  document.querySelector('.main-menu').style.display = 'none';
  document.querySelector('.game-container').style.display = 'block';
  renderBoard();
}

function renderBoard() {
  const boardElement = document.getElementById('board');
  boardElement.innerHTML = '';
  boardElement.style.gridTemplateColumns = `repeat(${gridSize}, 1fr)`;
  board.forEach((row, r) => {
    row.forEach((cell, c) => {
      const cellElement = document.createElement('div');
      cellElement.classList.add('cell');
      cellElement.dataset.row = r;
      cellElement.dataset.col = c;
      cellElement.innerText = cell || '';
      cellElement.addEventListener('click', handleMove);
      boardElement.appendChild(cellElement);
    });
  });
}

function handleMove(event) {
  playClickSound();
  const row = event.target.dataset.row;
  const col = event.target.dataset.col;
  if (board[row][col]) return;
  board[row][col] = currentPlayer;
  event.target.innerText = currentPlayer;
  if (checkWin(currentPlayer)) {
    displayMessage(`${getPlayerName(currentPlayer)} wins!`, 'win');
    speakWinner(getPlayerName(currentPlayer));
    scores[currentPlayer]++;
    updateScoreboard();
    setTimeout(resetGame, 1500);
  } else if (isBoardFull() || checkNoWinChance()) {
    displayMessage(`It's a draw!`, 'draw');
    setTimeout(resetGame, 1500);
  } else {
    currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
    if (gameMode === 'computer' && currentPlayer === 'O') {
      setTimeout(computerMove, 200);
    }
  }
}

function computerMove() {
  let emptyCells = [];
  board.forEach((row, r) => {
    row.forEach((cell, c) => {
      if (!cell) emptyCells.push({ r, c });
    });
  });
  if (emptyCells.length > 0) {
    const { r, c } = emptyCells[Math.floor(Math.random() * emptyCells.length)];
    board[r][c] = 'O';
    renderBoard();
    if (checkWin('O')) {
      displayMessage(`${getPlayerName('O')} wins!`, 'win');
      speakWinner(getPlayerName('O'));
      scores['O']++;
      updateScoreboard();
      setTimeout(resetGame, 1500);
    } else if (isBoardFull() || checkNoWinChance()) {
      displayMessage(`It's a draw!`, 'draw');
      setTimeout(resetGame, 1500);
    } else {
      currentPlayer = 'X';
    }
  }
}

function checkWin(player) {
  // Check rows and columns
  for (let i = 0; i < gridSize; i++) {
    if (board[i].every(cell => cell === player)) return true;
    if (board.map(row => row[i]).every(cell => cell === player)) return true;
  }
  // Check diagonals
  if (board.map((row, i) => row[i]).every(cell => cell === player)) return true;
  if (board.map((row, i) => row[gridSize - 1 - i]).every(cell => cell === player)) return true;
  return false;
}

function isBoardFull() {
  return board.every(row => row.every(cell => cell !== null));
}

function checkNoWinChance() {
  let winLines = [];
  for (let r = 0; r < gridSize; r++) {
    let line = [];
    for (let c = 0; c < gridSize; c++) line.push(board[r][c]);
    winLines.push(line);
  }
  for (let c = 0; c < gridSize; c++) {
    let line = [];
    for (let r = 0; r < gridSize; r++) line.push(board[r][c]);
    winLines.push(line);
  }
  winLines.push(board.map((row, i) => row[i]));
  winLines.push(board.map((row, i) => row[gridSize - 1 - i]));
  const possibleWin = winLines.some(line => !(line.includes('X') && line.includes('O')));
  return !possibleWin;
}

function updateScoreboard() {
  document.getElementById('score1').innerText = `${player1Name} (X): ${scores['X']}`;
  document.getElementById('score2').innerText = `${player2Name} (O): ${scores['O']}`;
}

function resetGame() {
  board = Array(gridSize).fill(null).map(() => Array(gridSize).fill(null));
  currentPlayer = 'X';
  document.getElementById('gameMessage').innerText = '';
  renderBoard();
}

function returnToMenu() {
  document.querySelector('.main-menu').style.display = 'block';
  document.querySelector('.game-container').style.display = 'none';
}

function toggleTheme() {
  currentThemeIndex = (currentThemeIndex + 1) % themes.length;
  document.body.dataset.theme = themes[currentThemeIndex];
}

function displayMessage(message, type) {
  const msgElement = document.getElementById('gameMessage');
  msgElement.innerText = message;
  msgElement.style.color = type === 'win' ? '#4caf50' : '#ff9800';
}

function getPlayerName(symbol) {
  return symbol === 'X' ? player1Name : player2Name;
}

// ===================== Sound Effects =====================
function playClickSound() {
  let clickAudio = new Audio(clickSoundUrl);
  clickAudio.play();
}

function toggleSound() {
  const bgMusic = document.getElementById('bgMusic');
  const soundToggleBtn = document.querySelector('.sound-toggle');
  if (bgMusic.muted) {
    bgMusic.muted = false;
    soundToggleBtn.innerText = 'Sound: On';
  } else {
    bgMusic.muted = true;
    soundToggleBtn.innerText = 'Sound: Off';
  }
}

// Use speech synthesis to announce the winner's name
function speakWinner(name) {
  if ('speechSynthesis' in window) {
    const utterance = new SpeechSynthesisUtterance(`${name} wins!`);
    window.speechSynthesis.speak(utterance);
  }
}

/*--------------------------------------------------
  MOBILE NAVIGATION TOGGLE (Hamburger Menu)
--------------------------------------------------*/
const menuToggle = document.getElementById("menuToggle");
if (menuToggle) {
  menuToggle.addEventListener("click", function(e) {
    e.stopPropagation();
    // Only toggle if screen width is less than 768px
    if (window.innerWidth < 768) {
      const navMenu = document.querySelector(".main-nav ul");
      if (navMenu) {
        if (navMenu.style.display === "flex") {
          navMenu.style.display = "none";
          menuToggle.classList.remove("active");
          menuToggle.innerHTML = "&#9776;"; // hamburger icon
        } else {
          navMenu.style.display = "flex";
          menuToggle.classList.add("active");
          menuToggle.innerHTML = "&times;"; // close icon
        }
      }
    }
  });
  // Hide nav menu when clicking outside (for mobile)
  document.addEventListener("click", function(e) {
    if (window.innerWidth < 768) {
      const navMenu = document.querySelector(".main-nav ul");
      if (navMenu && !navMenu.contains(e.target) && e.target.id !== "menuToggle") {
        navMenu.style.display = "none";
        menuToggle.classList.remove("active");
        menuToggle.innerHTML = "&#9776;";
      }
    }
  });
}
// On window resize, ensure nav is shown on larger screens
window.addEventListener("resize", function() {
  if (window.innerWidth >= 768) {
    const navMenu = document.querySelector(".main-nav ul");
    if (navMenu) {
      navMenu.style.display = "flex";
    }
  }
});
