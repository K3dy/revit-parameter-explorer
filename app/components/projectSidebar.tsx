"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronRight, ChevronDown, Loader2, FolderClosed, FolderOpen, File, Clock, Eye, Box } from "lucide-react";
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
  region: string;
  onViewSelected: (type: string, viewGuid: string, itemUrn: string) => void;
}

/**
 * Sidebar Component renders a hierarchical tree of hubs, projects, folders, items, versions, and views.
 * It fetches initial hubs on mount and loads children nodes dynamically when toggled.
 */
export function Sidebar({ region, onViewSelected }: SidebarProps) {
  const [tree, setTree] = useState<TreeNode[]>([]);
  const [loading, setLoading] = useState(true);

  /**
   * sortNodesByName - Sorts tree nodes alphabetically by their name.
   * @param nodes - Array of TreeNode to sort.
   * @returns Sorted TreeNode array.
   */
  const sortNodesByName = (nodes: TreeNode[]): TreeNode[] => {
    return [...nodes].sort((a, b) => a.name.localeCompare(b.name));
  };

  /**
   * Fetch initial hubs when the component mounts.
   */
  useEffect(() => {
    const fetchHubs = async () => {
      try {
        const response = await fetch("/api/hubs");
        if (!response.ok) throw new Error("Failed to fetch hubs");

        const hubs = await response.json();
        // Map hubs to TreeNode format and sort them alphabetically.
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

  /**
   * toggleNode - Handles node toggling to expand/collapse or fetch children if not yet loaded.
   * @param nodeId - The unique ID of the node to toggle.
   */
  const toggleNode = async (nodeId: string) => {
    /**
     * updateNode - Recursively updates a node by its ID with the provided updates.
     * @param nodes - The array of nodes to search.
     * @param id - The ID of the node to update.
     * @param updates - Partial updates to merge into the node.
     * @returns Updated array of nodes.
     */
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

    /**
     * findNode - Recursively searches for a node by its ID.
     * @param nodes - Array of TreeNode to search.
     * @param id - The node ID to find.
     * @returns The found TreeNode or undefined.
     */
    const findNode = (nodes: TreeNode[], id: string): TreeNode | undefined => {
      for (const node of nodes) {
        if (node.id === id) return node;
        if (node.children) {
          const found = findNode(node.children, id);
          if (found) return found;
        }
      }
      return undefined;
    };

    // Find the target node in the tree
    const node = findNode(tree, nodeId);
    if (!node) return;

    // If the node is already open, simply close it
    if (node.isOpen) {
      setTree(updateNode(tree, nodeId, { isOpen: false }));
      return;
    }

    // If the node has no children yet, fetch them from the API
    if (!node.children || node.children.length === 0) {
      // Set loading state on the node
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
            children = versions.map((version: Version) => ({
              id: `version|${version.id}`,
              name: version.name,
              type: "version" as const,
            }));
            children = sortNodesByName(children);
            break;
          }
          case "version": {
            const version = parts[1];
            // Convert version using base64 and proper encoding for URL
            const encodedVersion = btoa(version).replace("/", "%2F");
            const res = await fetch(`/api/modelDerivate/${region}/${encodedVersion}/views`);
            if (!res.ok || res.status === 404) {
              children = [
                {
                  id: "",
                  name: "Error: No views found",
                  type: "error" as const,
                  isOpen: false,
                },
              ];
              break;
            }
            if (!res.ok) throw new Error("Failed to fetch views");

            const views = await res.json();
            children = views
              .filter((view: View) => view.role === "3d")
              .map((view: View) => ({
                id: `view|${view.guid}`,
                name: view.name,
                type: "view" as const,
                parent: view.urn,
              }));
            children = sortNodesByName(children);
            break;
          }
        }

        // Update the target node with the fetched children, set it to open, and turn off loading indicator
        setTree(
          updateNode(tree, nodeId, {
            children,
            isOpen: true,
            isLoading: false,
          })
        );
      } catch (error) {
        console.error("Error fetching children:", error);
        // Update node to stop loading even if fetch fails
        setTree(updateNode(tree, nodeId, { isLoading: false }));
      }
    } else {
      // If children are already loaded, just open the node
      setTree(updateNode(tree, nodeId, { isOpen: true }));
    }
  };

  /**
   * handleNodeClick - Handles clicks on a node.
   * For view nodes, it triggers the onViewSelected callback.
   * For all others, it toggles the node (expands/collapses).
   * @param node - The clicked TreeNode.
   */
  const handleNodeClick = (node: TreeNode) => {
    if (node.type === "view") {
      const parts = node.id.split("|");
      onViewSelected(parts[0], parts[1], node.parent || "");
    } else {
      toggleNode(node.id);
    }
  };

  /**
   * renderTreeNode - Recursively renders a tree node along with its children.
   * @param node - The TreeNode to render.
   * @param level - The current nesting level (used for indentation).
   * @returns A JSX element representing the node.
   */
  const renderTreeNode = (node: TreeNode, level: number = 0) => {
    /**
     * getNodeIcon - Returns an icon component based on the node type and state.
     */
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
          return <Eye className="h-4 w-4 text-blue-500" />;
        case "error":
          return <Box className="h-4 w-4 text-red-500" />;
        default:
          return <FolderClosed className="h-4 w-4" />;
      }
    };

    return (
      <div key={node.id}>
        {/* Node container with dynamic indentation based on level */}
        <div
          className="flex items-center px-2 py-1 hover:bg-gray-100 hover:dark:bg-gray-600 rounded cursor-pointer"
          style={{ paddingLeft: `${level * 16 + 8}px` }}
          onClick={() => handleNodeClick(node)}
        >
          {/* Display toggle icon for nodes that are not views */}
          {node.type !== "view" && (
            <div className="mr-1">
              {node.isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : node.isOpen ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </div>
          )}
          {/* Display node-specific icon */}
          <div className="mr-2">{getNodeIcon()}</div>
          {/* Display node name */}
          <div className="text-sm truncate">{node.name}</div>
        </div>

        {/* Recursively render children if node is open */}
        {node.isOpen && node.children && node.children.length > 0 && (
          <div>{node.children.map((child) => renderTreeNode(child, level + 1))}</div>
        )}
      </div>
    );
  };

  return (
    <Card className="h-full rounded-xl py-4">
      <CardContent className="p-2 overflow-auto">
        {loading ? (
          <div className="flex justify-center items-center h-full">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          </div>
        ) : tree.length > 0 ? (
          <div>{tree.map((node) => renderTreeNode(node))}</div>
        ) : (
          <div className="flex justify-center items-center h-full">
            <p className="text-gray-500">No hubs found</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
