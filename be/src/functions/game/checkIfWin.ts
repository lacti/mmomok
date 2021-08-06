import GameTile from "./models/GameTile";
import Placed from "./models/Placed";

export default function checkIfWin(
  board: GameTile[][],
  placed: Placed
): boolean {
  function check(ny: number, nx: number): boolean {
    if (ny < 0 || ny >= board.length || nx < 0 || nx >= board[0].length) {
      return false;
    }
    return board[ny][nx].stone === placed.color;
  }
  const { y, x } = placed;
  for (let d = 0; d < 5; ++d) {
    if (
      check(y - 4 + d, x) &&
      check(y - 3 + d, x) &&
      check(y - 2 + d, x) &&
      check(y - 1 + d, x) &&
      check(y - 0 + d, x)
    ) {
      return true;
    }
    if (
      check(y, x - 4 + d) &&
      check(y, x - 3 + d) &&
      check(y, x - 2 + d) &&
      check(y, x - 1 + d) &&
      check(y, x - 0 + d)
    ) {
      return true;
    }
    if (
      check(y - 4 + d, x - 4 + d) &&
      check(y - 3 + d, x - 3 + d) &&
      check(y - 2 + d, x - 2 + d) &&
      check(y - 1 + d, x - 1 + d) &&
      check(y - 0 + d, x - 0 + d)
    ) {
      return true;
    }
    if (
      check(y - 4 + d, x + 4 + d) &&
      check(y - 3 + d, x + 3 + d) &&
      check(y - 2 + d, x + 2 + d) &&
      check(y - 1 + d, x + 1 + d) &&
      check(y - 0 + d, x + 0 + d)
    ) {
      return true;
    }
  }
  return false;
}
