import { ObjectTreeData } from '@/types';
import { ChevronDown, ChevronRight } from 'lucide-react';
import React from 'react';

interface TreeProps {
  data: ObjectTreeData[];
  level?: number;
}

const Tree: React.FC<TreeProps> = ({ data, level = 0 }) => {
  return (
    <ul style={{ paddingLeft: 20 }}>
      {data.map((node) => (
        <TreeNodeItem key={node.objectid} node={node} level={level} />
      ))}
    </ul>
  );
};

interface TreeNodeItemProps {
  node: ObjectTreeData;
  level: number;
}

const TreeNodeItem: React.FC<TreeNodeItemProps> = ({ node, level }) => {
  const hasChildren = node.objects && node.objects.length > 0;
  const [expanded, setExpanded] = React.useState<boolean>(level === 0);

  return (
    <li>
      <div
        style={{ cursor: hasChildren ? 'pointer' : 'default' }}
        onClick={() => hasChildren && setExpanded(!expanded)}
        className="flex items-center h-full"
      >
        {hasChildren && (
          <span style={{ marginRight: 2 }}>
            {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </span>
        )}
        {node.name}
      </div>
      {hasChildren && expanded && (
        <Tree data={node.objects!} level={level + 1} />
      )}
    </li>
  );
};

export default Tree;