// app/api/modelDerivate/[region]/[view_id]/views/route.ts
import { getAuthTokens } from "@/lib/server/auth";
import { getModelViews } from "@/lib/services/aps";
import { Region } from "@aps_sdk/data-management";
import { NextRequest } from "next/server";

/**
 * GET - Retrieves model views for a specific version.
 *
 * This route extracts the version_id and region parameters from the URL.
 * It then retrieves authentication tokens from cookies.
 * If tokens are missing, a 401 Unauthorized response is returned.
 * Otherwise, the version_id is decoded by replacing "%2F" with "/"
 * and passed along with the region and access token to fetch model views.
 * If successful, the views are returned as a JSON response.
 * Any errors during the process are caught and result in a 500 error response.
 *
 * @param request - The incoming Next.js request.
 * @param context - Contains route parameters: region and version_id.
 * @returns A JSON response containing the model views or an error message.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ region: string; version_id: string }> }
) {
  // Extract version_id and region from the route parameters.
  const { version_id, region } = await params;

  // Retrieve authentication tokens from cookies.
  const tokens = await getAuthTokens();

  // If tokens are missing or invalid, return a 401 Unauthorized JSON response.
  if (!tokens) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Decode the version_id by replacing "%2F" with "/" to get the original URN.
    const decodedVersionId = version_id.replace("%2F", "/");

    // Fetch model views using the decoded version_id, region, and internal access token.
    const views = await getModelViews(decodedVersionId, region as Region, tokens.internalToken.access_token);

    // Return the fetched views as a JSON response.
    return Response.json(views);
  } catch (error) {
    // Log any errors encountered during the fetch process.
    console.error("Error getting views:", error);
    // Return a JSON response with a 500 status if fetching views fails.
    return Response.json({ error: "Failed to fetch views" }, { status: 500 });
  }
}
