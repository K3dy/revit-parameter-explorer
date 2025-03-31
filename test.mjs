import { DataManagementClient } from "@aps_sdk/data-management";
import { ModelDerivativeClient } from "@aps_sdk/model-derivative";
// import { BuildingStoreys, Width, Height, Job, Region, OutputType, Manifest, ModelViews, ObjectTree, ModelViewsDataMetadata, Properties, SpecificPropertiesPayload, SpecificPropertiesPayloadQuery, Payload, SpecificProperties } from "@aps_sdk/model-derivative";

const token =
    "eyJhbGciOiJSUzI1NiIsImtpZCI6IlhrUFpfSmhoXzlTYzNZS01oRERBZFBWeFowOF9SUzI1NiIsInBpLmF0bSI6ImFzc2MifQ.eyJzY29wZSI6WyJkYXRhOnJlYWQiLCJkYXRhOndyaXRlIiwiZGF0YTpjcmVhdGUiLCJhY2NvdW50OnJlYWQiXSwiY2xpZW50X2lkIjoiNEE5RkwwMWxza3ltcGIxY0hkSzJ3bXp4YnVaaHdsdngiLCJpc3MiOiJodHRwczovL2RldmVsb3Blci5hcGkuYXV0b2Rlc2suY29tIiwiYXVkIjoiaHR0cHM6Ly9hdXRvZGVzay5jb20iLCJqdGkiOiJVZkk3SU1IQXBxVE5MNE5JSWRUQ2NiMGltNE5QZzJXZGdmR2VNcTB5SG5iVzg4MzF0YVdYTDFsT25aWjFQNmZtIiwiZXhwIjoxNzQzNDQyMzcwLCJ1c2VyaWQiOiJLQVdGTFoyV0Y5MlYifQ.HKJG7KwU5NHribYIvsnvaKtmmFkoYscSYPCBzgBEPuW3escQWHfQ1_BmPFzrlScY7D4hl3TVkqagOG9-4GLtoj_lXiHZ9UTX5fHkoXrMhiljor1Ii7xozN0NZiGYk3CurM4lV6IZawaO7zewr8VgCOC5ThXGJGJs2DCbR_6LK6m5jEKMTEukjV6F4pWdDNS0Fpy5pzmzrz4FeQvk6-Zw00IzfT8bhz457Eiu5EJWD450BB_Lrv7varFGN9xoxW4ft2rBHfwxXzzPGoIHHoP5LeTeJdBfn0orgOqhAwWM70t5pmWIoBK5M8YbYOLdeC8wKLujxPrK3Mtg8wLUUqTZJw";

const hub_id = "b.c2691772-1c72-44c6-be19-2847c2877e54";
const project_id = "b.978b65ea-2e78-46ee-936f-f9d0b5a97907";
const urn = "urn:adsk.wipemea:dm.lineage:cOeDfhS9Ry6W4nunytA56A?";
console.log(btoa(urn));
const guid = "2158c7ec-42c3-d583-683c-35895cd1afd9";

const dataManagementClient = new DataManagementClient();
const modelDerivativeClient = new ModelDerivativeClient();

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

const getProjectContents = async (hubId, projectId, folderId, accessToken) => {
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

const getModelViews = async (urn, accessToken) => {
    let modelViews = await modelDerivativeClient.getModelViews("dXJuOmFkc2sud2lwZW1lYTpmcy5maWxlOnZmLjd3SW5ITm0xUlNXS3g3NTFTb1ZOdnc_dmVyc2lvbj01", {region: "EMEA", accessToken });
    console.log(modelViews.data);
};

// getModelViews(btoa(urn), token);

const getAllProperties = async (urn, modelGuid, accessToken) => {
    let allProperties = await modelDerivativeClient.getAllProperties(urn, modelGuid, {region: "EMEA", accessToken });
    console.log(allProperties);
};

getAllProperties('dXJuOmFkc2sud2lwZW1lYTpmcy5maWxlOnZmLjd3SW5ITm0xUlNXS3g3NTFTb1ZOdnc_dmVyc2lvbj01', 'ce663f73-6869-a78a-1b8e-fc3e95cdfec1', token);
