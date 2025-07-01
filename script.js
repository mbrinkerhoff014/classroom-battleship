const GRID_SIZE = 10;
const SHIP_SIZES = [5, 4, 3, 3, 2];
let shipSelections = [[], []]; // Ships remaining to place per player
let placedShips = [[], []]; // Ships placed per player, each: {x, y, size, vertical}
let currentPlayer = 0;
let phase = "placement"; // 'placement' or 'gameplay' or 'gameover'
let draggingSize = null;
let isVertical = false;
let draggingShipElement = null;

const boardContainer = document.getElementById("board-container");
const instructions = document.getElementById("instructions");
const status = document.getElementById("status");
const doneBtn = document.getElementById("done-btn");
const shipSelectionDiv = document.getElementById("ship-selection");
const rotateBtn = document.getElementById("rotate-btn");

function resetShipSelections() {
  shipSelections = [SHIP_SIZES.slice(), SHIP_SIZES.slice()];
  placedShips = [[], []];
}

function buildBoard(forPlayer, forSetup = false) {
  boardContainer.innerHTML = "";
  boardContainer.appendChild(document.createElement("div")); // empty corner

  // Columns A-J
  for (let c = 0; c < GRID_SIZE; c++) {
    const label = document.createElement("div");
    label.textContent = String.fromCharCode(65 + c);
    boardContainer.appendChild(label);
  }

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

      if (phase === "placement" && forPlayer === currentPlayer) {
        cell.ondragover = (e) => e.preventDefault();
        cell.ondrop = () => placeShip(r, c);
        cell.onclick = () => removeShipPart(r, c);
      } else if (phase === "gameplay" && forPlayer !== currentPlayer) {
        cell.onclick = () => guess(r, c);
      }

      // Show placed ships for setup (only for current player)
      if (phase === "placement" && forPlayer === currentPlayer) {
        for (const ship of placedShips[forPlayer]) {
          for (let i = 0; i < ship.size; i++) {
            const sx = ship.x + (ship.vertical ? 0 : i);
            const sy = ship.y + (ship.vertical ? i : 0);
            if (sx === r && sy === c) cell.classList.add("occupied");
          }
        }
      }

      // Show hits/misses during gameplay
      if (phase === "gameplay" && forPlayer !== currentPlayer) {
        const hitMiss = getHitMiss(forPlayer, r, c);
        if (hitMiss === "hit") cell.classList.add("hit");
        else if (hitMiss === "miss") cell.classList.add("miss");
      }

      boardContainer.appendChild(cell);
    }
  }
}

function getHitMiss(player, x, y) {
  // Return 'hit' or 'miss' or null by checking guesses from opponent
  const opponent = (player + 1) % 2;
  const guesses = placedShips[opponent].guesses || [];
  for (const g of guesses) {
    if (g.x === x && g.y === y) return g.hit ? "hit" : "miss";
  }
  return null;
}

