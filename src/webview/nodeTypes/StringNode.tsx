import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';

export interface StringNodeData {
  value: string;
}

export const StringNode = memo<NodeProps<StringNodeData>>(({ data, selected }) => {
  return (
    <div className={`string-node literal-node ${selected ? 'selected' : ''}`}>
      <div className="node-header">
        <span className="node-icon">📝</span>
        <span className="node-title">String</span>
      </div>
      <div className="node-content">
        <input
          type="text"
          value={data.value || ''}
          placeholder="Enter string..."
          className="node-input"
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            data.value = e.target.value;
          }}
        />
      </div>
      <Handle type="source" position={Position.Bottom} id="output" />
    </div>
  );
});

StringNode.displayName = 'StringNode';