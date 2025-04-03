import { PropertiesDataCollection } from '@aps_sdk/model-derivative';
import { useState, useMemo } from 'react';


interface PropertiesListProps {
  data: PropertiesDataCollection[];
}

const PropertiesList: React.FC<PropertiesListProps> = ({ data }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortKey, setSortKey] = useState<"name" | "objectid">("name");
  const [expandedIds, setExpandedIds] = useState<number[]>([]);

  // Filter the data based on search query (matches name or objectid)
  const filteredData = useMemo(() => {
    return data.filter(item =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.objectid.toString().includes(searchQuery)
    );
  }, [data, searchQuery]);

  // Sort the filtered data by the selected sort key
  const sortedData = useMemo(() => {
    const sorted = [...filteredData];
    if (sortKey === "name") {
      sorted.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortKey === "objectid") {
      sorted.sort((a, b) => a.objectid - b.objectid);
    }
    return sorted;
  }, [filteredData, sortKey]);

  // Toggle expansion of a panel
  const toggleExpand = (id: number) => {
    setExpandedIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  return (
    <div className="w-full">
      {/* Search and Sort Controls */}
      <div className="mb-4 flex gap-4">
        <input
          type="text"
          placeholder="Search by name or ID..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="px-3 py-1 border rounded"
        />
        <select 
          value={sortKey} 
          onChange={(e) => setSortKey(e.target.value as "name" | "objectid")}
          className="px-3 py-1 border rounded"
        >
          <option value="name">Sort by Name (A–Z)</option>
          <option value="objectid">Sort by ID (ascending)</option>
        </select>
      </div>

      {/* List of expandable property panels */}
      {sortedData.map(item => (
        <div 
          key={item.objectid} 
          className="mb-2 "
        >
          {/* Panel Header */}
          <button 
            onClick={() => toggleExpand(item.objectid)}
            className="w-full text-left px-4 py-2 bg-gray-100 hover:bg-gray-200 font-medium"
          >
            {item.name} [{item.objectid}]
          </button>

          {/* Panel Body (expanded content) */}
          {expandedIds.includes(item.objectid) && (
            <div className="px-4 py-3 bg-gray-50">
              {item.properties ? (
                Object.entries(item.properties).map(([category, props]) => (
                  <div key={category} className="mb-4">
                    <h3 className="font-semibold text-gray-700 mb-2">{category}</h3>
                    <ul className="pl-5 list-disc list-outside text-gray-600">
                      {Object.entries(props).map(([propName, propValue]) => (
                        <li key={propName} className="text-sm mb-1">
                          <span className="font-medium text-gray-800">{propName}:</span>{" "}
                          {String(propValue)}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))
              ) : (
                <p className="text-gray-500">No properties available</p>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default PropertiesList;
