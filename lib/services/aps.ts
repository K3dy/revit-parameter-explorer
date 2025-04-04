// lib/services/aps.ts
import { AuthenticationClient, ResponseType, Scopes } from "@aps_sdk/authentication";
import { DataManagementClient } from "@aps_sdk/data-management";
import { Hub, Project, FolderContent, Version, UserProfile, SessionData, View } from "@/types";
import { Hubs, HubData, ProjectData, TopFolderData, FolderContentsData, VersionData } from "@aps_sdk/data-management/dist/model";
import { UserInfo } from "@aps_sdk/authentication/dist/model";
import { ModelDerivativeClient, ModelViewsDataMetadata, ObjectTreeDataObjects, PropertiesDataCollection, Region } from "@aps_sdk/model-derivative";

// Create instances of APS SDK clients.
const authenticationClient = new AuthenticationClient();
const dataManagementClient = new DataManagementClient();
const modelDerivativeClient = new ModelDerivativeClient();

// Using environment variables for configuration.
const APS_CLIENT_ID = process.env.APS_CLIENT_ID!;
const APS_CLIENT_SECRET = process.env.APS_CLIENT_SECRET!;
const APS_CALLBACK_URL = process.env.APS_CALLBACK_URL!;

// Define token scopes for internal and public tokens.
const INTERNAL_TOKEN_SCOPES = [Scopes.DataRead, Scopes.DataWrite, Scopes.ViewablesRead];
const PUBLIC_TOKEN_SCOPES = [Scopes.ViewablesRead];

/**
 * getAuthorizationUrl - Generates the authorization URL for user login.
 *
 * @returns The URL string that the user should be redirected to for authentication.
 */
export const getAuthorizationUrl = (): string => {
  return authenticationClient.authorize(APS_CLIENT_ID, ResponseType.Code, APS_CALLBACK_URL, INTERNAL_TOKEN_SCOPES);
};

/**
 * getTokens - Exchanges an authorization code for session tokens.
 *
 * @param code - The authorization code received from the authentication callback.
 * @returns A Promise that resolves with session data including internal and public tokens, refresh token, and expiration.
 */
export const getTokens = async (code: string): Promise<SessionData> => {
  try {
    // Get internal credentials using the three-legged token flow.
    const internalCredentials = await authenticationClient.getThreeLeggedToken(
      APS_CLIENT_ID,
      code,
      APS_CALLBACK_URL,
      { clientSecret: APS_CLIENT_SECRET }
    );

    // Refresh token to obtain public credentials with limited scopes.
    const publicCredentials = await authenticationClient.refreshToken(
      internalCredentials.refresh_token,
      APS_CLIENT_ID,
      { clientSecret: APS_CLIENT_SECRET, scopes: PUBLIC_TOKEN_SCOPES }
    );

    return {
      public_token: publicCredentials.access_token,
      internal_token: internalCredentials.access_token,
      refresh_token: publicCredentials.refresh_token,
      expires_at: Date.now() + internalCredentials.expires_in * 1000,
    };
  } catch (error) {
    console.error("Error obtaining tokens:", error);
    throw error;
  }
};

/**
 * refreshTokens - Refreshes session tokens using a refresh token.
 *
 * @param refreshToken - The refresh token from the previous session.
 * @returns A Promise that resolves with refreshed session data.
 */
export const refreshTokens = async (refreshToken: string): Promise<SessionData> => {
  try {
    // Refresh internal credentials using the provided refresh token.
    const internalCredentials = await authenticationClient.refreshToken(
      refreshToken,
      APS_CLIENT_ID,
      { clientSecret: APS_CLIENT_SECRET, scopes: INTERNAL_TOKEN_SCOPES }
    );

    // Refresh public credentials using the new internal refresh token.
    const publicCredentials = await authenticationClient.refreshToken(
      internalCredentials.refresh_token,
      APS_CLIENT_ID,
      { clientSecret: APS_CLIENT_SECRET, scopes: PUBLIC_TOKEN_SCOPES }
    );

    return {
      public_token: publicCredentials.access_token,
      internal_token: internalCredentials.access_token,
      refresh_token: publicCredentials.refresh_token,
      expires_at: Date.now() + internalCredentials.expires_in * 1000,
    };
  } catch (error) {
    console.error("Error refreshing tokens:", error);
    throw error;
  }
};

/**
 * getUserProfile - Retrieves the user's profile information.
 *
 * @param accessToken - The access token for authorization.
 * @returns A Promise that resolves with a user profile object.
 */
export const getUserProfile = async (accessToken: string): Promise<UserProfile> => {
  try {
    const resp: UserInfo = await authenticationClient.getUserInfo(accessToken);
    return {
      name: resp.name || "",
      email: resp.email,
    };
  } catch (error) {
    console.error("Error fetching user profile:", error);
    throw error;
  }
};

/**
 * getHubs - Fetches the list of hubs accessible with the given access token.
 *
 * @param accessToken - The access token for authorization.
 * @returns A Promise that resolves with an array of Hub objects.
 */
export const getHubs = async (accessToken: string): Promise<Hub[]> => {
  try {
    const resp: Hubs = await dataManagementClient.getHubs({ accessToken });
    const hubs: Hub[] = [];

    // Process each hub data entry into our Hub type.
    resp.data?.forEach((hub: HubData) => {
      if (hub.id) {
        hubs.push({
          id: hub.id,
          name: hub.attributes?.name || "",
          region: hub.attributes?.region || "",
          type: hub.attributes?.extension?.type || "",
        });
      }
    });

    return hubs;
  } catch (error) {
    console.error("Error fetching hubs:", error);
    throw error;
  }
};

