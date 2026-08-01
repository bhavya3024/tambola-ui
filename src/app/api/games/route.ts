import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { Game, ALL_PATTERNS } from "@/lib/models/game.model";
import { Ticket } from "@/lib/models/ticket.model";
import { getAuthUser } from "@/lib/utils/jwt";
import { generateGameCode } from "@/lib/services/game.service";
import { generateTickets } from "@/lib/utils/ticket.generator";
import { gameBroadcaster } from "@/lib/services/game-runner.service";
import { successResponse, errorResponse } from "@/lib/utils/response";
import {
  PLAYERS,
  NUMBER_CALL_INTERVAL,
  TICKETS_PER_PLAYER,
  PAGINATION,
  GAME_STATUS,
} from "@/lib/config/constants";

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) return errorResponse("Unauthorized", 401);

    await connectDB();
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || String(PAGINATION.GAMES_LIST), 10);
    const skip = (page - 1) * limit;

    const statusFilter = { status: { $in: [GAME_STATUS.WAITING, GAME_STATUS.IN_PROGRESS] } };

    const [games, total] = await Promise.all([
      Game.find(statusFilter)
        .populate("host", "username displayName")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Game.countDocuments(statusFilter),
    ]);

    return successResponse(
      {
        games: games.map((g: any) => ({
          id: g._id,
          code: g.code,
          host: g.host,
          status: g.status,
          playerCount: g.players.length,
          maxPlayers: g.maxPlayers,
          ticketsPerPlayer: g.ticketsPerPlayer,
          availablePatterns: g.availablePatterns,
          createdAt: g.createdAt,
        })),
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      },
      "Available games"
    );
  } catch (err: any) {
    return errorResponse(err.message || "Internal server error", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) return errorResponse("Unauthorized", 401);

    await connectDB();

    const activeGame = await Game.findOne({
      "players.user": user._id,
      status: { $in: [GAME_STATUS.IN_PROGRESS, GAME_STATUS.PAUSED] },
    });

    if (activeGame) {
      return errorResponse(`You are already in an active game (${activeGame.code}). Finish or leave it first.`, 400);
    }

    const body = await req.json().catch(() => ({}));
    const ticketsPerPlayer = body.ticketsPerPlayer ?? TICKETS_PER_PLAYER.DEFAULT;
    const code = await generateGameCode();

    const game = await Game.create({
      code,
      host: user._id,
      maxPlayers: body.maxPlayers ?? PLAYERS.DEFAULT,
      numberCallInterval: body.numberCallInterval ?? NUMBER_CALL_INTERVAL.DEFAULT,
      ticketsPerPlayer,
      availablePatterns: body.availablePatterns ?? ALL_PATTERNS,
      players: [{ user: user._id }],
    });

    const grids = generateTickets(ticketsPerPlayer);
    await Ticket.insertMany(
      grids.map((grid) => ({ game: game._id, user: user._id, grid }))
    );

    game.status = GAME_STATUS.IN_PROGRESS;
    game.startedAt = new Date();
    await game.save();

    gameBroadcaster.startNumberCalling(game.code);

    return successResponse(
      {
        id: game._id,
        code: game.code,
        host: user.username,
        status: game.status,
        maxPlayers: game.maxPlayers,
        ticketsPerPlayer: game.ticketsPerPlayer,
        availablePatterns: game.availablePatterns,
        playerCount: 1,
      },
      "Game created and started",
      201
    );
  } catch (err: any) {
    return errorResponse(err.message || "Internal server error", 500);
  }
}
