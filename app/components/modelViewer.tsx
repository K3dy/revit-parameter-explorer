'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, AlertTriangle } from 'lucide-react';
import Script from 'next/script';

// =====================
// Autodesk Viewer Types
// =====================

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

// =====================
// Viewer Component
// =====================

export function Viewer({ versionId }: ViewerProps) {
  // References to the container element and the Autodesk Viewer instance
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<Viewer3D | null>(null);

  // Component state to handle loading, error messages, and script readiness
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [scriptsReady, setScriptsReady] = useState<boolean>(false);

  // =====================
  // Function: getAccessToken
  // =====================
  // Fetches an access token from the API and invokes the callback provided by Autodesk.
  // If the request fails, logs the error and sets an error state.
  const getAccessToken = useCallback(async (callback: (token: string, expiresIn: number) => void) => {
    try {
      const resp = await fetch('/api/auth/token');
      if (!resp.ok) {
        // Throw error with response text if fetch fails
        throw new Error(await resp.text());
      }
      const { access_token, expires_in } = await resp.json();
      callback(access_token, expires_in);
    } catch (err) {
      console.error('Could not obtain access token:', err);
      setError('Failed to authenticate with Autodesk Platform Services');
    }
  }, []);

  // =====================
  // Function: initViewer
  // =====================
  // Initializes the Autodesk Viewer by setting up the environment and viewer configuration.
  // Wrapped in a try-catch block to handle any errors during initialization.
  const initViewer = useCallback(() => {
    if (!containerRef.current || !window.Autodesk?.Viewing) return;

    // Initialize Autodesk Viewing environment
    window.Autodesk.Viewing.Initializer(
      {
        env: 'AutodeskProduction',
        getAccessToken
      },
      () => {
        try {
          // Double-check that the container still exists
          if (!containerRef.current) return;

          // Viewer configuration including desired extensions
          const config = {
            extensions: ['Autodesk.DocumentBrowser']
          };

          // Instantiate the viewer and start it
          viewerRef.current = new window.Autodesk.Viewing.GuiViewer3D(containerRef.current, config);
          if (!viewerRef.current.start()) {
            throw new Error('Viewer failed to start');
          }
          viewerRef.current.setTheme('light-theme');
        } catch (err) {
          console.error('Failed to initialize viewer:', err);
          setError('Failed to initialize the viewer');
        }
      }
    );
  }, [getAccessToken]);

  // =====================
  // Function: handleScriptsLoaded
  // =====================
  // Callback invoked when the external Autodesk Viewer script has loaded successfully.
  // Sets the scriptsReady state to true and initializes the viewer.
  const handleScriptsLoaded = useCallback(() => {
    setScriptsReady(true);
    initViewer();
  }, [initViewer]);

  // =====================
  // Function: handleScriptError
  // =====================
  // Callback invoked if there is an error loading the Autodesk Viewer script.
  // Logs the error and updates the error state to inform the user.
  const handleScriptError = useCallback((e: ErrorEvent) => {
    console.error('Failed to load Autodesk Viewer script:', e);
    setError('Failed to load Autodesk Viewer script. Please refresh the page and try again.');
  }, []);

  // =====================
  // Effect: Load Model on versionId change
  // =====================
  // Whenever the versionId or script readiness changes, attempt to load the model.
  // Converts the versionId into a proper base64 URN and handles success and failure callbacks.
  useEffect(() => {
    if (!versionId || !viewerRef.current || !window.Autodesk?.Viewing) return;

    setLoading(true);
    setError(null);

    // Replace URL-encoded forward slashes for compatibility if needed.
    const formattedVersionId = versionId.replace(/%2F/g, '_');

    // Convert the formatted versionId to a base64 URN and remove any trailing '=' characters.
    const urn = window.btoa(formattedVersionId).replace(/=/g, '');

    // Callback when the document is loaded successfully
    const onDocumentLoadSuccess = (doc: ViewerDocument) => {
      try {
        // Load the default geometry of the document into the viewer
        viewerRef.current?.loadDocumentNode(doc, doc.getRoot().getDefaultGeometry());
      } catch (loadError) {
        console.error('Error loading document node:', loadError);
        setError('Failed to load document geometry.');
      } finally {
        setLoading(false);
      }
    };

    // Callback if there is a failure in loading the document
    const onDocumentLoadFailure = (code: number, message: string) => {
      console.error('Could not load model:', message);
      setError(`Failed to load the model: ${message}`);
      setLoading(false);
    };

    // Start loading the document using Autodesk's API
    window.Autodesk.Viewing.Document.load('urn:' + urn, onDocumentLoadSuccess, onDocumentLoadFailure);
  }, [versionId, scriptsReady]);

  // =====================
  // Effect: Cleanup on Component Unmount
  // =====================
  // Ensures that the viewer is properly shut down when the component unmounts to prevent memory leaks.
  useEffect(() => {
    return () => {
      if (viewerRef.current) {
        viewerRef.current.finish();
        viewerRef.current = null;
      }
    };
  }, []);

  // =====================
  // Render Component
  // =====================
  return (
    <Card className="h-full">
      <CardContent className="p-0 h-full relative">
        {/* Load Autodesk Viewer styles */}
        <Script
          id="autodesk-viewer-style"
          src="https://developer.api.autodesk.com/modelderivative/v2/viewers/7.*/style.css"
          strategy="beforeInteractive"
          onError={handleScriptError}
        />
        {/* Load Autodesk Viewer script */}
        <Script
          id="autodesk-viewer-script"
          src="https://developer.api.autodesk.com/modelderivative/v2/viewers/7.*/viewer3D.js"
          strategy="lazyOnload"
          onLoad={handleScriptsLoaded}
          onError={handleScriptError}
        />

        {/* Display loading state overlay */}
        {loading && (
          <div className="absolute inset-0 bg-white bg-opacity-70 flex justify-center items-center z-10">
            <div className="flex flex-col items-center">
              <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
              <p className="mt-2 text-gray-700">Loading model...</p>
            </div>
          </div>
        )}

        {/* Display error state overlay */}
        {error && (
          <div className="absolute inset-0 bg-white bg-opacity-70 flex justify-center items-center z-10">
            <div className="flex flex-col items-center text-center p-4 max-w-md">
              <AlertTriangle className="h-12 w-12 text-red-500 mb-2" />
              <p className="text-red-500 font-medium">{error}</p>
              <p className="mt-2 text-gray-600">Please check your connection and try again.</p>
            </div>
          </div>
        )}

        {/* Display empty state if no model is selected */}
        {!versionId && (
          <div className="h-full flex justify-center items-center">
            <p className="text-gray-500">Select a model from the sidebar to view</p>
          </div>
        )}

        {/* Container for the Autodesk Viewer */}
        <div ref={containerRef} className="h-full w-full" />
      </CardContent>
    </Card>
  );
}

// =====================
// Global Window Typings
// =====================
// Extend the global Window interface with Autodesk Viewing types for TypeScript.
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
