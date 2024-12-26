let board = ["", "", "", "", "", "", "", "", ""];
let currentPlayer = "X";
let player1 = "";
let player2 = "";
let score1 = 0;
let score2 = 0;

function startGame() {
    player1 = document.getElementById("player1").value || "Player 1";
    player2 = document.getElementById("player2").value || "Player 2";

    document.getElementById("scoreboard").style.display = "block";
    document.getElementById("game").style.display = "block";
    document.querySelector(".player-inputs").style.display = "none";
    document.getElementById("turn").innerText = `Turn: ${player1}`;

    resetBoard();
}

function makeMove(index) {
    if (board[index] !== "") return;

    board[index] = currentPlayer;
    document.querySelectorAll(".cell")[index].innerText = currentPlayer;

    if (checkWinner()) {
        const winner = currentPlayer === "X" ? player1 : player2;
        document.getElementById("message").innerText = `${winner} wins!`;
        setTimeout(resetBoard, 1000);
    } else if (board.every(cell => cell !== "")) {
        document.getElementById("message").innerText = "It's a draw!";
        setTimeout(resetBoard, 1000);
    } else {
        currentPlayer = currentPlayer === "X" ? "O" : "X";
        document.getElementById("turn").innerText = `Turn: ${currentPlayer === "X" ? player1 : player2}`;
    }
}

function checkWinner() {
    const winPatterns = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8],
        [0, 3, 6], [1, 4, 7], [2, 5, 8],
        [0, 4, 8], [2, 4, 6]
    ];
    return winPatterns.some(pattern => {
        const [a, b, c] = pattern;
        return board[a] && board[a] === board[b] && board[a] === board[c];
    });
}

function resetBoard() {
    board = ["", "", "", "", "", "", "", "", ""];
    document.querySelectorAll(".cell").forEach(cell => cell.innerText = "");
    document.getElementById("message").innerText = "";
    currentPlayer = "X";
    document.getElementById("turn").innerText = `Turn: ${player1}`;
}

function toggleTheme() {
    document.body.classList.toggle("dark-theme");
    document.body.classList.toggle("light-theme");
}
