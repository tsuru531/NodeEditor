import { NodeTypes, EdgeTypes } from 'reactflow';
import { 
  CommandNode, 
  PipeNode, 
  ConditionNode, 
  LoopNode, 
  VariableNode,
  StringNode,
  NumberNode,
  ArrayNode,
  OutputNode
} from '../nodeTypes';

export const defaultViewport = { x: 0, y: 0, zoom: 1 };

export const nodeTypes: NodeTypes = {
  command: CommandNode,
  pipe: PipeNode,
  condition: ConditionNode,
  loop: LoopNode,
  variable: VariableNode,
  string: StringNode,
  number: NumberNode,
  array: ArrayNode,
  output: OutputNode,
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