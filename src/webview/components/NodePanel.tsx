import React from 'react';

const nodeTypes = [
  { type: 'string', label: 'String', icon: '📝', description: 'String literal value' },
  { type: 'number', label: 'Number', icon: '🔢', description: 'Number literal value' },
  { type: 'array', label: 'Array', icon: '📚', description: 'Array of values' },
  { type: 'command', label: 'Command', icon: '⚡', description: 'Execute a shell command' },
  { type: 'pipe', label: 'Pipe', icon: '🔀', description: 'Pipe output between commands' },
  { type: 'condition', label: 'If/Then', icon: '❓', description: 'Conditional branching' },
  { type: 'loop', label: 'Loop', icon: '🔄', description: 'Loop through items' },
  { type: 'variable', label: 'Variable', icon: '📦', description: 'Define or use variables' },
  { type: 'output', label: 'Output', icon: '📤', description: 'Display output' },
];

export const NodePanel: React.FC = () => {
  const onDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div className="node-panel">
      <h3>Node Types</h3>
      <div className="node-list">
        {nodeTypes.map((node) => (
          <div
            key={node.type}
            className="node-item"
            draggable
            onDragStart={(e) => onDragStart(e, node.type)}
            title={node.description}
          >
            <span className="node-icon">{node.icon}</span>
            <span className="node-label">{node.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};