import "source-map-support/register";

import * as crypto from "crypto";

import { GameResponse, LoadedResponse } from "../../models/GameMessage";
import {
  gameLockRedisKeyFromGameId,
  gameQueueRedisKeyFromGameId,
  redisKeyForGameIdMappingFromConnectionId,
} from "../../support/redis/redisKeys";
import { randomBoolean, randomNumber } from "../../support/random";

import { ApiGatewayManagementApi } from "aws-sdk";
import Color from "./models/Color";
import GameTile from "./models/GameTile";
import GameUser from "./models/GameUser";
import { Handler } from "aws-lambda";
import Placed from "./models/Placed";
import QueueItem from "../../models/QueueItem";
import checkIfWin from "./checkIfWin";
import enqueueToGameQueue from "../../support/redis/enqueueToGameQueue";
import redisDel from "@yingyeothon/naive-redis/lib/del";
import redisLrange from "@yingyeothon/naive-redis/lib/lrange";
import redisLtrim from "@yingyeothon/naive-redis/lib/ltrim";
import redisSet from "@yingyeothon/naive-redis/lib/set";
import withRedis from "../../support/redis/withRedis";

const lambdaTtl = 900 * 1000;
const gameSeconds = 600;
const width = 20;
const height = 20;

const offline = !!process.env.IS_OFFLINE;
const webSocketEndpoint = process.env.WS_ENDPOINT!;

