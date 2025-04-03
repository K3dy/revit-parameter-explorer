"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserRound } from "lucide-react";
import { Sidebar } from "./components/sidebar";
import { useUser } from "@/lib/client/auth";
import { PropertiesDataCollection } from "@aps_sdk/model-derivative";
import { Spinner } from "@/components/ui/spinner";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import Image from "next/image";
import PropertiesList from "./components/propertiesList";
import Tree from "./components/objectsTree";
import { ObjectTreeData } from "@/types";
import { Label } from "@/components/ui/label";
import { ThemeToggle } from "@/components/ui/theme-toggle";

export default function Home() {
    const { user, loading } = useUser();
    const [isLoading, setLoading] = useState(false);
    const [properties, setProperties] = useState<PropertiesDataCollection[]>([]);
    const [objectTree, setObjectTree] = useState<ObjectTreeData[]>([]);
    const [server, setServer] = useState("US");
    const [error, setError] = useState<string | null>(null);

    const handleLogin = () => {
        window.location.href = "/api/auth/login";
    };

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

    const handleModelViewSelect = async (type: string, viewGuid: string, itemUrn: string) => {
        setLoading(true);
        setError(null);

        const maxAttempts = 150;
        let attempts = 0;

        try {
            while (attempts < maxAttempts) {
                const res = await fetch(`/api/modelDerivate/${itemUrn.replace("/", "%2F")}/views/${viewGuid}/allProperties`);

                if (!res.ok) {
                    throw new Error(`Failed to load model data (${res.status}: ${res.statusText})`);
                }

                const data = await res.json();
                console.log("Attempt", attempts + 1, "data:", data);

                if (!data.isProcessing) {
                    setProperties(data.properties);
                    setObjectTree(data.objectTreeWithProperties);
                    setLoading(false);
                    return;
                }

                await new Promise((resolve) => setTimeout(resolve, 1000));
                attempts++;
            }

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
            <header className="bg-black  p-4">
                <nav className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="flex items-center gap-4 justify-center lg:justify-start">
                        <Image src="/aps-logo.svg" alt="APS Logo" width={180} height={64} className="h-12 w-auto priority" />
                        <h1 className="text-2xl md:text-4xl text-white font-bold">Revit Parameter Explorer</h1>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 justify-center lg:justify-end">
                        <ThemeToggle />

                        <div className="flex items-center">
                            <Label className="text-base md:text-xl px-2">Server:</Label>
                            <Tabs className="bg-white text-black border-2 h-10 rounded-md" defaultValue="US" value={server} onValueChange={setServer}>
                                <TabsList defaultValue="US">
                                    <TabsTrigger
                                        className="hover:bg-blue-300 hover:text-white data-[state=active]:bg-blue-500 data-[state=active]:text-white data-[state=inactive]:text-neutral-800"
                                        value="US"
                                    >
                                        US
                                    </TabsTrigger>
                                    <TabsTrigger
                                        className="hover:bg-blue-300 hover:text-white data-[state=active]:bg-blue-500 data-[state=active]:text-white data-[state=inactive]:text-neutral-800"
                                        value="EMEA"
                                    >
                                        EMEA
                                    </TabsTrigger>
                                    <TabsTrigger
                                        className="hover:bg-blue-300 hover:text-white data-[state=active]:bg-blue-500 data-[state=active]:text-white data-[state=inactive]:text-neutral-800"
                                        value="AUS"
                                    >
                                        AUS
                                    </TabsTrigger>
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

            {loading ? (
                <div className="flex-1 h-full flex justify-center items-center">
                    <Spinner size="large" className="text-black" />
                </div>
            ) : user ? (
                <ResizablePanelGroup direction="horizontal" className="border">
                    <ResizablePanel defaultSize={20}>
                        <div className="h-full">
                            <Sidebar onViewSelected={handleModelViewSelect} />
                        </div>
                    </ResizablePanel>
                    <ResizableHandle withHandle />
                    <ResizablePanel>
                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center h-full gap-4">
                                <Spinner size="large" />
                                <p className="text-gray-600">Revit Model parameters are beeing fetched from ACC. Please wait...</p>
                            </div>
                        ) : error ? (
                            <div className="flex flex-col items-center justify-center h-full gap-4">
                                <div className="max-w-md p-4 text-center">
                                    <h3 className="text-xl font-bold text-red-600 mb-2">Error</h3>
                                    <p className="text-gray-800 mb-4">{error}</p>
                                    <Button onClick={() => setError(null)} variant="outline" className="bg-white">
                                        Dismiss
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 gap-4 h-[calc(100vh-8rem)]">
                                <div className="p-4 overflow-hidden">
                                    <h2 className="text-xl font-bold mb-4">Tree</h2>
                                    <div className="h-[calc(100%-2rem)] overflow-y-auto">
                                        <Tree data={objectTree} />
                                    </div>
                                </div>
                                <div className="p-4 overflow-hidden">
                                    <h2 className="text-xl font-bold mb-4">Properties</h2>
                                    <div className="h-[calc(100%-2rem)] overflow-y-auto">
                                        <PropertiesList data={properties} />
                                    </div>
                                </div>
                            </div>
                        )}
                    </ResizablePanel>
                </ResizablePanelGroup>
            ) : (
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
