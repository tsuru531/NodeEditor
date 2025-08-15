# タスク010d: 具体的なコマンドノードの実装

## 目的
汎用的な「Command」ノードではなく、具体的なBashコマンドごとの専用ノードを実装する

## 背景
各コマンドには固有のオプションやパラメータがあり、専用UIを提供することでユーザビリティが向上する

## 前提条件
- タスク010cが完了している
- 入力フィールドの問題が解決されている

## 実装内容

### 1. EchoNode - テキスト出力
```typescript
// src/webview/nodeTypes/commands/EchoNode.tsx
import React, { memo, useState, useEffect } from 'react';
import { Handle, Position, NodeProps, useReactFlow } from 'reactflow';

export interface EchoNodeData {
  text: string;
  newline: boolean;
}

export const EchoNode = memo<NodeProps<EchoNodeData>>(({ id, data, selected }) => {
  const [text, setText] = useState(data.text || '');
  const [newline, setNewline] = useState(data.newline !== false);
  const { updateNodeData } = useReactFlow();

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setText(e.target.value);
  };

  const handleBlur = () => {
    updateNodeData(id, { text, newline });
  };

  return (
    <div className={`echo-node command-node ${selected ? 'selected' : ''}`}>
      <Handle type="target" position={Position.Top} id="stdin" />
      <div className="node-header">
        <span className="node-icon">📢</span>
        <span className="node-title">echo</span>
      </div>
      <div className="node-content">
        <input
          type="text"
          value={text}
          placeholder="Text to echo..."
          className="node-input"
          onChange={handleTextChange}
          onBlur={handleBlur}
        />
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={!newline}
            onChange={(e) => {
              setNewline(!e.target.checked);
              updateNodeData(id, { text, newline: !e.target.checked });
            }}
          />
          -n (no newline)
        </label>
      </div>
      <Handle type="source" position={Position.Bottom} id="stdout" />
    </div>
  );
});

EchoNode.displayName = 'EchoNode';
```

### 2. GrepNode - パターン検索
```typescript
// src/webview/nodeTypes/commands/GrepNode.tsx
import React, { memo, useState, useEffect } from 'react';
import { Handle, Position, NodeProps, useReactFlow } from 'reactflow';

export interface GrepNodeData {
  pattern: string;
  ignoreCase: boolean;
  invert: boolean;
  count: boolean;
  lineNumber: boolean;
}

export const GrepNode = memo<NodeProps<GrepNodeData>>(({ id, data, selected }) => {
  const [pattern, setPattern] = useState(data.pattern || '');
  const [ignoreCase, setIgnoreCase] = useState(data.ignoreCase || false);
  const [invert, setInvert] = useState(data.invert || false);
  const [count, setCount] = useState(data.count || false);
  const [lineNumber, setLineNumber] = useState(data.lineNumber || false);
  const { updateNodeData } = useReactFlow();

  const handlePatternChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPattern(e.target.value);
  };

  const handleBlur = () => {
    updateNodeData(id, { pattern, ignoreCase, invert, count, lineNumber });
  };

  const handleOptionChange = (option: string, value: boolean) => {
    const updates = { pattern, ignoreCase, invert, count, lineNumber };
    updates[option] = value;
    updateNodeData(id, updates);
  };

  return (
    <div className={`grep-node command-node ${selected ? 'selected' : ''}`}>
      <Handle type="target" position={Position.Top} id="stdin" />
      <div className="node-header">
        <span className="node-icon">🔍</span>
        <span className="node-title">grep</span>
      </div>
      <div className="node-content">
        <input
          type="text"
          value={pattern}
          placeholder="Search pattern..."
          className="node-input"
          onChange={handlePatternChange}
          onBlur={handleBlur}
        />
        <div className="node-options">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={ignoreCase}
              onChange={(e) => {
                setIgnoreCase(e.target.checked);
                handleOptionChange('ignoreCase', e.target.checked);
              }}
            />
            -i (ignore case)
          </label>
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={invert}
              onChange={(e) => {
                setInvert(e.target.checked);
                handleOptionChange('invert', e.target.checked);
              }}
            />
            -v (invert)
          </label>
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={count}
              onChange={(e) => {
                setCount(e.target.checked);
                handleOptionChange('count', e.target.checked);
              }}
            />
            -c (count)
          </label>
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={lineNumber}
              onChange={(e) => {
                setLineNumber(e.target.checked);
                handleOptionChange('lineNumber', e.target.checked);
              }}
            />
            -n (line numbers)
          </label>
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} id="stdout" />
    </div>
  );
});

GrepNode.displayName = 'GrepNode';
```

