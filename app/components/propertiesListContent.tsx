// app/components/propertiesListContent.tsx
import { PropertiesDataCollection } from "@aps_sdk/model-derivative";

interface PropertiesListContentProps {
  data: PropertiesDataCollection[];
  onSelect: (objectId: number) => void;
}

/**
 * PropertiesListContent renders a list of property panels.
 * Each panel is a button that calls the onSelect callback with the corresponding object's ID when clicked.
 */
const PropertiesListContent: React.FC<PropertiesListContentProps> = ({ data, onSelect }) => {
  return (
    <div className="w-full">
      {/* Iterate over the properties data and render a panel for each item */}
      {data.map((item) => (
        <div key={item.objectid} className="mb-1">
          {/* Panel Header */}
          <button
            onClick={() => {
              try {
                // Call the onSelect callback with the object's ID
                onSelect(item.objectid);
              } catch (error) {
                // Log any errors during selection
                console.error("Error selecting property:", error);
              }
            }}
            className="w-full text-left px-4 py-1 bg-gray-100 hover:bg-gray-200 font-medium dark:bg-slate-700 dark:text-white dark:hover:bg-slate-600 rounded"
          >
            {item.name} [{item.objectid}]
          </button>
        </div>
      ))}
    </div>
  );
};

export default PropertiesListContent;
