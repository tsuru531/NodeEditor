# タスク010c: 入力フィールドの問題修正

## 目的
ノードの入力フィールドで1文字ずつしか入力できない問題を修正し、適切な状態管理を実装する

## 背景
現在の実装では、入力のたびにノードが再レンダリングされ、フォーカスが失われるため、連続入力ができない

## 前提条件
- タスク010bまでが完了している
- リテラルノード（String, Number, Array）が実装されている

## 実装内容

### 1. StringNodeの修正
```typescript
// src/webview/nodeTypes/StringNode.tsx
import React, { memo, useState, useEffect } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { useReactFlow } from 'reactflow';

export interface StringNodeData {
  value: string;
}

export const StringNode = memo<NodeProps<StringNodeData>>(({ id, data, selected }) => {
  const [value, setValue] = useState(data.value || '');
  const { updateNodeData } = useReactFlow();

  useEffect(() => {
    setValue(data.value || '');
  }, [data.value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value);
  };

  const handleBlur = () => {
    updateNodeData(id, { value });
  };

  return (
    <div className={`string-node literal-node ${selected ? 'selected' : ''}`}>
      <div className="node-header">
        <span className="node-icon">📝</span>
        <span className="node-title">String</span>
      </div>
      <div className="node-content">
        <input
          type="text"
          value={value}
          placeholder="Enter string..."
          className="node-input"
          onChange={handleChange}
          onBlur={handleBlur}
        />
      </div>
      <Handle type="source" position={Position.Bottom} id="output" />
    </div>
  );
});

StringNode.displayName = 'StringNode';
```

### 2. NumberNodeの修正
```typescript
// src/webview/nodeTypes/NumberNode.tsx
import React, { memo, useState, useEffect } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { useReactFlow } from 'reactflow';

export interface NumberNodeData {
  value: number;
}

export const NumberNode = memo<NodeProps<NumberNodeData>>(({ id, data, selected }) => {
  const [value, setValue] = useState(data.value || 0);
  const { updateNodeData } = useReactFlow();

  useEffect(() => {
    setValue(data.value || 0);
  }, [data.value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseFloat(e.target.value) || 0;
    setValue(newValue);
  };

  const handleBlur = () => {
    updateNodeData(id, { value });
  };

  return (
    <div className={`number-node literal-node ${selected ? 'selected' : ''}`}>
      <div className="node-header">
        <span className="node-icon">🔢</span>
        <span className="node-title">Number</span>
      </div>
      <div className="node-content">
        <input
          type="number"
          value={value}
          placeholder="Enter number..."
          className="node-input"
          onChange={handleChange}
          onBlur={handleBlur}
        />
      </div>
      <Handle type="source" position={Position.Bottom} id="output" />
    </div>
  );
});

NumberNode.displayName = 'NumberNode';
```

### 3. ArrayNodeの修正
```typescript
// src/webview/nodeTypes/ArrayNode.tsx
import React, { memo, useState, useEffect } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { useReactFlow } from 'reactflow';

export interface ArrayNodeData {
  values: string[];
}

export const ArrayNode = memo<NodeProps<ArrayNodeData>>(({ id, data, selected }) => {
  const [text, setText] = useState(data.values?.join('\n') || '');
  const { updateNodeData } = useReactFlow();

  useEffect(() => {
    setText(data.values?.join('\n') || '');
  }, [data.values]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
  };

  const handleBlur = () => {
    const values = text.split('\n').filter(v => v.trim());
    updateNodeData(id, { values });
  };

  return (
    <div className={`array-node literal-node ${selected ? 'selected' : ''}`}>
      <div className="node-header">
        <span className="node-icon">📚</span>
        <span className="node-title">Array</span>
      </div>
      <div className="node-content">
        <textarea
          value={text}
          placeholder="Enter values (one per line)..."
          className="node-textarea"
          rows={3}
          onChange={handleChange}
          onBlur={handleBlur}
        />
      </div>
      <Handle type="source" position={Position.Bottom} id="output" />
    </div>
  );
});

ArrayNode.displayName = 'ArrayNode';
```

### 4. CommandNodeの修正
```typescript
// src/webview/nodeTypes/CommandNode.tsx（部分修正）
import React, { memo, useState, useEffect } from 'react';
import { Handle, Position, NodeProps, useReactFlow } from 'reactflow';

export interface CommandNodeData {
  command: string;
  argCount: number;
  hasStdin: boolean;
}

export const CommandNode = memo<NodeProps<CommandNodeData>>(({ id, data, selected }) => {
  const [command, setCommand] = useState(data.command || '');
  const [argCount, setArgCount] = useState(data.argCount || 0);
  const [hasStdin, setHasStdin] = useState(data.hasStdin || false);
  const { updateNodeData } = useReactFlow();

  useEffect(() => {
    setCommand(data.command || '');
    setArgCount(data.argCount || 0);
    setHasStdin(data.hasStdin || false);
  }, [data]);

  const handleCommandChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCommand(e.target.value);
  };

  const handleCommandBlur = () => {
    updateNodeData(id, { command, argCount, hasStdin });
  };

  const handleArgCountChange = (newCount: number) => {
    setArgCount(newCount);
    updateNodeData(id, { command, argCount: newCount, hasStdin });
  };

  const handleStdinChange = (checked: boolean) => {
    setHasStdin(checked);
    updateNodeData(id, { command, argCount, hasStdin: checked });
  };

  // ... 残りの実装
});
```

### 5. VariableNodeの修正
```typescript
// src/webview/nodeTypes/VariableNode.tsx（部分修正）
import React, { memo, useState, useEffect } from 'react';
import { Handle, Position, NodeProps, useReactFlow } from 'reactflow';

export interface VariableNodeData {
  name: string;
  value?: string;
  scope: 'local' | 'export';
  useInput: boolean;
}

export const VariableNode = memo<NodeProps<VariableNodeData>>(({ id, data, selected }) => {
  const [name, setName] = useState(data.name || '');
  const [value, setValue] = useState(data.value || '');
  const [scope, setScope] = useState(data.scope || 'local');
  const [useInput, setUseInput] = useState(data.useInput || false);
  const { updateNodeData } = useReactFlow();

  useEffect(() => {
    setName(data.name || '');
    setValue(data.value || '');
    setScope(data.scope || 'local');
    setUseInput(data.useInput || false);
  }, [data]);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);
  };

  const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value);
  };

  const handleBlur = () => {
    updateNodeData(id, { name, value, scope, useInput });
  };

  // ... 残りの実装
});
```

## 重要な変更点

1. **ローカルステートの使用**: 各ノードでuseStateを使用して入力値を管理
2. **updateNodeData APIの使用**: React FlowのupdateNodeData APIを使用してノードデータを更新
3. **onBlurイベント**: フォーカスが外れた時にデータを同期
4. **useEffectによる同期**: 外部からのデータ変更に対応

## テスト方法

1. StringNodeに複数文字を連続入力できることを確認
2. NumberNodeに数値を連続入力できることを確認
3. ArrayNodeに複数行のテキストを入力できることを確認
4. 入力後にフォーカスを外した時にデータが保存されることを確認
5. ノード間の接続が維持されることを確認

## 完了条件

- [ ] すべてのリテラルノードで連続入力が可能
- [ ] フォーカスが失われない
- [ ] データが適切に保存される
- [ ] React Flowの他の機能に影響がない
- [ ] パフォーマンスの問題がない