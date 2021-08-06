export function randomNumber(max: number): number {
  return Math.floor(Math.random() * max);
}

export function randomBoolean(): boolean {
  return randomNumber(2) === 0;
}
