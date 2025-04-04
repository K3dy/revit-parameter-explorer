// app/api/hubs/[hub_id]/projects/[project_id]/contents/[item_id]/versions/route.ts
import { getAuthTokens } from "@/lib/server/auth";
import { getItemVersions } from "@/lib/services/aps";
import { NextRequest } from "next/server";

/**
 * GET - Retrieves the versions for a specific item.
 *
 * This route extracts the project_id and item_id parameters from the URL.
 * It retrieves authentication tokens from cookies and then uses the internal access token
 * to fetch the item versions via the APS service. If tokens are missing, a 401 Unauthorized
 * response is returned. Any errors during the fetch result in a 500 error response.
 *
 * @param request - The incoming Next.js request.
 * @param context - Contains route parameters: project_id and item_id.
 * @returns A JSON response containing the list of item versions or an error message.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ project_id: string; item_id: string }> }
) {
  // Extract project_id and item_id from the route parameters.
  const { project_id, item_id } = await params;

  // Retrieve authentication tokens from cookies.
  const tokens = await getAuthTokens();

  // If tokens are missing or invalid, return a JSON response with a 401 Unauthorized status.
  if (!tokens) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Use the internal access token to fetch the item versions.
    const versions = await getItemVersions(project_id, item_id, tokens.internalToken.access_token);
    // Return the fetched versions as a JSON response.
    return Response.json(versions);
  } catch (error) {
    // Log the error for debugging purposes.
    console.error("Error getting item versions:", error);
    // Return a JSON response with a 500 status code if fetching versions fails.
    return Response.json({ error: "Failed to fetch item versions" }, { status: 500 });
  }
}
