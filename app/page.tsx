"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { UserRound, Loader2 } from "lucide-react";
import { Sidebar } from "./components/sidebar";
// import { Viewer } from "./components/viewer";
import { useUser } from "@/lib/client/auth";
import Image from "next/image";
import { PropertiesDataCollection } from "@aps_sdk/model-derivative";
import PropertiesList from "./components/propertiesList";

export default function Home() {
    const { user, loading } = useUser();
    const [sidebarWidth, setSidebarWidth] = useState(300);
    const [properties, setProperties] = useState<PropertiesDataCollection[]>([]);
    const [isResizing, setIsResizing] = useState(false);
    const sidebarRef = useRef<HTMLDivElement>(null);
    const startXRef = useRef(0);
    const startWidthRef = useRef(0);

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
        const res = await fetch(`/api/modelDerivate/${itemUrn.replace("/", "%2F")}/views/${viewGuid}/allProperties`);
        if (!res.ok) throw new Error("Failed to fetch contents");
        setProperties(await res.json());
    };

    // Start resizing
    const handleMouseDown = (e: React.MouseEvent) => {
        e.preventDefault();
        setIsResizing(true);
        startXRef.current = e.clientX;
        startWidthRef.current = sidebarWidth;
        document.body.classList.add("resizing");
    };

    // Handle resize and cleanup
    useEffect(() => {
        if (typeof window === "undefined") return;

        const handleMouseMove = (e: MouseEvent) => {
            if (!isResizing) return;

            const delta = e.clientX - startXRef.current;
            const newWidth = Math.max(200, Math.min(600, startWidthRef.current + delta));
            setSidebarWidth(newWidth);
        };

        const handleMouseUp = () => {
            if (isResizing) {
                setIsResizing(false);
                document.body.classList.remove("resizing");

                try {
                    localStorage.setItem("sidebar-width", sidebarWidth.toString());
                } catch (e) {
                    console.error("Failed to save sidebar width", e);
                }
            }
        };

        document.addEventListener("mousemove", handleMouseMove);
        document.addEventListener("mouseup", handleMouseUp);

        return () => {
            document.removeEventListener("mousemove", handleMouseMove);
            document.removeEventListener("mouseup", handleMouseUp);
            document.body.classList.remove("resizing");
        };
    }, [isResizing, sidebarWidth]);

    // Load saved width
    useEffect(() => {
        if (typeof window === "undefined") return;

        try {
            const savedWidth = localStorage.getItem("sidebar-width");
            if (savedWidth) {
                const width = parseInt(savedWidth);
                if (!isNaN(width) && width >= 200 && width <= 600) {
                    setSidebarWidth(width);
                }
            }
        } catch (e) {
            console.error("Failed to load sidebar width", e);
        }
    }, []);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            </div>
        );
    }

    return (
        <div className="flex flex-col h-screen overflow-hidden">
            {/* Header */}
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
                    {/* Sidebar with resizing */}
                    <div ref={sidebarRef} className="h-full bg-white border-r relative" style={{ width: `${sidebarWidth}px`, flexShrink: 0 }}>
                        <Sidebar onViewSelected={handleViewSelect} />

                        {/* Resize handle */}
                        <div
                            className="absolute top-0 right-0 w-3 h-full cursor-col-resize z-50"
                            style={{
                                position: "absolute",
                                top: 0,
                                right: "-2px",
                                width: "10px",
                                height: "100%",
                                cursor: "col-resize",
                                zIndex: 50,
                            }}
                            onMouseDown={handleMouseDown}
                        >
                            <div
                                style={{
                                    position: "absolute",
                                    top: 0,
                                    left: "50%",
                                    transform: "translateX(-50%)",
                                    width: "4px",
                                    height: "100%",
                                    backgroundColor: isResizing ? "#3b82f6" : "#e5e7eb",
                                    transition: "background-color 0.2s",
                                }}
                            />
                        </div>
                    </div>

                    {/* Main content / Viewer */}
                    <div className="flex-1 overflow-hidden p-4">
                        <div className="p-4">
                            <h2 className="text-xl font-bold mb-4">Properties</h2>
                            <PropertiesList data={properties.slice(0, 100)} />
                        </div>
                    </div>
                </div>
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
