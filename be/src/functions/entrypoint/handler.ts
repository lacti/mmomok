import "source-map-support/register";

import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { Lambda } from "aws-sdk";
import { gameLockRedisKeyFromGameId } from "../../support/redis/redisKeys";
import redisExists from "@yingyeothon/naive-redis/lib/exists";
import withRedis from "../../support/redis/withRedis";

const gameActorLambdaName = process.env.GAME_ACTOR_LAMBDA_NAME!;
const offline = !!process.env.IS_OFFLINE;

const lambda = new Lambda(offline ? { endpoint: `http://localhost:3002` } : {});

export const main: APIGatewayProxyHandlerV2 = async (event) => {
  const { gameId } = event.pathParameters ?? {};
  if (!gameId) {
    return { statusCode: 404, body: "Not Found" };
  }

  const gameLock = gameLockRedisKeyFromGameId(gameId);
  if (
    await withRedis((redisConnection) => redisExists(redisConnection, gameLock))
  ) {
    console.info({ gameId, gameLock }, "Already running");
    return { statusCode: 200, body: JSON.stringify(true) };
  }

  console.info({
    FunctionName: gameActorLambdaName,
    InvocationType: "Event",
    Qualifier: "$LATEST",
    Payload: JSON.stringify({ gameId }),
  });
  const invoked = await lambda
    .invoke({
      FunctionName: gameActorLambdaName,
      InvocationType: "Event",
      Qualifier: "$LATEST",
      Payload: JSON.stringify({ gameId }),
    })
    .promise();
  console.info({ invoked, gameId }, "Game start");
  return {
    statusCode: 200,
    body: JSON.stringify(true),
  };
};
