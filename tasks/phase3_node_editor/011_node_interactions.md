# タスク010: ノード操作機能

## 目的
ノードの追加、削除、編集、接続などの操作機能を実装する

## 前提条件
- タスク009が完了している
- 基本ノードタイプが実装されている

## 実装内容

### 1. ノード操作ツールバーの実装
```typescript
// src/webview/components/Toolbar.tsx
import React from 'react';
import { useReactFlow } from 'reactflow';

interface ToolbarProps {
  onSave: () => void;
  onLoad: () => void;
  onClear: () => void;
  onExport: () => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  onSave,
  onLoad,
  onClear,
  onExport,
}) => {
  const { zoomIn, zoomOut, fitView } = useReactFlow();

  return (
    <div className="toolbar">
      <div className="toolbar-group">
        <button onClick={onSave} title="Save">💾</button>
        <button onClick={onLoad} title="Load">📂</button>
        <button onClick={onExport} title="Export">📤</button>
        <button onClick={onClear} title="Clear">🗑️</button>
      </div>
      <div className="toolbar-group">
        <button onClick={() => zoomIn()} title="Zoom In">🔍+</button>
        <button onClick={() => zoomOut()} title="Zoom Out">🔍-</button>
        <button onClick={() => fitView()} title="Fit View">⊡</button>
      </div>
    </div>
  );
};
```

### 2. コンテキストメニューの実装
```typescript
// src/webview/components/ContextMenu.tsx
import React from 'react';
import { Node, Edge, useReactFlow } from 'reactflow';

interface ContextMenuProps {
  node?: Node;
  edge?: Edge;
  position: { x: number; y: number };
  onClose: () => void;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({
  node,
  edge,
  position,
  onClose,
}) => {
  const { deleteElements, duplicateNodes } = useReactFlow();

  const handleDelete = () => {
    if (node) {
      deleteElements({ nodes: [node] });
    } else if (edge) {
      deleteElements({ edges: [edge] });
    }
    onClose();
  };

  const handleDuplicate = () => {
    if (node) {
      duplicateNodes([node]);
    }
    onClose();
  };

  return (
    <div
      className="context-menu"
      style={{
        position: 'absolute',
        left: position.x,
        top: position.y,
        zIndex: 1000,
      }}
    >
      {node && (
        <>
          <div className="menu-item" onClick={handleDuplicate}>
            📋 Duplicate Node
          </div>
          <div className="menu-item" onClick={handleDelete}>
            🗑️ Delete Node
          </div>
          <div className="menu-separator" />
          <div className="menu-item">
            ⚙️ Properties
          </div>
        </>
      )}
      {edge && (
        <div className="menu-item" onClick={handleDelete}>
          ✂️ Delete Connection
        </div>
      )}
    </div>
  );
};
```

### 3. プロパティパネルの実装
```typescript
// src/webview/components/PropertiesPanel.tsx
import React, { useEffect, useState } from 'react';
import { Node } from 'reactflow';

interface PropertiesPanelProps {
  node: Node | null;
  onUpdate: (node: Node) => void;
}

export const PropertiesPanel: React.FC<PropertiesPanelProps> = ({
  node,
  onUpdate,
}) => {
  const [properties, setProperties] = useState<Record<string, any>>({});

  useEffect(() => {
    if (node) {
      setProperties(node.data || {});
    }
  }, [node]);

  const handlePropertyChange = (key: string, value: any) => {
    const updatedProperties = { ...properties, [key]: value };
    setProperties(updatedProperties);
    
    if (node) {
      onUpdate({
        ...node,
        data: updatedProperties,
      });
    }
  };

  if (!node) {
    return (
      <div className="properties-panel">
        <h3>Properties</h3>
        <p className="empty-state">Select a node to view properties</p>
      </div>
    );
  }

  return (
    <div className="properties-panel">
      <h3>Properties</h3>
      <div className="property-group">
        <label>Node ID</label>
        <input type="text" value={node.id} disabled />
      </div>
      <div className="property-group">
        <label>Node Type</label>
        <input type="text" value={node.type || 'default'} disabled />
      </div>
      <div className="property-group">
        <label>Position</label>
        <div className="position-inputs">
          <input
            type="number"
            value={Math.round(node.position.x)}
            onChange={(e) => {
              onUpdate({
                ...node,
                position: { ...node.position, x: Number(e.target.value) },
              });
            }}
          />
          <input
            type="number"
            value={Math.round(node.position.y)}
            onChange={(e) => {
              onUpdate({
                ...node,
                position: { ...node.position, y: Number(e.target.value) },
              });
            }}
          />
        </div>
      </div>
      {/* Dynamic properties based on node type */}
      {Object.entries(properties).map(([key, value]) => (
        <div key={key} className="property-group">
          <label>{key}</label>
          {typeof value === 'boolean' ? (
            <input
              type="checkbox"
              checked={value}
              onChange={(e) => handlePropertyChange(key, e.target.checked)}
            />
          ) : (
            <input
              type="text"
              value={value}
              onChange={(e) => handlePropertyChange(key, e.target.value)}
            />
          )}
        </div>
      ))}
    </div>
  );
};
```

