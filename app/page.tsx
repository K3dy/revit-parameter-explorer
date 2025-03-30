'use client';

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { UserRound, Loader2 } from "lucide-react";
import { Sidebar } from "./components/sidebar";
import { Viewer } from "./components/viewer";
import { useUser } from "@/lib/client/auth";
import Image from "next/image";
import { ResizableSidebar } from "./components/resizable-sidebar";

export default function Home() {
    const { user, loading } = useUser();
    const [selectedVersion, setSelectedVersion] = useState<string | null>(null);

    const handleLogin = () => {
        window.location.href = "/api/auth/login";
    };

    const handleLogout = () => {
        // Create an iframe to log out from Autodesk accounts
        const iframe = document.createElement("iframe");
        iframe.style.display = "none";
        iframe.src = "https://accounts.autodesk.com/Authentication/LogOut";
        document.body.appendChild(iframe);

        iframe.onload = () => {
            window.location.href = "/api/auth/logout";
            document.body.removeChild(iframe);
        };
    };

    const handleVersionSelect = (versionId: string) => {
        setSelectedVersion(versionId);
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            </div>
        );
    }

    return (
        <div className="flex flex-col h-screen overflow-hidden">
            <header className="h-16 flex items-center justify-between px-4 bg-white border-b shadow-sm flex-shrink-0">
                <div className="flex items-center">
                    <Image src="/aps-logo.svg" alt="Autodesk Platform Services" width={40} height={40} className="h-10 w-auto" />
                    <h1 className="ml-4 text-xl font-bold">Construction Cloud Browser</h1>
                </div>

                <Button variant={user ? "outline" : "default"} onClick={user ? handleLogout : handleLogin} className="flex items-center gap-2">
                    <UserRound className="h-4 w-4" />
                    {user ? `Logout (${user.name})` : "Login"}
                </Button>
            </header>

            {user ? (
                <div className="flex flex-1 overflow-hidden">
                    {/* Pass a className to ensure proper styling with the resize handle */}
                    <ResizableSidebar 
                        initialWidth={300} 
                        minWidth={200} 
                        maxWidth={600}
                        className="h-full bg-white border-r"
                    >
                        <Sidebar onVersionSelected={handleVersionSelect} />
                    </ResizableSidebar>
                    
                    <div className="flex-1 overflow-hidden p-4">
                        <Viewer versionId={selectedVersion} />
                    </div>
                </div>
            ) : (
                <div className="flex-1 flex flex-col justify-center items-center">
                    <h2 className="text-2xl font-bold mb-4">Welcome to Construction Cloud Browser</h2>
                    <p className="text-gray-600 mb-6 text-center max-w-md">
                        Please log in with your Autodesk account to browse your Construction Cloud projects and view models.
                    </p>
                    <Button onClick={handleLogin} size="lg">
                        Login with Autodesk
                    </Button>
                </div>
            )}
        </div>
    );
}