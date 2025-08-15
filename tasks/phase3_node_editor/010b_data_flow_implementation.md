# タスク010b: データフロー実装

## 目的
ノード間でデータを受け渡すメカニズムを実装し、真のビジュアルプログラミングを実現する

## 前提条件
- タスク010aが完了している
- 改善されたノード設計が実装されている

## 実装内容

### 1. データフローコンテキストの作成
```typescript
// src/webview/providers/DataFlowProvider.tsx
import React, { createContext, useContext, useState, useCallback } from 'react';
import { Node, Edge } from 'reactflow';

interface DataFlowContextType {
  nodeOutputs: Map<string, any>;
  setNodeOutput: (nodeId: string, portId: string, value: any) => void;
  getNodeInput: (nodeId: string, portId: string, nodes: Node[], edges: Edge[]) => any;
  executeNode: (node: Node, nodes: Node[], edges: Edge[]) => Promise<void>;
}

const DataFlowContext = createContext<DataFlowContextType>({
  nodeOutputs: new Map(),
  setNodeOutput: () => {},
  getNodeInput: () => null,
  executeNode: async () => {},
});

export const useDataFlow = () => useContext(DataFlowContext);

export const DataFlowProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [nodeOutputs, setNodeOutputs] = useState<Map<string, any>>(new Map());

  const setNodeOutput = useCallback((nodeId: string, portId: string, value: any) => {
    setNodeOutputs(prev => {
      const newMap = new Map(prev);
      const key = `${nodeId}:${portId}`;
      newMap.set(key, value);
      return newMap;
    });
  }, []);

  const getNodeInput = useCallback((nodeId: string, portId: string, nodes: Node[], edges: Edge[]) => {
    // 該当ノードの入力ポートに接続されているエッジを探す
    const edge = edges.find(e => e.target === nodeId && e.targetHandle === portId);
    if (!edge) return null;

    // 接続元のノードの出力を取得
    const sourceKey = `${edge.source}:${edge.sourceHandle || 'output'}`;
    return nodeOutputs.get(sourceKey);
  }, [nodeOutputs]);

  const executeNode = useCallback(async (node: Node, nodes: Node[], edges: Edge[]) => {
    switch (node.type) {
      case 'string':
        setNodeOutput(node.id, 'output', node.data.value);
        break;
      
      case 'number':
        setNodeOutput(node.id, 'output', node.data.value);
        break;
      
      case 'array':
        setNodeOutput(node.id, 'output', node.data.values);
        break;
      
      case 'command':
        const command = node.data.command;
        const args = [];
        
        // 引数を入力ポートから取得
        for (let i = 0; i < node.data.argCount; i++) {
          const arg = getNodeInput(node.id, `arg${i}`, nodes, edges);
          if (arg !== null) args.push(arg);
        }
        
        // コマンド実行のシミュレーション
        const result = `$ ${command} ${args.join(' ')}`;
        setNodeOutput(node.id, 'stdout', result);
        setNodeOutput(node.id, 'stderr', '');
        break;
      
      case 'variable':
        let value;
        if (node.data.useInput) {
          value = getNodeInput(node.id, 'input', nodes, edges);
        } else {
          value = node.data.value;
        }
        setNodeOutput(node.id, 'output', value);
        break;
      
      case 'output':
        const input = getNodeInput(node.id, 'input', nodes, edges);
        // OutputNodeのデータを更新
        node.data.output = String(input || '');
        break;
    }
  }, [getNodeInput, setNodeOutput]);

  return (
    <DataFlowContext.Provider value={{
      nodeOutputs,
      setNodeOutput,
      getNodeInput,
      executeNode,
    }}>
      {children}
    </DataFlowContext.Provider>
  );
};
```

