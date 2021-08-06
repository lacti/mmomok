export interface LoadRequest {
  type: "load";
}

export interface MoveRequest {
  type: "move";
  dir: "l" | "r" | "t" | "b";
}

export interface PlaceRequest {
  type: "place";
}

export type GameRequest = LoadRequest | MoveRequest | PlaceRequest;

type Color = "b" | "w";

export interface LoadedResponse {
  type: "loaded";
  me: number;
  users: {
    user: number;
    name: string;
    color: Color;
    x: number;
    y: number;
  }[];
  height: number;
  width: number;
  stones: { x: number; y: number; color: Color }[];
}

export interface EnteredResponse {
  type: "entered";
  user: number;
  name: string;
  color: Color;
  x: number;
  y: number;
}

export interface LeavedResponse {
  type: "leaved";
  user: number;
  name: string;
  color: Color;
}

export interface GameOverResponse {
  type: "gameover";
  winner: {
    names: string[];
    color: Color;
  };
}

export interface ClockResponse {
  type: "clock";
  remain: number;
}

export interface MovedResponse {
  type: "moved";
  user: number;
  x: number;
  y: number;
}

export interface PlacedResponse {
  type: "placed";
  color: Color;
  x: number;
  y: number;
}

export type GameResponse =
  | LoadedResponse
  | EnteredResponse
  | LeavedResponse
  | GameOverResponse
  | ClockResponse
  | MovedResponse
  | PlacedResponse;
