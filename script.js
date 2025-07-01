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

  // Add top-left empty corner for grid labels
  boardContainer.appendChild(document.createElement("div"));

  // Add column labels A-J
  for (let c = 0; c < GRID_SIZE; c++) {
    const label = document.createElement("div");
    label.textContent = String.fromCharCode(65 + c);
    boardContainer.appendChild(label);
  }

  // Add rows with row number and cells
  for (let r = 0; r < GRID_SIZE; r++) {
    // Row label
    const rowLabel = document.createElement("div");
    rowLabel.textContent = r + 1;
    boardContainer.appendChild(rowLabel);

    for (let c = 0; c < GRID_SIZE; c++) {
      const cell = document.createElement("div");
      cell.className = "cell";
      cell.dataset.x = r;
      cell.dataset.y = c;

      // Placement phase for current player - allow drag/drop
      if (phase === "placement" && forPlayer === currentPlayer) {
        cell.ondragover = (e) => e.preventDefault();
        cell.ondrop = (e) => {
          e.preventDefault();
          placeShip(r, c);
        };
      }

      // Gameplay phase - only allow clicks on opponent's board
      if (phase === "gameplay" && forPlayer !== currentPlayer) {
        cell.onclick = () => makeGuess(r, c);
      }

      // Show placed ships during placement for current player
      if (phase === "placement" && forPlayer === currentPlayer) {
        for (const ship of placedShips[forPlayer]) {
          for (let i = 0; i < ship.size; i++) {
            const sx = ship.x + (ship.vertical ? i : 0);
            const sy = ship.y + (ship.vertical ? 0 : i);
            if (sx === r && sy === c) {
              cell.classList.add("occupied");
              // Allow removing ship by clicking its cells
              cell.onclick = () => removeShip(ship);
            }
          }
        }
      }

      // Show hits/misses during gameplay on opponent board
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

    // Hack: create drag ghost image matching ship size/direction
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

  placedShips[currentPlayer].push({
    x,
    y,
    size: draggingSize,
    vertical: draggingVertical,
  });

  // Remove placed ship from selection
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

doneBtn.onclick = () => {
  if (phase === "gameover") {
    resetGame();
    return;
  }

  if (phase === "placement") {
    if (currentPlayer === 0) {
      currentPlayer = 1;
      instructions.textContent = "Player 2: Place your ships (click to rotate, drag to grid)";
      renderShipSelection();
      buildBoard(currentPlayer);
      doneBtn.style.display = "none";
      status.textContent = "";
    } else {
      phase = "gameplay";
      currentPlayer = 0;
      instructions.textContent = "Player 1's turn! Click opponent's grid to guess.";
      shipSelectionDiv.innerHTML = "";
      buildBoard(1); // Show opponent's board for guessing
      doneBtn.style.display = "none";
      status.textContent = "";
    }
  }
};

function makeGuess(x, y) {
  if (phase !== "gameplay") return;

  // Ignore repeated guesses
  if (guesses[currentPlayer].some((g) => g.x === x && g.y === y)) return;

  const opponent = (currentPlayer + 1) % 2;
  const ships = placedShips[opponent];

  let hit = false;

  outer: for (const ship of ships) {
    for (let i = 0; i < ship.size; i++) {
      const sx = ship.x + (ship.vertical ? i : 0);
      const sy = ship.y + (ship.vertical ? 0 : i);
      if (sx === x && sy === y) {
        hit = true;
        break outer;
      }
    }
  }

  guesses[currentPlayer].push({ x, y, hit });
  buildBoard(opponent);

  if (hit) {
    status.textContent = "Hit! You get another turn.";
  } else {
    status.textContent = "Miss! Turn passes to opponent.";
    currentPlayer = opponent;
    instructions.textContent = `Player ${currentPlayer + 1}'s turn! Click opponent's grid to guess.`;
  }

  // Check for win
  const totalHits = guesses[currentPlayer].filter((g) => g.hit).length;
  const totalShipCells = SHIP_SIZES.reduce((a, b) => a + b);

  if (totalHits >= totalShipCells) {
    phase = "gameover";
    instructions.textContent = `Player ${currentPlayer + 1} Wins! 🎉`;
    doneBtn.style.display = "inline-block";
    doneBtn.textContent = "Restart";
    status.textContent = "";
  }
}

function resetGame() {
  resetShipSelections();
  phase = "placement";
  currentPlayer = 0;
  status.textContent = "";
  instructions.textContent = "Player 1: Place your ships (click to rotate, drag to grid)";
  doneBtn.textContent = "Done";
  doneBtn.style.display = "none";
  renderShipSelection();
  buildBoard(currentPlayer);
}

resetGame();
