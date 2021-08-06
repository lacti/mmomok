import { RedisConnection } from "@yingyeothon/naive-redis/lib/connection";
import connectToRedis from "./connectToRedis";

export default async function withRedis<R>(
  doRedis: (connection: RedisConnection) => Promise<R>
): Promise<R> {
  const connection = connectToRedis();
  try {
    const result = await doRedis(connection);
    return result;
  } finally {
    connection.socket.disconnect();
    console.debug({}, "Redis disconnected");
  }
}
