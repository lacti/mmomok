import QueueItem from "../../models/QueueItem";
import { RedisConnection } from "@yingyeothon/naive-redis/lib/connection";
import redisRpush from "@yingyeothon/naive-redis/lib/rpush";

export default async function enqueueToGameQueue(
  redisConnection: RedisConnection,
  gameQueue: string,
  item: QueueItem
): Promise<void> {
  const pushed = await redisRpush(
    redisConnection,
    gameQueue,
    JSON.stringify(item)
  );
  console.info({ item, pushed, gameQueue }, "Enqueue to game queue");
}
