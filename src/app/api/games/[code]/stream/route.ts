import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { Game } from "@/lib/models/game.model";
import { verifyAccessToken } from "@/lib/utils/jwt";
import { gameBroadcaster, resolveWinnerNames } from "@/lib/services/game-runner.service";
import { GAME_STATUS, WS_EVENT } from "@/lib/config/constants";

export async function GET(req: NextRequest, props: { params: Promise<{ code: string }> }) {
  const params = await props.params;
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");

  if (!token) {
    return new Response("Unauthorized: missing token", { status: 401 });
  }

  const payload = verifyAccessToken(token);
  if (!payload || !payload.sub) {
    return new Response("Unauthorized: invalid token", { status: 401 });
  }

  await connectDB();
  const gameCode = params.code.toUpperCase();
  const game = await Game.findOne({ code: gameCode });

  if (!game) {
    return new Response("Game not found", { status: 404 });
  }

  if (
    game.status === GAME_STATUS.IN_PROGRESS &&
    typeof gameBroadcaster.isCallingActive === "function" &&
    !gameBroadcaster.isCallingActive(gameCode)
  ) {
    gameBroadcaster.startNumberCalling(gameCode);
  }

  const encoder = new TextEncoder();
  let unsubscribe: (() => void) | null = null;

  const stream = new ReadableStream({
    async start(controller) {
      const sendEvent = (dataObj: any) => {
        try {
          const formatted = `data: ${JSON.stringify(dataObj)}\n\n`;
          controller.enqueue(encoder.encode(formatted));
        } catch (e) {
          console.error("SSE enqueue error:", e);
        }
      };

      const resolvedWinners = await resolveWinnerNames(game.winners as any);
      sendEvent({
        type: WS_EVENT.GAME_STATE,
        data: {
          status: game.status,
          calledNumbers: game.calledNumbers,
          currentNumber: game.currentNumber,
          winners: resolvedWinners,
          playerCount: game.players?.length || 0,
        },
      });

      unsubscribe = gameBroadcaster.subscribe(gameCode, (event) => {
        sendEvent(event);
      });
    },

    cancel() {
      if (unsubscribe) {
        unsubscribe();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
