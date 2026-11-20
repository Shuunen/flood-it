/** A number from 0 to 1 that always comes out the same for the same inputs : a seeded dice for the sounds. */
export function dice(index: number, salt = 0): number {
  const value = Math.sin(index * 91.7 + salt * 17.3) * 43_758.5453
  return value - Math.floor(value)
}
