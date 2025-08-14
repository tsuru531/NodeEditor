# タスク008: React Flow統合

## 目的
React Flowを完全に統合し、基本的なノードエディタ機能を実装する

## 前提条件
- タスク007が完了している
- React環境が構築されている

## 実装内容

### 1. React Flowラッパーコンポーネントの作成
```typescript
// src/webview/components/NodeEditor.tsx
import React, { useCallback, useRef } from 'react';
import ReactFlow, {
  ReactFlowProvider,
  addEdge,
  useNodesState,
  useEdgesState,
  useReactFlow,
  Connection,
  Edge,
  Node,
  ReactFlowInstance,
  Controls,
  MiniMap,
  Background,
  BackgroundVariant,
} from 'reactflow';

interface NodeEditorProps {
  initialNodes?: Node[];
  initialEdges?: Edge[];
  onNodesChange?: (nodes: Node[]) => void;
  onEdgesChange?: (edges: Edge[]) => void;
}

export const NodeEditor: React.FC<NodeEditorProps> = ({
  initialNodes = [],
  initialEdges = [],
  onNodesChange,
  onEdgesChange,
}) => {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [nodes, setNodes, onNodesChangeInternal] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChangeInternal] = useEdgesState(initialEdges);
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);

  const onConnect = useCallback(
    (params: Connection | Edge) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const reactFlowBounds = reactFlowWrapper.current?.getBoundingClientRect();
      const type = event.dataTransfer.getData('application/reactflow');

      if (typeof type === 'undefined' || !type || !reactFlowBounds || !reactFlowInstance) {
        return;
      }

      const position = reactFlowInstance.project({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      });

      const newNode: Node = {
        id: `${type}_${Date.now()}`,
        type,
        position,
        data: { label: `${type} node` },
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [reactFlowInstance, setNodes]
  );

  return (
    <div ref={reactFlowWrapper} style={{ width: '100%', height: '100%' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={(changes) => {
          onNodesChangeInternal(changes);
          onNodesChange?.(nodes);
        }}
        onEdgesChange={(changes) => {
          onEdgesChangeInternal(changes);
          onEdgesChange?.(edges);
        }}
        onConnect={onConnect}
        onInit={setReactFlowInstance}
        onDrop={onDrop}
        onDragOver={onDragOver}
        fitView
      >
        <Controls />
        <MiniMap />
        <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
      </ReactFlow>
    </div>
  );
};
```

### 2. ノードパネルコンポーネントの作成
```typescript
// src/webview/components/NodePanel.tsx
import React from 'react';

const nodeTypes = [
  { type: 'command', label: 'Command', icon: '📝' },
  { type: 'pipe', label: 'Pipe', icon: '🔀' },
  { type: 'condition', label: 'If/Then', icon: '❓' },
  { type: 'loop', label: 'Loop', icon: '🔄' },
  { type: 'variable', label: 'Variable', icon: '📦' },
  { type: 'function', label: 'Function', icon: '🎯' },
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
          >
            <span className="node-icon">{node.icon}</span>
            <span className="node-label">{node.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
```

### 3. エディタレイアウトコンポーネント
```typescript
// src/webview/components/EditorLayout.tsx
import React, { useState } from 'react';
import { NodeEditor } from './NodeEditor';
import { NodePanel } from './NodePanel';
import { PropertiesPanel } from './PropertiesPanel';

export const EditorLayout: React.FC = () => {
  const [selectedNode, setSelectedNode] = useState(null);

  return (
    <div className="editor-layout">
      <div className="sidebar-left">
        <NodePanel />
      </div>
      <div className="editor-main">
        <NodeEditor
          onNodeSelect={setSelectedNode}
        />
      </div>
      <div className="sidebar-right">
        <PropertiesPanel node={selectedNode} />
      </div>
    </div>
  );
};
```

### 4. レイアウトCSS
```css
/* src/webview/styles/layout.css */
.editor-layout {
  display: flex;
  width: 100vw;
  height: 100vh;
  background: var(--vscode-editor-background);
}

.sidebar-left {
  width: 200px;
  background: var(--vscode-sideBar-background);
  border-right: 1px solid var(--vscode-panel-border);
  padding: 10px;
  overflow-y: auto;
}

.editor-main {
  flex: 1;
  position: relative;
}

.sidebar-right {
  width: 250px;
  background: var(--vscode-sideBar-background);
  border-left: 1px solid var(--vscode-panel-border);
  padding: 10px;
  overflow-y: auto;
}

.node-panel h3 {
  margin: 0 0 10px 0;
  font-size: 14px;
  font-weight: 600;
}

.node-item {
  display: flex;
  align-items: center;
  padding: 8px;
  margin: 4px 0;
  background: var(--vscode-input-background);
  border: 1px solid var(--vscode-input-border);
  border-radius: 4px;
  cursor: move;
  transition: background 0.2s;
}

.node-item:hover {
  background: var(--vscode-list-hoverBackground);
}

.node-icon {
  margin-right: 8px;
}
```

## 成果物
- src/webview/components/NodeEditor.tsx
- src/webview/components/NodePanel.tsx
- src/webview/components/EditorLayout.tsx
- src/webview/styles/layout.css

## テスト方法
1. ノードパネルからドラッグ&ドロップでノードを追加できる
2. ノード間を接続できる
3. ミニマップとコントロールが表示される
4. レイアウトが正しく表示される

## 完了条件
- [ ] React Flowが完全に統合されている
- [ ] ドラッグ&ドロップでノードを追加できる
- [ ] ノード間の接続が可能
- [ ] レイアウトコンポーネントが実装されている
- [ ] スタイリングが適用されている