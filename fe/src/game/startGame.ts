export default async function startGame({
  gameId,
}: {
  gameId: string;
}): Promise<void> {
  return fetch(`/start/${gameId}`, {
    method: "post",
  }).then((result) => {
    console.info(result);
  });
}
