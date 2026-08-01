import { Game } from "../models/game.model";
import { User } from "../models/user.model";
import { drawNextNumber, isGameComplete } from "./game.service";
import { GAME_STATUS, TOTAL_NUMBERS, WS_EVENT } from "../config/constants";
import { connectDB } from "../db";

type Listener = (event: { type: string; data: any }) => void;

class GameBroadcaster {
  private listeners: Map<string, Set<Listener>> = new Map();
  private activeTimers: Map<string, NodeJS.Timeout> = new Map();

  subscribe(gameCode: string, listener: Listener) {
    const code = gameCode.toUpperCase();
    if (!this.listeners.has(code)) {
      this.listeners.set(code, new Set());
    }
    this.listeners.get(code)!.add(listener);

    return () => {
      const set = this.listeners.get(code);
      if (set) {
        set.delete(listener);
        if (set.size === 0) {
          this.listeners.delete(code);
        }
      }
    };
  }

  broadcast(gameCode: string, event: { type: string; data: any }) {
    const code = gameCode.toUpperCase();
    const set = this.listeners.get(code);
    if (set) {
      set.forEach((listener) => {
        try {
          listener(event);
        } catch (e) {
          console.error("Error broadcasting to SSE listener:", e);
        }
      });
    }
  }

  isCallingActive(gameCode: string): boolean {
    return this.activeTimers.has(gameCode.toUpperCase());
  }

  startNumberCalling(gameCode: string, force = false) {
    const code = gameCode.toUpperCase();
    if (!force && this.activeTimers.has(code)) {
      return;
    }
    this.stopNumberCalling(code);

    const scheduleNext = () => {
      const delay = (Math.floor(Math.random() * 5) + 2) * 1000;

      const timer = setTimeout(async () => {
        try {
          await connectDB();
          const game = await Game.findOne({ code });

          if (!game || game.status !== GAME_STATUS.IN_PROGRESS) {
            this.stopNumberCalling(code);
            return;
          }

          const nextNumber = drawNextNumber(game.calledNumbers);

          if (nextNumber === null) {
            this.stopNumberCalling(code);

            game.status = GAME_STATUS.COMPLETED;
            game.completedAt = new Date();
            await game.save();

            const resolvedTimerWinners = await resolveWinnerNames(game.winners as any);
            const endMsg = {
              type: WS_EVENT.GAME_ENDED,
              data: {
                winners: resolvedTimerWinners,
                message: "All numbers have been called! Game over!",
              },
            };

            this.broadcast(code, endMsg);
            return;
          }

          game.calledNumbers.push(nextNumber);
          game.currentNumber = nextNumber;
          await game.save();

          const callMsg = {
            type: WS_EVENT.NUMBER_CALLED,
            data: {
              number: nextNumber,
              calledNumbers: game.calledNumbers,
              remaining: TOTAL_NUMBERS - game.calledNumbers.length,
            },
          };

          this.broadcast(code, callMsg);
          scheduleNext();
        } catch (err) {
          console.error(`Error calling number for game ${code}:`, err);
          scheduleNext();
        }
      }, delay);

      this.activeTimers.set(code, timer);
    };

    scheduleNext();
  }

  stopNumberCalling(gameCode: string) {
    const code = gameCode.toUpperCase();
    const timer = this.activeTimers.get(code);
    if (timer) {
      clearTimeout(timer);
      this.activeTimers.delete(code);
    }
  }
}

export async function resolveWinnerNames(
  winners: Record<string, any>
): Promise<Record<string, string>> {
  const resolved: Record<string, string> = {};
  const ids = Object.entries(winners || {})
    .filter(([_, id]) => id != null)
    .map(([pattern, id]) => ({ pattern, id: id.toString() }));

  if (ids.length === 0) return resolved;

  const users = await User.find(
    { _id: { $in: ids.map((i) => i.id) } },
    "username"
  ).lean();

  const userMap = new Map(users.map((u: any) => [u._id.toString(), u.username]));

  for (const { pattern, id } of ids) {
    resolved[pattern] = userMap.get(id) || "Unknown";
  }

  return resolved;
}

if (
  !(globalThis as any).gameBroadcaster ||
  typeof (globalThis as any).gameBroadcaster.isCallingActive !== "function"
) {
  (globalThis as any).gameBroadcaster = new GameBroadcaster();
}

export const gameBroadcaster: GameBroadcaster = (globalThis as any).gameBroadcaster;
