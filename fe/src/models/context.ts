type Color = "b" | "w";

export default interface Context {
  loaded: boolean;
  width: number;
  height: number;
  me: number;
  users: {
    user: number;
    name: string;
    color: Color;
    x: number;
    y: number;
  }[];
  stones: { x: number; y: number; color: Color }[];
  lifetime: number;
  winner: {
    names: string[];
    color: Color;
  } | null;

  error: boolean;
  end: boolean;

  latency: number[];
}

export function emptyContext(): Context {
  return {
    loaded: false,
    height: 0,
    width: 0,
    lifetime: 0,
    me: 0,
    stones: [],
    users: [],
    winner: null,
    error: false,
    end: false,
    latency: [],
  };
}
