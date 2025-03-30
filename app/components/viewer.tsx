'use client';

import { useEffect, useRef, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

// Declare global types for the Autodesk Viewer
declare global {
  interface Window {
    Autodesk: AutodeskNamespace;
  }
}

// Type definitions for Autodesk Viewer API
interface AutodeskNamespace {
  Viewing: ViewingNamespace;
}

interface ViewingNamespace {
  Initializer: (options: ViewerInitOptions, onSuccess: () => void) => void;
  Document: DocumentNamespace;
  GuiViewer3D: new (container: HTMLElement, config?: ViewerConfig) => Viewer3D;
}

interface ViewerInitOptions {
  env: string;
  getAccessToken: (callback: (accessToken: string, expiresInSeconds: number) => void) => void;
}

interface DocumentNamespace {
  load: (
    documentId: string, 
    onSuccess: (doc: ViewerDocument) => void, 
    onError: (errorCode: number, errorMessage: string) => void
  ) => void;
}

interface ViewerDocument {
  getRoot: () => ViewerNode;
}

interface ViewerNode {
  getDefaultGeometry: () => ViewerGeometry;
}

interface ViewerGeometry {
  [key: string]: unknown;
}

interface ViewerConfig {
  extensions?: string[];
  [key: string]: unknown;
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
  const [scriptsLoaded, setScriptsLoaded] = useState<boolean>(false);

  // Load the Autodesk Viewer scripts
  useEffect(() => {
    if (document.getElementById('autodesk-viewer-script')) {
      setScriptsLoaded(true);
      return;
    }

    const loadScripts = async () => {
      // Load the stylesheet
      const link = document.createElement('link');
      link.id = 'autodesk-viewer-style';
      link.rel = 'stylesheet';
      link.href = 'https://developer.api.autodesk.com/modelderivative/v2/viewers/7.*/style.css';
      document.head.appendChild(link);

      // Load the script
      const script = document.createElement('script');
      script.id = 'autodesk-viewer-script';
      script.src = 'https://developer.api.autodesk.com/modelderivative/v2/viewers/7.*/viewer3D.js';
      script.onload = () => setScriptsLoaded(true);
      document.body.appendChild(script);
    };

    loadScripts();
    
    return () => {
      // Clean up the scripts if component unmounts
      const script = document.getElementById('autodesk-viewer-script');
      const style = document.getElementById('autodesk-viewer-style');
      
      if (script) document.body.removeChild(script);
      if (style) document.head.removeChild(style);
    };
  }, []);

  // Initialize the viewer once scripts are loaded
  useEffect(() => {
    if (!scriptsLoaded || viewerRef.current || !containerRef.current) return;

    const getAccessToken = async (callback: (token: string, expiresIn: number) => void) => {
      try {
        const resp = await fetch('/api/auth/token');
        if (!resp.ok) throw new Error(await resp.text());
        
        const { access_token, expires_in } = await resp.json();
        callback(access_token, expires_in);
      } catch (err) {
        console.error('Could not obtain access token:', err);
        setError('Failed to authenticate with Autodesk Platform Services');
      }
    };

    const initViewer = () => {
      window.Autodesk.Viewing.Initializer({ env: 'AutodeskProduction', getAccessToken }, () => {
        const config = {
          extensions: ['Autodesk.DocumentBrowser']
        };
        
        try {
          if (!containerRef.current) throw new Error('Container reference is null');
          if (viewerRef.current) {
            viewerRef.current = new window.Autodesk.Viewing.GuiViewer3D(containerRef.current, config);
            viewerRef.current.start();
            viewerRef.current.setTheme('light-theme');
          } 
        } catch (err) {
          console.error('Failed to initialize viewer:', err);
          setError('Failed to initialize the viewer');
        }
      });
    };

    initViewer();

    return () => {
      if (viewerRef.current) {
        viewerRef.current.finish();
        viewerRef.current = null;
      }
    };
  }, [scriptsLoaded]);

  // Load the model when the versionId changes
  useEffect(() => {
    if (!versionId || !viewerRef.current || !scriptsLoaded) return;

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
      setError('Failed to load the model. Please try again.');
      setLoading(false);
    };
    
    window.Autodesk.Viewing.Document.load('urn:' + urn, onDocumentLoadSuccess, onDocumentLoadFailure);
  }, [versionId, scriptsLoaded]);

  return (
    <Card className="h-full">
      <CardContent className="p-0 h-full relative">
        {loading && (
          <div className="absolute inset-0 bg-white bg-opacity-70 flex justify-center items-center z-10">
            <div className="flex flex-col items-center">
              <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
              <p className="mt-2 text-gray-700">Loading model...</p>
            </div>
          </div>
        )}
        
        {error && (
          <div className="absolute inset-0 bg-white bg-opacity-70 flex justify-center items-center z-10">
            <div className="flex flex-col items-center text-center p-4">
              <p className="text-red-500 font-medium">{error}</p>
              <p className="mt-2 text-gray-600">Please check your connection and try again.</p>
            </div>
          </div>
        )}
        
        {!versionId && (
          <div className="h-full flex justify-center items-center">
            <p className="text-gray-500">Select a model from the sidebar to view</p>
          </div>
        )}
        
        <div ref={containerRef} className="h-full w-full" />
      </CardContent>
    </Card>
  );
}