import { Game, IGame, WinPattern } from "../models/game.model";
import {
  GAME_CODE,
  TOTAL_NUMBERS,
  WIN_PATTERN,
  EARLY_FIVE_COUNT,
  ROW_INDEX,
} from "../config/constants";

export async function generateGameCode(): Promise<string> {
  const chars = GAME_CODE.CHARSET;
  let code: string;
  let attempts = 0;

  do {
    code = "";
    for (let i = 0; i < GAME_CODE.LENGTH; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
    attempts++;
    const existing = await Game.findOne({ code });
    if (!existing) break;
  } while (attempts < GAME_CODE.MAX_GENERATION_ATTEMPTS);

  return code;
}

export function validateClaim(
  pattern: WinPattern,
  ticketGrid: number[][],
  calledNumbers: number[]
): boolean {
  const calledSet = new Set(calledNumbers);

  switch (pattern) {
    case WIN_PATTERN.EARLY_FIVE: {
      let count = 0;
      for (const row of ticketGrid) {
        for (const num of row) {
          if (num > 0 && calledSet.has(num)) {
            count++;
          }
        }
      }
      return count >= EARLY_FIVE_COUNT;
    }

    case WIN_PATTERN.TOP_LINE:
      return ticketGrid[ROW_INDEX.TOP]
        .filter((n) => n > 0)
        .every((n) => calledSet.has(n));

    case WIN_PATTERN.MIDDLE_LINE:
      return ticketGrid[ROW_INDEX.MIDDLE]
        .filter((n) => n > 0)
        .every((n) => calledSet.has(n));

    case WIN_PATTERN.BOTTOM_LINE:
      return ticketGrid[ROW_INDEX.BOTTOM]
        .filter((n) => n > 0)
        .every((n) => calledSet.has(n));

    case WIN_PATTERN.FULL_HOUSE: {
      for (const row of ticketGrid) {
        for (const num of row) {
          if (num > 0 && !calledSet.has(num)) {
            return false;
          }
        }
      }
      return true;
    }

    default:
      return false;
  }
}

export function isGameComplete(game: IGame): boolean {
  return game.availablePatterns.every(
    (pattern) => game.winners[pattern] != null
  );
}

export function drawNextNumber(calledNumbers: number[]): number | null {
  const calledSet = new Set(calledNumbers);
  const remaining: number[] = [];

  for (let i = 1; i <= TOTAL_NUMBERS; i++) {
    if (!calledSet.has(i)) {
      remaining.push(i);
    }
  }

  if (remaining.length === 0) return null;

  const index = Math.floor(Math.random() * remaining.length);
  return remaining[index];
}
