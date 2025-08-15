import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';

export interface ConditionNodeData {
  condition: string;
  operator: 'eq' | 'ne' | 'gt' | 'lt' | 'ge' | 'le' | 'exists' | 'empty';
  value?: string;
}

export const ConditionNode = memo<NodeProps<ConditionNodeData>>(({ data, selected }) => {
  return (
    <div className={`condition-node custom-node ${selected ? 'selected' : ''}`}>
      <Handle type="target" position={Position.Top} />
      <div className="node-header">
        <span className="node-icon">❓</span>
        <span className="node-title">If Condition</span>
      </div>
      <div className="node-content">
        <input
          type="text"
          value={data.condition || ''}
          placeholder="Variable or expression..."
          className="node-input"
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            data.condition = e.target.value;
          }}
        />
        <select 
          value={data.operator || 'eq'} 
          className="node-select"
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
            data.operator = e.target.value as ConditionNodeData['operator'];
          }}
        >
          <option value="eq">Equal (==)</option>
          <option value="ne">Not Equal (!=)</option>
          <option value="gt">Greater (&gt;)</option>
          <option value="lt">Less (&lt;)</option>
          <option value="ge">Greater Equal (&gt;=)</option>
          <option value="le">Less Equal (&lt;=)</option>
          <option value="exists">File Exists (-e)</option>
          <option value="empty">Is Empty (-z)</option>
        </select>
        {!['exists', 'empty'].includes(data.operator || 'eq') && (
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
      <div className="condition-handles">
        <Handle 
          type="source" 
          position={Position.Bottom} 
          id="true" 
          style={{ left: '30%' }}
          className="handle-true"
        />
        <Handle 
          type="source" 
          position={Position.Bottom} 
          id="false" 
          style={{ left: '70%' }}
          className="handle-false"
        />
      </div>
      <div className="handle-labels">
        <span className="handle-label-true">✓</span>
        <span className="handle-label-false">✗</span>
      </div>
    </div>
  );
});

ConditionNode.displayName = 'ConditionNode';