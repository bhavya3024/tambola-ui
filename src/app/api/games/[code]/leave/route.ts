import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { Game } from "@/lib/models/game.model";
import { getAuthUser } from "@/lib/utils/jwt";
import { gameBroadcaster } from "@/lib/services/game-runner.service";
import { GAME_STATUS, WS_EVENT } from "@/lib/config/constants";
import { successResponse, errorResponse } from "@/lib/utils/response";

export async function POST(req: NextRequest, props: { params: Promise<{ code: string }> }) {
  try {
    const params = await props.params;
    const currentUser = await getAuthUser(req);
    if (!currentUser) return errorResponse("Unauthorized", 401);

    await connectDB();
    const game = await Game.findOne({ code: params.code.toUpperCase() });
    if (!game) return errorResponse("Game not found", 404);

    if (game.status === GAME_STATUS.IN_PROGRESS || game.status === GAME_STATUS.PAUSED) {
      return errorResponse("Cannot leave an active game while in progress", 400);
    }

    if (game.host.toString() === currentUser._id.toString() && game.players.length > 1) {
      return errorResponse("Host cannot leave while other players are in the game", 400);
    }

    game.players = game.players.filter(
      (p: any) => p.user.toString() !== currentUser._id.toString()
    ) as any;
    await game.save();

    gameBroadcaster.broadcast(game.code, {
      type: WS_EVENT.PLAYER_LEFT,
      data: { username: currentUser.username, playerCount: game.players.length },
    });

    return successResponse(null, "Left game successfully");
  } catch (err: any) {
    return errorResponse(err.message || "Internal server error", 500);
  }
}