### 2. 実行エンジンの実装
```typescript
// src/webview/utils/ExecutionEngine.ts
import { Node, Edge } from 'reactflow';

export class ExecutionEngine {
  private executionOrder: string[] = [];
  
  // トポロジカルソートでノードの実行順序を決定
  private topologicalSort(nodes: Node[], edges: Edge[]): string[] {
    const adjacencyList = new Map<string, string[]>();
    const inDegree = new Map<string, number>();
    
    // 初期化
    nodes.forEach(node => {
      adjacencyList.set(node.id, []);
      inDegree.set(node.id, 0);
    });
    
    // グラフ構築
    edges.forEach(edge => {
      const sourceList = adjacencyList.get(edge.source) || [];
      sourceList.push(edge.target);
      adjacencyList.set(edge.source, sourceList);
      
      inDegree.set(edge.target, (inDegree.get(edge.target) || 0) + 1);
    });
    
    // トポロジカルソート
    const queue: string[] = [];
    const result: string[] = [];
    
    // 入次数0のノードをキューに追加
    inDegree.forEach((degree, nodeId) => {
      if (degree === 0) queue.push(nodeId);
    });
    
    while (queue.length > 0) {
      const nodeId = queue.shift()!;
      result.push(nodeId);
      
      const neighbors = adjacencyList.get(nodeId) || [];
      neighbors.forEach(neighbor => {
        const newDegree = (inDegree.get(neighbor) || 0) - 1;
        inDegree.set(neighbor, newDegree);
        if (newDegree === 0) queue.push(neighbor);
      });
    }
    
    return result;
  }
  
  public async execute(
    nodes: Node[], 
    edges: Edge[], 
    executeNode: (node: Node, nodes: Node[], edges: Edge[]) => Promise<void>
  ): Promise<void> {
    this.executionOrder = this.topologicalSort(nodes, edges);
    
    // 実行順序に従ってノードを実行
    for (const nodeId of this.executionOrder) {
      const node = nodes.find(n => n.id === nodeId);
      if (node) {
        await executeNode(node, nodes, edges);
      }
    }
  }
  
  public getExecutionOrder(): string[] {
    return this.executionOrder;
  }
}
```

### 3. 実行ボタンとステータス表示
```typescript
// src/webview/components/ExecutionControls.tsx
import React, { useState } from 'react';
import { useReactFlow } from 'reactflow';
import { useDataFlow } from '../providers/DataFlowProvider';
import { ExecutionEngine } from '../utils/ExecutionEngine';

export const ExecutionControls: React.FC = () => {
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionStatus, setExecutionStatus] = useState<string>('');
  const { getNodes, getEdges } = useReactFlow();
  const { executeNode } = useDataFlow();
  
  const handleExecute = async () => {
    setIsExecuting(true);
    setExecutionStatus('Executing...');
    
    try {
      const nodes = getNodes();
      const edges = getEdges();
      const engine = new ExecutionEngine();
      
      await engine.execute(nodes, edges, executeNode);
      
      setExecutionStatus('Execution completed');
    } catch (error) {
      setExecutionStatus(`Error: ${error.message}`);
    } finally {
      setIsExecuting(false);
    }
  };
  
  return (
    <div className="execution-controls">
      <button 
        onClick={handleExecute}
        disabled={isExecuting}
        className="execute-button"
      >
        {isExecuting ? '⏳ Executing...' : '▶️ Execute'}
      </button>
      {executionStatus && (
        <div className="execution-status">
          {executionStatus}
        </div>
      )}
    </div>
  );
};
```

