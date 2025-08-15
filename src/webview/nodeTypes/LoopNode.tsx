import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';

export interface LoopNodeData {
  loopType: 'for' | 'while' | 'until';
  variable?: string;
  list?: string;
  condition?: string;
}

export const LoopNode = memo<NodeProps<LoopNodeData>>(({ data, selected }) => {
  return (
    <div className={`loop-node custom-node ${selected ? 'selected' : ''}`}>
      <Handle type="target" position={Position.Top} />
      <div className="node-header">
        <span className="node-icon">🔄</span>
        <span className="node-title">Loop</span>
      </div>
      <div className="node-content">
        <select
          value={data.loopType || 'for'}
          className="node-select"
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
            data.loopType = e.target.value as LoopNodeData['loopType'];
          }}
        >
          <option value="for">For Loop</option>
          <option value="while">While Loop</option>
          <option value="until">Until Loop</option>
        </select>
        {data.loopType === 'for' ? (
          <>
            <input
              type="text"
              value={data.variable || ''}
              placeholder="Variable name..."
              className="node-input"
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                data.variable = e.target.value;
              }}
            />
            <input
              type="text"
              value={data.list || ''}
              placeholder="List or range..."
              className="node-input"
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                data.list = e.target.value;
              }}
            />
          </>
        ) : (
          <input
            type="text"
            value={data.condition || ''}
            placeholder="Condition..."
            className="node-input"
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              data.condition = e.target.value;
            }}
          />
        )}
      </div>
      <Handle 
        type="source" 
        position={Position.Right} 
        id="loop-body"
        style={{ top: '50%' }}
      />
      <Handle 
        type="source" 
        position={Position.Bottom} 
        id="loop-end" 
      />
    </div>
  );
});

LoopNode.displayName = 'LoopNode';