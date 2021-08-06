import {
  gameQueueRedisKeyFromGameId,
  redisKeyForGameIdMappingFromConnectionId,
} from "../../support/redis/redisKeys";

import { APIGatewayProxyHandler } from "aws-lambda";
import { GameRequest } from "../../models/GameMessage";
import connectToRedis from "../../support/redis/connectToRedis";
import enqueueToGameQueue from "../../support/redis/enqueueToGameQueue";
import pMemoize from "p-memoize";
import redisGet from "@yingyeothon/naive-redis/lib/get";

const redisConnection = connectToRedis();

async function getGameIdappedWithConnectionId(
  connectionId: string
): Promise<string> {
  return redisGet(
    redisConnection,
    redisKeyForGameIdMappingFromConnectionId(connectionId)
  );
}

const cacheOrGetGameIdMappedWithConnectionId = pMemoize(
  getGameIdappedWithConnectionId
);

export const main: APIGatewayProxyHandler = async (event) => {
  const { body } = event;
  if (!body) {
    return { statusCode: 404, body: "" };
  }

  let payload: GameRequest | null = null;
  try {
    payload = JSON.parse(body) as GameRequest;
  } catch (error) {
    console.debug({ error, body }, "Invalid payload");
    return { statusCode: 400, body: "" };
  }

  const { connectionId } = event.requestContext;
  if (!connectionId) {
    return { statusCode: 404, body: "" };
  }
  const gameId = await cacheOrGetGameIdMappedWithConnectionId(connectionId);
  const gameQueue = gameQueueRedisKeyFromGameId(gameId);
  await enqueueToGameQueue(redisConnection, gameQueue, {
    type: "message",
    connectionId,
    payload,
  });
  return { statusCode: 200, body: "" };
};
