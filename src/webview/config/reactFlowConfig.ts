import { NodeTypes, EdgeTypes } from 'reactflow';
import { 
  // Canvasノードタイプ
  MemoNode,
  FileNode,
  FunctionNode,
  ConnectorNode
} from '../nodeTypes';

export const defaultViewport = { x: 0, y: 0, zoom: 1 };

export const nodeTypes: NodeTypes = {
  // Canvasノードタイプ
  memo: MemoNode,
  file: FileNode,
  function: FunctionNode,
  connector: ConnectorNode,
};

export const edgeTypes: EdgeTypes = {
  // エッジタイプは必要に応じて追加
};

export const connectionLineStyle = {
  strokeWidth: 2,
  stroke: 'var(--edge-color)',
};

export const defaultEdgeOptions = {
  animated: false,
  type: 'smoothstep',
};