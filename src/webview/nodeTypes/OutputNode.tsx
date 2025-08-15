import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';

export interface OutputNodeData {
  output: string;
  type: 'stdout' | 'stderr' | 'result';
}

export const OutputNode = memo<NodeProps<OutputNodeData>>(({ data, selected }) => {
  const getIcon = () => {
    switch (data.type) {
      case 'stderr': return '❌';
      case 'result': return '✅';
      default: return '📤';
    }
  };

  return (
    <div className={`output-node ${data.type}-output ${selected ? 'selected' : ''}`}>
      <Handle type="target" position={Position.Top} id="input" />
      <div className="node-header">
        <span className="node-icon">{getIcon()}</span>
        <span className="node-title">Output</span>
      </div>
      <div className="node-content">
        <div className="output-display">
          {data.output || 'No output yet...'}
        </div>
      </div>
    </div>
  );
});

OutputNode.displayName = 'OutputNode';