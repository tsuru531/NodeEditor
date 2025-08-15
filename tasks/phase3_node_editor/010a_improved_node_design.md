# タスク010a: 改善されたノード設計

## 目的
データフロー指向のビジュアルプログラミングを実現するための改善されたノード設計を実装する

## 前提条件
- タスク009が完了している
- 基本的なノードタイプが実装されている

## 実装内容

### 1. スタイルの修正
```css
/* src/webview/styles/nodes.css の修正 */
.node-input,
.node-textarea,
.node-select {
  width: calc(100% - 12px);
  box-sizing: border-box;
  padding: 4px 6px;
  margin: 4px 0;
  background: var(--vscode-input-background);
  color: var(--vscode-input-foreground);
  border: 1px solid var(--vscode-input-border);
  border-radius: 4px;
  font-family: var(--vscode-editor-font-family);
  font-size: 12px;
}
```

### 2. StringNodeの実装
```typescript
// src/webview/nodeTypes/StringNode.tsx
import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';

export interface StringNodeData {
  value: string;
}

export const StringNode = memo<NodeProps<StringNodeData>>(({ data, selected }) => {
  return (
    <div className={`string-node literal-node ${selected ? 'selected' : ''}`}>
      <div className="node-header">
        <span className="node-icon">📝</span>
        <span className="node-title">String</span>
      </div>
      <div className="node-content">
        <input
          type="text"
          value={data.value || ''}
          placeholder="Enter string..."
          className="node-input"
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            data.value = e.target.value;
          }}
        />
      </div>
      <Handle type="source" position={Position.Bottom} id="output" />
    </div>
  );
});

StringNode.displayName = 'StringNode';
```

### 3. NumberNodeの実装
```typescript
// src/webview/nodeTypes/NumberNode.tsx
import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';

export interface NumberNodeData {
  value: number;
}

export const NumberNode = memo<NodeProps<NumberNodeData>>(({ data, selected }) => {
  return (
    <div className={`number-node literal-node ${selected ? 'selected' : ''}`}>
      <div className="node-header">
        <span className="node-icon">🔢</span>
        <span className="node-title">Number</span>
      </div>
      <div className="node-content">
        <input
          type="number"
          value={data.value || 0}
          placeholder="Enter number..."
          className="node-input"
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            data.value = parseFloat(e.target.value);
          }}
        />
      </div>
      <Handle type="source" position={Position.Bottom} id="output" />
    </div>
  );
});

NumberNode.displayName = 'NumberNode';
```

### 4. ArrayNodeの実装
```typescript
// src/webview/nodeTypes/ArrayNode.tsx
import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';

export interface ArrayNodeData {
  values: string[];
}

export const ArrayNode = memo<NodeProps<ArrayNodeData>>(({ data, selected }) => {
  return (
    <div className={`array-node literal-node ${selected ? 'selected' : ''}`}>
      <div className="node-header">
        <span className="node-icon">📚</span>
        <span className="node-title">Array</span>
      </div>
      <div className="node-content">
        <textarea
          value={data.values?.join('\n') || ''}
          placeholder="Enter values (one per line)..."
          className="node-textarea"
          rows={3}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
            data.values = e.target.value.split('\n').filter(v => v.trim());
          }}
        />
      </div>
      <Handle type="source" position={Position.Bottom} id="output" />
    </div>
  );
});

ArrayNode.displayName = 'ArrayNode';
```

### 5. OutputNodeの実装
```typescript
// src/webview/nodeTypes/OutputNode.tsx
import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';

export interface OutputNodeData {
  output: string;
  type: 'stdout' | 'stderr' | 'result';
}

export const OutputNode = memo<NodeProps<OutputNodeData>>(({ data, selected }) => {
  const getIcon = () => {
    switch (data.type) {
      case 'stderr': return '❌';
      case 'result': return '✅';
      default: return '📤';
    }
  };

  return (
    <div className={`output-node ${data.type}-output ${selected ? 'selected' : ''}`}>
      <Handle type="target" position={Position.Top} id="input" />
      <div className="node-header">
        <span className="node-icon">{getIcon()}</span>
        <span className="node-title">Output</span>
      </div>
      <div className="node-content">
        <div className="output-display">
          {data.output || 'No output yet...'}
        </div>
      </div>
    </div>
  );
});

OutputNode.displayName = 'OutputNode';
```

