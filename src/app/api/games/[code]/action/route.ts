import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { Game, WinPattern } from "@/lib/models/game.model";
import { Ticket } from "@/lib/models/ticket.model";
import { User } from "@/lib/models/user.model";
import { getAuthUser } from "@/lib/utils/jwt";
import { validateClaim, isGameComplete } from "@/lib/services/game.service";
import { gameBroadcaster, resolveWinnerNames } from "@/lib/services/game-runner.service";
import { GAME_STATUS, WS_ACTION, WS_EVENT } from "@/lib/config/constants";
import { successResponse, errorResponse } from "@/lib/utils/response";
import { Types } from "mongoose";

export async function POST(req: NextRequest, props: { params: Promise<{ code: string }> }) {
  try {
    const params = await props.params;
    const currentUser = await getAuthUser(req);
    if (!currentUser) return errorResponse("Unauthorized", 401);

    await connectDB();
    const game = await Game.findOne({ code: params.code.toUpperCase() });
    if (!game) return errorResponse("Game not found", 404);

    const body = await req.json().catch(() => ({}));
    const { action, payload } = body;

    const gameCode = game.code;
    const userId = currentUser._id.toString();
    const username = currentUser.username;

    switch (action) {
      case WS_ACTION.START_GAME: {
        if (game.host.toString() !== userId) {
          return errorResponse("Only the host can start the game", 403);
        }
        if (game.status !== GAME_STATUS.WAITING) {
          return errorResponse("Game is not in waiting state", 400);
        }

        const ticketCounts = await Ticket.aggregate([
          { $match: { game: game._id } },
          { $group: { _id: "$user", count: { $sum: 1 } } },
        ]);

        const playersWithTickets = new Set(ticketCounts.map((t: any) => t._id.toString()));
        const allHaveTickets = game.players.every((p: any) => playersWithTickets.has(p.user.toString()));

        if (!allHaveTickets) {
          return errorResponse("All players must have at least 1 ticket before starting", 400);
        }

        game.status = GAME_STATUS.IN_PROGRESS;
        game.startedAt = new Date();
        await game.save();

        gameBroadcaster.broadcast(gameCode, {
          type: WS_EVENT.GAME_STARTED,
          data: { message: "Game has started!" },
        });

        gameBroadcaster.startNumberCalling(gameCode);
        return successResponse(null, "Game started");
      }

      case WS_ACTION.PAUSE_GAME: {
        if (game.host.toString() !== userId) {
          return errorResponse("Only the host can pause the game", 403);
        }
        if (game.status !== GAME_STATUS.IN_PROGRESS) {
          return errorResponse("Game is not in progress", 400);
        }

        game.status = GAME_STATUS.PAUSED;
        await game.save();

        gameBroadcaster.stopNumberCalling(gameCode);
        gameBroadcaster.broadcast(gameCode, {
          type: WS_EVENT.GAME_PAUSED,
          data: { message: "Game has been paused by host" },
        });

        return successResponse(null, "Game paused");
      }

      case WS_ACTION.RESUME_GAME: {
        if (game.host.toString() !== userId) {
          return errorResponse("Only the host can resume the game", 403);
        }
        if (game.status !== GAME_STATUS.PAUSED && game.status !== GAME_STATUS.IN_PROGRESS) {
          return errorResponse("Game is not paused or in progress", 400);
        }

        game.status = GAME_STATUS.IN_PROGRESS;
        await game.save();

        gameBroadcaster.broadcast(gameCode, {
          type: WS_EVENT.GAME_RESUMED,
          data: { message: "Game has been resumed" },
        });

        gameBroadcaster.startNumberCalling(gameCode, true);
        return successResponse(null, "Game resumed");
      }

      case WS_ACTION.CLAIM: {
        const { pattern, ticketId } = payload || {};
        if (!pattern || !ticketId) {
          return errorResponse("Missing pattern or ticketId", 400);
        }
        if (game.status !== GAME_STATUS.IN_PROGRESS) {
          return errorResponse("Game is not in progress", 400);
        }
        if (!game.availablePatterns.includes(pattern as WinPattern)) {
          return errorResponse("This pattern is not available in this game", 400);
        }

        if ((game.winners as any)[pattern]) {
          return errorResponse("This pattern has already been claimed", 400);
        }

        const ticket = await Ticket.findOne({
          _id: ticketId,
          user: userId,
          game: game._id,
        });

        if (!ticket) {
          return errorResponse("Ticket not found or does not belong to you", 404);
        }

        const isValid = validateClaim(pattern as WinPattern, ticket.grid, game.calledNumbers);

        if (!isValid) {
          gameBroadcaster.broadcast(gameCode, {
            type: WS_EVENT.CLAIM_RESULT,
            data: {
              pattern,
              valid: false,
              username,
              message: `${username}'s claim for ${pattern} was invalid`,
            },
          });
          return errorResponse("Invalid claim — numbers don't match", 400);
        }

        (game.winners as any)[pattern] = new Types.ObjectId(userId);
        await game.save();

        await User.findByIdAndUpdate(userId, { $inc: { "stats.totalClaims": 1 } });

        const claimMsg = {
          type: WS_EVENT.CLAIM_RESULT,
          data: {
            pattern,
            valid: true,
            winner: username,
            message: `${username} won ${pattern}!`,
          },
        };

        gameBroadcaster.broadcast(gameCode, claimMsg);

        const refreshedGame = await Game.findById(game._id);
        if (refreshedGame && isGameComplete(refreshedGame)) {
          refreshedGame.status = GAME_STATUS.COMPLETED;
          refreshedGame.completedAt = new Date();
          await refreshedGame.save();

          gameBroadcaster.stopNumberCalling(gameCode);

          const playerIds = refreshedGame.players.map((p: any) => p.user);
          await User.updateMany({ _id: { $in: playerIds } }, { $inc: { "stats.gamesPlayed": 1 } });

          const winnerIds = Object.values(refreshedGame.winners).filter(Boolean);
          const uniqueWinners = [...new Set(winnerIds.map((id: any) => id.toString()))];
          await User.updateMany({ _id: { $in: uniqueWinners } }, { $inc: { "stats.gamesWon": 1 } });

          const resolvedEndWinners = await resolveWinnerNames(refreshedGame.winners as any);
          const endMsg = {
            type: WS_EVENT.GAME_ENDED,
            data: {
              winners: resolvedEndWinners,
              message: "All patterns claimed! Game over!",
            },
          };

          gameBroadcaster.broadcast(gameCode, endMsg);
        }

        return successResponse({ valid: true, pattern, winner: username }, `${username} won ${pattern}!`);
      }

      default:
        return errorResponse(`Unknown action: ${action}`, 400);
    }
  } catch (err: any) {
    return errorResponse(err.message || "Internal server error", 500);
  }
}
