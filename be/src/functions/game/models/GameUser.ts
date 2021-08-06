import Color from "./Color";

export default interface GameUser {
  user: number;
  name: string;
  connectionId: string;
  x: number;
  y: number;
  color: Color;
}
