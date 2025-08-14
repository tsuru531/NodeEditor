# タスク009: 基本ノードタイプ実装

## 目的
Bashスクリプトの基本的な構造を表現するためのカスタムノードタイプを実装する

## 前提条件
- タスク008が完了している
- React Flowが統合されている

## 実装内容

### 1. コマンドノードの実装
```typescript
// src/webview/nodeTypes/CommandNode.tsx
import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';

export interface CommandNodeData {
  command: string;
  args: string[];
  options: Record<string, string>;
}

export const CommandNode = memo<NodeProps<CommandNodeData>>(({ data, selected }) => {
  return (
    <div className={`command-node ${selected ? 'selected' : ''}`}>
      <Handle type="target" position={Position.Top} />
      <div className="node-header">
        <span className="node-icon">📝</span>
        <span className="node-title">Command</span>
      </div>
      <div className="node-content">
        <input
          type="text"
          value={data.command || ''}
          placeholder="Enter command..."
          className="node-input"
          onChange={(e) => {
            data.command = e.target.value;
          }}
        />
        <textarea
          value={data.args?.join(' ') || ''}
          placeholder="Arguments..."
          className="node-textarea"
          rows={2}
          onChange={(e) => {
            data.args = e.target.value.split(' ');
          }}
        />
      </div>
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
});
```

### 2. パイプノードの実装
```typescript
// src/webview/nodeTypes/PipeNode.tsx
import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';

export interface PipeNodeData {
  pipeType: '|' | '|&' | '||' | '&&';
}

export const PipeNode = memo<NodeProps<PipeNodeData>>(({ data, selected }) => {
  return (
    <div className={`pipe-node ${selected ? 'selected' : ''}`}>
      <Handle type="target" position={Position.Top} id="input" />
      <div className="node-header">
        <span className="node-icon">🔀</span>
        <span className="node-title">Pipe</span>
      </div>
      <div className="node-content">
        <select
          value={data.pipeType || '|'}
          className="node-select"
          onChange={(e) => {
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
```

### 3. 条件分岐ノードの実装
```typescript
// src/webview/nodeTypes/ConditionNode.tsx
import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';

export interface ConditionNodeData {
  condition: string;
  operator: 'eq' | 'ne' | 'gt' | 'lt' | 'ge' | 'le' | 'exists' | 'empty';
  value?: string;
}

export const ConditionNode = memo<NodeProps<ConditionNodeData>>(({ data, selected }) => {
  return (
    <div className={`condition-node ${selected ? 'selected' : ''}`}>
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
        />
        <select value={data.operator || 'eq'} className="node-select">
          <option value="eq">Equal (==)</option>
          <option value="ne">Not Equal (!=)</option>
          <option value="gt">Greater (&gt;)</option>
          <option value="lt">Less (&lt;)</option>
          <option value="ge">Greater Equal (&gt;=)</option>
          <option value="le">Less Equal (&lt;=)</option>
          <option value="exists">File Exists (-e)</option>
          <option value="empty">Is Empty (-z)</option>
        </select>
        {!['exists', 'empty'].includes(data.operator) && (
          <input
            type="text"
            value={data.value || ''}
            placeholder="Value..."
            className="node-input"
          />
        )}
      </div>
      <Handle type="source" position={Position.Bottom} id="true" style={{ left: '30%' }} />
      <Handle type="source" position={Position.Bottom} id="false" style={{ left: '70%' }} />
    </div>
  );
});
```

### 4. ループノードの実装
```typescript
// src/webview/nodeTypes/LoopNode.tsx
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
    <div className={`loop-node ${selected ? 'selected' : ''}`}>
      <Handle type="target" position={Position.Top} />
      <div className="node-header">
        <span className="node-icon">🔄</span>
        <span className="node-title">Loop</span>
      </div>
      <div className="node-content">
        <select
          value={data.loopType || 'for'}
          className="node-select"
          onChange={(e) => {
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
            />
            <input
              type="text"
              value={data.list || ''}
              placeholder="List or range..."
              className="node-input"
            />
          </>
        ) : (
          <input
            type="text"
            value={data.condition || ''}
            placeholder="Condition..."
            className="node-input"
          />
        )}
      </div>
      <Handle type="source" position={Position.Right} id="loop-body" />
      <Handle type="source" position={Position.Bottom} id="loop-end" />
    </div>
  );
});
```

### 5. 変数ノードの実装
```typescript
// src/webview/nodeTypes/VariableNode.tsx
import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';

export interface VariableNodeData {
  name: string;
  value: string;
  scope: 'local' | 'export';
}

export const VariableNode = memo<NodeProps<VariableNodeData>>(({ data, selected }) => {
  return (
    <div className={`variable-node ${selected ? 'selected' : ''}`}>
      <Handle type="target" position={Position.Top} />
      <div className="node-header">
        <span className="node-icon">📦</span>
        <span className="node-title">Variable</span>
      </div>
      <div className="node-content">
        <select value={data.scope || 'local'} className="node-select">
          <option value="local">Local</option>
          <option value="export">Export</option>
        </select>
        <input
          type="text"
          value={data.name || ''}
          placeholder="Variable name..."
          className="node-input"
        />
        <input
          type="text"
          value={data.value || ''}
          placeholder="Value..."
          className="node-input"
        />
      </div>
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
});
```

### 6. ノードスタイル
```css
/* src/webview/styles/nodes.css */
.command-node,
.pipe-node,
.condition-node,
.loop-node,
.variable-node {
  background: var(--vscode-editor-background);
  border: 2px solid var(--vscode-panel-border);
  border-radius: 8px;
  padding: 0;
  min-width: 200px;
  font-size: 12px;
}

.node-header {
  display: flex;
  align-items: center;
  padding: 8px;
  background: var(--vscode-titleBar-activeBackground);
  border-radius: 6px 6px 0 0;
  border-bottom: 1px solid var(--vscode-panel-border);
}

.node-icon {
  margin-right: 8px;
}

.node-title {
  font-weight: 600;
}

.node-content {
  padding: 8px;
}

.node-input,
.node-textarea,
.node-select {
  width: 100%;
  padding: 4px;
  margin: 4px 0;
  background: var(--vscode-input-background);
  color: var(--vscode-input-foreground);
  border: 1px solid var(--vscode-input-border);
  border-radius: 4px;
  font-family: var(--vscode-editor-font-family);
  font-size: 12px;
}

.node-textarea {
  resize: vertical;
  min-height: 40px;
}

.selected {
  border-color: var(--vscode-focusBorder);
  box-shadow: 0 0 0 1px var(--vscode-focusBorder);
}
```

## 成果物
- src/webview/nodeTypes/CommandNode.tsx
- src/webview/nodeTypes/PipeNode.tsx
- src/webview/nodeTypes/ConditionNode.tsx
- src/webview/nodeTypes/LoopNode.tsx
- src/webview/nodeTypes/VariableNode.tsx
- src/webview/styles/nodes.css

## テスト方法
1. 各ノードタイプが正しく表示される
2. ノード内のフォームが動作する
3. ハンドル（接続ポイント）が正しい位置に表示される
4. 選択状態のスタイルが適用される

## 完了条件
- [ ] コマンドノードが実装されている
- [ ] パイプノードが実装されている
- [ ] 条件分岐ノードが実装されている
- [ ] ループノードが実装されている
- [ ] 変数ノードが実装されている
- [ ] ノードのスタイリングが完了している