"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronRight, ChevronDown, Loader2, FolderClosed, FolderOpen, File, Clock } from "lucide-react";
import { FolderContent, Hub, Project, Version, View } from "@/types";

interface TreeNode {
    id: string;
    name: string;
    type: "hub" | "project" | "folder" | "item" | "version" | "view" | "error";
    children?: TreeNode[];
    isOpen?: boolean;
    isLoading?: boolean;
    parent?: string;
}

interface SidebarProps {
    onViewSelected: (type: string, viewGuid: string, itemUrn: string) => void;
}

export function Sidebar({ onViewSelected }: SidebarProps) {
    const [tree, setTree] = useState<TreeNode[]>([]);
    const [loading, setLoading] = useState(true);

    // Sort nodes alphabetically by name
    const sortNodesByName = (nodes: TreeNode[]): TreeNode[] => {
        return [...nodes].sort((a, b) => a.name.localeCompare(b.name));
    };

    // Fetch hubs when component mounts
    useEffect(() => {
        const fetchHubs = async () => {
            try {
                const response = await fetch("/api/hubs");
                if (!response.ok) throw new Error("Failed to fetch hubs");

                const hubs = await response.json();
                // Sort hubs by name
                const sortedHubs = sortNodesByName(
                    hubs.map((hub: Hub) => ({
                        id: `hub|${hub.id}`,
                        name: hub.name,
                        type: "hub" as const,
                        isOpen: false,
                        children: [],
                    }))
                );

                setTree(sortedHubs);
            } catch (error) {
                console.error("Error fetching hubs:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchHubs();
    }, []);

    const toggleNode = async (nodeId: string) => {
        const updateNode = (nodes: TreeNode[], id: string, updates: Partial<TreeNode>): TreeNode[] => {
            return nodes.map((node) => {
                if (node.id === id) {
                    return { ...node, ...updates };
                } else if (node.children) {
                    return { ...node, children: updateNode(node.children, id, updates) };
                }
                return node;
            });
        };

        // Find the node
        const findNode = (nodes: TreeNode[], id: string): TreeNode | undefined => {
            for (const node of nodes) {
                if (node.id === nodeId) return node;
                if (node.children) {
                    const found = findNode(node.children, id);
                    if (found) return found;
                }
            }
            return undefined;
        };

        const node = findNode(tree, nodeId);
        if (!node) return;

        // If node is already open, just close it
        if (node.isOpen) {
            setTree(updateNode(tree, nodeId, { isOpen: false }));
            return;
        }

        // If node has no children yet, fetch them
        if (!node.children || node.children.length === 0) {
            setTree(updateNode(tree, nodeId, { isLoading: true }));

            try {
                const parts = nodeId.split("|");
                const nodeType = parts[0];
                let children: TreeNode[] = [];

                switch (nodeType) {
                    case "hub": {
                        const hubId = parts[1];
                        const res = await fetch(`/api/hubs/${hubId}/projects`);
                        if (!res.ok) throw new Error("Failed to fetch projects");

                        const projects = await res.json();
                        children = projects.map((project: Project) => ({
                            id: `project|${hubId}|${project.id}`,
                            name: project.name,
                            type: "project" as const,
                            isOpen: false,
                            children: [],
                        }));
                        // Sort projects by name
                        children = sortNodesByName(children);
                        break;
                    }
                    case "project": {
                        const hubId = parts[1];
                        const projectId = parts[2];
                        const res = await fetch(`/api/hubs/${hubId}/projects/${projectId}/contents`);
                        if (!res.ok) throw new Error("Failed to fetch contents");

                        const contents = await res.json();
                        children = contents.map((content: FolderContent) => ({
                            id: content.folder ? `folder|${hubId}|${projectId}|${content.id}` : `item|${hubId}|${projectId}|${content.id}`,
                            name: content.name,
                            type: (content.folder ? "folder" : "item") as "folder" | "item",
                            isOpen: false,
                            children: [],
                        }));
                        // Sort contents by name
                        children = sortNodesByName(children);
                        break;
                    }
                    case "folder": {
                        const hubId = parts[1];
                        const projectId = parts[2];
                        const folderId = parts[3];
                        const res = await fetch(`/api/hubs/${hubId}/projects/${projectId}/contents?folder_id=${folderId}`);
                        if (!res.ok) throw new Error("Failed to fetch folder contents");

                        const contents = await res.json();
                        children = contents.map((content: FolderContent) => ({
                            id: content.folder ? `folder|${hubId}|${projectId}|${content.id}` : `item|${hubId}|${projectId}|${content.id}`,
                            name: content.name,
                            type: (content.folder ? "folder" : "item") as "folder" | "item",
                            isOpen: false,
                            children: [],
                        }));
                        // Sort contents by name
                        children = sortNodesByName(children);
                        break;
                    }
                    case "item": {
                        const hubId = parts[1];
                        const projectId = parts[2];
                        const itemId = parts[3];
                        const res = await fetch(`/api/hubs/${hubId}/projects/${projectId}/contents/${itemId}/versions`);
                        if (!res.ok) throw new Error("Failed to fetch versions");

                        const versions = await res.json();
                        console.log(versions);
                        children = versions.map((version: Version) => ({
                            id: `version|${version.id}`,
                            name: version.name,
                            type: "version" as const,
                        }));
                        // Sort versions by name
                        children = sortNodesByName(children);
                        break;
                    }
                    case "version": {
                        const version = parts[1];
                        const res = await fetch(`/api/modelDerivate/${btoa(version).replace("/", "%2F")}/views`);
                        console.log(res);
                        if (!res.ok || res.status === 404) {
                            children = [
                                {
                                    id: "",
                                    name: "Error: No views found",
                                    type: "error" as const,
                                },
                            ];
                            break;
                        }
                        if (!res.ok) throw new Error("Failed to fetch versions");

                        const views = await res.json();
                        children = views.map((view: View) => ({
                            id: `view|${view.guid}`,
                            name: view.name + " - " + view.role.toUpperCase(),
                            type: "view" as const,
                            parent: view.urn,
                        }));
                        // Sort versions by name
                        children = sortNodesByName(children);
                        break;
                    }
                }

                setTree(
                    updateNode(tree, nodeId, {
                        children,
                        isOpen: true,
                        isLoading: false,
                    })
                );
            } catch (error) {
                console.error("Error fetching children:", error);
                setTree(updateNode(tree, nodeId, { isLoading: false }));
            }
        } else {
            // Just open the node if children are already loaded
            setTree(updateNode(tree, nodeId, { isOpen: true }));
        }
    };

    const handleNodeClick = (node: TreeNode) => {
        if (node.type === "view") {
            const parts = node.id.split("|");
            console.log(parts, node.parent);
            onViewSelected(parts[0], parts[1], node.parent || "");
        } else {
            toggleNode(node.id);
        }
    };

    const renderTreeNode = (node: TreeNode, level: number = 0) => {
        const getNodeIcon = () => {
            switch (node.type) {
                case "hub":
                    return <FolderClosed className="h-4 w-4 text-blue-500" />;
                case "project":
                    return <FolderClosed className="h-4 w-4 text-green-500" />;
                case "folder":
                    return node.isOpen ? <FolderOpen className="h-4 w-4 text-yellow-500" /> : <FolderClosed className="h-4 w-4 text-yellow-500" />;
                case "item":
                    return <File className="h-4 w-4 text-gray-500" />;
                case "version":
                    return <Clock className="h-4 w-4 text-purple-500" />;
                case "view":
                    return <Clock className="h-4 w-4 text-purple-500" />;
                default:
                    return <FolderClosed className="h-4 w-4" />;
            }
        };

        return (
            <div key={node.id} className="w-full">
                <div className="flex items-center px-2 py-1 hover:bg-gray-100 rounded cursor-pointer" style={{ paddingLeft: `${level * 16 + 8}px` }} onClick={() => handleNodeClick(node)}>
                    {node.type !== "view" && (
                        <div className="mr-1">
                            {node.isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : node.isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                        </div>
                    )}
                    <div className="mr-2">{getNodeIcon()}</div>
                    <div className="text-sm truncate">{node.name}</div>
                </div>

                {node.isOpen && node.children && node.children.length > 0 && <div>{node.children.map((child) => renderTreeNode(child, level + 1))}</div>}
            </div>
        );
    };

    return (
        <Card className="h-full">
            <CardContent className="p-2 h-full overflow-auto">
                {loading ? (
                    <div className="flex justify-center items-center h-full">
                        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                    </div>
                ) : tree.length > 0 ? (
                    <div className="w-full">{tree.map((node) => renderTreeNode(node))}</div>
                ) : (
                    <div className="flex justify-center items-center h-full">
                        <p className="text-gray-500">No hubs found</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
