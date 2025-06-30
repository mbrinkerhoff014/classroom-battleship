const GRID_SIZE = 10;
const SHIP_SIZES = [5, 4, 3, 3, 2];
let shipPlacements = [[], []];
let guesses = [[], []];
let currentPlayer = 0;
let phase = "placement";
let draggingSize = null;

const board = document.getElementById("game-board");
const instructions = document.getElementById("instructions");
const status = document.getElementById("status");
const doneBtn = document.getElementById("done-btn");

// Build the board with headers
function buildBoard() {
  board.innerHTML = "";
  board.appendChild(document.createElement("div")); // corner empty
  for (let c = 0; c < GRID_SIZE; c++) {
    const label = document.createElement("div");
    label.textContent = String.fromCharCode(65 + c);
    board.appendChild(label);
  }
  for (let r = 0; r < GRID_SIZE; r++) {
    const rowLabel = document.createElement("div");
    rowLabel.textContent = r + 1;
    board.appendChild(rowLabel);
    for (let c = 0; c < GRID_SIZE; c++) {
      const cell = document.createElement("div");
      cell.className = "cell";
      cell.dataset.x = r;
      cell.dataset.y = c;
      cell.ondragover = (e) => e.preventDefault();
      cell.ondrop = () => placeShip(r, c);
      cell.onclick = () => guess(r, c);
      board.appendChild(cell);
    }
  }
}

buildBoard();

document.querySelectorAll(".ship").forEach(ship => {
  ship.ondragstart = () => {
    draggingSize = parseInt(ship.dataset.size);
  };
});

function placeShip(x, y) {
  if (draggingSize == null) return;
  if (x + draggingSize > GRID_SIZE) return;

  const occupied = shipPlacements[currentPlayer];
  for (let i = 0; i < draggingSize; i++) {
    if (occupied.some(([sx, sy]) => sx === x + i && sy === y)) return;
  }

  for (let i = 0; i < draggingSize; i++) {
    occupied.push([x + i, y]);
    getCell(x + i, y).classList.add("occupied");
  }

  draggingSize = null;
  document.querySelector(`.ship[data-size='${draggingSize}']`)?.remove();

  if (occupied.length === SHIP_SIZES.reduce((a, b) => a + b, 0)) {
    doneBtn.style.display = "inline-block";
  }
}

doneBtn.onclick = () => {
  if (currentPlayer === 0) {
    shipPlacements[0] = [...shipPlacements[0]];
    currentPlayer = 1;
    instructions.textContent = "Player 2, drag and drop your ships.";
    resetBoard();
  } else {
    instructions.textContent = "Player 1's turn! Answer a card, then click to guess.";
    phase = "gameplay";
    currentPlayer = 0;
    resetBoard();
    doneBtn.style.display = "none";
  }
};

function guess(x, y) {
  if (phase !== "gameplay" || currentPlayer !== 0) return;
  const opponent = (currentPlayer + 1) % 2;
  const cell = getCell(x, y);
  if (cell.classList.contains("hit") || cell.classList.contains("miss")) return;

  const hit = shipPlacements[opponent].some(([sx, sy]) => sx === x && sy === y);
  cell.classList.add(hit ? "hit" : "miss");
  status.textContent = hit ? "Hit!" : "Miss!";
  if (!hit) currentPlayer = opponent;
}

function getCell(x, y) {
  return board.querySelector(`.cell[data-x='${x}'][data-y='${y}']`);
}

function resetBoard() {
  buildBoard();
  doneBtn.style.display = "none";
}