### 6. 改善されたCommandNode
```typescript
// src/webview/nodeTypes/CommandNode.tsx (改善版)
import React, { memo, useState } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';

export interface CommandNodeData {
  command: string;
  argCount: number;
  hasStdin: boolean;
}

export const CommandNode = memo<NodeProps<CommandNodeData>>(({ data, selected }) => {
  const [argCount, setArgCount] = useState(data.argCount || 1);

  return (
    <div className={`command-node custom-node ${selected ? 'selected' : ''}`}>
      {data.hasStdin && (
        <Handle type="target" position={Position.Top} id="stdin" />
      )}
      
      {/* 引数入力ポート */}
      {Array.from({ length: argCount }, (_, i) => (
        <Handle
          key={`arg${i}`}
          type="target"
          position={Position.Left}
          id={`arg${i}`}
          style={{ top: `${30 + i * 25}px` }}
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
          <button onClick={() => setArgCount(Math.max(0, argCount - 1))}>-</button>
          <span>Args: {argCount}</span>
          <button onClick={() => setArgCount(argCount + 1)}>+</button>
        </div>
      </div>
      
      {/* 出力ポート */}
      <Handle type="source" position={Position.Bottom} id="stdout" style={{ left: '30%' }} />
      <Handle type="source" position={Position.Bottom} id="stderr" style={{ left: '70%' }} />
    </div>
  );
});

CommandNode.displayName = 'CommandNode';
```

### 7. 改善されたVariableNode
```typescript
// src/webview/nodeTypes/VariableNode.tsx (改善版)
import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';

export interface VariableNodeData {
  name: string;
  value?: string;
  scope: 'local' | 'export';
  useInput: boolean;
}

export const VariableNode = memo<NodeProps<VariableNodeData>>(({ data, selected }) => {
  return (
    <div className={`variable-node custom-node ${selected ? 'selected' : ''}`}>
      {data.useInput && (
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
            checked={data.useInput || false}
            onChange={(e) => {
              data.useInput = e.target.checked;
            }}
          />
          Use input port
        </label>
        {!data.useInput && (
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
```

### 8. 追加スタイル
```css
/* src/webview/styles/nodes.css に追加 */
.literal-node {
  min-width: 150px;
  max-width: 200px;
}

.string-node { border-color: #4CAF50; }
.number-node { border-color: #2196F3; }
.array-node { border-color: #9C27B0; }
.output-node { border-color: #FF9800; }

.output-display {
  background: var(--vscode-textCodeBlock-background);
  border: 1px solid var(--vscode-panel-border);
  border-radius: 4px;
  padding: 8px;
  font-family: 'Courier New', Courier, monospace;
  font-size: 11px;
  min-height: 50px;
  max-height: 150px;
  overflow-y: auto;
  white-space: pre-wrap;
  word-break: break-all;
}

.arg-controls {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 8px;
}

.arg-controls button {
  width: 24px;
  height: 24px;
  border: 1px solid var(--vscode-button-border);
  background: var(--vscode-button-background);
  color: var(--vscode-button-foreground);
  border-radius: 4px;
  cursor: pointer;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  margin: 4px 0;
}
```

## 成果物
- 修正されたsrc/webview/styles/nodes.css
- src/webview/nodeTypes/StringNode.tsx
- src/webview/nodeTypes/NumberNode.tsx
- src/webview/nodeTypes/ArrayNode.tsx
- src/webview/nodeTypes/OutputNode.tsx
- 改善されたCommandNode.tsx
- 改善されたVariableNode.tsx

## テスト方法
1. 各リテラルノードが正しく値を保持できる
2. CommandNodeで引数ポートを動的に追加/削除できる
3. VariableNodeで入力ポートの使用を切り替えられる
4. OutputNodeが結果を表示できる
5. スタイルのはみ出し問題が解決されている

## 完了条件
- [ ] スタイルの修正が完了
- [ ] リテラルノードが実装されている
- [ ] OutputNodeが実装されている
- [ ] CommandNodeが改善されている
- [ ] VariableNodeが改善されている