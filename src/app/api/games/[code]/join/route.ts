import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { Game } from "@/lib/models/game.model";
import { Ticket } from "@/lib/models/ticket.model";
import { getAuthUser } from "@/lib/utils/jwt";
import { generateTickets } from "@/lib/utils/ticket.generator";
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

    const activeGame = await Game.findOne({
      "players.user": currentUser._id,
      _id: { $ne: game._id },
      status: { $in: [GAME_STATUS.IN_PROGRESS, GAME_STATUS.PAUSED] },
    });

    if (activeGame) {
      return errorResponse(`You are already in another active game (${activeGame.code}). Leave it first.`, 400);
    }

    const isAlreadyJoined = game.players.some(
      (p: any) => p.user.toString() === currentUser._id.toString()
    );

    if (!isAlreadyJoined) {
      if (game.status === GAME_STATUS.COMPLETED) {
        return errorResponse("This game has already completed", 400);
      }
      if (game.players.length >= game.maxPlayers) {
        return errorResponse("Game is full", 400);
      }

      game.players.push({ user: currentUser._id, joinedAt: new Date() });
      await game.save();

      const existingTickets = await Ticket.countDocuments({
        game: game._id,
        user: currentUser._id,
      });

      if (existingTickets === 0) {
        const grids = generateTickets(game.ticketsPerPlayer);
        await Ticket.insertMany(
          grids.map((grid) => ({ game: game._id, user: currentUser._id, grid }))
        );
      }

      gameBroadcaster.broadcast(game.code, {
        type: WS_EVENT.PLAYER_JOINED,
        data: { username: currentUser.username, playerCount: game.players.length },
      });
    }

    return successResponse(
      { code: game.code, playerCount: game.players.length },
      "Joined game successfully"
    );
  } catch (err: any) {
    return errorResponse(err.message || "Internal server error", 500);
  }
}
