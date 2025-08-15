import React, { memo, useState } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';

export interface CommandNodeData {
  command: string;
  argCount: number;
  hasStdin: boolean;
}

export const CommandNode = memo<NodeProps<CommandNodeData>>(({ data, selected }) => {
  const [argCount, setArgCount] = useState(data.argCount || 0);
  const [hasStdin, setHasStdin] = useState(data.hasStdin || false);

  React.useEffect(() => {
    data.argCount = argCount;
    data.hasStdin = hasStdin;
  }, [argCount, hasStdin, data]);

  return (
    <div className={`command-node custom-node ${selected ? 'selected' : ''}`}>
      {hasStdin && (
        <Handle type="target" position={Position.Top} id="stdin" />
      )}
      
      {/* 引数入力ポート */}
      {Array.from({ length: argCount }, (_, i) => (
        <Handle
          key={`arg${i}`}
          type="target"
          position={Position.Left}
          id={`arg${i}`}
          style={{ top: `${50 + i * 30}px` }}
        />
      ))}

      <div className="node-header">
        <span className="node-icon">⚡</span>
        <span className="node-title">Command</span>
      </div>
      <div className="node-content">
        <input
          type="text"
          value={data.command || ''}
          placeholder="Command name..."
          className="node-input"
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            data.command = e.target.value;
          }}
        />
        <div className="arg-controls">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={hasStdin}
              onChange={(e) => setHasStdin(e.target.checked)}
            />
            stdin
          </label>
          <div className="arg-counter">
            <button onClick={() => setArgCount(Math.max(0, argCount - 1))}>-</button>
            <span>Args: {argCount}</span>
            <button onClick={() => setArgCount(argCount + 1)}>+</button>
          </div>
        </div>
      </div>
      
      {/* 出力ポート */}
      <Handle type="source" position={Position.Bottom} id="stdout" style={{ left: '30%' }} />
      <Handle type="source" position={Position.Bottom} id="stderr" style={{ left: '70%' }} />
    </div>
  );
});

CommandNode.displayName = 'CommandNode';