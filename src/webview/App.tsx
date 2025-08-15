import React, { useState, useEffect, useCallback } from 'react';
import ReactFlow, {
    Node,
    Edge,
    Controls,
    Background,
    MiniMap,
    useNodesState,
    useEdgesState,
    Connection,
    addEdge,
    BackgroundVariant,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { 
    initialNodes, 
    initialEdges, 
    reactFlowProps,
    defaultNodeStyle,
    connectionLineStyle,
    defaultEdgeOptions 
} from './config/reactFlowConfig';

declare global {
    interface Window {
        vscode: {
            postMessage: (message: any) => void;
        };
    }
}

const App: React.FC = () => {
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);
    const [scriptContent, setScriptContent] = useState<string>('');

    // VSCodeからのメッセージを受信
    useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            const message = event.data;
            switch (message.command) {
                case 'setScript':
                    setScriptContent(message.script);
                    // TODO: パーサー実装後、スクリプトをノードに変換
                    loadScriptAsNodes(message.script);
                    break;
                case 'updateNodes':
                    setNodes(message.nodes);
                    setEdges(message.edges);
                    break;
            }
        };

        window.addEventListener('message', handleMessage);
        
        // 初期スクリプトを要求
        window.vscode.postMessage({
            command: 'getScript'
        });

        return () => window.removeEventListener('message', handleMessage);
    }, []);

    // スクリプトをノードに変換（仮実装）
    const loadScriptAsNodes = (scriptContent: string) => {
        console.log('Loading script:', scriptContent);
        
        // デモ用の初期ノードを設定から読み込み
        setNodes(initialNodes);
        setEdges(initialEdges);
    };

    // エッジ接続時のハンドラー
    const onConnect = useCallback(
        (params: Connection) => setEdges((eds) => addEdge({...params, ...defaultEdgeOptions}, eds)),
        [setEdges]
    );

    // ノードを保存
    const saveNodes = () => {
        // TODO: ノードをスクリプトに変換する処理を実装
        window.vscode.postMessage({
            command: 'updateScript',
            script: generateScriptFromNodes(),
        });
    };

    // ノードからスクリプトを生成（仮実装）
    const generateScriptFromNodes = () => {
        // TODO: 実際の変換ロジックを実装
        return '#!/bin/bash\n# Generated from nodes\necho "Hello World"';
    };

    return (
        <div style={{ width: '100vw', height: '100vh' }}>
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                connectionLineStyle={connectionLineStyle}
                {...reactFlowProps}
            >
                <Background 
                    variant={BackgroundVariant.Dots} 
                    gap={12} 
                    size={1} 
                />
                <Controls />
                <MiniMap 
                    nodeColor={() => 'var(--vscode-editor-background)'}
                    style={{
                        backgroundColor: 'var(--vscode-editor-background)',
                        border: '1px solid var(--vscode-panel-border)',
                    }}
                />
            </ReactFlow>
            <button 
                onClick={saveNodes}
                style={{
                    position: 'absolute',
                    top: 10,
                    right: 10,
                    zIndex: 10,
                    padding: '8px 16px',
                    backgroundColor: 'var(--vscode-button-background)',
                    color: 'var(--vscode-button-foreground)',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                }}
            >
                Save to Script
            </button>
        </div>
    );
};

export default App;