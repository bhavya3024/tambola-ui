import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { Game } from "@/lib/models/game.model";
import { Ticket } from "@/lib/models/ticket.model";
import { getAuthUser } from "@/lib/utils/jwt";
import { successResponse, errorResponse } from "@/lib/utils/response";

export async function GET(req: NextRequest, props: { params: Promise<{ code: string }> }) {
  try {
    const params = await props.params;
    const currentUser = await getAuthUser(req);
    if (!currentUser) return errorResponse("Unauthorized", 401);

    await connectDB();
    const game = await Game.findOne({ code: params.code.toUpperCase() });
    if (!game) return errorResponse("Game not found", 404);

    const tickets = await Ticket.find({ game: game._id, user: currentUser._id }).lean();

    return successResponse({
      tickets: tickets.map((t: any) => ({
        id: t._id,
        grid: t.grid,
        markedNumbers: t.markedNumbers,
      })),
    });
  } catch (err: any) {
    return errorResponse(err.message || "Internal server error", 500);
  }
}
