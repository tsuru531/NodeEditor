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
import { ContextMenu } from './ContextMenu';
import { useHistory } from '../hooks/useHistory';
import { NotificationToast } from './NotificationToast';
import { useNotifications } from '../hooks/useNotifications';

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
  const [contextMenu, setContextMenu] = useState<{ isVisible: boolean; position: { x: number; y: number } }>({
    isVisible: false,
    position: { x: 0, y: 0 }
  });
  
  // Undo/Redo履歴管理
  const { canUndo, canRedo, undo, redo, pushState } = useHistory();
  
  // 通知システム
  const { notifications, removeNotification, showSuccess, showError, showInfo } = useNotifications();

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
    console.log(`getNodeInputData for nodeId ${nodeId}:`, inputNodes);
    return inputNodes.map(node => {
      console.log(`Processing input node:`, node);
      // MemoNodeの場合はcontentを、FunctionNodeの場合は最後の実行結果を返す
      if (node.type === 'memo') {
        const content = node.data?.content || '';
        console.log(`Memo node content:`, content);
        return content;
      } else if (node.type === 'function') {
        const result = node.data?.executionResult || node.data?.lastOutput || '';
        console.log(`Function node result:`, result);
        return result;
      }
      console.log(`Unknown node type: ${node.type}`);
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
        const result = await executeBashFunction({ ...node.data, nodeId }, inputData);
        
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
        console.log(`Output nodes for ${nodeId}:`, outputNodes);
        console.log(`Execution result stdout:`, result.stdout);
        outputNodes.forEach(outputNode => {
          console.log(`Processing output node:`, outputNode);
          if (outputNode.type === 'memo') {
            console.log(`Updating memo node ${outputNode.id} with content:`, result.stdout);
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

  // 履歴に状態を保存
  const saveToHistory = useCallback(() => {
    pushState(nodes, edges);
  }, [nodes, edges, pushState]);

  const onConnect = useCallback(
    (params: Connection | Edge) => {
      setEdges((eds) => addEdge({ ...params, ...defaultEdgeOptions }, eds));
      // 接続後に履歴保存
      setTimeout(() => saveToHistory(), 100);
    },
    [setEdges, saveToHistory]
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
      // ノード追加後に履歴保存
      setTimeout(() => saveToHistory(), 100);
    },
    [reactFlowInstance, setNodes, saveToHistory]
  );

  const onSelectionChange = useCallback(
    ({ nodes }: { nodes: Node[] }) => {
      if (onNodeSelect) {
        onNodeSelect(nodes.length > 0 ? nodes[0] : null);
      }
    },
    [onNodeSelect]
  );

  // キーボードショートカットのハンドリング
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // 入力フィールドにフォーカスが当たっている場合はショートカットを無効にする
    const activeElement = document.activeElement;
    if (activeElement?.tagName === 'INPUT' || activeElement?.tagName === 'TEXTAREA') {
      return;
    }

    // Ctrl+A: 全選択
    if (event.ctrlKey && event.key === 'a') {
      event.preventDefault();
      setNodes(nds => nds.map(node => ({ ...node, selected: true })));
      return;
    }

    // Delete: 選択されたノードを削除
    if (event.key === 'Delete' || event.key === 'Backspace') {
      event.preventDefault();
      const selectedNodes = nodes.filter(node => node.selected);
      const selectedNodeIds = selectedNodes.map(node => node.id);
      
      if (selectedNodeIds.length > 0) {
        // ノードを削除
        setNodes(nds => nds.filter(node => !selectedNodeIds.includes(node.id)));
        // 関連するエッジも削除
        setEdges(eds => eds.filter(edge => 
          !selectedNodeIds.includes(edge.source) && !selectedNodeIds.includes(edge.target)
        ));
      }
      return;
    }

    // Ctrl+C: コピー（将来の実装のため）
    if (event.ctrlKey && event.key === 'c') {
      event.preventDefault();
      const selectedNodes = nodes.filter(node => node.selected);
      if (selectedNodes.length > 0) {
        // 将来のコピー機能実装用
        console.log('Copy nodes:', selectedNodes);
      }
      return;
    }

    // Ctrl+Z: Undo
    if (event.ctrlKey && event.key === 'z' && !event.shiftKey) {
      event.preventDefault();
      if (canUndo) {
        const previousState = undo();
        if (previousState) {
          setNodes(previousState.nodes);
          setEdges(previousState.edges);
          showInfo('元に戻しました', '前の状態に復元しました');
        }
      } else {
        showInfo('元に戻せません', '履歴がありません');
      }
      return;
    }

    // Ctrl+Y または Ctrl+Shift+Z: Redo
    if ((event.ctrlKey && event.key === 'y') || (event.ctrlKey && event.shiftKey && event.key === 'z')) {
      event.preventDefault();
      if (canRedo) {
        const nextState = redo();
        if (nextState) {
          setNodes(nextState.nodes);
          setEdges(nextState.edges);
          showInfo('やり直しました', '次の状態に進みました');
        }
      } else {
        showInfo('やり直せません', 'やり直し履歴がありません');
      }
      return;
    }

    // Escape: 選択解除
    if (event.key === 'Escape') {
      event.preventDefault();
      setNodes(nds => nds.map(node => ({ ...node, selected: false })));
      setEdges(eds => eds.map(edge => ({ ...edge, selected: false })));
      return;
    }

    // Space: フィット表示
    if (event.key === ' ') {
      event.preventDefault();
      if (reactFlowInstance) {
        reactFlowInstance.fitView();
      }
      return;
    }
  }, [nodes, setNodes, setEdges, reactFlowInstance, canUndo, canRedo, undo, redo, showInfo]);

  // キーボードイベントリスナーの設定
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  // コンテキストメニューのハンドリング
  const handleContextMenu = useCallback((event: React.MouseEvent) => {
    event.preventDefault();
    setContextMenu({
      isVisible: true,
      position: { x: event.clientX, y: event.clientY }
    });
  }, []);

  const closeContextMenu = useCallback(() => {
    setContextMenu({ isVisible: false, position: { x: 0, y: 0 } });
  }, []);

  // コンテキストメニューからノードを追加
  const addNodeFromContextMenu = useCallback((nodeType: string) => {
    if (!reactFlowInstance) return;

    // マウス位置をcanvas座標に変換
    const reactFlowBounds = reactFlowWrapper.current?.getBoundingClientRect();
    if (!reactFlowBounds) return;

    const position = reactFlowInstance.project({
      x: contextMenu.position.x - reactFlowBounds.left,
      y: contextMenu.position.y - reactFlowBounds.top,
    });

    // ノードタイプに応じた初期データを設定
    let nodeData: any = { label: `${nodeType} node` };
    
    if (nodeType === 'function') {
      nodeData = {
        functionName: 'my_function',
        parameters: ['param1'],
        functionBody: 'echo "Hello $1"',
        language: 'bash',
        isEditing: false,
        executionResult: '',
        isExecuting: false
      };
    } else if (nodeType === 'memo') {
      nodeData = {
        content: '',
        isEditing: false
      };
    } else if (nodeType === 'file') {
      nodeData = {
        filePath: '',
        content: '',
        isLoaded: false
      };
    } else if (nodeType === 'connector') {
      nodeData = {
        connectorType: 'pass-through',
        condition: ''
      };
    }

    const newNode: Node = {
      id: `${nodeType}_${Date.now()}`,
      type: nodeType,
      position,
      data: nodeData,
    };

    setNodes((nds) => nds.concat(newNode));
    // コンテキストメニューからのノード追加後に履歴保存
    setTimeout(() => saveToHistory(), 100);
  }, [reactFlowInstance, contextMenu.position, setNodes, saveToHistory]);

  // 選択されたノードを削除
  const deleteSelectedNodes = useCallback(() => {
    const selectedNodes = nodes.filter(node => node.selected);
    const selectedNodeIds = selectedNodes.map(node => node.id);
    
    if (selectedNodeIds.length > 0) {
      setNodes(nds => nds.filter(node => !selectedNodeIds.includes(node.id)));
      setEdges(eds => eds.filter(edge => 
        !selectedNodeIds.includes(edge.source) && !selectedNodeIds.includes(edge.target)
      ));
    }
  }, [nodes, setNodes, setEdges]);

  // 選択されたノードをコピー
  const copySelectedNodes = useCallback(() => {
    const selectedNodes = nodes.filter(node => node.selected);
    if (selectedNodes.length > 0) {
      console.log('Copy nodes:', selectedNodes);
      // 将来のコピー機能実装用
    }
  }, [nodes]);

  // 全ノードを選択
  const selectAllNodes = useCallback(() => {
    setNodes(nds => nds.map(node => ({ ...node, selected: true })));
  }, [setNodes]);

  return (
    <NodeExecutionContext.Provider value={executionContextValue}>
      <div ref={reactFlowWrapper} style={{ width: '100%', height: '100%' }} onContextMenu={handleContextMenu}>
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
        <ContextMenu
          isVisible={contextMenu.isVisible}
          position={contextMenu.position}
          onClose={closeContextMenu}
          onAddNode={addNodeFromContextMenu}
          onDeleteSelected={deleteSelectedNodes}
          onCopySelected={copySelectedNodes}
          onSelectAll={selectAllNodes}
          hasSelectedNodes={nodes.some(node => node.selected)}
        />
        <NotificationToast
          notifications={notifications}
          onRemove={removeNotification}
        />
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