function createShipElement(size) {
  const ship = document.createElement("div");
  ship.className = "ship" + (isVertical ? " vertical" : "");
  ship.draggable = true;
  ship.dataset.size = size;
  ship.textContent = `🚢 ${size}`;
  ship.style.width = isVertical ? "30px" : `${size * 30}px`;
  ship.style.height = isVertical ? `${size * 30}px` : "30px";

  ship.ondragstart = () => {
    draggingSize = size;
    draggingShipElement = ship;
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

  // Check if ship fits and does not overlap
  if (isVertical) {
    if (y + draggingSize > GRID_SIZE) return;
    for (let i = 0; i < draggingSize; i++) {
      if (isOccupied(x, y + i)) return;
    }
  } else {
    if (x + draggingSize > GRID_SIZE) return;
    for (let i = 0; i < draggingSize; i++) {
      if (isOccupied(x + i, y)) return;
    }
  }

  // Add ship placement
  placedShips[currentPlayer].push({
    x,
    y,
    size: draggingSize,
    vertical: isVertical,
  });

  // Remove ship size from selection
  const idx = shipSelections[currentPlayer].indexOf(draggingSize);
  if (idx !== -1) shipSelections[currentPlayer].splice(idx, 1);

  draggingSize = null;
  draggingShipElement = null;
  renderShipSelection();
  buildBoard(currentPlayer, true);
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

// Remove entire ship if clicking on one of its parts during setup
function removeShipPart(x, y) {
  if (phase !== "placement") return;
  const ships = placedShips[currentPlayer];
  for (let i = 0; i < ships.length; i++) {
    const ship = ships[i];
    for (let j = 0; j < ship.size; j++) {
      const sx = ship.x + (ship.vertical ? 0 : j);
      const sy = ship.y + (ship.vertical ? j : 0);
      if (sx === x && sy === y) {
        ships.splice(i, 1);
        shipSelections[currentPlayer].push(ship.size);
        renderShipSelection();
        buildBoard(currentPlayer, true);
        doneBtn.style.display = "none";
        return;
      }
    }
  }
}

doneBtn.onclick = () => {
  if (currentPlayer === 0) {
    currentPlayer = 1;
    instructions.textContent = "Player 2: Drag your ships onto the board";
    renderShipSelection();
    buildBoard(currentPlayer, true);
    doneBtn.style.display = "none";
    status.textContent = "";
  } else {
    phase = "gameplay";
    currentPlayer = 0;
    instructions.textContent = "Player 1's turn! Answer a card, then guess.";
    status.textContent = "";
    renderShipSelection(); // Hide ships during gameplay
    shipSelectionDiv.innerHTML = "";
    buildBoard(1, false); // Show opponent board to guess on
    doneBtn.style.display = "none";
  }
};

function guess(x, y) {
  if (phase !== "gameplay") return;
  const opponent = (currentPlayer + 1) % 2;
  const guesses = placedShips[currentPlayer].guesses || [];
  if (guesses.some((g) => g.x === x && g.y === y)) return; // already guessed

  const opponentShips = placedShips[opponent];
  let hit = false;

  // Check if guess hits opponent ship
  outer: for (const ship of opponentShips) {
    for (let i = 0; i < ship.size; i++) {
      const sx = ship.x + (ship.vertical ? 0 : i);
      const sy = ship.y + (ship.vertical ? i : 0);
      if (sx === x && sy === y) {
        hit = true;
        break outer;
      }
    }
  }

  guesses.push({ x, y, hit });
  placedShips[currentPlayer].guesses = guesses;

  buildBoard(opponent, false); // redraw opponent's board with hits/misses

  if (hit) {
    status.textContent = "Hit!";
    // Check win
    const totalShipCells = SHIP_SIZES.reduce((a, b) => a + b);
    const totalHits = guesses.filter((g) => g.hit).length;
    if (totalHits === totalShipCells) {
      instructions.textContent = `Player ${currentPlayer + 1} Wins!`;
      phase = "gameover";
      doneBtn.style.display = "inline-block";
      doneBtn.textContent = "Restart Game";
      doneBtn.onclick = resetGame;
    }
  } else {
    status.textContent = "Miss! Turn switches.";
    currentPlayer = opponent;
    instructions.textContent = `Player ${currentPlayer + 1}'s turn! Answer a card, then guess.`;
    buildBoard(currentPlayer === 0 ? 1 : 0, false); // Show opponent board for next guess
  }
}

rotateBtn.onclick = () => {
  isVertical = !isVertical;
  document.querySelectorAll(".ship").forEach((ship) =>
    ship.classList.toggle("vertical", isVertical)
  );
};

function resetGame() {
  resetShipSelections();
  phase = "placement";
  currentPlayer = 0;
  status.textContent = "";
  instructions.textContent = "Player 1: Drag your ships onto the board";
  doneBtn.textContent = "Done";
  doneBtn.style.display = "none";
  renderShipSelection();
  buildBoard(currentPlayer, true);
}

resetGame();
