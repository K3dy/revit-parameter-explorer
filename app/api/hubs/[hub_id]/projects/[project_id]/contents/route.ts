// app/api/hubs/[hub_id]/projects/[project_id]/contents/route.ts
import { getAuthTokens } from "@/lib/server/auth";
import { getProjectContents } from "@/lib/services/aps";
import { NextRequest } from "next/server";

/**
 * GET - Retrieves the contents of a project folder or top-level folders.
 *
 * This route extracts the hub_id and project_id from the route parameters.
 * It optionally extracts the folder_id from the query string if provided.
 * It then retrieves authentication tokens and uses the internal access token
 * to fetch the project contents via the APS service.
 *
 * @param request - The incoming Next.js request.
 * @param context - Contains route parameters: hub_id and project_id.
 * @returns A JSON response with the project contents or an error message.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ hub_id: string; project_id: string }> }
) {
  // Extract hub_id and project_id from the route parameters.
  const { hub_id, project_id } = await params;

  // Retrieve authentication tokens from cookies.
  const tokens = await getAuthTokens();

  // If tokens are missing or invalid, return a 401 Unauthorized JSON response.
  if (!tokens) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Parse the request URL to extract any query parameters.
    const url = new URL(request.url);
    // Extract the folder_id query parameter if available.
    const folderId = url.searchParams.get("folder_id");

    // Fetch project contents using the provided hub_id, project_id, and optional folderId.
    const contents = await getProjectContents(
      hub_id,
      project_id,
      folderId,
      tokens.internalToken.access_token
    );

    // Return the fetched contents as a JSON response.
    return Response.json(contents);
  } catch (error) {
    // Log the error for debugging purposes.
    console.error("Error getting project contents:", error);
    // Return a JSON response with a 500 status if fetching contents fails.
    return Response.json({ error: "Failed to fetch project contents" }, { status: 500 });
  }
}
