"use client";

import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, UserRound } from "lucide-react";
import { Sidebar } from "./components/sidebar";
import { useUser } from "@/lib/client/auth";
import { PropertiesDataCollection } from "@aps_sdk/model-derivative";
import { Spinner } from "@/components/ui/spinner";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import Image from "next/image";
import Tree from "./components/objectsTree";
import { ObjectTreeData } from "@/types";
import { Label } from "@/components/ui/label";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import PropertiesListContent from "./components/propertiesListContent";
import PropertySidebar from "./components/propertySidebar";
import { Viewer } from "./components/modelViewer";

export default function Home() {
    // Get the current user and loading status from authentication hook
    const { user, loading } = useUser();

    // Local component states for loading, selected model version, properties, etc.
    const [isLoading, setLoading] = useState(false);
    const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null);
    const [properties, setProperties] = useState<PropertiesDataCollection[]>([]);
    const [objectTree, setObjectTree] = useState<ObjectTreeData[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [sortKey, setSortKey] = useState<"name" | "objectid">("name");
    const [selectedObject, setSelectedObject] = useState<PropertiesDataCollection | null>(null);
    const [showSidebar, setShowSidebar] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [expandAll, setExpandAll] = useState(false);

    // Initialize region and viewType with default values.
    const [region, setRegion] = useState<string>("US");
    const [viewType, setViewType] = useState<string>("tree");

    // When the component mounts, update the region and viewType from localStorage (client-only).
    useEffect(() => {
        if (typeof window !== "undefined") {
            const storedRegion = localStorage.getItem("preferredRegion");
            if (storedRegion) {
                setRegion(storedRegion);
            }
            const storedView = localStorage.getItem("preferredViewType");
            if (storedView) {
                setViewType(storedView);
            }
        }
    }, []);

    /**
     * filteredSortedData - Filters and sorts the properties based on the search query and sort key.
     */
    const filteredSortedData = useMemo(() => {
        // Filter properties matching by name or object ID
        const filtered = properties.filter((item) => item.name.toLowerCase().includes(searchQuery.toLowerCase()) || item.objectid.toString().includes(searchQuery));

        // Sort the filtered data by name or numeric objectid
        return [...filtered].sort((a, b) => {
            if (sortKey === "name") {
                return a.name.localeCompare(b.name);
            } else {
                return a.objectid - b.objectid;
            }
        });
    }, [properties, searchQuery, sortKey]);

    /**
     * handleLogin - Redirects the user to the login endpoint.
     */
    const handleLogin = () => {
        window.location.href = "/api/auth/login";
    };

    /**
     * handleObjectSelect - Selects an object from the properties list/tree by its objectId.
     * Opens the property sidebar on selection.
     */
    const handleObjectSelect = (objectId: number) => {
        const object = properties.find((item) => item.objectid === objectId);
        if (object) {
            setSelectedObject(object);
            setShowSidebar(true);
        }
    };

    /**
     * handleLogout - Logs the user out by first hitting Autodesk logout endpoint using an iframe,
     * then redirects to our logout endpoint.
     */
    const handleLogout = () => {
        const iframe = document.createElement("iframe");
        iframe.style.display = "none";
        iframe.src = "https://accounts.autodesk.com/Authentication/LogOut";
        document.body.appendChild(iframe);

        iframe.onload = () => {
            window.location.href = "/api/auth/logout";
            document.body.removeChild(iframe);
        };
    };

    /**
     * handleServerChange - Updates the region state and persists the preference in localStorage.
     */
    const handleServerChange = (value: string) => {
        setRegion(value);
        if (typeof window !== "undefined") {
            localStorage.setItem("preferredRegion", value);
        }
    };

    /**
     * handleViewChange - Updates the view type state and persists the preference in localStorage.
     */
    const handleViewChange = (value: string) => {
        setViewType(value);
        if (typeof window !== "undefined") {
            localStorage.setItem("preferredViewType", value);
        }
    };

    /**
     * handleModelViewSelect - Handles the selection of a model view.
     * It repeatedly polls the API until the model data is ready or times out.
     */
    const handleModelViewSelect = async (type: string, viewGuid: string, itemUrn: string) => {
        setLoading(true);
        setError(null);
        // Replace "/" with its URL-encoded equivalent in the item URN.
        const encodedUrn = itemUrn.replace("/", "%2F");
        setSelectedVersionId(encodedUrn);

        const maxAttempts = 150;
        let attempts = 0;

        try {
            while (attempts < maxAttempts) {
                const res = await fetch(`/api/modelDerivate/${region}/${encodedUrn}/views/${viewGuid}/allProperties`);

                if (!res.ok) {
                    throw new Error(`Failed to load model data (${res.status}: ${res.statusText})`);
                }

                const data = await res.json();

                // If model processing is complete, update the properties and object tree.
                if (!data.isProcessing) {
                    setProperties(data.properties);
                    setObjectTree(data.objectTreeWithProperties);
                    setLoading(false);
                    return;
                }

                // Wait for 1 second before next attempt.
                await new Promise((resolve) => setTimeout(resolve, 1000));
                attempts++;
            }

            // If the loop completes without success, throw a timeout error.
            throw new Error("Timeout: Model data is taking too long to load. Please try again later.");
        } catch (error) {
            console.error("Error fetching view properties:", error);
            setError(error instanceof Error ? error.message : "An unexpected error occurred");
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-screen">
            {/* Header */}
            <header className="bg-black p-4">
                <nav className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="flex items-center gap-4 justify-center lg:justify-start">
                        <Image src="/aps-logo.svg" alt="APS Logo" width={180} height={64} className="h-12 w-auto priority" />
                        <h1 className="text-2xl md:text-4xl text-white font-bold">Revit Parameter Explorer</h1>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 justify-center lg:justify-end">
                        <ThemeToggle />
                        <div className="flex items-center">
                            <Label className="text-white md:text-lg px-2">Region:</Label>
                            <Tabs className="bg-white text-black border-2 h-10 rounded-md" defaultValue="US" value={region} onValueChange={handleServerChange}>
                                <TabsList defaultValue="US">
                                    <TabsTrigger value="US">US</TabsTrigger>
                                    <TabsTrigger value="EMEA">EMEA</TabsTrigger>
                                    <TabsTrigger value="AUS">AUS</TabsTrigger>
                                </TabsList>
                            </Tabs>
                        </div>

                        {loading ? (
                            <div className="flex items-center">
                                <Spinner size="small" />
                            </div>
                        ) : (
                            <Button variant={user ? "outline" : "default"} onClick={user ? handleLogout : handleLogin} className="flex border-2 h-10 whitespace-nowrap items-center">
                                <UserRound />
                                {user ? (
                                    <div className="flex items-center gap-1">
                                        <strong className="md:text-xl">Logout</strong>
                                        <span className="hidden sm:inline">({user.name})</span>
                                    </div>
                                ) : (
                                    <strong className="md:text-xl">Login</strong>
                                )}
                            </Button>
                        )}
                    </div>
                </nav>
            </header>

            {/* Main Content */}
            {loading ? (
                <div className="flex-1 h-full flex justify-center items-center">
                    <Spinner size="large" className="text-black" />
                </div>
            ) : user ? (
                <ResizablePanelGroup direction="horizontal" className="border rounded-lg">
                    {/* Sidebar Panel */}
                    <ResizablePanel defaultSize={15} minSize={5}>
                        <div className="h-full">
                            <Sidebar region={region} onViewSelected={handleModelViewSelect} />
                        </div>
                    </ResizablePanel>
                    <ResizableHandle withHandle />
                    {/* Main Content Panel */}
                    <ResizablePanel>
                        <div className="h-full flex flex-col">
                            <div className="flex items-center justify-between">
                                {/* Tabs aligned left */}
                                <Tabs className="text-black p-4 h-16 rounded-md w-1/2" value={viewType} onValueChange={handleViewChange}>
                                    <TabsList className="w-full" defaultValue="tree">
                                        <TabsTrigger className="text-center" value="tree">
                                            Tree View
                                        </TabsTrigger>
                                        <TabsTrigger className="text-center" value="list">
                                            List View
                                        </TabsTrigger>
                                        {/* Uncomment below if model viewer is needed */}
                                        {/* <TabsTrigger className="text-center" value="model">
        Model Viewer
      </TabsTrigger> */}
                                    </TabsList>
                                </Tabs>

                                {/* Button aligned right */}
                            </div>
                            {/* Content area */}
                            {isLoading ? (
                                <div className="flex-1 flex flex-col items-center justify-center gap-4">
                                    <Spinner size="large" />
                                    <p className="text-gray-600 dark:text-gray-300">Revit Model parameters are being fetched from ACC. Please wait...</p>
                                </div>
                            ) : error ? (
                                <div className="flex-1 flex flex-col items-center justify-center gap-4">
                                    <div className="max-w-md p-4 text-center">
                                        <h3 className="text-xl font-bold text-red-600 mb-2">Error</h3>
                                        <p className="text-gray-800 dark:text-gray-200 mb-4">{error}</p>
                                        <Button onClick={() => setError(null)} variant="outline" className="bg-white dark:bg-slate-700 dark:text-white">
                                            Dismiss
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <div className="p-4 space-y-4 flex-1 flex flex-col">
                                    {/* Search bar and sort options for Tree and List views */}
                                    {viewType !== "model" ? (
                                        <div className="flex flex-col sm:flex-row gap-4">
                                            {viewType === "tree" && (
                                                <Button onClick={() => setExpandAll(true)} className="px-4 mr-2 h-10 text-muted">
                                                    Expand All
                                                </Button>
                                            )}
                                            <div className="relative flex-grow">
                                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                    <Search className="h-5 w-5 text-gray-400" />
                                                </div>
                                                <input
                                                    type="text"
                                                    placeholder="Search by name or ID..."
                                                    value={searchQuery}
                                                    onChange={(e) => setSearchQuery(e.target.value)}
                                                    className="pl-10 pr-3 py-2 border rounded w-full dark:bg-slate-800 dark:text-white dark:border-slate-600"
                                                />
                                            </div>
                                            {viewType === "list" && (
                                                <select
                                                    value={sortKey}
                                                    onChange={(e) => setSortKey(e.target.value as "name" | "objectid")}
                                                    className="px-3 py-2 border rounded w-full sm:w-64 dark:bg-slate-800 dark:text-white dark:border-slate-600"
                                                >
                                                    <option value="name">Sort by Name (A–Z)</option>
                                                    <option value="objectid">Sort by ID (ascending)</option>
                                                </select>
                                            )}
                                            
                                        </div>
                                    ) : null}

                                    {/* Main view area rendering Tree, List or Model Viewer */}
                                    <div className="flex-1 overflow-y-auto border rounded dark:border-slate-700">
                                        {viewType === "tree" ? (
                                            <Tree data={objectTree} searchQuery={searchQuery} onSelect={handleObjectSelect} expandAll={expandAll} />
                                        ) : viewType === "list" ? (
                                            <PropertiesListContent data={filteredSortedData} onSelect={handleObjectSelect} />
                                        ) : viewType === "model" ? (
                                            <div className="h-full">
                                                <Viewer versionId={selectedVersionId} />
                                            </div>
                                        ) : null}
                                    </div>
                                </div>
                            )}
                        </div>
                    </ResizablePanel>

                    {/* Sidebar for property details; hidden in model view */}
                    {showSidebar && viewType !== "model" && (
                        <>
                            <ResizableHandle withHandle />
                            <ResizablePanel defaultSize={25} minSize={20}>
                                <PropertySidebar object={selectedObject} onClose={() => setShowSidebar(false)} />
                            </ResizablePanel>
                        </>
                    )}
                </ResizablePanelGroup>
            ) : (
                // If user is not authenticated, show a welcome and login prompt
                <div className="flex-1 h-full flex">
                    <div className="w-full h-1/2 flex flex-col justify-center items-center">
                        <h2 className="text-4xl font-bold mb-4 text-center">Welcome to Revit Parameter Explorer</h2>
                        <p className="text-gray-600 mb-6 text-center max-w-md">Please log in with your Autodesk account to browse your Construction Cloud projects and view models.</p>
                        <Button onClick={handleLogin} size="lg" className="bg-blue-500 text-white hover:bg-blue-600">
                            Login with Autodesk
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
