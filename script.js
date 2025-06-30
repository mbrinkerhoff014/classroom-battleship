const GRID_SIZE = 10;
const SHIP_SIZES = [5, 4, 3, 3, 2];
let shipPlacements = [[], []];
let guesses = [[], []];
let currentPlayer = 0;
let phase = "placement";
let draggingSize = null;
let isVertical = false;

const boardContainer = document.getElementById("board-container");
const instructions = document.getElementById("instructions");
const status = document.getElementById("status");
const doneBtn = document.getElementById("done-btn");

function buildBoard() {
  boardContainer.innerHTML = "";
  boardContainer.appendChild(document.createElement("div")); // corner empty

  for (let c = 0; c < GRID_SIZE; c++) {
    const label = document.createElement("div");
    label.textContent = String.fromCharCode(65 + c);
    boardContainer.appendChild(label);
  }

  for (let r = 0; r < GRID_SIZE; r++) {
    const rowLabel = document.createElement("div");
    rowLabel.textContent = r + 1;
    boardContainer.appendChild(rowLabel);

    for (let c = 0; c < GRID_SIZE; c++) {
      const cell = document.createElement("div");
      cell.className = "cell";
      cell.dataset.x = r;
      cell.dataset.y = c;
      cell.ondragover = (e) => e.preventDefault();
      cell.ondrop = () => placeShip(r, c);
      cell.onclick = () => guess(r, c);
      boardContainer.appendChild(cell);
    }
  }
}

buildBoard();

document.querySelectorAll(".ship").forEach(ship => {
  ship.ondragstart = () => {
    draggingSize = parseInt(ship.dataset.size);
  };
});

document.getElementById("rotate-btn").onclick = () => {
  isVertical = !isVertical;
  document.querySelectorAll(".ship").forEach(ship =>
    ship.classList.toggle("vertical", isVertical)
  );
};

function placeShip(x, y) {
  if (draggingSize == null) return;
  const occupied = shipPlacements[currentPlayer];

  if (isVertical) {
    if (y + draggingSize > GRID_SIZE) return;
    for (let i = 0; i < draggingSize; i++) {
      if (occupied.some(([sx, sy]) => sx === x && sy === y + i)) return;
    }
    for (let i = 0; i < draggingSize; i++) {
      occupied.push([x, y + i]);
      getCell(x, y + i).classList.add("occupied");
    }
  } else {
    if (x + draggingSize > GRID_SIZE) return;
    for (let i = 0; i < draggingSize; i++) {
      if (occupied.some(([sx, sy]) => sx === x + i && sy === y)) return;
    }
    for (let i = 0; i < draggingSize; i++) {
      occupied.push([x + i, y]);
      getCell(x + i, y).classList.add("occupied");
    }
  }

  draggingSize = null;

  if (occupied.length >= SHIP_SIZES.reduce((a, b) => a + b, 0)) {
    doneBtn.style.display = "inline-block";
  }
}

doneBtn.onclick = () => {
  if (currentPlayer === 0) {
    shipPlacements[0] = [...shipPlacements[0]];
    currentPlayer = 1;
    instructions.textContent = "Player 2: Drag your ships onto the board";
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
  if (phase !== "gameplay") return;
  const opponent = (currentPlayer + 1) % 2;
  const cell = getCell(x, y);
  if (cell.classList.contains("hit") || cell.classList.contains("miss")) return;

  const hit = shipPlacements[opponent].some(([sx, sy]) => sx === x && sy === y);
  cell.classList.add(hit ? "hit" : "miss");
  status.textContent = hit ? "Hit!" : "Miss!";

  if (hit) {
    const hits = boardContainer.querySelectorAll(".hit").length;
    if (hits >= SHIP_SIZES.reduce((a, b) => a + b, 0)) {
      instructions.textContent = `Player ${currentPlayer + 1} Wins!`;
      phase = "gameover";
    }
  } else {
    currentPlayer = opponent;
    instructions.textContent = `Player ${currentPlayer + 1}'s turn! Answer a card, then guess.`;
  }
}

function getCell(x, y) {
  return boardContainer.querySelector(`.cell[data-x='${x}'][data-y='${y}']`);
}

function resetBoard() {
  buildBoard();
  doneBtn.style.display = "none";
  document.querySelectorAll(".ship").forEach(ship => ship.remove());
  if (currentPlayer === 1) addShipsToSelection();
}

function addShipsToSelection() {
  const selection = document.getElementById("ship-selection");
  SHIP_SIZES.forEach(size => {
    const ship = document.createElement("div");
    ship.className = "ship";
    ship.draggable = true;
    ship.dataset.size = size;
    ship.textContent = `🚢 ${size}`;
    ship.style.width = `${size * 30}px`;
    ship.ondragstart = () => draggingSize = size;
    selection.appendChild(ship);
  });
}
