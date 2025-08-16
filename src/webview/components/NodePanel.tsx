import React from 'react';

const nodeTypes = [
  // Canvasノードタイプ
  { type: 'memo', label: 'テキスト', icon: '📝', description: 'テキストメモ', category: 'canvas' },
  { type: 'file', label: 'ファイル', icon: '📁', description: 'ローカルファイル参照', category: 'canvas' },
  { type: 'function', label: '関数', icon: '🔧', description: '関数定義・実行', category: 'canvas' },
  { type: 'connector', label: 'コネクタ', icon: '🔗', description: 'データフロー制御', category: 'canvas' },
];

export const NodePanel: React.FC = () => {
  const onDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  const canvasNodes = nodeTypes.filter(node => node.category === 'canvas');

  const renderNodeGroup = (title: string, nodes: typeof nodeTypes) => (
    <div className="node-group" style={{ marginBottom: '20px' }}>
      <h4 style={{ 
        fontSize: '12px', 
        color: 'var(--text-muted)', 
        marginBottom: '8px',
        borderBottom: '1px solid var(--border-color)',
        paddingBottom: '4px'
      }}>
        {title}
      </h4>
      <div className="node-list">
        {nodes.map((node) => (
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

  return (
    <div className="node-panel">
      <h3>ノードタイプ</h3>
      {renderNodeGroup('ノード', canvasNodes)}
    </div>
  );
};