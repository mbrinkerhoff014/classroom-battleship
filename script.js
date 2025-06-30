const GRID_SIZE = 5;
const SHIP_COUNT = 3;
let shipPlacements = [[], []];
let guesses = [[], []];
let currentPlayer = 0;
let phase = "placement";
const boardsDiv = document.getElementById("boards");
const instructions = document.getElementById("instructions");
const newGameBtn = document.getElementById("newGameBtn");

function createBoard(player) {
  const board = document.createElement("div");
  board.className = "board";
  for (let x = 0; x < GRID_SIZE; x++) {
    for (let y = 0; y < GRID_SIZE; y++) {
      const btn = document.createElement("button");
      btn.onclick = () => handleClick(player, x, y, btn);
      board.appendChild(btn);
    }
  }
  return board;
}

function renderBoards() {
  boardsDiv.innerHTML = "";
  boardsDiv.appendChild(createBoard(0));
  boardsDiv.appendChild(createBoard(1));
}

function handleClick(player, x, y, btn) {
  if (phase === "placement") {
    if (player !== currentPlayer) return;
    if (shipPlacements[player].some(([sx, sy]) => sx === x && sy === y)) return;
    shipPlacements[player].push([x, y]);
    btn.textContent = "🚢";
    if (shipPlacements[player].length === SHIP_COUNT) {
      if (currentPlayer === 0) {
        currentPlayer = 1;
        instructions.textContent = "Player 2, place your ships!";
      } else {
        phase = "gameplay";
        currentPlayer = 0;
        instructions.textContent = "Player 1's turn! Answer a card before guessing.";
      }
    }
  } else if (phase === "gameplay") {
    if (player !== currentPlayer) return;
    const opponent = (currentPlayer + 1) % 2;
    if (guesses[currentPlayer].some(([gx, gy]) => gx === x && gy === y)) return;
    guesses[currentPlayer].push([x, y]);
    const isHit = shipPlacements[opponent].some(([sx, sy]) => sx === x && sy === y);
    btn.textContent = isHit ? "🔥" : "⭕";
    btn.className = isHit ? "hit" : "miss";
    if (isHit) {
      const remaining = shipPlacements[opponent].filter(
        ([sx, sy]) => !guesses[currentPlayer].some(([gx, gy]) => gx === sx && gy === sy)
      );
      if (remaining.length === 0) {
        instructions.textContent = `Player ${currentPlayer + 1} wins!`;
        phase = "gameover";
        newGameBtn.style.display = "inline-block";
      }
    } else {
      currentPlayer = opponent;
      instructions.textContent = `Player ${currentPlayer + 1}'s turn! Answer a card before guessing.`;
    }
  }
}

newGameBtn.onclick = () => {
  shipPlacements = [[], []];
  guesses = [[], []];
  currentPlayer = 0;
  phase = "placement";
  instructions.textContent = "Player 1, place your ships!";
  newGameBtn.style.display = "none";
  renderBoards();
};

renderBoards();
