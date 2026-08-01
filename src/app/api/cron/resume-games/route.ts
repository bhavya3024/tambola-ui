import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { Game } from "@/lib/models/game.model";
import { GAME_STATUS } from "@/lib/config/constants";
import { gameBroadcaster } from "@/lib/services/game-runner.service";
import { successResponse, errorResponse } from "@/lib/utils/response";

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return errorResponse("Unauthorized cron request", 401);
    }

    await connectDB();
    const activeGames = await Game.find({ status: GAME_STATUS.IN_PROGRESS }).select("code").lean();

    let resumedCount = 0;
    for (const game of activeGames) {
      if (!gameBroadcaster.isCallingActive(game.code)) {
        gameBroadcaster.startNumberCalling(game.code);
        resumedCount++;
      }
    }

    return successResponse(
      {
        totalActive: activeGames.length,
        resumedCount,
      },
      `Cron executed: ${resumedCount} of ${activeGames.length} in-progress games resumed.`
    );
  } catch (err: any) {
    return errorResponse(err.message || "Cron execution failed", 500);
  }
}
