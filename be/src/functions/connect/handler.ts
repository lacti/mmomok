import "source-map-support/register";

import {
  gameLockRedisKeyFromGameId,
  gameQueueRedisKeyFromGameId,
  redisKeyForGameIdMappingFromConnectionId,
} from "../../support/redis/redisKeys";

import { APIGatewayProxyHandler } from "aws-lambda";
import enqueueToGameQueue from "../../support/redis/enqueueToGameQueue";
import redisExists from "@yingyeothon/naive-redis/lib/exists";
import redisSet from "@yingyeothon/naive-redis/lib/set";
import withRedis from "../../support/redis/withRedis";

export const main: APIGatewayProxyHandler = async (event) => {
  const { connectionId } = event.requestContext;
  if (!connectionId) {
    return { statusCode: 404, body: "" };
  }

  function getParameter(key: string) {
    return event.headers[key] ?? (event.queryStringParameters ?? {})[key];
  }
  const gameId = getParameter("x-game-id");
  const memberId = getParameter("x-member-id");
  if (!gameId || !memberId) {
    return { statusCode: 404, body: "" };
  }

  const gameQueue = gameQueueRedisKeyFromGameId(gameId);
  const gameLock = gameLockRedisKeyFromGameId(gameId);
  const redisKeyForMapping =
    redisKeyForGameIdMappingFromConnectionId(connectionId);

  const initialized = await withRedis(async (redisConnection) => {
    const validGame = await redisExists(redisConnection, gameLock);
    console.info(
      { validGame, gameId, memberId, gameLock },
      "Check if game exists"
    );
    if (!validGame) {
      return false;
    }
    const mapped = await redisSet(redisConnection, redisKeyForMapping, gameId);
    console.info(
      { mapped, gameQueue, redisKeyForMapping, connectionId },
      "Add mapping"
    );

    await enqueueToGameQueue(redisConnection, gameQueue, {
      type: "connect",
      connectionId,
      payload: { memberId },
    });
    return true;
  });
  return { statusCode: initialized ? 200 : 404, body: "" };
};
