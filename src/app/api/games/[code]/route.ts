import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { Game } from "@/lib/models/game.model";
import { User } from "@/lib/models/user.model";
import { getAuthUser } from "@/lib/utils/jwt";
import { gameBroadcaster } from "@/lib/services/game-runner.service";
import { GAME_STATUS } from "@/lib/config/constants";
import { successResponse, errorResponse } from "@/lib/utils/response";

export async function GET(req: NextRequest, props: { params: Promise<{ code: string }> }) {
  try {
    const params = await props.params;
    const currentUser = await getAuthUser(req);
    if (!currentUser) return errorResponse("Unauthorized", 401);

    await connectDB();
    const game: any = await Game.findOne({ code: params.code.toUpperCase() })
      .populate("host", "username displayName")
      .populate("players.user", "username displayName")
      .lean();

    if (!game) return errorResponse("Game not found", 404);

    if (game.status === GAME_STATUS.IN_PROGRESS && !gameBroadcaster.isCallingActive(game.code)) {
      gameBroadcaster.startNumberCalling(game.code);
    }

    const resolvedWinners: Record<string, string> = {};
    const winnersObj = (game.winners || {}) as Record<string, any>;
    const winnerEntries = Object.entries(winnersObj).filter(([_, id]) => id != null);

    if (winnerEntries.length > 0) {
      const userIds = winnerEntries.map(([_, id]) => id.toString());
      const users = await User.find({ _id: { $in: userIds } }, "username").lean();
      const userMap = new Map(users.map((u: any) => [u._id.toString(), u.username]));
      for (const [pattern, id] of winnerEntries) {
        resolvedWinners[pattern] = userMap.get(id.toString()) || "Unknown";
      }
    }

    const hostObj = game.host as any;
    const hostId = hostObj?._id?.toString() || hostObj?.toString();
    const isHost = hostId === currentUser._id.toString();

    const isPlayer = (game.players || []).some(
      (p: any) =>
        p?.user &&
        (p.user._id?.toString() === currentUser._id.toString() ||
          p.user.toString() === currentUser._id.toString())
    );

    return successResponse({
      game: {
        id: game._id,
        code: game.code,
        host: game.host,
        status: game.status,
        maxPlayers: game.maxPlayers,
        ticketsPerPlayer: game.ticketsPerPlayer,
        numberCallInterval: game.numberCallInterval,
        availablePatterns: game.availablePatterns,
        calledNumbers: game.calledNumbers,
        currentNumber: game.currentNumber,
        winners: resolvedWinners,
        players: (game.players || [])
          .filter((p: any) => p && p.user)
          .map((p: any) => ({
            username: p.user?.username || "Unknown",
            displayName: p.user?.displayName || "Player",
            joinedAt: p.joinedAt,
          })),
        playerCount: game.players.length,
        isHost,
        isPlayer,
        startedAt: game.startedAt,
        completedAt: game.completedAt,
        createdAt: game.createdAt,
      },
    });
  } catch (err: any) {
    return errorResponse(err.message || "Internal server error", 500);
  }
}
