import { GameRequest, GameResponse } from "./messages";

import Context from "../models/context";
import { emptyContext } from "../models/context";
import sleep from "../utils/sleep";
import startGame from "./startGame";

const wsEndpoint = process.env.REACT_APP_WS_ENDPOINT ?? "ws://localhost:3001";

type Sender = (req: GameRequest) => Promise<void>;
let context: Context = emptyContext();
let sender: Sender | null = null;

export function getContext() {
  return { ...context };
}

export async function sendMessage(request: GameRequest): Promise<void> {
  if (sender) {
    return sender(request);
  }
}

export default async function gameLoop({
  gameId,
  memberId,
}: {
  gameId: string;
  memberId: string;
}): Promise<void> {
  await startGame({ gameId });
  await sleep(1000);

  console.info(`${wsEndpoint}?x-game-id=${gameId}&x-member-id=${memberId}`);
  const socket = new WebSocket(
    `${wsEndpoint}?x-game-id=${gameId}&x-member-id=${memberId}`
  );
  async function send(request: GameRequest): Promise<void> {
    socket.send(JSON.stringify(request));
  }

  let pingTimer: NodeJS.Timer | null = null;
  socket.addEventListener("open", async () => {
    context = emptyContext();
    sender = send;
    await sleep(500);
    await send({ type: "load" });
    pingTimer = setInterval(() => {
      send({ type: "ping", clientRequest: Date.now() });
    }, 1000);
  });

  socket.addEventListener("message", async (event) => {
    const response: GameResponse = JSON.parse(event.data);
    const now = Date.now();
    console.info({ response }, "OnMessage");
    switch (response.type) {
      case "loaded":
        context.loaded = true;
        context.width = response.width;
        context.height = response.height;
        context.me = response.me;
        context.stones = response.stones;
        context.users = response.users;
        break;
      case "entered":
        context.users.push({
          user: response.user,
          name: response.name,
          color: response.color,
          x: response.x,
          y: response.y,
        });
        break;
      case "leaved":
        context.users = context.users.filter((u) => u.user !== response.user);
        break;
      case "moved":
        const user = context.users.find((u) => u.user === response.user);
        if (user) {
          user.x = response.x;
          user.y = response.y;
        }
        break;
      case "placed":
        context.stones.push({
          color: response.color,
          x: response.x,
          y: response.y,
        });
        break;
      case "clock":
        context.lifetime = response.remain;
        break;
      case "gameover":
        context.winner = response.winner;
        break;
      case "pong":
        context.latency.push(now - response.clientRequest);
        console.info({
          reqToDeq: response.serverDequeue - response.clientRequest,
          deqToNow: now - response.serverDequeue,
          reqToNow: now - response.clientRequest,
        });
        break;
    }
  });
  socket.addEventListener("error", (event) => {
    console.info({ event }, "Error from socket");
    context.error = true;
  });
  socket.addEventListener("close", (event) => {
    console.info({ event }, "Socket is over");
    context.end = true;
    if (pingTimer) {
      clearInterval(pingTimer);
      pingTimer = null;
    }
    sender = null;
  });
}
