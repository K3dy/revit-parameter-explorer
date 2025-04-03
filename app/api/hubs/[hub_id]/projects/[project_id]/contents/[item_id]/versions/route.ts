// app/api/hubs/[hub_id]/projects/[project_id]/contents/[item_id]/versions/route.ts
import { getAuthTokens } from "@/lib/server/auth";
import { getItemVersions } from "@/lib/services/aps";
import { NextRequest } from "next/server";

type Props = {
    params: {
        item_id: string;
        project_id: string;
    };
};

export async function GET(request: NextRequest, { params }: Props) {
    const { project_id, item_id } = await params;

    const tokens = await getAuthTokens();

    if (!tokens) {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const versions = await getItemVersions(project_id, item_id, tokens.internalToken.access_token);

        return Response.json(versions);
    } catch (error) {
        console.error("Error getting item versions:", error);
        return Response.json({ error: "Failed to fetch item versions" }, { status: 500 });
    }
}
