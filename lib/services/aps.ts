// lib/services/aps.ts
import { AuthenticationClient, ResponseType, Scopes } from "@aps_sdk/authentication";
import { DataManagementClient } from "@aps_sdk/data-management";
import { Hub, Project, FolderContent, Version, UserProfile, SessionData, View } from "@/types";
import { Hubs, HubData, ProjectData, TopFolderData, FolderContentsData, VersionData } from "@aps_sdk/data-management/dist/model";
import { UserInfo } from "@aps_sdk/authentication/dist/model";
import { ModelDerivativeClient, ModelViewsDataMetadata, ObjectTreeDataObjects, PropertiesDataCollection } from "@aps_sdk/model-derivative";

const authenticationClient = new AuthenticationClient();
const dataManagementClient = new DataManagementClient();
const modelDerivativeClient = new ModelDerivativeClient();


// Using environment variables for configuration
const APS_CLIENT_ID = process.env.APS_CLIENT_ID!;
const APS_CLIENT_SECRET = process.env.APS_CLIENT_SECRET!;
const APS_CALLBACK_URL = process.env.APS_CALLBACK_URL!;
const INTERNAL_TOKEN_SCOPES = [Scopes.DataRead, Scopes.DataWrite, Scopes.ViewablesRead];
const PUBLIC_TOKEN_SCOPES = [Scopes.ViewablesRead];

export const getAuthorizationUrl = (): string => {
    return authenticationClient.authorize(APS_CLIENT_ID, ResponseType.Code, APS_CALLBACK_URL, INTERNAL_TOKEN_SCOPES);
};

export const getTokens = async (code: string): Promise<SessionData> => {
    const internalCredentials = await authenticationClient.getThreeLeggedToken(APS_CLIENT_ID, code, APS_CALLBACK_URL, {
        clientSecret: APS_CLIENT_SECRET,
    });

    const publicCredentials = await authenticationClient.refreshToken(internalCredentials.refresh_token, APS_CLIENT_ID, {
        clientSecret: APS_CLIENT_SECRET,
        scopes: PUBLIC_TOKEN_SCOPES,
    });

    return {
        public_token: publicCredentials.access_token,
        internal_token: internalCredentials.access_token,
        refresh_token: publicCredentials.refresh_token,
        expires_at: Date.now() + internalCredentials.expires_in * 1000,
    };
};

export const refreshTokens = async (refreshToken: string): Promise<SessionData> => {
    const internalCredentials = await authenticationClient.refreshToken(refreshToken, APS_CLIENT_ID, {
        clientSecret: APS_CLIENT_SECRET,
        scopes: INTERNAL_TOKEN_SCOPES,
    });

    const publicCredentials = await authenticationClient.refreshToken(internalCredentials.refresh_token, APS_CLIENT_ID, {
        clientSecret: APS_CLIENT_SECRET,
        scopes: PUBLIC_TOKEN_SCOPES,
    });

    return {
        public_token: publicCredentials.access_token,
        internal_token: internalCredentials.access_token,
        refresh_token: publicCredentials.refresh_token,
        expires_at: Date.now() + internalCredentials.expires_in * 1000,
    };
};

export const getUserProfile = async (accessToken: string): Promise<UserProfile> => {
    const resp: UserInfo = await authenticationClient.getUserInfo(accessToken);
    return {
        name: resp.name || "",
        email: resp.email,
    };
};

export const getHubs = async (accessToken: string): Promise<Hub[]> => {
    const resp: Hubs = await dataManagementClient.getHubs({ accessToken });

    const hubs: Hub[] = [];

    resp.data?.map((hub: HubData) => {
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
};

export const getProjects = async (hubId: string, accessToken: string): Promise<Project[]> => {
    const resp = await dataManagementClient.getHubProjects(hubId, { accessToken });

    const projects: Project[] = [];
    resp.data?.map((project: ProjectData) => {
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
};

export const getProjectContents = async (hubId: string, projectId: string, folderId: string | null, accessToken: string): Promise<FolderContent[]> => {
    const folders: FolderContent[] = [];
    let data: FolderContentsData[] | TopFolderData[] = [];
    if (!folderId) {
        const resp = await dataManagementClient.getProjectTopFolders(hubId, projectId, { accessToken });
        data = resp.data || [];
    } else {
        const resp = await dataManagementClient.getFolderContents(projectId, folderId, { accessToken });
        data = resp.data || [];
    }

    data.map((entry: FolderContentsData | TopFolderData) => {
        folders.push({
            id: entry.id,
            name: entry.attributes.displayName,
            folder: entry.type === "folders",
        });
    });
    return folders;
};

export const getItemVersions = async (projectId: string, itemId: string, accessToken: string): Promise<Version[]> => {
    const versions: Version[] = [];
    const resp = await dataManagementClient.getItemVersions(projectId, itemId, { accessToken });
    resp.data?.map((version: VersionData) => {
        if (version.id) {
            versions.push({
                id: version.id,
                name: version.attributes.createTime,
            });
        }
    });
    return versions;
};

export const getModelViews = async (versionUrn: string, accessToken: string): Promise<View[]> => {
    const views: View[] = [];
    const resp = await modelDerivativeClient.getModelViews(versionUrn, {region: "EMEA", accessToken });
    resp.data.metadata?.map((view: ModelViewsDataMetadata) => {
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
};

export const getAllProperties = async (versionUrn: string, modelGuid : string, accessToken: string): Promise<{ properties: PropertiesDataCollection[], isLoading: boolean }> => {
    const resp = await modelDerivativeClient.getAllProperties(versionUrn, modelGuid, {region: "EMEA", accessToken, forceget: "true" });
    const properties: PropertiesDataCollection[] = [];
    if (resp.isProcessing) {
        console.log(resp)
    } else {
        properties.push(...resp.data.collection);
    }
    return {properties: properties, isLoading: resp.isProcessing };
};

export const getObjectTree = async (versionUrn: string, modelGuid : string, accessToken: string): Promise<ObjectTreeDataObjects[]> => {
    const resp = await modelDerivativeClient.getObjectTree(versionUrn, modelGuid, {region: "EMEA", accessToken, forceget: "true" });
    const objectTree = resp.data.objects;
    return objectTree;
};