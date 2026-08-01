import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { Game } from "@/lib/models/game.model";
import { User } from "@/lib/models/user.model";
import { getAuthUser } from "@/lib/utils/jwt";
import { successResponse, errorResponse } from "@/lib/utils/response";
import { PAGINATION, ALL_GAME_STATUSES } from "@/lib/config/constants";

export async function GET(req: NextRequest) {
  try {
    const currentUser = await getAuthUser(req);
    if (!currentUser) return errorResponse("Unauthorized", 401);

    await connectDB();
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || String(PAGINATION.GAME_HISTORY), 10);
    const skip = (page - 1) * limit;
    const statusFilter = searchParams.get("status");

    const filter: any = { "players.user": currentUser._id };
    if (statusFilter && ALL_GAME_STATUSES.includes(statusFilter as any)) {
      filter.status = statusFilter;
    }

    const [games, total] = await Promise.all([
      Game.find(filter)
        .populate("host", "username displayName")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Game.countDocuments(filter),
    ]);

    const resolvedGames = await Promise.all(
      games.map(async (g: any) => {
        const resolvedWinners: Record<string, string> = {};
        const winnersObj = (g.winners || {}) as Record<string, any>;
        const winnerEntries = Object.entries(winnersObj).filter(([_, id]) => id != null);

        if (winnerEntries.length > 0) {
          const userIds = winnerEntries.map(([_, id]) => id.toString());
          const users = await User.find({ _id: { $in: userIds } }, "username").lean();
          const userMap = new Map(users.map((u: any) => [u._id.toString(), u.username]));
          for (const [pattern, id] of winnerEntries) {
            resolvedWinners[pattern] = userMap.get(id.toString()) || "Unknown";
          }
        }

        return {
          id: g._id,
          code: g.code,
          host: g.host,
          status: g.status,
          playerCount: g.players.length,
          maxPlayers: g.maxPlayers,
          ticketsPerPlayer: g.ticketsPerPlayer,
          availablePatterns: g.availablePatterns,
          winners: resolvedWinners,
          isHost: g.host._id?.toString() === currentUser._id.toString(),
          startedAt: g.startedAt,
          completedAt: g.completedAt,
          createdAt: g.createdAt,
        };
      })
    );

    return successResponse({
      games: resolvedGames,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (err: any) {
    return errorResponse(err.message || "Internal server error", 500);
  }
}
