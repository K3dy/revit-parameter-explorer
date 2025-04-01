// app/api/modelDerivate/[view_id]/views/[view_guid]route.ts
import { getAuthTokens } from "@/lib/server/auth";
import { getAllProperties, getObjectTree } from "@/lib/services/aps";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest, { params }: { params: { version_id: string; view_guid: string } }) {
    const { version_id, view_guid } = await params;

    const tokens = await getAuthTokens();

    if (!tokens) {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.log("test", version_id.replace("%2F", "/"), view_guid);
    try {
        const allProperties = await getAllProperties(version_id.replace("%2F", "/"), view_guid, tokens.internalToken.access_token);
        const objectTree = await getObjectTree(version_id.replace("%2F", "/"), view_guid, tokens.internalToken.access_token);
        return Response.json([allProperties, objectTree]);
    } catch (error) {
        console.error("Error getting all properties:", error);
        return Response.json({ error: "Failed to fetch all properties" }, { status: 500 });
    }
}
