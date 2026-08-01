import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { Game } from "@/lib/models/game.model";
import { getAuthUser } from "@/lib/utils/jwt";
import { GAME_STATUS } from "@/lib/config/constants";
import { successResponse, errorResponse } from "@/lib/utils/response";

export async function GET(req: NextRequest) {
  try {
    const currentUser = await getAuthUser(req);
    if (!currentUser) return errorResponse("Unauthorized", 401);

    await connectDB();
    const activeGame = await Game.findOne({
      "players.user": currentUser._id,
      status: { $in: [GAME_STATUS.IN_PROGRESS, GAME_STATUS.PAUSED] },
    });

    return successResponse(
      { activeGame: activeGame ? { code: activeGame.code, status: activeGame.status } : null },
      activeGame ? "You have an active game" : "No active game"
    );
  } catch (err: any) {
    return errorResponse(err.message || "Internal server error", 500);
  }
}