### 4. ノード接続バリデーション
```typescript
// src/webview/utils/ConnectionValidator.ts
import { Connection, Node } from 'reactflow';

export class ConnectionValidator {
  // ポートタイプの定義
  private static portTypes = {
    string: ['string', 'any'],
    number: ['number', 'any'],
    array: ['array', 'any'],
    any: ['string', 'number', 'array', 'any'],
  };
  
  public static isValidConnection(
    connection: Connection,
    nodes: Node[]
  ): boolean {
    const sourceNode = nodes.find(n => n.id === connection.source);
    const targetNode = nodes.find(n => n.id === connection.target);
    
    if (!sourceNode || !targetNode) return false;
    
    // 同じノードへの接続を防ぐ
    if (connection.source === connection.target) return false;
    
    // ノードタイプに基づいた検証
    const sourceType = this.getPortType(sourceNode, connection.sourceHandle);
    const targetType = this.getPortType(targetNode, connection.targetHandle);
    
    return this.areTypesCompatible(sourceType, targetType);
  }
  
  private static getPortType(node: Node, handle: string | null): string {
    // ノードタイプとハンドルに基づいてポートタイプを決定
    switch (node.type) {
      case 'string': return 'string';
      case 'number': return 'number';
      case 'array': return 'array';
      case 'command':
        if (handle?.startsWith('arg')) return 'any';
        if (handle === 'stdout' || handle === 'stderr') return 'string';
        return 'any';
      case 'variable': return 'any';
      case 'output': return 'any';
      default: return 'any';
    }
  }
  
  private static areTypesCompatible(sourceType: string, targetType: string): boolean {
    const compatibleTypes = this.portTypes[targetType] || ['any'];
    return compatibleTypes.includes(sourceType);
  }
}
```

### 5. データフロー表示コンポーネント
```typescript
// src/webview/components/DataFlowDebugger.tsx
import React from 'react';
import { useDataFlow } from '../providers/DataFlowProvider';

export const DataFlowDebugger: React.FC = () => {
  const { nodeOutputs } = useDataFlow();
  
  return (
    <div className="dataflow-debugger">
      <h4>Data Flow Debug</h4>
      <div className="debug-content">
        {Array.from(nodeOutputs.entries()).map(([key, value]) => (
          <div key={key} className="debug-item">
            <span className="debug-key">{key}:</span>
            <span className="debug-value">{JSON.stringify(value)}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
```

### 6. スタイル定義
```css
/* src/webview/styles/dataflow.css */
.execution-controls {
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 10;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.execute-button {
  padding: 8px 16px;
  background: var(--vscode-button-background);
  color: var(--vscode-button-foreground);
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.execute-button:hover:not(:disabled) {
  background: var(--vscode-button-hoverBackground);
}

.execute-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.execution-status {
  padding: 6px 12px;
  background: var(--vscode-textBlockQuote-background);
  border: 1px solid var(--vscode-textBlockQuote-border);
  border-radius: 4px;
  font-size: 12px;
  max-width: 200px;
}

.dataflow-debugger {
  position: absolute;
  bottom: 10px;
  left: 10px;
  background: var(--vscode-editor-background);
  border: 1px solid var(--vscode-panel-border);
  border-radius: 4px;
  padding: 8px;
  max-width: 300px;
  max-height: 200px;
  overflow-y: auto;
  z-index: 10;
  font-size: 11px;
}

.debug-content {
  margin-top: 8px;
}

.debug-item {
  display: flex;
  gap: 8px;
  margin-bottom: 4px;
  font-family: 'Courier New', Courier, monospace;
}

.debug-key {
  color: var(--vscode-symbolIcon-variableForeground);
  font-weight: bold;
}

.debug-value {
  color: var(--vscode-symbolIcon-stringForeground);
  word-break: break-all;
}
```

## 成果物
- src/webview/providers/DataFlowProvider.tsx
- src/webview/utils/ExecutionEngine.ts
- src/webview/components/ExecutionControls.tsx
- src/webview/utils/ConnectionValidator.ts
- src/webview/components/DataFlowDebugger.tsx
- src/webview/styles/dataflow.css

## テスト方法
1. ノード間でデータが正しく受け渡される
2. 実行順序が依存関係に基づいて決定される
3. 接続バリデーションが機能する
4. 実行結果がOutputNodeに表示される
5. デバッガーでデータフローを確認できる

## 完了条件
- [ ] DataFlowProviderが実装されている
- [ ] ExecutionEngineが実装されている
- [ ] 実行コントロールが実装されている
- [ ] 接続バリデーションが実装されている
- [ ] デバッグ表示が実装されている