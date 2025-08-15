import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';

export interface NumberNodeData {
  value: number;
}

export const NumberNode = memo<NodeProps<NumberNodeData>>(({ data, selected }) => {
  return (
    <div className={`number-node literal-node ${selected ? 'selected' : ''}`}>
      <div className="node-header">
        <span className="node-icon">🔢</span>
        <span className="node-title">Number</span>
      </div>
      <div className="node-content">
        <input
          type="number"
          value={data.value || 0}
          placeholder="Enter number..."
          className="node-input"
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            data.value = parseFloat(e.target.value);
          }}
        />
      </div>
      <Handle type="source" position={Position.Bottom} id="output" />
    </div>
  );
});

NumberNode.displayName = 'NumberNode';