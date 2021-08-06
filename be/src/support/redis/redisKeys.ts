export function redisKeyForGameIdMappingFromConnectionId(
  connectionId: string
): string {
  return `mmomok:connectionId-to-gameId:${connectionId}`;
}

export function gameQueueRedisKeyFromGameId(gameId: string): string {
  return `mmomok:gameQueue:${gameId}`;
}

export function gameLockRedisKeyFromGameId(gameId: string): string {
  return `mmomok:gameLock:${gameId}`;
}
