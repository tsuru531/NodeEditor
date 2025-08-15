import { Node, Edge, ConnectionLineType, MarkerType } from 'reactflow';

// デフォルトのビューポート設定
export const defaultViewport = { 
    x: 0, 
    y: 0, 
    zoom: 1 
};

// ノードタイプの定義（後で実装予定）
export const nodeTypes = {
    // command: CommandNode,
    // pipe: PipeNode,
    // condition: ConditionNode,
    // loop: LoopNode,
    // variable: VariableNode,
    // function: FunctionNode,
};

// エッジタイプの定義（後で実装予定）
export const edgeTypes = {
    // default: DefaultEdge,
    // conditional: ConditionalEdge,
};

// 接続線のスタイル
export const connectionLineStyle = {
    strokeWidth: 2,
    stroke: 'var(--edge-color)',
    type: ConnectionLineType.SmoothStep,
};

// デフォルトのエッジオプション
export const defaultEdgeOptions = {
    type: 'smoothstep',
    animated: false,
    style: {
        strokeWidth: 2,
        stroke: 'var(--edge-color)',
    },
    markerEnd: {
        type: MarkerType.ArrowClosed,
        width: 20,
        height: 20,
        color: 'var(--edge-color)',
    },
};

// React Flowのデフォルトプロップス
export const reactFlowProps = {
    fitView: true,
    fitViewOptions: {
        padding: 0.2,
    },
    snapToGrid: true,
    snapGrid: [15, 15] as [number, number],
    defaultViewport: defaultViewport,
    minZoom: 0.2,
    maxZoom: 4,
    attributionPosition: 'bottom-left' as const,
    proOptions: { hideAttribution: true },
};

// ノードのデフォルトスタイル
export const defaultNodeStyle = {
    background: 'var(--vscode-editor-background)',
    color: 'var(--vscode-editor-foreground)',
    border: '1px solid var(--vscode-panel-border)',
    borderRadius: '4px',
    fontSize: '12px',
    fontFamily: 'var(--vscode-font-family)',
    padding: '10px',
};

// サンプルノード（デモ用）
export const initialNodes: Node[] = [
    {
        id: 'demo-1',
        type: 'input',
        data: { label: '#!/bin/bash' },
        position: { x: 250, y: 0 },
        style: defaultNodeStyle,
    },
    {
        id: 'demo-2',
        data: { label: 'echo "Hello, Node Editor!"' },
        position: { x: 250, y: 100 },
        style: defaultNodeStyle,
    },
    {
        id: 'demo-3',
        data: { label: 'ls -la' },
        position: { x: 100, y: 200 },
        style: defaultNodeStyle,
    },
    {
        id: 'demo-4',
        data: { label: 'pwd' },
        position: { x: 400, y: 200 },
        style: defaultNodeStyle,
    },
    {
        id: 'demo-5',
        type: 'output',
        data: { label: 'exit 0' },
        position: { x: 250, y: 300 },
        style: defaultNodeStyle,
    },
];

// サンプルエッジ（デモ用）
export const initialEdges: Edge[] = [
    {
        id: 'e1-2',
        source: 'demo-1',
        target: 'demo-2',
        ...defaultEdgeOptions,
    },
    {
        id: 'e2-3',
        source: 'demo-2',
        target: 'demo-3',
        ...defaultEdgeOptions,
    },
    {
        id: 'e2-4',
        source: 'demo-2',
        target: 'demo-4',
        ...defaultEdgeOptions,
    },
    {
        id: 'e3-5',
        source: 'demo-3',
        target: 'demo-5',
        ...defaultEdgeOptions,
    },
    {
        id: 'e4-5',
        source: 'demo-4',
        target: 'demo-5',
        ...defaultEdgeOptions,
    },
];