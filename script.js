const GRID_SIZE = 10;
const SHIP_SIZES = [5, 4, 3, 3, 2];
let shipSelections = [[], []];
let placedShips = [[], []];
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
        cell.ondrop = () => placeShip(r, c);
      } else if (phase === "gameplay" && forPlayer !== currentPlayer) {
        cell.onclick = () => guess(r, c);
      }

      // Show placed ships
      if (phase === "placement" && forPlayer === currentPlayer) {
        for (const ship of placedShips[forPlayer]) {
          for (let i = 0; i < ship.size; i++) {
            const sx = ship.x + (ship.vertical ? 0 : i);
            const sy = ship.y + (ship.vertical ? i : 0);
            if (sx === r && sy === c) {
              cell.classList.add("occupied");
              cell.onclick = () => removeShip(ship);
            }
          }
        }
      }

      // Show hits/misses
      if (phase === "gameplay" && forPlayer !== currentPlayer) {
        const guesses = placedShips[currentPlayer].guesses || [];
        for (const g of guesses) {
          if (g.x === r && g.y === c) {
            cell.classList.add(g.hit ? "hit" : "miss");
          }
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
  ship.style.width = `${size * 30}px`;
  ship.style.height = "30px";

  ship.onclick = (e) => {
    e.preventDefault();
    const vertical = ship.dataset.vertical === "true";
    ship.dataset.vertical = vertical ? "false" : "true";
    ship.classList.toggle("vertical");
    if (vertical) {
      ship.style.width = `${size * 30}px`;
      ship.style.height = "30px";
    } else {
      ship.style.width = "30px";
      ship.style.height = `${size * 30}px`;
    }
  };

  ship.ondragstart = () => {
    draggingSize = size;
    draggingVertical = ship.dataset.vertical === "true";
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

function placeShip(x, y) {
  if (draggingSize == null) return;

  // Use current dragging orientation exactly as previewed
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

  placedShips[currentPlayer].push({
    x,
    y,
    size: draggingSize,
    vertical: draggingVertical,
  });

  const idx = shipSelections[currentPlayer].indexOf(draggingSize);
  if (idx !== -1) shipSelections[currentPlayer].splice(idx, 1);

  draggingSize = null;
  renderShipSelection();
  buildBoard(currentPlayer);
  doneBtn.style.display =
    shipSelections[currentPlayer].length === 0 ? "inline-block" : "none";
}

function removeShip(ship) {
  placedShips[currentPlayer] = placedShips[currentPlayer].filter((s) => s !== ship);
  shipSelections[currentPlayer].push(ship.size);
  renderShipSelection();
  buildBoard(currentPlayer);
  doneBtn.style.display =
    shipSelections[currentPlayer].length === 0 ? "inline-block" : "none";
}

function isOccupied(x, y) {
  for (const ship of placedShips[currentPlayer]) {
    for (let i = 0; i < ship.size; i++) {
      const sx = ship.x + (ship.vertical ? 0 : i);
      const sy = ship.y + (ship.vertical ? i : 0);
      if (sx === x && sy === y) return true;
    }
  }
  return false;
}

doneBtn.onclick = () => {
  if (phase === "gameover") {
    resetGame();
    return;
  }

  if (currentPlayer === 0) {
    currentPlayer = 1;
    instructions.textContent = "Player 2: Place your ships";
    renderShipSelection();
    buildBoard(currentPlayer);
    doneBtn.style.display = "none";
  } else {
    phase = "gameplay";
    currentPlayer = 0;
    instructions.textContent = "Player 1's turn! Guess opponent's grid.";
    shipSelectionDiv.innerHTML = "";
    buildBoard(1);
    doneBtn.style.display = "none";
  }
};

function guess(x, y) {
  if (phase !== "gameplay") return;
  const opponent = (currentPlayer + 1) % 2;
  placedShips[currentPlayer].guesses = placedShips[currentPlayer].guesses || [];

  if (placedShips[currentPlayer].guesses.some((g) => g.x === x && g.y === y))
    return;

  const ships = placedShips[opponent];
  let hit = false;

  outer: for (const ship of ships) {
    for (let i = 0; i < ship.size; i++) {
      const sx = ship.x + (ship.vertical ? 0 : i);
      const sy = ship.y + (ship.vertical ? i : 0);
      if (sx === x && sy === y) {
        hit = true;
        break outer;
      }
    }
  }

  placedShips[currentPlayer].guesses.push({ x, y, hit });
  buildBoard(opponent);

  if (hit) {
    status.textContent = "Hit!";
    const totalHits = placedShips[currentPlayer].guesses.filter((g) => g.hit).length;
    const totalShipCells = SHIP_SIZES.reduce((a, b) => a + b);
    if (totalHits === totalShipCells) {
      instructions.textContent = `Player ${currentPlayer + 1} Wins!`;
      phase = "gameover";
      doneBtn.style.display = "inline-block";
      doneBtn.textContent = "Restart";
      return;
    }
  } else {
    status.textContent = "Miss! Turn switches.";
    currentPlayer = opponent;
  }

  instructions.textContent = `Player ${currentPlayer + 1}'s turn! Guess opponent's grid.`;
  buildBoard(currentPlayer === 0 ? 1 : 0);
}

function resetGame() {
  resetShipSelections();
  placedShips = [[], []];
  phase = "placement";
  currentPlayer = 0;
  status.textContent = "";
  instructions.textContent = "Player 1: Place your ships";
  doneBtn.textContent = "Done";
  doneBtn.style.display = "none";
  renderShipSelection();
  buildBoard(currentPlayer);
}

resetGame();
