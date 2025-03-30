import { DataManagementClient } from "@aps_sdk/data-management";

const token =
    "eyJhbGciOiJSUzI1NiIsImtpZCI6IlhrUFpfSmhoXzlTYzNZS01oRERBZFBWeFowOF9SUzI1NiIsInBpLmF0bSI6ImFzc2MifQ.eyJzY29wZSI6WyJkYXRhOnJlYWQiLCJkYXRhOndyaXRlIiwiYWNjb3VudDpyZWFkIl0sImNsaWVudF9pZCI6IjRBOUZMMDFsc2t5bXBiMWNIZEsyd216eGJ1Wmh3bHZ4IiwiaXNzIjoiaHR0cHM6Ly9kZXZlbG9wZXIuYXBpLmF1dG9kZXNrLmNvbSIsImF1ZCI6Imh0dHBzOi8vYXV0b2Rlc2suY29tIiwianRpIjoiZkNlM05CNjV0WWprU2lQMFJQZXZNOUdqSktoUVBUR0ZCeklZVVpvVW83RkplRTN4Z2hMOUJqZmhnaEdvR3JKZSIsImV4cCI6MTc0MzM2OTU0NSwidXNlcmlkIjoiS0FXRkxaMldGOTJWIn0.QdoJFxvgIfhms2KkXfc37JrpDhptzAUUvrd530y65X4UM9q8YM_iOP_TRrZIKqYaJhczb-r_h7Et2gfVaBKiAFE3u0HqgPaJz0TeZxwDOjYW_PVX20uzs7rp_xJe_owgO4HHTVlKYCqz2-q32lpgWjXXglI658YADqpj_69WigxXwEMGEDGR1-pw8Ie9YKHWOhHUu2m261zX1Z6XAPwln2nvX7bBJP9VaO01vVENrxluaPpqU4x3R7hcywclPpAwczuxG8KzUDIPTxhRbFfX_gF0VRmYk-f6hH1F-CaycqVXDh08U74KCvxPc17FYsIupAkv86GYPLIyMfQR05_QWQ";

const hub_id = "b.c2691772-1c72-44c6-be19-2847c2877e54";
const project_id = "b.13032c54-de7f-4a1c-8093-2fe123df6c0a";

const dataManagementClient = new DataManagementClient();

const getHubs = async (accessToken) => {
    const resp = await dataManagementClient.getHubs({ accessToken });

    const hubs = [];

    resp.data?.map((hub) => {
        if (hub.id) {
            hubs.push({
                id: hub.id,
                name: hub.attributes?.name || "",
                region: hub.attributes?.region || "",
                type: hub.attributes?.extension?.type || "",
            });
        }
    });

    // console.log(hubs);
};

getHubs(token);

const getProjects = async (hubId, accessToken) => {
    const projects = [];

    const resp = await dataManagementClient.getHubProjects(hubId, { accessToken });
    resp.data?.map((project) => {
        projects.push({
            id: project.id,
            name: project.attributes.name,
        });
    });
    console.log(projects.data);
};

getProjects(hub_id, token);

export const getProjectContents = async (hubId, projectId, folderId, accessToken) => {
    let resp;
    if (!folderId) {
        resp = await dataManagementClient.getProjectTopFolders(hubId, projectId, { accessToken });
    } else {
        resp = await dataManagementClient.getFolderContents(projectId, folderId, { accessToken });
    }
    const folders = [];
    resp.data?.map((entry) => ({
        id: entry.id,
        name: entry.attributes.displayName,
        folder: entry.type === "folders",
    }));
    console.log(folders);
};

getProjectContents(hub_id, project_id, null, token);