export const main: Handler<{ gameId: string }, void> = async (event) => {
  const lambdaId = crypto.randomUUID();
  const { gameId } = event;
  console.info({ lambdaId, gameId }, "Game start");
  if (!gameId) {
    return;
  }

  const gameLock = gameLockRedisKeyFromGameId(gameId);
  await withRedis(async (redisConnection) => {
    const acquired = await redisSet(redisConnection, gameLock, lambdaId, {
      expirationMillis: lambdaTtl,
      onlySet: "nx",
    });
    if (!acquired) {
      console.info(
        { acquired, lambdaId, gameId },
        "Other instance is already running"
      );
      return;
    }

    const gameQueue = gameQueueRedisKeyFromGameId(gameId);
    await enqueueToGameQueue(redisConnection, gameQueue, {
      type: "start",
      payload: {},
    });

    async function flushQueue(): Promise<QueueItem[]> {
      const values = await redisLrange(redisConnection, gameQueue, 0, -1);
      if (!values || values.length === 0) {
        return [];
      }
      const items = values.map((value) => JSON.parse(value) as QueueItem);
      await redisLtrim(redisConnection, gameQueue, items.length, -1);
      return items;
    }

    let users: GameUser[] = [];
    const apimgmt = new ApiGatewayManagementApi({
      endpoint: offline ? `http://localhost:3001` : webSocketEndpoint,
    });
    async function reply(
      connectionId: string,
      payload: string | GameResponse
    ): Promise<void> {
      try {
        await apimgmt
          .postToConnection({
            ConnectionId: connectionId,
            Data:
              typeof payload === "string" ? payload : JSON.stringify(payload),
          })
          .promise();
      } catch (error) {
        console.error({ connectionId, error, payload }, "Cannot reply");
      }
    }

    async function broadcast(
      payload: GameResponse,
      excludedConnectionIds: string[] = []
    ): Promise<void> {
      const data = JSON.stringify(payload);
      const promises = users
        .filter((u) => !excludedConnectionIds.includes(u.connectionId))
        .map((u) => reply(u.connectionId, data));
      try {
        await Promise.all(promises);
      } catch (error) {
        console.error({ error, payload }, "Cannot broadcast");
      }
    }

    let userSequence = 0;
    const board: GameTile[][] = Array.from({ length: height }, () =>
      Array.from({ length: width }, () => ({ user: null, stone: null }))
    );
    let lifetime = gameSeconds;
    let finish = false;
    const startMillis = Date.now();
    while (lifetime > 0 && !finish) {
      const items = await flushQueue();
      const placedStones: Placed[] = [];
      for (const item of items) {
        console.info(JSON.stringify(item));
        switch (item.type) {
          case "start":
            console.info({ item, gameQueue }, "Queue is ready!");
            break;
          case "connect":
            const newbie = {
              user: ++userSequence,
              color: (randomBoolean() ? "b" : "w") as Color,
              connectionId: item.connectionId,
              name: item.payload.memberId,
              x: randomNumber(width),
              y: randomNumber(height),
            };
            await broadcast({
              type: "entered",
              user: newbie.user,
              name: newbie.name,
              color: newbie.color,
              x: newbie.x,
              y: newbie.y,
            });
            users.push(newbie);
            console.info({ item, newbie }, "Welcome");
            break;
          case "disconnect":
            const leaver = users.find(
              (u) => u.connectionId === item.connectionId
            );
            if (leaver) {
              users = users.filter((u) => u.connectionId !== item.connectionId);
              await broadcast({
                type: "leaved",
                user: leaver.user,
                name: leaver.name,
                color: leaver.color,
              });
              console.info({ item }, "Bye");
            }
            break;
          case "message":
            const user = users.find(
              (u) => u.connectionId === item.connectionId
            );
            if (!user) {
              console.info({ item }, "No mapped user");
              continue;
            }
            switch (item.payload.type) {
              case "load":
                const currentState: LoadedResponse = {
                  type: "loaded",
                  width,
                  height,
                  me: user.user,
                  users: users.map((u) => ({
                    user: u.user,
                    name: u.name,
                    color: u.color,
                    x: u.x,
                    y: u.y,
                  })),
                  stones: board
                    .flatMap((row, y) =>
                      row.map((col, x) => ({ x, y, color: col.stone }))
                    )
                    .filter((tile) => tile.color !== null),
                };
                console.info(
                  { currentState, connectionId: item.connectionId },
                  "Send loaded message"
                );
                await reply(item.connectionId, currentState);
                break;
              case "move":
                let nx = user.x;
                let ny = user.y;
                switch (item.payload.dir) {
                  case "l":
                    nx = Math.max(0, user.x - 1);
                    break;
                  case "r":
                    nx = Math.min(width - 1, user.x + 1);
                    break;
                  case "t":
                    ny = Math.max(0, user.y - 1);
                    break;
                  case "b":
                    ny = Math.min(height - 1, user.y + 1);
                    break;
                }
                console.info({ user, nx, ny }, "Moved!");
                if (
                  (user.x !== nx || user.y !== ny) &&
                  board[ny][nx].user === null &&
                  board[ny][nx].stone === null
                ) {
                  board[user.y][user.x].user = null;
                  board[ny][nx].user = user.user;

                  user.x = nx;
                  user.y = ny;
                  await broadcast({
                    type: "moved",
                    user: user.user,
                    x: user.x,
                    y: user.y,
                  });
                }
                break;
              case "place":
                if (board[user.y][user.x].stone === null) {
                  board[user.y][user.x].stone = user.color;

                  await broadcast({
                    type: "placed",
                    color: user.color,
                    x: user.x,
                    y: user.y,
                  });
                  placedStones.push({
                    x: user.x,
                    y: user.y,
                    color: user.color,
                  });
                }
                break;
            }
            break;
        }
      }
      const elapsedSeconds = Math.floor((Date.now() - startMillis) / 1000);
      const nextLifetime = Math.max(0, gameSeconds - elapsedSeconds);
      if (lifetime !== nextLifetime) {
        lifetime = nextLifetime;
        console.info({ lifetime }, "Tick");
        await broadcast({
          type: "clock",
          remain: lifetime,
        });
      }

      for (const placed of placedStones) {
        if (checkIfWin(board, placed)) {
          console.info({ placed }, "Win!");
          await broadcast({
            type: "gameover",
            winner: {
              color: placed.color,
              names: users
                .filter((u) => u.color === placed.color)
                .map((u) => u.name),
            },
          });
          finish = true;
          break;
        }
      }
    }

    console.info({ gameId, lambdaId }, "Bye all");
    await Promise.all(
      users.map(async (u) => {
        try {
          await redisDel(
            redisConnection,
            redisKeyForGameIdMappingFromConnectionId(u.connectionId)
          );
          await apimgmt
            .deleteConnection({
              ConnectionId: u.connectionId,
            })
            .promise();
        } catch (error) {
          console.warn({ error }, "Cannot disconnect");
        }
      })
    );

    await redisDel(redisConnection, gameLock);
    await redisDel(redisConnection, gameQueue);
    console.info({ gameId, lambdaId }, "Cleanup completed");
  });
};
