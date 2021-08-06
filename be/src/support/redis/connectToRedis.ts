import redisConnect, {
  RedisConnection,
} from "@yingyeothon/naive-redis/lib/connection";

const connectionInfo = {
  host: process.env.REDIS_HOST!,
  password: process.env.REDIS_PASSWORD,
};

export default function connectToRedis(): RedisConnection {
  console.debug(connectionInfo, "Start to connect to redis");
  return redisConnect(connectionInfo);
}
