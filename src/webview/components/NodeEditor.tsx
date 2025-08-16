import React, { useCallback, useRef, useState, useEffect } from 'react';
import ReactFlow, {
  ReactFlowProvider,
  addEdge,
  useNodesState,
  useEdgesState,
  Connection,
  Edge,
  Node,
  ReactFlowInstance,
  Controls,
  Background,
  BackgroundVariant,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { nodeTypes, defaultViewport, connectionLineStyle, defaultEdgeOptions } from '../config/reactFlowConfig';

// ノード実行コンテキスト
export const NodeExecutionContext = React.createContext<NodeExecutionContext | null>(null);

// ノード実行結果の型定義
interface NodeExecutionResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}

// ノード実行コンテキスト
interface NodeExecutionContext {
  executeNode: (nodeId: string) => Promise<NodeExecutionResult>;
  getConnectedNodes: (nodeId: string, direction: 'input' | 'output') => Node[];
  getNodeInputData: (nodeId: string) => string[];
  updateNodeData: (nodeId: string, data: any) => void;
}

interface NodeEditorProps {
  initialNodes?: Node[];
  initialEdges?: Edge[];
  onNodesChange?: (nodes: Node[]) => void;
  onEdgesChange?: (edges: Edge[]) => void;
  onNodeSelect?: (node: Node | null) => void;
}

