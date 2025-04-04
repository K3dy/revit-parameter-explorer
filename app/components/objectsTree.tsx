// app/components/objectsTree.tsx
import { ObjectTreeData } from "@/types";
import { ChevronDown, ChevronRight } from "lucide-react";
import React, { useMemo } from "react";

interface TreeProps {
    data: ObjectTreeData[];
    searchQuery?: string;
    level?: number;
    onSelect?: (objectId: number) => void;
    expandAll?: boolean;
}

/**
 * Tree Component renders a list of tree nodes.
 * It filters nodes based on the search query and passes selection events up.
 */
const Tree: React.FC<TreeProps> = ({ data, searchQuery = "", level = 1, onSelect, expandAll = false }) => {
    // Filter data based on search query.
    // If a search query exists, include nodes that match by name or object ID,
    // or if any of their children match.
    const filteredData = useMemo(() => {
        if (!searchQuery) return data;

        // Helper function to check if a node or any of its children match the search query.
        const nodeMatches = (node: ObjectTreeData): boolean => {
            const nameMatch = node.name.toLowerCase().includes(searchQuery.toLowerCase());
            const idMatch = node.objectid.toString().includes(searchQuery);

            if (nameMatch || idMatch) return true;

            // If node has children, check recursively if any child matches.
            if (node.objects && node.objects.length > 0) {
                return node.objects.some((child) => nodeMatches(child as ObjectTreeData));
            }

            return false;
        };

        return data.filter(nodeMatches);
    }, [data, searchQuery]);

    return (
        <ul>
            {filteredData.map((node) => (
                <TreeNodeItem
                    key={node.objectid}
                    node={node}
                    searchQuery={searchQuery}
                    level={level}
                    onSelect={onSelect} // Pass onSelect callback to each node item
                    expandAll={expandAll}
                />
            ))}
        </ul>
    );
};

interface TreeNodeItemProps {
    node: ObjectTreeData;
    searchQuery: string;
    level: number;
    onSelect?: (objectId: number) => void;
    expandAll?: boolean;
}

/**
 * TreeNodeItem renders an individual tree node.
 * It handles expanding/collapsing of nodes with children,
 * highlights search query matches in the node name,
 * and calls onSelect when a leaf node is clicked.
 */
const TreeNodeItem: React.FC<TreeNodeItemProps> = ({ node, searchQuery, level, onSelect, expandAll = false }) => {
    // Check if node has children.
    const hasChildren = node.objects && node.objects.length > 0;

    // Initialize the expanded state.
    // Expanded by default at level 1.
    const [expanded, setExpanded] = React.useState<boolean>(level === 1);

    // When expandAll becomes true, expand this node.
    React.useEffect(() => {
        if (expandAll) {
            setExpanded(true);
        }
    }, [expandAll]);

    /**
     * highlightMatch - Highlights the part of the text that matches the search query.
     * If no match is found, returns the original text.
     */
    const highlightMatch = (text: string) => {
        if (!searchQuery) return text;

        const index = text.toLowerCase().indexOf(searchQuery.toLowerCase());
        if (index === -1) return text;

        return (
            <>
                {text.substring(0, index)}
                <span className="bg-yellow-200 dark:bg-yellow-700">{text.substring(index, index + searchQuery.length)}</span>
                {text.substring(index + searchQuery.length)}
            </>
        );
    };

    /**
     * handleClick - Handles click events on the tree node.
     * Toggles expansion for nodes with children.
     * For leaf nodes, it invokes the onSelect callback if provided.
     */
    const handleClick = (e: React.MouseEvent) => {
        try {
            // Toggle expanded state for nodes with children.
            if (hasChildren) {
                setExpanded((prev) => !prev);
            }

            // For leaf nodes, invoke the onSelect callback.
            if (!hasChildren && onSelect) {
                onSelect(node.objectid);
                // Prevent further propagation to avoid triggering parent click handlers.
                e.stopPropagation();
            }
        } catch (error) {
            // Log the error and optionally, you can provide user feedback here.
            console.error("Error handling node click:", error);
        }
    };

    return (
        <li className={hasChildren ? "pl-3" : "pl-4"}>
            <div
                onClick={handleClick}
                className={`flex items-center cursor-${hasChildren ? "pointer" : "default"} hover:bg-gray-100 dark:hover:bg-slate-700 p-1 rounded ${
                    !hasChildren ? "pl-2 ml-4 border-l-2 border-gray-300 dark:border-gray-600 rounded-none" : ""
                }`}
            >
                {/* Render collapse/expand icon for nodes with children */}
                {hasChildren && <span className="mr-1 text-gray-500">{expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}</span>}
                {/* Display node name with highlighted search query if applicable */}
                <span className="text-gray-800 dark:text-gray-200">{highlightMatch(node.name)}</span>
                {/* Display node's object ID */}
                <span className="text-gray-500 dark:text-gray-400 text-sm ml-2">[{node.objectid}]</span>
            </div>
            {/* Recursively render children nodes if the node is expanded */}
            {hasChildren && expanded && (
                <Tree
                    data={node.objects!}
                    searchQuery={searchQuery}
                    level={level + 1}
                    onSelect={onSelect} // Pass the onSelect callback to child nodes
                    expandAll={expandAll}
                />
            )}
        </li>
    );
};

export default Tree;