### 3. LsNode - ファイル一覧
```typescript
// src/webview/nodeTypes/commands/LsNode.tsx
import React, { memo, useState, useEffect } from 'react';
import { Handle, Position, NodeProps, useReactFlow } from 'reactflow';

export interface LsNodeData {
  path: string;
  all: boolean;
  long: boolean;
  human: boolean;
  sortTime: boolean;
  reverse: boolean;
}

export const LsNode = memo<NodeProps<LsNodeData>>(({ id, data, selected }) => {
  const [path, setPath] = useState(data.path || '.');
  const [all, setAll] = useState(data.all || false);
  const [long, setLong] = useState(data.long || false);
  const [human, setHuman] = useState(data.human || false);
  const [sortTime, setSortTime] = useState(data.sortTime || false);
  const [reverse, setReverse] = useState(data.reverse || false);
  const { updateNodeData } = useReactFlow();

  const handlePathChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPath(e.target.value);
  };

  const handleBlur = () => {
    updateNodeData(id, { path, all, long, human, sortTime, reverse });
  };

  return (
    <div className={`ls-node command-node ${selected ? 'selected' : ''}`}>
      <div className="node-header">
        <span className="node-icon">📁</span>
        <span className="node-title">ls</span>
      </div>
      <div className="node-content">
        <input
          type="text"
          value={path}
          placeholder="Path (default: .)"
          className="node-input"
          onChange={handlePathChange}
          onBlur={handleBlur}
        />
        <div className="node-options-grid">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={all}
              onChange={(e) => {
                setAll(e.target.checked);
                updateNodeData(id, { path, all: e.target.checked, long, human, sortTime, reverse });
              }}
            />
            -a (all)
          </label>
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={long}
              onChange={(e) => {
                setLong(e.target.checked);
                updateNodeData(id, { path, all, long: e.target.checked, human, sortTime, reverse });
              }}
            />
            -l (long)
          </label>
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={human}
              onChange={(e) => {
                setHuman(e.target.checked);
                updateNodeData(id, { path, all, long, human: e.target.checked, sortTime, reverse });
              }}
            />
            -h (human)
          </label>
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={sortTime}
              onChange={(e) => {
                setSortTime(e.target.checked);
                updateNodeData(id, { path, all, long, human, sortTime: e.target.checked, reverse });
              }}
            />
            -t (time)
          </label>
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} id="stdout" />
    </div>
  );
});

LsNode.displayName = 'LsNode';
```

### 4. CatNode - ファイル表示
```typescript
// src/webview/nodeTypes/commands/CatNode.tsx
import React, { memo, useState } from 'react';
import { Handle, Position, NodeProps, useReactFlow } from 'reactflow';

export interface CatNodeData {
  showEnds: boolean;
  numberLines: boolean;
  squeezeBlank: boolean;
}

export const CatNode = memo<NodeProps<CatNodeData>>(({ id, data, selected }) => {
  const [showEnds, setShowEnds] = useState(data.showEnds || false);
  const [numberLines, setNumberLines] = useState(data.numberLines || false);
  const [squeezeBlank, setSqueezeBlank] = useState(data.squeezeBlank || false);
  const { updateNodeData } = useReactFlow();

  return (
    <div className={`cat-node command-node ${selected ? 'selected' : ''}`}>
      <Handle type="target" position={Position.Top} id="file" />
      <div className="node-header">
        <span className="node-icon">📄</span>
        <span className="node-title">cat</span>
      </div>
      <div className="node-content">
        <div className="node-options">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={showEnds}
              onChange={(e) => {
                setShowEnds(e.target.checked);
                updateNodeData(id, { showEnds: e.target.checked, numberLines, squeezeBlank });
              }}
            />
            -E (show ends)
          </label>
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={numberLines}
              onChange={(e) => {
                setNumberLines(e.target.checked);
                updateNodeData(id, { showEnds, numberLines: e.target.checked, squeezeBlank });
              }}
            />
            -n (number lines)
          </label>
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={squeezeBlank}
              onChange={(e) => {
                setSqueezeBlank(e.target.checked);
                updateNodeData(id, { showEnds, numberLines, squeezeBlank: e.target.checked });
              }}
            />
            -s (squeeze blank)
          </label>
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} id="stdout" />
    </div>
  );
});

CatNode.displayName = 'CatNode';
```

