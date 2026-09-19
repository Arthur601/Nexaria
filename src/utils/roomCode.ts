/**
 * Utility for generating completely random, high-entropy RPG room codes.
 * Uses unambiguous uppercase alphanumeric characters (avoiding 0/O, 1/I/L) to prevent transcription mistakes.
 * Generates pure random codes without any prefix (e.g., "7K9M2F", "8W2D9K").
 */
const UNAMBIGUOUS_CHARS = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';

export function generateRandomRoomCode(length: number = 6): string {
  let result = '';
  // 6 random high-entropy characters from 32 distinct symbols => 1.07+ billion combinations
  for (let i = 0; i < length; i++) {
    const randIndex = Math.floor(Math.random() * UNAMBIGUOUS_CHARS.length);
    result += UNAMBIGUOUS_CHARS[randIndex];
  }
  return result;
}

/**
 * Normalizes user input room code (trims whitespace, converts to uppercase)
 */
export function normalizeRoomCode(input: string): string {
  return input.trim().toUpperCase().replace(/\s+/g, '');
}
