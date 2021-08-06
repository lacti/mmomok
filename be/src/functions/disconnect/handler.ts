import "source-map-support/register";

import {
  gameLockRedisKeyFromGameId,
  gameQueueRedisKeyFromGameId,
  redisKeyForGameIdMappingFromConnectionId,
} from "../../support/redis/redisKeys";

import { APIGatewayProxyHandler } from "aws-lambda";
import enqueueToGameQueue from "../../support/redis/enqueueToGameQueue";
import redisDel from "@yingyeothon/naive-redis/lib/del";
import redisExists from "@yingyeothon/naive-redis/lib/exists";
import redisGet from "@yingyeothon/naive-redis/lib/get";
import withRedis from "../../support/redis/withRedis";

export const main: APIGatewayProxyHandler = async (event) => {
  const { connectionId } = event.requestContext;
  if (!connectionId) {
    return { statusCode: 404, body: "" };
  }

  const redisKeyForMapping =
    redisKeyForGameIdMappingFromConnectionId(connectionId);

  await withRedis(async (redisConnection) => {
    const gameId = await redisGet(redisConnection, redisKeyForMapping);

    console.info({ connectionId, gameId }, "Find game mapping");

    if (gameId) {
      const gameQueue = gameQueueRedisKeyFromGameId(gameId);
      const gameLock = gameLockRedisKeyFromGameId(gameId);
      if (redisExists(redisConnection, gameLock)) {
        console.info({ connectionId, gameQueue }, "Send disconnect message");
        await enqueueToGameQueue(redisConnection, gameQueue, {
          type: "disconnect",
          connectionId,
          payload: {},
        });
      }

      console.info({ connectionId, gameId }, "Delete game mapping");
      await redisDel(redisConnection, redisKeyForMapping);
    }
  });
  return {
    statusCode: 200,
    body: "",
  };
};
