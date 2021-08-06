import Color from "./Color";

export default interface GameTile {
  user: number | null;
  stone: Color | null;
}