/**
 * getProjects - Retrieves projects for a given hub.
 *
 * @param hubId - The ID of the hub.
 * @param accessToken - The access token for authorization.
 * @returns A Promise that resolves with an array of Project objects.
 */
export const getProjects = async (hubId: string, accessToken: string): Promise<Project[]> => {
  try {
    const resp = await dataManagementClient.getHubProjects(hubId, { accessToken });
    const projects: Project[] = [];
    resp.data?.forEach((project: ProjectData) => {
      if (project.id) {
        projects.push({
          id: project.id,
          name: project.attributes.name || "",
          accountId: project.relationships?.hub?.data?.id || "",
          type: (project.attributes.extension?.data?.projectType as unknown as string) || "",
        });
      }
    });
    return projects;
  } catch (error) {
    console.error("Error fetching projects:", error);
    throw error;
  }
};

/**
 * getProjectContents - Retrieves contents of a project folder.
 *
 * @param hubId - The hub ID.
 * @param projectId - The project ID.
 * @param folderId - The folder ID, or null to fetch top folders.
 * @param accessToken - The access token for authorization.
 * @returns A Promise that resolves with an array of FolderContent objects.
 */
export const getProjectContents = async (hubId: string, projectId: string, folderId: string | null, accessToken: string): Promise<FolderContent[]> => {
  try {
    const folders: FolderContent[] = [];
    let data: FolderContentsData[] | TopFolderData[] = [];
    if (!folderId) {
      const resp = await dataManagementClient.getProjectTopFolders(hubId, projectId, { accessToken });
      data = resp.data || [];
    } else {
      const resp = await dataManagementClient.getFolderContents(projectId, folderId, { accessToken });
      data = resp.data || [];
    }

    // Map API data entries to FolderContent objects.
    data.forEach((entry: FolderContentsData | TopFolderData) => {
      folders.push({
        id: entry.id,
        name: entry.attributes.displayName,
        folder: entry.type === "folders",
      });
    });
    return folders;
  } catch (error) {
    console.error("Error fetching project contents:", error);
    throw error;
  }
};

/**
 * getItemVersions - Retrieves versions for a given item.
 *
 * @param projectId - The project ID.
 * @param itemId - The item ID.
 * @param accessToken - The access token for authorization.
 * @returns A Promise that resolves with an array of Version objects.
 */
export const getItemVersions = async (projectId: string, itemId: string, accessToken: string): Promise<Version[]> => {
  try {
    const versions: Version[] = [];
    const resp = await dataManagementClient.getItemVersions(projectId, itemId, { accessToken });
    resp.data?.forEach((version: VersionData) => {
      if (version.id) {
        versions.push({
          id: version.id,
          name: version.attributes.createTime,
        });
      }
    });
    return versions;
  } catch (error) {
    console.error("Error fetching item versions:", error);
    throw error;
  }
};

/**
 * getModelViews - Retrieves model views for a given version URN.
 *
 * @param versionUrn - The URN of the version.
 * @param region - The region of the model derivative service.
 * @param accessToken - The access token for authorization.
 * @returns A Promise that resolves with an array of View objects.
 */
export const getModelViews = async (versionUrn: string, region: Region, accessToken: string): Promise<View[]> => {
  try {
    const views: View[] = [];
    const resp = await modelDerivativeClient.getModelViews(versionUrn, { region, accessToken });
    resp.data.metadata?.forEach((view: ModelViewsDataMetadata) => {
      if (view.guid) {
        views.push({
          guid: view.guid,
          name: view.name,
          role: view.role,
          urn: versionUrn,
        });
      }
    });
    return views;
  } catch (error) {
    console.error("Error fetching model views:", error);
    throw error;
  }
};

/**
 * getAllProperties - Retrieves all properties for a given model.
 *
 * @param versionUrn - The URN of the version.
 * @param modelGuid - The GUID of the model.
 * @param region - The region of the model derivative service.
 * @param accessToken - The access token for authorization.
 * @returns A Promise that resolves with an object containing properties and a processing status.
 */
export const getAllProperties = async (
  versionUrn: string,
  modelGuid: string,
  region: Region,
  accessToken: string
): Promise<{ properties: PropertiesDataCollection[]; isProcessing: boolean }> => {
  try {
    const resp = await modelDerivativeClient.getAllProperties(versionUrn, modelGuid, {
      region,
      accessToken,
      forceget: "true",
    });
    const properties: PropertiesDataCollection[] = [];
    if (resp.data?.collection) {
      properties.push(...resp.data.collection);
    }
    return { properties: properties, isProcessing: resp.isProcessing };
  } catch (error) {
    console.error("Error fetching all properties:", error);
    throw error;
  }
};

/**
 * getObjectTree - Retrieves the object tree for a given model.
 *
 * @param versionUrn - The URN of the version.
 * @param modelGuid - The GUID of the model.
 * @param region - The region of the model derivative service.
 * @param accessToken - The access token for authorization.
 * @returns A Promise that resolves with the object tree data.
 */
export const getObjectTree = async (
  versionUrn: string,
  modelGuid: string,
  region: Region,
  accessToken: string
): Promise<ObjectTreeDataObjects[]> => {
  try {
    const resp = await modelDerivativeClient.getObjectTree(versionUrn, modelGuid, {
      region,
      accessToken,
      forceget: "true",
    });
    const objectTree = resp.data.objects;
    return objectTree;
  } catch (error) {
    console.error("Error fetching object tree:", error);
    throw error;
  }
};
