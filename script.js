const GRID_SIZE = 10;
const SHIP_SIZES = [5, 4, 3, 3, 2];

let shipSelections = [[], []];
let placedShips = [[], []];
let guesses = [[], []];
let currentPlayer = 0;
let phase = "placement";
let draggingSize = null;
let draggingVertical = false;

const boardContainer = document.getElementById("board-container");
const instructions = document.getElementById("instructions");
const status = document.getElementById("status");
const doneBtn = document.getElementById("done-btn");
const shipSelectionDiv = document.getElementById("ship-selection");

function resetShipSelections() {
  shipSelections = [SHIP_SIZES.slice(), SHIP_SIZES.slice()];
  placedShips = [[], []];
  guesses = [[], []];
}

function buildBoard(forPlayer) {
  boardContainer.innerHTML = "";

  boardContainer.appendChild(document.createElement("div"));
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

      if (phase === "placement" && forPlayer === currentPlayer) {
        cell.ondragover = (e) => e.preventDefault();
        cell.ondrop = (e) => {
          e.preventDefault();
          placeShip(r, c);
        };
      }

      if (phase === "gameplay" && forPlayer !== currentPlayer) {
        cell.onclick = () => makeGuess(r, c);
      }

      if (phase === "placement" && forPlayer === currentPlayer) {
        for (const ship of placedShips[forPlayer]) {
          for (let i = 0; i < ship.size; i++) {
            const sx = ship.x + (ship.vertical ? i : 0);
            const sy = ship.y + (ship.vertical ? 0 : i);
            if (sx === r && sy === c) {
              cell.classList.add("occupied");
              cell.onclick = () => removeShip(ship);
            }
          }
        }
      }

      if (phase === "gameplay" && forPlayer !== currentPlayer) {
        const guess = guesses[currentPlayer].find((g) => g.x === r && g.y === c);
        if (guess) {
          cell.classList.add(guess.hit ? "hit" : "miss");
          cell.textContent = guess.hit ? "🔥" : "⭕";
        }
      }

      boardContainer.appendChild(cell);
    }
  }
}

function createShipElement(size) {
  const ship = document.createElement("div");
  ship.className = "ship";
  ship.draggable = true;
  ship.dataset.size = size;
  ship.dataset.vertical = "false";
  ship.textContent = `🚢 ${size}`;
  ship.style.setProperty("--size", size);

  ship.onclick = (e) => {
    e.preventDefault();
    const vertical = ship.dataset.vertical === "true";
    ship.dataset.vertical = vertical ? "false" : "true";
    ship.classList.toggle("vertical");
  };

  ship.ondragstart = (e) => {
    draggingSize = size;
    draggingVertical = ship.dataset.vertical === "true";
    const crt = ship.cloneNode(true);
    crt.style.position = "absolute";
    crt.style.top = "-1000px";
    crt.style.left = "-1000px";
    crt.style.zIndex = "999";
    crt.style.pointerEvents = "none";
    document.body.appendChild(crt);
    e.dataTransfer.setDragImage(crt, 0, 0);
    setTimeout(() => document.body.removeChild(crt), 0);
  };

  return ship;
}

function renderShipSelection() {
  shipSelectionDiv.innerHTML = "";
  for (const size of shipSelections[currentPlayer]) {
    const ship = createShipElement(size);
    shipSelectionDiv.appendChild(ship);
  }
}

function isOccupied(x, y) {
  for (const ship of placedShips[currentPlayer]) {
    for (let i = 0; i < ship.size; i++) {
      const sx = ship.x + (ship.vertical ? i : 0);
      const sy = ship.y + (ship.vertical ? 0 : i);
      if (sx === x && sy === y) return true;
    }
  }
  return false;
}

function placeShip(x, y) {
  if (draggingSize == null) return;

  if (draggingVertical) {
    if (x + draggingSize > GRID_SIZE) return;
    for (let i = 0; i < draggingSize; i++) {
      if (isOccupied(x + i, y)) return;
    }
  } else {
    if (y + draggingSize > GRID_SIZE) return;
    for (let i = 0; i < draggingSize; i++) {
      if (isOccupied(x, y + i)) return;
    }
  }

  placedShips[currentPlayer].push({ x, y, size: draggingSize, vertical: draggingVertical });
  const idx = shipSelections[currentPlayer].indexOf(draggingSize);
  if (idx !== -1) shipSelections[currentPlayer].splice(idx, 1);

  draggingSize = null;
  renderShipSelection();
  buildBoard(currentPlayer);
  doneBtn.style.display = shipSelections[currentPlayer].length === 0 ? "inline-block" : "none";
}

function removeShip(ship) {
  placedShips[currentPlayer] = placedShips[currentPlayer].filter((s) => s !== ship);
  shipSelections[currentPlayer].push(ship.size);
  renderShipSelection();
  buildBoard(currentPlayer);
  doneBtn.style.display = shipSelections[currentPlayer].length === 0 ? "inline-block" : "none";
}

doneBtn.onclick = () => {
  if (phase === "gameover") return resetGame();

  if (phase === "placement") {
    if (currentPlayer === 0) {
      currentPlayer = 1;
      instructions.innerHTML = "<span class='player2'>Player 2:</span> Place your ships (click to rotate, drag to grid)";
      renderShipSelection();
      buildBoard(currentPlayer);
      doneBtn.style.display = "none";
      status.textContent = "";
    } else {
      phase = "gameplay";
      currentPlayer = 0;
      instructions.innerHTML = "<span class='player1'>Player 1's turn!</span> Click opponent's grid to guess.";
      shipSelectionDiv.innerHTML = "";
      buildBoard(1);
      doneBtn.style.display = "none";
      status.textContent = "";
    }
  }
};

function makeGuess(x, y) {
  if (phase !== "gameplay") return;

  const opponent = (currentPlayer + 1) % 2;
  if (guesses[currentPlayer].some((g) => g.x === x && g.y === y)) return;

  let hit = false;
  for (const ship of placedShips[opponent]) {
    for (let i = 0; i < ship.size; i++) {
      const sx = ship.x + (ship.vertical ? i : 0);
      const sy = ship.y + (ship.vertical ? 0 : i);
      if (sx === x && sy === y) hit = true;
    }
  }

  guesses[currentPlayer].push({ x, y, hit });

  const totalHits = guesses[currentPlayer].filter((g) => g.hit).length;
  const totalShipCells = SHIP_SIZES.reduce((a, b) => a + b);

  if (totalHits >= totalShipCells) {
    phase = "gameover";
    instructions.textContent = `Player ${currentPlayer + 1} Wins! 🎉`;
    doneBtn.style.display = "inline-block";
    doneBtn.textContent = "Restart";
    status.textContent = "";
    buildBoard(opponent);
    return;
  }

  if (hit) {
    status.textContent = "Hit! You get another turn.";
    buildBoard(opponent);
  } else {
    currentPlayer = opponent;
    instructions.innerHTML = `<span class='player${currentPlayer + 1}'>Player ${currentPlayer + 1}'s turn!</span> Click opponent's grid to guess.`;
    buildBoard((currentPlayer + 1) % 2);
    status.textContent = "Miss! Switching turns.";
  }
}

function resetGame() {
  resetShipSelections();
  phase = "placement";
  currentPlayer = 0;
  status.textContent = "";
  instructions.innerHTML = "<span class='player1'>Player 1:</span> Place your ships (click to rotate, drag to grid)";
  doneBtn.textContent = "Done";
  doneBtn.style.display = "none";
  renderShipSelection();
  buildBoard(currentPlayer);
}

resetGame();