export const NodeEditor: React.FC<NodeEditorProps> = ({
  initialNodes = [],
  initialEdges = [],
  onNodesChange,
  onEdgesChange,
  onNodeSelect,
}) => {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [nodes, setNodes, onNodesChangeInternal] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChangeInternal] = useEdgesState(initialEdges);
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);

  // 接続されたノードを取得する関数
  const getConnectedNodes = useCallback((nodeId: string, direction: 'input' | 'output'): Node[] => {
    const relevantEdges = edges.filter(edge => 
      direction === 'input' ? edge.target === nodeId : edge.source === nodeId
    );
    
    const connectedNodeIds = relevantEdges.map(edge => 
      direction === 'input' ? edge.source : edge.target
    );
    
    return nodes.filter(node => connectedNodeIds.includes(node.id));
  }, [edges, nodes]);

  // ノードの入力データを取得する関数
  const getNodeInputData = useCallback((nodeId: string): string[] => {
    const inputNodes = getConnectedNodes(nodeId, 'input');
    return inputNodes.map(node => {
      // MemoNodeの場合はcontentを、FunctionNodeの場合は最後の実行結果を返す
      if (node.type === 'memo') {
        return node.data?.content || '';
      } else if (node.type === 'function') {
        return node.data?.executionResult || node.data?.lastOutput || '';
      }
      return '';
    });
  }, [getConnectedNodes]);

  // ノードデータを更新する関数
  const updateNodeData = useCallback((nodeId: string, data: any) => {
    setNodes(nds => nds.map(node => 
      node.id === nodeId ? { ...node, data: { ...node.data, ...data } } : node
    ));
  }, [setNodes]);

  // ノードを実行する関数
  const executeNode = useCallback(async (nodeId: string): Promise<NodeExecutionResult> => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node) {
      throw new Error(`Node ${nodeId} not found`);
    }

    // 入力データを取得
    const inputData = getNodeInputData(nodeId);
    
    // ノードタイプに応じて実行
    if (node.type === 'function') {
      // 実行中状態を設定
      updateNodeData(nodeId, { isExecuting: true });

      try {
        // VSCode拡張機能にbash実行を依頼
        const result = await executeBashFunction(node.data, inputData);
        
        // 実行結果をノードデータに保存
        updateNodeData(nodeId, {
          isExecuting: false,
          executionResult: result.stdout,
          lastOutput: result.stdout,
          lastError: result.stderr,
          lastExitCode: result.exitCode
        });

        // 接続先のノードに結果を伝播
        const outputNodes = getConnectedNodes(nodeId, 'output');
        outputNodes.forEach(outputNode => {
          if (outputNode.type === 'memo') {
            updateNodeData(outputNode.id, { content: result.stdout });
          }
        });

        return result;
      } catch (error) {
        updateNodeData(nodeId, {
          isExecuting: false,
          executionResult: `Error: ${error}`,
          lastError: error?.toString() || 'Unknown error'
        });
        throw error;
      }
    }

    // MemoNodeやその他のノードは単純に成功を返す
    return { stdout: '', stderr: '', exitCode: 0 };
  }, [nodes, getNodeInputData, updateNodeData, getConnectedNodes]);

  // VSCode拡張機能にbash実行を依頼する関数
  const executeBashFunction = async (nodeData: any, inputArgs: string[]): Promise<NodeExecutionResult> => {
    console.log('executeBashFunction called:', { nodeData, inputArgs });
    console.log('window.vscode available:', typeof window !== 'undefined' && (window as any).vscode);
    
    return new Promise((resolve, reject) => {
      if (typeof window !== 'undefined' && (window as any).vscode) {
        // リスナーを設定
        const handleMessage = (event: MessageEvent) => {
          if (event.data.command === 'bashExecutionResult') {
            window.removeEventListener('message', handleMessage);
            if (event.data.success) {
              resolve({
                stdout: event.data.stdout || '',
                stderr: event.data.stderr || '',
                exitCode: event.data.exitCode || 0
              });
            } else {
              reject(new Error(event.data.error || 'Execution failed'));
            }
          }
        };
        
        window.addEventListener('message', handleMessage);

        // VSCodeにメッセージを送信
        (window as any).vscode.postMessage({
          command: 'executeBashFunction',
          functionBody: nodeData.functionBody || 'echo "No function body"',
          arguments: inputArgs,
          nodeId: nodeData.nodeId
        });

        // タイムアウト設定（10秒）
        setTimeout(() => {
          window.removeEventListener('message', handleMessage);
          reject(new Error('Execution timeout'));
        }, 10000);
      } else {
        // 開発時のモック
        console.log('Using mock execution');
        setTimeout(() => {
          const command = nodeData.functionBody || 'echo "hello"';
          const mockOutput = `Executed: ${command}\nArgs: ${inputArgs.join(', ')}`;
          console.log('Mock execution result:', mockOutput);
          resolve({
            stdout: mockOutput,
            stderr: '',
            exitCode: 0
          });
        }, 1000);
      }
    });
  };

  // 実行コンテキストの値
  const executionContextValue: NodeExecutionContext = {
    executeNode,
    getConnectedNodes,
    getNodeInputData,
    updateNodeData
  };

  const onConnect = useCallback(
    (params: Connection | Edge) => setEdges((eds) => addEdge({ ...params, ...defaultEdgeOptions }, eds)),
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

      // ノードタイプに応じた初期データを設定
      let nodeData: any = { label: `${type} node` };
      
      if (type === 'function') {
        nodeData = {
          functionName: 'my_function',
          parameters: ['param1'],
          functionBody: 'echo "Hello $1"',
          language: 'bash',
          isEditing: false,
          executionResult: '',
          isExecuting: false
        };
      } else if (type === 'memo') {
        nodeData = {
          content: '',
          isEditing: false
        };
      } else if (type === 'file') {
        nodeData = {
          filePath: '',
          content: '',
          isLoaded: false
        };
      } else if (type === 'connector') {
        nodeData = {
          connectorType: 'pass-through',
          condition: ''
        };
      }

      const newNode: Node = {
        id: `${type}_${Date.now()}`,
        type,
        position,
        data: nodeData,
      };
      
      console.log('Creating new node:', newNode);

      setNodes((nds) => nds.concat(newNode));
    },
    [reactFlowInstance, setNodes]
  );

  const onSelectionChange = useCallback(
    ({ nodes }: { nodes: Node[] }) => {
      if (onNodeSelect) {
        onNodeSelect(nodes.length > 0 ? nodes[0] : null);
      }
    },
    [onNodeSelect]
  );

  return (
    <NodeExecutionContext.Provider value={executionContextValue}>
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
          onSelectionChange={onSelectionChange}
          nodeTypes={nodeTypes}
          defaultViewport={defaultViewport}
          connectionLineStyle={connectionLineStyle}
          defaultEdgeOptions={defaultEdgeOptions}
          fitView
        >
          <Controls />
          <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
        </ReactFlow>
      </div>
    </NodeExecutionContext.Provider>
  );
};

export const NodeEditorWithProvider: React.FC<NodeEditorProps> = (props) => {
  return (
    <ReactFlowProvider>
      <NodeEditor {...props} />
    </ReactFlowProvider>
  );
};