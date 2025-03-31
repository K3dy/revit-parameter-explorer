'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, AlertTriangle } from 'lucide-react';
import Script from 'next/script';

// Declare Autodesk Viewer types
interface ViewerInitOptions {
  env: string;
  getAccessToken: (callback: (accessToken: string, expiresInSeconds: number) => void) => void;
}

interface ViewerNode {
  getDefaultGeometry: () => ViewerGeometry;
}

interface ViewerGeometry {
  [key: string]: unknown;
}

interface ViewerDocument {
  getRoot: () => ViewerNode;
}

interface Viewer3D {
  start: () => boolean;
  finish: () => void;
  setTheme: (theme: string) => void;
  loadDocumentNode: (doc: ViewerDocument, geometryItem: ViewerGeometry) => void;
}

interface ViewerProps {
  versionId: string | null;
}

export function Viewer({ versionId }: ViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<Viewer3D | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [scriptsReady, setScriptsReady] = useState<boolean>(false);

  // Get access token
  const getAccessToken = useCallback(async (callback: (token: string, expiresIn: number) => void) => {
    try {
      const resp = await fetch('/api/auth/token');
      if (!resp.ok) throw new Error(await resp.text());
      
      const { access_token, expires_in } = await resp.json();
      callback(access_token, expires_in);
    } catch (err) {
      console.error('Could not obtain access token:', err);
      setError('Failed to authenticate with Autodesk Platform Services');
    }
  }, []);

  // Initialize viewer
  const initViewer = useCallback(() => {
    if (!containerRef.current || !window.Autodesk?.Viewing) return;

    window.Autodesk.Viewing.Initializer({ 
      env: 'AutodeskProduction', 
      getAccessToken 
    }, () => {
      try {
        if (!containerRef.current) return;
        
        const config = {
          extensions: ['Autodesk.DocumentBrowser']
        };
        
        viewerRef.current = new window.Autodesk.Viewing.GuiViewer3D(containerRef.current, config);
        viewerRef.current.start();
        viewerRef.current.setTheme('light-theme');
      } catch (err) {
        console.error('Failed to initialize viewer:', err);
        setError('Failed to initialize the viewer');
      }
    });
  }, [getAccessToken]);

  // Handle script loading
  const handleScriptsLoaded = useCallback(() => {
    setScriptsReady(true);
    initViewer();
  }, [initViewer]);

  // Load the model when versionId changes
  useEffect(() => {
    if (!versionId || !viewerRef.current || !window.Autodesk?.Viewing) return;

    setLoading(true);
    setError(null);

    // Convert the versionId to a base64 URN
    const urn = window.btoa(versionId).replace(/=/g, '');

    const onDocumentLoadSuccess = (doc: ViewerDocument) => {
      viewerRef.current?.loadDocumentNode(doc, doc.getRoot().getDefaultGeometry());
      setLoading(false);
    };
    
    const onDocumentLoadFailure = (code: number, message: string) => {
      console.error('Could not load model:', message);
      setError(`Failed to load the model: ${message}`);
      setLoading(false);
    };
    
    window.Autodesk.Viewing.Document.load('urn:' + urn, onDocumentLoadSuccess, onDocumentLoadFailure);
  }, [versionId, scriptsReady]);

  // Cleanup viewer on unmount
  useEffect(() => {
    return () => {
      if (viewerRef.current) {
        viewerRef.current.finish();
        viewerRef.current = null;
      }
    };
  }, []);

  return (
    <Card className="h-full">
      <CardContent className="p-0 h-full relative">
        {/* Script loading */}
        <Script 
          id="autodesk-viewer-style"
          src="https://developer.api.autodesk.com/modelderivative/v2/viewers/7.*/style.css"
          strategy="beforeInteractive"
        />
        <Script 
          id="autodesk-viewer-script"
          src="https://developer.api.autodesk.com/modelderivative/v2/viewers/7.*/viewer3D.js"
          strategy="lazyOnload"
          onLoad={handleScriptsLoaded}
        />
        
        {/* Loading state */}
        {loading && (
          <div className="absolute inset-0 bg-white bg-opacity-70 flex justify-center items-center z-10">
            <div className="flex flex-col items-center">
              <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
              <p className="mt-2 text-gray-700">Loading model...</p>
            </div>
          </div>
        )}
        
        {/* Error state */}
        {error && (
          <div className="absolute inset-0 bg-white bg-opacity-70 flex justify-center items-center z-10">
            <div className="flex flex-col items-center text-center p-4 max-w-md">
              <AlertTriangle className="h-12 w-12 text-red-500 mb-2" />
              <p className="text-red-500 font-medium">{error}</p>
              <p className="mt-2 text-gray-600">Please check your connection and try again.</p>
            </div>
          </div>
        )}
        
        {/* Empty state */}
        {!versionId && (
          <div className="h-full flex justify-center items-center">
            <p className="text-gray-500">Select a model from the sidebar to view</p>
          </div>
        )}
        
        {/* Viewer container */}
        <div ref={containerRef} className="h-full w-full" />
      </CardContent>
    </Card>
  );
}

// Add typings to global Window interface
declare global {
  interface Window {
    Autodesk: {
      Viewing: {
        Initializer: (options: ViewerInitOptions, onSuccess: () => void) => void;
        Document: {
          load: (
            documentId: string, 
            onSuccess: (doc: ViewerDocument) => void, 
            onError: (errorCode: number, errorMessage: string) => void
          ) => void;
        };
        GuiViewer3D: new (container: HTMLElement, config?: unknown) => Viewer3D;
      };
    };
  }
}