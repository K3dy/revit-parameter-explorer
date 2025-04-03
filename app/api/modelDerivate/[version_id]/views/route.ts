// app/api/modelDerivate/[view_id]/views/route.ts
import { getAuthTokens } from "@/lib/server/auth";
import { getModelViews } from "@/lib/services/aps";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest, { params }: { params: Promise<{ version_id: string }> }) {
    const { version_id } = await params;

    const tokens = await getAuthTokens();

    if (!tokens) {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {

        const views = await getModelViews(version_id.replace("%2F", "/"), tokens.internalToken.access_token);
        return Response.json(views);
    } catch (error) {
        console.error("Error getting views:", error);
        return Response.json({ error: "Failed to fetch views" }, { status: 500 });
    }
}
