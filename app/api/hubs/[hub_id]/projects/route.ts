// app/api/hubs/[hub_id]/projects/route.ts
import { getAuthTokens } from "@/lib/server/auth";
import { getProjects } from "@/lib/services/aps";
import { NextRequest } from "next/server";

/**
 * GET - Retrieves the projects for a specific hub.
 *
 * This route extracts the hub_id parameter from the request, obtains the authentication tokens,
 * and then uses the internal access token to fetch projects for the specified hub.
 * If tokens are missing or fetching projects fails, it returns an appropriate error response.
 *
 * @param request - The incoming Next.js request.
 * @param context - Contains the route parameters, including hub_id.
 * @returns A JSON response with the list of projects or an error message.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ hub_id: string }> }
) {
  // Extract the hub_id from the parameters.
  const { hub_id } = await params;

  // Retrieve authentication tokens from cookies.
  const tokens = await getAuthTokens();

  // If tokens are missing or invalid, return a 401 Unauthorized response.
  if (!tokens) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Use the internal access token to fetch projects for the given hub.
    const projects = await getProjects(hub_id, tokens.internalToken.access_token);
    // Return the fetched projects in a JSON response.
    return Response.json(projects);
  } catch (error) {
    // Log the error for debugging purposes.
    console.error("Error getting projects:", error);
    // Return a JSON response with a 500 status code if the projects cannot be fetched.
    return Response.json({ error: "Failed to fetch projects" }, { status: 500 });
  }
}
