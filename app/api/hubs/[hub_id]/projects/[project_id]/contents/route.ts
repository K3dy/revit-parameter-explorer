// app/api/hubs/[hub_id]/projects/[project_id]/contents/route.ts
import { getAuthTokens } from "@/lib/server/auth";
import { getProjectContents } from "@/lib/services/aps";
import { NextRequest } from "next/server";

type Props = {
    params: {
        hub_id: string;
        project_id: string;
    };
};

export async function GET(request: NextRequest, { params }: Props) {
    const { hub_id, project_id } = await params;

    const tokens = await getAuthTokens();

    if (!tokens) {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const url = new URL(request.url);
        const folderId = url.searchParams.get("folder_id");

        const contents = await getProjectContents(hub_id, project_id, folderId, tokens.internalToken.access_token);

        return Response.json(contents);
    } catch (error) {
        console.error("Error getting project contents:", error);
        return Response.json({ error: "Failed to fetch project contents" }, { status: 500 });
    }
}
