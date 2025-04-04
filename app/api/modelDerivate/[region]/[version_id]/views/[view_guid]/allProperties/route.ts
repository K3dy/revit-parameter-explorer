// app/api/modelDerivate/[region]/[view_id]/views/[view_guid]/allProperties/route.ts
import { getAuthTokens } from "@/lib/server/auth";
import { getAllProperties, getObjectTree } from "@/lib/services/aps";
import { ObjectTreeData } from "@/types";
import { PropertiesDataCollection, Region } from "@aps_sdk/model-derivative";
import { NextRequest } from "next/server";

/**
 * GET - Retrieves all properties for a specific model view.
 *
 * This endpoint uses the provided version_id (encoded URN), view_guid, and region to:
 * 1. Retrieve all properties via the APS service.
 * 2. If processing is complete, fetch the object tree.
 * 3. Attach properties from the property collection to the corresponding nodes in the object tree.
 *
 * The final response contains a flag indicating whether processing is still occurring,
 * the list of properties, and the object tree enriched with properties.
 *
 * @param request - The incoming Next.js request.
 * @param context - Contains route parameters: region, version_id, and view_guid.
 * @returns A JSON response with all properties and the processed object tree, or an error message.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ region: string; version_id: string; view_guid: string }> }
) {
  // Destructure the route parameters.
  const { version_id, view_guid, region } = await params;

  // Retrieve authentication tokens from cookies.
  const tokens = await getAuthTokens();

  // If tokens are missing or invalid, return a 401 Unauthorized response.
  if (!tokens) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  try {
    // Convert the encoded version_id (URN) back to its original form.
    // This assumes that "%2F" was previously used in place of "/" in the URN.
    const decodedVersionId = version_id.replace("%2F", "/");

    // Fetch all properties for the specified model view.
    const allProperties = await getAllProperties(
      decodedVersionId,
      view_guid,
      region as Region,
      tokens.internalToken.access_token
    );

    // Initialize a response object with default values.
    const res: {
      isProcessing: boolean;
      properties: PropertiesDataCollection[];
      objectTreeWithProperties: ObjectTreeData[];
    } = {
      isProcessing: true,
      properties: [],
      objectTreeWithProperties: [],
    };

    // If the properties fetch indicates processing is complete...
    if (!allProperties.isProcessing) {
      // Create a Map to quickly lookup properties by their object ID.
      const propertiesMap = new Map<number, PropertiesDataCollection>();
      allProperties.properties.forEach((prop) => propertiesMap.set(prop.objectid, prop));

      // Fetch the object tree for the model.
      const objectTree = await getObjectTree(
        decodedVersionId,
        view_guid,
        region as Region,
        tokens.internalToken.access_token
      );

      /**
       * attachProperties - Recursively attaches properties to nodes in the object tree.
       *
       * @param objects - The array of object tree nodes.
       * @returns The updated array of nodes with attached properties.
       */
      const attachProperties = (objects: ObjectTreeData[]): ObjectTreeData[] => {
        // Iterate over each node in the current level.
        objects.forEach((object) => {
          // If a matching property exists, attach it to the object.
          const property = propertiesMap.get(object.objectid);
          if (property) {
            object.properties = property.properties;
          }
          // If the node has children, recursively attach properties to them.
          if (object.objects) {
            attachProperties(object.objects as ObjectTreeData[]);
          }
        });
        return objects;
      };

      // Enrich the object tree with properties.
      const objectTreeWithProperties = attachProperties(objectTree);

      // Update the response object with the fetched properties and enriched object tree.
      res.isProcessing = false;
      res.properties = allProperties.properties;
      res.objectTreeWithProperties = objectTreeWithProperties;
    }

    // Return the final response as JSON.
    return Response.json(res);
  } catch (error) {
    // Log any errors encountered during the process.
    console.error("Error getting all properties:", error);
    // Return a 500 error response if something goes wrong.
    return Response.json({ error: "Failed to fetch all properties" }, { status: 500 });
  }
}
