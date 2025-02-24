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

// Sound effect URL for click
const clickSoundUrl = 'https://www.myinstants.com/en/instant/mouse-click-84937/?utm_source=copy&utm_medium=share';

// ===================== Q-Learning Variables =====================
let qTable = {};          // Maps board state string to actions { "r,c": Q-value, ... }
let computerEpisode = []; // Stores transitions: { state, action, nextState }
const alpha = 0.5;        // Learning rate
const gamma = 0.9;        // Discount factor
let epsilon = 0.8;        // Exploration rate (starts high for easy level)

// Global round counter to adjust difficulty over rounds
let roundCount = 0;

// Convert board (2D array) to a unique string representation
function boardToState(board) {
  return board.flat().map(cell => cell ? cell : '-').join('');
}

// Returns a list of available moves as strings "r,c"
function getAvailableActions(board) {
  let moves = [];
  board.forEach((row, r) => {
    row.forEach((cell, c) => {
      if (!cell) moves.push(`${r},${c}`);
    });
  });
  return moves;
}

// Returns a move (in "r,c" format) if placing 'player' there results in a win; otherwise null
function immediateWinningMove(player) {
  const moves = getAvailableActions(board);
  for (let move of moves) {
    let [r, c] = move.split(',').map(Number);
    board[r][c] = player;  // simulate move
    if (checkWin(player)) {
      board[r][c] = null;  // undo move
      return move;
    }
    board[r][c] = null;    // undo move
  }
  return null;
}

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
  computerEpisode = []; // Clear previous episode data
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
    // If computer lost while playing, update Q-values with a negative reward
    if (currentPlayer === 'X' && computerEpisode.length > 0) {
      updateQValues(-1);
    }
    setTimeout(resetGame, 1500);
  } else if (isBoardFull() || checkNoWinChance()) {
    displayMessage(`It's a draw!`, 'draw');
    updateQValues(0);
    setTimeout(resetGame, 1500);
  } else {
    currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
    if (gameMode === 'computer' && currentPlayer === 'O') {
      setTimeout(computerMove, 200);
    }
  }
}

// Modified computerMove using Q-learning with added heuristic for blocking/winning
function computerMove() {
  const availableMoves = getAvailableActions(board);
  const state = boardToState(board);
  
  let chosenMove;
  // 1. Check if computer can win immediately
  chosenMove = immediateWinningMove('O');
  // 2. If not, check if computer needs to block player's win
  if (!chosenMove) {
    let blockMove = immediateWinningMove('X');
    if (blockMove) {
      chosenMove = blockMove;
    }
  }
  // 3. Otherwise, use Q-learning epsilon-greedy selection
  if (!chosenMove) {
    if (!(state in qTable)) {
      qTable[state] = {};
      availableMoves.forEach(move => {
        qTable[state][move] = 0;
      });
    }
    if (Math.random() < epsilon) {
      chosenMove = availableMoves[Math.floor(Math.random() * availableMoves.length)];
    } else {
      let maxQ = -Infinity;
      availableMoves.forEach(move => {
        const qVal = qTable[state][move] !== undefined ? qTable[state][move] : 0;
        if (qVal > maxQ) {
          maxQ = qVal;
          chosenMove = move;
        }
      });
    }
  }
  
  // Parse chosen move and update board
  const [r, c] = chosenMove.split(',').map(Number);
  board[r][c] = 'O';
  renderBoard();
  
  // Compute next state after the move and record transition for learning
  const nextState = boardToState(board);
  computerEpisode.push({ state: state, action: chosenMove, nextState: nextState });
  
  if (checkWin('O')) {
    displayMessage(`${getPlayerName('O')} wins!`, 'win');
    speakWinner(getPlayerName('O'));
    scores['O']++;
    updateScoreboard();
    updateQValues(1);  // Reward win with +1
    setTimeout(resetGame, 1500);
  } else if (isBoardFull() || checkNoWinChance()) {
    displayMessage(`It's a draw!`, 'draw');
    updateQValues(0);
    setTimeout(resetGame, 1500);
  } else {
    currentPlayer = 'X';
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
  // Increase round count and adjust epsilon to decrease exploration (making AI tougher)
  roundCount++;
  // Decrease epsilon by 0.1 each round, down to a minimum of 0.2
  epsilon = Math.max(0.2, 0.8 - (roundCount * 0.1));
  
  board = Array(gridSize).fill(null).map(() => Array(gridSize).fill(null));
  currentPlayer = 'X';
  document.getElementById('gameMessage').innerText = '';
  computerEpisode = []; // Clear episode data for new game
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

// ===================== Q-Learning Q-Value Update =====================
// For each computer move, update Q(s, a) = Q(s, a) + α*(target - Q(s, a))
// where target = (for terminal move) reward or (for non-terminal) gamma * max_a Q(nextState, a)
function updateQValues(finalReward) {
  for (let i = computerEpisode.length - 1; i >= 0; i--) {
    const { state, action, nextState } = computerEpisode[i];
    let bestNextQ = 0;
    if (nextState && qTable[nextState]) {
      bestNextQ = Math.max(...Object.values(qTable[nextState]));
    }
    const target = (i === computerEpisode.length - 1) ? finalReward : gamma * bestNextQ;
    qTable[state][action] = qTable[state][action] + alpha * (target - qTable[state][action]);
  }
  computerEpisode = [];
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

function speakWinner(name) {
  if ('speechSynthesis' in window) {
    const utterance = new SpeechSynthesisUtterance(`${name} wins!`);
    window.speechSynthesis.speak(utterance);
  }
}

// ------------------------------
// MOBILE NAVIGATION TOGGLE (Hamburger Menu)
// ------------------------------
const menuToggle = document.getElementById("menuToggle");
if (menuToggle) {
  menuToggle.addEventListener("click", function(e) {
    e.stopPropagation();
    if (window.innerWidth < 768) {
      const navMenu = document.querySelector(".main-nav ul");
      if (navMenu) {
        if (navMenu.style.display === "flex") {
          navMenu.style.display = "none";
          menuToggle.classList.remove("active");
          menuToggle.innerHTML = "&#9776;";
        } else {
          navMenu.style.display = "flex";
          menuToggle.classList.add("active");
          menuToggle.innerHTML = "&times;";
        }
      }
    }
  });
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
window.addEventListener("resize", function() {
  if (window.innerWidth >= 768) {
    const navMenu = document.querySelector(".main-nav ul");
    if (navMenu) {
      navMenu.style.display = "flex";
    }
  }
});
