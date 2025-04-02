import { ObjectTreeData } from '@/types';
import React from 'react';



interface TreeProps {
  data: ObjectTreeData[];
}

const Tree: React.FC<TreeProps> = ({ data }) => {
  return (
    <ul style={{ listStyle: 'none', paddingLeft: 20 }}>
      {data.map((node) => (
        <TreeNodeItem key={node.objectid} node={node} />
      ))}
    </ul>
  );
};

interface TreeNodeItemProps {
  node: ObjectTreeData;
}

const TreeNodeItem: React.FC<TreeNodeItemProps> = ({ node }) => {
  const hasChildren = node.objects && node.objects.length > 0;
  const [expanded, setExpanded] = React.useState<boolean>(false);

  return (
    <li>
      <div
        style={{ cursor: hasChildren ? 'pointer' : 'default' }}
        onClick={() => hasChildren && setExpanded(!expanded)}
      >
        {hasChildren && (
          <span style={{ marginRight: 5 }}>
            {expanded ? '▼' : '►'}
          </span>
        )}
        {node.name}
      </div>
      {hasChildren && expanded && (
        <Tree data={node.objects!} />
      )}
    </li>
  );
};

export default Tree;
