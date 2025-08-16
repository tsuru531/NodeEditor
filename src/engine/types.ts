// ワークフロー実行エンジンの型定義

import { Node, Edge } from 'reactflow';

// グラフノード（実行時の内部表現）
export interface GraphNode {
  id: string;
  type: string;
  dependencies: string[];
  dependents: string[];
  level: number;
  data?: any;
}

// 実行計画
export interface ExecutionPlan {
  levels: string[][];
  totalNodes: number;
  maxParallelism: number;
  estimatedTime: number;
}

// グラフ解析結果
export interface GraphAnalysisResult {
  isValid: boolean;
  errors: string[];
  plan?: ExecutionPlan;
  cycles?: string[][];
}

// 実行状態
export enum ExecutionStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

// ノード実行状態
export interface NodeExecutionState {
  nodeId: string;
  status: ExecutionStatus;
  startTime?: number;
  endTime?: number;
  error?: string;
  output?: any;
  progress?: number;
}

// 実行コンテキスト
export interface ExecutionContext {
  executionId: string;
  nodes: Node[];
  edges: Edge[];
  nodeStates: Map<string, NodeExecutionState>;
  globalData: Map<string, any>;
  isRunning: boolean;
  startTime?: number;
  endTime?: number;
}

// データ転送タイプ
export interface DataTransfer {
  sourceNodeId: string;
  targetNodeId: string;
  sourceHandle: string;
  targetHandle: string;
  data: any;
  timestamp: number;
}

// エラータイプ
export interface ExecutionError {
  type: 'validation' | 'runtime' | 'timeout' | 'dependency';
  nodeId?: string;
  message: string;
  details?: any;
  timestamp: number;
}

// 実行統計
export interface ExecutionStats {
  totalNodes: number;
  completedNodes: number;
  failedNodes: number;
  averageExecutionTime: number;
  totalExecutionTime: number;
  parallelismUtilization: number;
}

// ハンドルタイプ定義
export enum HandleType {
  INPUT = 'input',
  OUTPUT = 'output',
  PARAMETER = 'parameter'
}

// データタイプ定義
export enum DataType {
  STRING = 'string',
  NUMBER = 'number',
  BOOLEAN = 'boolean',
  OBJECT = 'object',
  ARRAY = 'array',
  STREAM = 'stream',
  FILE = 'file'
}

// ハンドル定義
export interface HandleDefinition {
  id: string;
  type: HandleType;
  dataType: DataType;
  label: string;
  required: boolean;
  defaultValue?: any;
}

// ノードタイプ定義
export interface NodeTypeDefinition {
  type: string;
  label: string;
  description: string;
  inputs: HandleDefinition[];
  outputs: HandleDefinition[];
  parameters: HandleDefinition[];
  executor: string; // 実行クラス名
}