### 5. WcNode - 行数カウント
```typescript
// src/webview/nodeTypes/commands/WcNode.tsx
import React, { memo, useState } from 'react';
import { Handle, Position, NodeProps, useReactFlow } from 'reactflow';

export interface WcNodeData {
  lines: boolean;
  words: boolean;
  chars: boolean;
  bytes: boolean;
}

export const WcNode = memo<NodeProps<WcNodeData>>(({ id, data, selected }) => {
  const [lines, setLines] = useState(data.lines !== false);
  const [words, setWords] = useState(data.words !== false);
  const [chars, setChars] = useState(data.chars !== false);
  const [bytes, setBytes] = useState(data.bytes || false);
  const { updateNodeData } = useReactFlow();

  return (
    <div className={`wc-node command-node ${selected ? 'selected' : ''}`}>
      <Handle type="target" position={Position.Top} id="stdin" />
      <div className="node-header">
        <span className="node-icon">📊</span>
        <span className="node-title">wc</span>
      </div>
      <div className="node-content">
        <div className="node-options-grid">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={lines}
              onChange={(e) => {
                setLines(e.target.checked);
                updateNodeData(id, { lines: e.target.checked, words, chars, bytes });
              }}
            />
            -l (lines)
          </label>
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={words}
              onChange={(e) => {
                setWords(e.target.checked);
                updateNodeData(id, { lines, words: e.target.checked, chars, bytes });
              }}
            />
            -w (words)
          </label>
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={chars}
              onChange={(e) => {
                setChars(e.target.checked);
                updateNodeData(id, { lines, words, chars: e.target.checked, bytes });
              }}
            />
            -m (chars)
          </label>
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={bytes}
              onChange={(e) => {
                setBytes(e.target.checked);
                updateNodeData(id, { lines, words, chars, bytes: e.target.checked });
              }}
            />
            -c (bytes)
          </label>
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} id="stdout" />
    </div>
  );
});

WcNode.displayName = 'WcNode';
```

### 6. 追加スタイル
```css
/* src/webview/styles/command-nodes.css */
.echo-node { border-color: #4CAF50; }
.grep-node { border-color: #FF9800; }
.ls-node { border-color: #2196F3; }
.cat-node { border-color: #9C27B0; }
.wc-node { border-color: #00BCD4; }

.node-options {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-top: 8px;
}

.node-options-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4px;
  margin-top: 8px;
}

.command-node .node-header {
  background: var(--vscode-titleBar-activeBackground);
}

.command-node .node-title {
  font-family: 'Courier New', Courier, monospace;
  font-weight: bold;
}
```

### 7. ノードの登録
```typescript
// src/webview/nodeTypes/commands/index.ts
export { EchoNode } from './EchoNode';
export { GrepNode } from './GrepNode';
export { LsNode } from './LsNode';
export { CatNode } from './CatNode';
export { WcNode } from './WcNode';
```

### 8. reactFlowConfigの更新
```typescript
// src/webview/config/reactFlowConfig.ts に追加
import { 
  EchoNode,
  GrepNode,
  LsNode,
  CatNode,
  WcNode
} from '../nodeTypes/commands';

export const nodeTypes: NodeTypes = {
  // ... 既存のノード
  echo: EchoNode,
  grep: GrepNode,
  ls: LsNode,
  cat: CatNode,
  wc: WcNode,
};
```

### 9. NodePanelの更新
```typescript
// NodePanelのnodeTypes配列に追加
const commandNodes = [
  { type: 'echo', label: 'echo', icon: '📢', description: 'Output text' },
  { type: 'grep', label: 'grep', icon: '🔍', description: 'Search pattern' },
  { type: 'ls', label: 'ls', icon: '📁', description: 'List files' },
  { type: 'cat', label: 'cat', icon: '📄', description: 'Display file' },
  { type: 'wc', label: 'wc', icon: '📊', description: 'Count lines/words' },
];
```

## 成果物
- src/webview/nodeTypes/commands/EchoNode.tsx
- src/webview/nodeTypes/commands/GrepNode.tsx
- src/webview/nodeTypes/commands/LsNode.tsx
- src/webview/nodeTypes/commands/CatNode.tsx
- src/webview/nodeTypes/commands/WcNode.tsx
- src/webview/nodeTypes/commands/index.ts
- src/webview/styles/command-nodes.css

## テスト方法
1. 各コマンドノードが正しく表示される
2. オプションのチェックボックスが動作する
3. パラメータの入力が可能
4. ノード間の接続が可能
5. コマンドの組み合わせが作成できる

## 完了条件
- [ ] 5つの基本コマンドノードが実装されている
- [ ] 各ノードに適切なUIが実装されている
- [ ] オプションが正しく設定できる
- [ ] NodePanelから追加できる
- [ ] スタイリングが適用されている