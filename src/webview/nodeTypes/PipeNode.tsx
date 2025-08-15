import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';

export interface PipeNodeData {
  pipeType: '|' | '|&' | '||' | '&&';
}

export const PipeNode = memo<NodeProps<PipeNodeData>>(({ data, selected }) => {
  return (
    <div className={`pipe-node custom-node ${selected ? 'selected' : ''}`}>
      <Handle type="target" position={Position.Top} id="input" />
      <div className="node-header">
        <span className="node-icon">🔀</span>
        <span className="node-title">Pipe</span>
      </div>
      <div className="node-content">
        <select
          value={data.pipeType || '|'}
          className="node-select"
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
            data.pipeType = e.target.value as PipeNodeData['pipeType'];
          }}
        >
          <option value="|">Pipe (|)</option>
          <option value="|&">Pipe Stderr (|&)</option>
          <option value="||">Or (||)</option>
          <option value="&&">And (&&)</option>
        </select>
      </div>
      <Handle type="source" position={Position.Bottom} id="output" />
    </div>
  );
});

PipeNode.displayName = 'PipeNode';