### 4. ショートカットキーの実装
```typescript
// src/webview/hooks/useKeyboardShortcuts.ts
import { useEffect } from 'react';
import { useReactFlow } from 'reactflow';

export const useKeyboardShortcuts = () => {
  const { deleteElements, getNodes, getEdges, fitView } = useReactFlow();

  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      // Delete selected nodes/edges
      if (event.key === 'Delete' || event.key === 'Backspace') {
        const selectedNodes = getNodes().filter((n) => n.selected);
        const selectedEdges = getEdges().filter((e) => e.selected);
        deleteElements({ nodes: selectedNodes, edges: selectedEdges });
      }

      // Select all (Ctrl/Cmd + A)
      if ((event.ctrlKey || event.metaKey) && event.key === 'a') {
        event.preventDefault();
        // Select all logic
      }

      // Copy (Ctrl/Cmd + C)
      if ((event.ctrlKey || event.metaKey) && event.key === 'c') {
        // Copy logic
      }

      // Paste (Ctrl/Cmd + V)
      if ((event.ctrlKey || event.metaKey) && event.key === 'v') {
        // Paste logic
      }

      // Undo (Ctrl/Cmd + Z)
      if ((event.ctrlKey || event.metaKey) && event.key === 'z') {
        // Undo logic
      }

      // Fit view (F)
      if (event.key === 'f' && !event.ctrlKey && !event.metaKey) {
        fitView();
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [deleteElements, getNodes, getEdges, fitView]);
};
```

### 5. 操作機能のスタイル
```css
/* src/webview/styles/interactions.css */
.toolbar {
  position: absolute;
  top: 10px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 10px;
  background: var(--vscode-editor-background);
  border: 1px solid var(--vscode-panel-border);
  border-radius: 6px;
  padding: 5px;
  z-index: 10;
}

.toolbar-group {
  display: flex;
  gap: 5px;
}

.toolbar button {
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--vscode-button-background);
  color: var(--vscode-button-foreground);
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
}

.toolbar button:hover {
  background: var(--vscode-button-hoverBackground);
}

.context-menu {
  background: var(--vscode-menu-background);
  border: 1px solid var(--vscode-menu-border);
  border-radius: 4px;
  padding: 4px 0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.menu-item {
  padding: 6px 20px;
  cursor: pointer;
  color: var(--vscode-menu-foreground);
  font-size: 12px;
}

.menu-item:hover {
  background: var(--vscode-menu-selectionBackground);
  color: var(--vscode-menu-selectionForeground);
}

.menu-separator {
  height: 1px;
  background: var(--vscode-menu-separatorBackground);
  margin: 4px 0;
}

.properties-panel {
  padding: 10px;
}

.properties-panel h3 {
  margin: 0 0 15px 0;
  font-size: 14px;
}

.property-group {
  margin-bottom: 10px;
}

.property-group label {
  display: block;
  margin-bottom: 4px;
  font-size: 11px;
  color: var(--vscode-descriptionForeground);
}

.property-group input {
  width: 100%;
  padding: 4px;
  background: var(--vscode-input-background);
  color: var(--vscode-input-foreground);
  border: 1px solid var(--vscode-input-border);
  border-radius: 4px;
  font-size: 12px;
}

.position-inputs {
  display: flex;
  gap: 5px;
}

.position-inputs input {
  flex: 1;
}
```

## 成果物
- src/webview/components/Toolbar.tsx
- src/webview/components/ContextMenu.tsx
- src/webview/components/PropertiesPanel.tsx
- src/webview/hooks/useKeyboardShortcuts.ts
- src/webview/styles/interactions.css

## テスト方法
1. ツールバーのボタンが正しく動作する
2. 右クリックでコンテキストメニューが表示される
3. プロパティパネルでノードのプロパティを編集できる
4. キーボードショートカットが動作する

## 完了条件
- [ ] ツールバーが実装されている
- [ ] コンテキストメニューが実装されている
- [ ] プロパティパネルが実装されている
- [ ] キーボードショートカットが実装されている
- [ ] スタイリングが完了している