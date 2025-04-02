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

import PropertiesList from "./components/propertiesList";
import Tree from "./components/objectsTree";
import { ObjectTreeData } from "@/types";
import { Label } from "@/components/ui/label";

export default function Home() {
    const { user, loading } = useUser();
    const [isLoading, setLoading] = useState(false);
    const [properties, setProperties] = useState<PropertiesDataCollection[]>([]);
    const [objectTree, setObjectTree] = useState<ObjectTreeData[]>([]);

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

    const handleViewSelect = async (type: string, viewGuid: string, itemUrn: string) => {
        setLoading(true);
        let data = { isLoading: true, allProperties: [], objectTreeWithProperties: [] };
        while (data.isLoading) {
            const res = await fetch(`/api/modelDerivate/${itemUrn.replace("/", "%2F")}/views/${viewGuid}/allProperties`);
            if (!res.ok) throw new Error("Failed to fetch contents");
            data = await res.json();
            if (data.isLoading) {
                await new Promise((resolve) => setTimeout(resolve, 1000));
            }
        }
        setLoading(false);
        setProperties(data.allProperties);
        setObjectTree(data.objectTreeWithProperties);
    };

    if (loading) {
        return (
            <div className="flex items-center">
                <Spinner size="large" />
            </div>
        );
    }

    return (
        <div className="flex flex-col h-screen">
            {/* Header */}
            <header className="bg-blue-600 text-white p-4 shadow">
                <nav className="container mx-auto flex justify-between items-center">
                    <h1 className="text-xl font-bold">SKANSKA</h1>
                    <div className="flex items-center gap-8">
                        <div className="flex items-center space-x-4">
                            <Label className="text-sm text-gray-700">Server:</Label>
                            <Tabs defaultValue="US">
                                <TabsList>
                                    <TabsTrigger value="US">US</TabsTrigger>
                                    <TabsTrigger value="EMEA">EMEA</TabsTrigger>
                                </TabsList>
                            </Tabs>
                        </div>
                        <Button variant={user ? "outline" : "default"} onClick={user ? handleLogout : handleLogin} className="flex items-center gap-2">
                            <UserRound />
                            {user ? `Logout (${user.name})` : "Login"}
                        </Button>
                    </div>
                </nav>
            </header>

            {user ? (
                <ResizablePanelGroup direction="horizontal" className="max-w-md rounded-lg border">
                    <ResizablePanel defaultSize={20}>
                        <div className="h-full bg-white relative">
                            <Sidebar onViewSelected={handleViewSelect} />
                        </div>
                    </ResizablePanel>
                    <ResizableHandle withHandle />
                    <ResizablePanel defaultSize={80}>
                        <div className="flex-1 p-4">
                            {isLoading ? (
                                <div className="flex items-center">
                                    <Spinner size="large" />
                                </div>
                            ) : (
                                <div className="columns-3 gap-4">
                                    <div className="p-4">
                                        <h2 className="text-xl font-bold mb-4">Tree</h2>
                                        <Tree data={objectTree.slice(0, 100)} />
                                    </div>
                                    <div className="p-4">
                                        <h2 className="text-xl font-bold mb-4">Properties</h2>
                                        <PropertiesList data={properties.slice(0, 100)} />
                                    </div>
                                </div>
                            )}
                        </div>
                    </ResizablePanel>
                </ResizablePanelGroup>
            ) : (
                <div className="flex-1 flex flex-col justify-center items-center">
                    <h2 className="text-2xl font-bold mb-4">Welcome to Construction Cloud Browser</h2>
                    <p className="text-gray-600 mb-6 text-center max-w-md">Please log in with your Autodesk account to browse your Construction Cloud projects and view models.</p>
                    <Button onClick={handleLogin} size="lg">
                        Login with Autodesk
                    </Button>
                </div>
            )}
        </div>
    );
}
