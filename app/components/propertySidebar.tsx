// app/components/propertySidebar.tsx
import { PropertiesDataCollection } from "@aps_sdk/model-derivative";
import { X, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import React, { useRef, useState, useEffect } from "react";

interface PropertySidebarProps {
  object: PropertiesDataCollection | null;
  onClose: () => void;
}

/**
 * ConditionalTooltip Component
 * Renders a tooltip around its child element only if the text is truncated.
 * It checks the rendered width of the element against its scroll width
 * to determine if the content overflows.
 */
const ConditionalTooltip: React.FC<{
  text: string;
  children: React.ReactElement;
}> = ({ text, children }) => {
  const textRef = useRef<HTMLDivElement>(null);
  const [isTruncated, setIsTruncated] = useState(false);

  useEffect(() => {
    const checkTruncation = () => {
      try {
        const element = textRef.current;
        if (element) {
          // If the element's offset width is less than its scroll width, content is truncated
          setIsTruncated(element.offsetWidth < element.scrollWidth);
        }
      } catch (error) {
        console.error("Error checking text truncation:", error);
      }
    };

    // Perform the initial check
    checkTruncation();

    // Re-check on window resize to handle dynamic layout changes
    window.addEventListener("resize", checkTruncation);
    return () => window.removeEventListener("resize", checkTruncation);
  }, [text]);

  // Wrap the child element with a tooltip if the text is truncated
  const tooltipContent = (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {React.cloneElement(children, { ref: textRef })}
        </TooltipTrigger>
        {isTruncated && <TooltipContent>{text}</TooltipContent>}
      </Tooltip>
    </TooltipProvider>
  );

  return isTruncated ? tooltipContent : children;
};

/**
 * PropertySidebar Component
 * Renders a sidebar that displays the properties of a selected object.
 * It includes a header with the object's name and a close button,
 * and the main content displays categorized property details.
 */
const PropertySidebar: React.FC<PropertySidebarProps> = ({ object, onClose }) => {
  // If no object is selected, render an empty state with instructions
  if (!object) {
    return (
      <div className="h-full flex flex-col border-l dark:border-slate-700 bg-white dark:bg-card overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b dark:border-slate-700">
          <h2 className="text-lg font-semibold truncate dark:text-white">Properties</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="hover:bg-gray-100 dark:hover:bg-slate-800"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="flex-1 flex items-center justify-center p-4">
          <div className="text-center">
            <Info className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">
              Select an element from the tree or list view to see its properties
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col border-l dark:border-slate-700 bg-white dark:bg-card overflow-hidden">
      {/* Sidebar Header */}
      <div className="flex items-center justify-between p-4 border-b dark:border-slate-700">
        <ConditionalTooltip text={`${object.name} #${object.objectid}`}>
          <h2 className="text-lg font-semibold truncate dark:text-white max-w-[85%]">
            {object.name} <span className="text-sm text-gray-500 dark:text-gray-400">#{object.objectid}</span>
          </h2>
        </ConditionalTooltip>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            try {
              onClose();
            } catch (error) {
              console.error("Error closing sidebar:", error);
            }
          }}
          className="hover:bg-gray-100 dark:hover:bg-slate-800"
        >
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* Sidebar Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {object.properties ? (
          <div>
            {Object.entries(object.properties).map(([category, props]) => (
              <div key={category} className="mb-4">
                {/* Category Header */}
                <h3 className="font-semibold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-neutral-800 p-2 rounded">
                  {category}
                </h3>

                {/* Property List for the Category */}
                <div className="border dark:border-slate-700 rounded">
                  {Object.entries(props).map(([propName, propValue]) => (
                    <div key={propName} className="flex border-b last:border-b-0 dark:border-neutral-600">
                      <div className="w-3/5 py-1 px-4 bg-gray-50 dark:bg-neutral-700 font-medium text-gray-800 dark:text-gray-200 border-r dark:border-neutral-600">
                        {propName}:
                      </div>
                      <div className="w-2/5 py-1 px-4 bg-gray-50 dark:bg-neutral-700 text-gray-600 dark:text-gray-400">
                        {String(propValue)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          // Fallback message when no properties are available
          <p className="text-gray-500 dark:text-gray-400">No properties available</p>
        )}
      </div>
    </div>
  );
};

export default PropertySidebar;
