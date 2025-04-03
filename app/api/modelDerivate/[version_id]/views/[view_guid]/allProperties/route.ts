// app/api/modelDerivate/[view_id]/views/[view_guid]/allProperties/route.ts
import { getAuthTokens } from "@/lib/server/auth";
import { getAllProperties, getObjectTree } from "@/lib/services/aps";
import { ObjectTreeData } from "@/types";
import { PropertiesDataCollection } from "@aps_sdk/model-derivative";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest, { params }: { params: { version_id: string; view_guid: string } }) {
    const { version_id, view_guid } = await params;

    const tokens = await getAuthTokens();

    if (!tokens) {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
    try {
        const allProperties = await getAllProperties(version_id.replace("%2F", "/"), view_guid, tokens.internalToken.access_token);
        const res: {
            isProcessing: boolean;
            properties: PropertiesDataCollection[];
            objectTreeWithProperties: ObjectTreeData[];
        } = {
            isProcessing: true,
            properties: [],
            objectTreeWithProperties: [],
        };

        if (!allProperties.isProcessing) {
            const propertiesMap = new Map<number, PropertiesDataCollection>();
            allProperties.properties.forEach((prop) => propertiesMap.set(prop.objectid, prop));

            const objectTree = await getObjectTree(version_id.replace("%2F", "/"), view_guid, tokens.internalToken.access_token);

            const attachProperties = (objects: ObjectTreeData[]): ObjectTreeData[] => {
                objects.map((object) => {
                    const property = propertiesMap.get(object.objectid);
                    if (property) {
                        object.properties = property.properties;
                    }
                    if (object.objects) {
                        attachProperties(object.objects as ObjectTreeData[]);
                    }
                });
                return objects;
            };

            const objectTreeWithProperties = attachProperties(objectTree);
            res.isProcessing = false;
            res.properties = allProperties.properties;
            res.objectTreeWithProperties = objectTreeWithProperties;
        }

        return Response.json(res);
    } catch (error) {
        console.error("Error getting all properties:", error);
        return Response.json({ error: "Failed to fetch all properties" }, { status: 500 });
    }
}
