import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';

export interface ArrayNodeData {
  values: string[];
}

export const ArrayNode = memo<NodeProps<ArrayNodeData>>(({ data, selected }) => {
  return (
    <div className={`array-node literal-node ${selected ? 'selected' : ''}`}>
      <div className="node-header">
        <span className="node-icon">📚</span>
        <span className="node-title">Array</span>
      </div>
      <div className="node-content">
        <textarea
          value={data.values?.join('\n') || ''}
          placeholder="Enter values (one per line)..."
          className="node-textarea"
          rows={3}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
            data.values = e.target.value.split('\n').filter(v => v.trim());
          }}
        />
      </div>
      <Handle type="source" position={Position.Bottom} id="output" />
    </div>
  );
});

ArrayNode.displayName = 'ArrayNode';