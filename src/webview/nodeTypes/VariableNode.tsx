import React, { memo, useState } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';

export interface VariableNodeData {
  name: string;
  value?: string;
  scope: 'local' | 'export';
  useInput: boolean;
}

export const VariableNode = memo<NodeProps<VariableNodeData>>(({ data, selected }) => {
  const [useInput, setUseInput] = useState(data.useInput || false);

  React.useEffect(() => {
    data.useInput = useInput;
  }, [useInput, data]);

  return (
    <div className={`variable-node custom-node ${selected ? 'selected' : ''}`}>
      {useInput && (
        <Handle type="target" position={Position.Top} id="input" />
      )}
      <div className="node-header">
        <span className="node-icon">📦</span>
        <span className="node-title">Variable</span>
      </div>
      <div className="node-content">
        <select 
          value={data.scope || 'local'} 
          className="node-select"
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
            data.scope = e.target.value as 'local' | 'export';
          }}
        >
          <option value="local">Local</option>
          <option value="export">Export</option>
        </select>
        <input
          type="text"
          value={data.name || ''}
          placeholder="Variable name..."
          className="node-input"
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            data.name = e.target.value;
          }}
        />
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={useInput}
            onChange={(e) => setUseInput(e.target.checked)}
          />
          Use input port
        </label>
        {!useInput && (
          <input
            type="text"
            value={data.value || ''}
            placeholder="Value..."
            className="node-input"
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              data.value = e.target.value;
            }}
          />
        )}
      </div>
      <Handle type="source" position={Position.Bottom} id="output" />
    </div>
  );
});

VariableNode.displayName = 'VariableNode';