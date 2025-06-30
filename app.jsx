// Classroom Battleship Game - 10x10 Grid with Drag & Drop Ships
// React + Tailwind (No external UI libraries required)

import { useState } from "react";

const GRID_SIZE = 10;
const SHIP_SIZES = [5, 4, 3, 3, 2];

export default function App() {
  const [playerBoards, setPlayerBoards] = useState([
    createEmptyBoard(),
    createEmptyBoard(),
  ]);
  const [shipPlacements, setShipPlacements] = useState([[], []]);
  const [currentPlayer, setCurrentPlayer] = useState(0);
  const [phase, setPhase] = useState("placement"); // placement, gameplay
  const [message, setMessage] = useState("");
  const [activeShip, setActiveShip] = useState(null);

  function createEmptyBoard() {
    return Array(GRID_SIZE)
      .fill(0)
      .map(() => Array(GRID_SIZE).fill(""));
  }

  function handleDrop(x, y) {
    if (activeShip == null) return;
    const length = activeShip;

    if (x + length > GRID_SIZE) return;

    const newPlacements = [...shipPlacements];
    for (let i = 0; i < length; i++) {
      if (newPlacements[currentPlayer].some(([sx, sy]) => sx === x + i && sy === y)) return;
    }
    for (let i = 0; i < length; i++) {
      newPlacements[currentPlayer].push([x + i, y]);
    }
    setShipPlacements(newPlacements);
    setActiveShip(null);
  }

  function handleGuess(x, y) {
    const opponent = (currentPlayer + 1) % 2;
    const opponentShips = shipPlacements[opponent];
    const newBoards = [...playerBoards];

    if (newBoards[currentPlayer][x][y]) return;

    const isHit = opponentShips.some(([sx, sy]) => sx === x && sy === y);
    newBoards[currentPlayer][x][y] = isHit ? "H" : "M";
    setPlayerBoards(newBoards);

    if (isHit) {
      setMessage("Hit!");
      const remainingShips = opponentShips.filter(
        ([sx, sy]) => newBoards[currentPlayer][sx][sy] !== "H"
      );
      if (remainingShips.length === 0) {
        setPhase("gameover");
        setMessage(`Player ${currentPlayer + 1} Wins!`);
      }
    } else {
      setMessage("Miss!");
      setCurrentPlayer(opponent);
    }
  }

  function donePlacing() {
    if (shipPlacements[currentPlayer].length !== SHIP_SIZES.reduce((a, b) => a + b)) return;
    if (currentPlayer === 0) {
      setCurrentPlayer(1);
    } else {
      setPhase("gameplay");
      setCurrentPlayer(0);
    }
  }

  function resetGame() {
    setPlayerBoards([createEmptyBoard(), createEmptyBoard()]);
    setShipPlacements([[], []]);
    setCurrentPlayer(0);
    setPhase("placement");
    setMessage("");
    setActiveShip(null);
  }

  const columnLabels = Array.from({ length: GRID_SIZE }, (_, i) => String.fromCharCode(65 + i));

  return (
    <div className="p-4 space-y-4 text-center">
      <h1 className="text-2xl font-bold">Classroom Battleship</h1>
      {phase === "placement" && (
        <>
          <p>Player {currentPlayer + 1}, place your ships by dragging them onto the board.</p>
          <div className="flex justify-center gap-2 mb-4">
            {SHIP_SIZES.map((size, i) => (
              <button
                key={i}
                onClick={() => setActiveShip(size)}
                disabled={
                  shipPlacements[currentPlayer].filter((_, idx) => idx < SHIP_SIZES.slice(0, i).reduce((a, b) => a + b, 0)).length === SHIP_SIZES.slice(0, i + 1).reduce((a, b) => a + b, 0)
                }
                className={`px-2 py-1 border ${activeShip === size ? "bg-blue-200" : ""}`}
              >
                {size}-Cell Ship
              </button>
            ))}
          </div>
        </>
      )}
      {phase === "gameplay" && <p>Player {currentPlayer + 1}'s turn. Answer a card before guessing!</p>}
      {phase === "gameover" && <p className="font-bold text-green-600">{message}</p>}
      {message && phase !== "gameover" && <p className="text-lg font-semibold">{message}</p>}

      <div className="flex justify-center">
        <table className="border-collapse">
          <thead>
            <tr>
              <th></th>
              {columnLabels.map((label) => (
                <th key={label} className="px-2">{label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: GRID_SIZE }, (_, x) => (
              <tr key={x}>
                <th className="px-2">{x + 1}</th>
                {Array.from({ length: GRID_SIZE }, (_, y) => (
                  <td key={y}>
                    <button
                      className="h-10 w-10 border border-gray-400 flex items-center justify-center text-lg"
                      onClick={() => {
                        if (phase === "placement" && currentPlayer === 0 && activeShip != null) handleDrop(x, y);
                        if (phase === "gameplay" && currentPlayer === 0) handleGuess(x, y);
                      }}
                      disabled={
                        (phase === "placement" && currentPlayer !== 0) ||
                        (phase === "gameplay" && currentPlayer !== 0) ||
                        (phase === "gameplay" && playerBoards[currentPlayer][x][y]) ||
                        phase === "gameover"
                      }
                    >
                      {phase === "placement" && shipPlacements[0].some(([sx, sy]) => sx === x && sy === y) ? "🚢" : null}
                      {phase === "gameplay" && playerBoards[currentPlayer][x][y] === "H" ? "🔥" : null}
                      {phase === "gameplay" && playerBoards[currentPlayer][x][y] === "M" ? "⭕" : null}
                    </button>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {phase === "placement" && (
        <button
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded"
          onClick={donePlacing}
          disabled={shipPlacements[currentPlayer].length !== SHIP_SIZES.reduce((a, b) => a + b, 0)}
        >
          Done
        </button>
      )}

      {phase === "gameover" && (
        <button
          className="mt-4 px-4 py-2 bg-green-500 text-white rounded"
          onClick={resetGame}
        >
          New Game
        </button>
      )}
    </div>
  );
}
