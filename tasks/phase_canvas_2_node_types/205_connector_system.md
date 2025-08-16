# タスク 205: 接続システム実装

## タスク概要

ノード間のデータフローを管理するConnectorシステムの実装を行う。ノード間の接続、データ変換、実行順序制御を提供する。

## 前提条件

- タスク201-204（すべてのノードタイプ）の完了
- React Flowの接続システムの理解
- データフロー制御の理解

## 実装内容

### 1. 接続システム データ構造

#### Connection インターフェース
```typescript
interface NodeConnection {
  id: string;                 // 接続ID
  sourceNodeId: string;       // 送信元ノードID
  sourceHandle: string;       // 送信元ハンドルID
  targetNodeId: string;       // 送信先ノードID
  targetHandle: string;       // 送信先ハンドルID
  dataType: DataType;         // データ型
  transform?: DataTransform;  // データ変換設定
  isActive: boolean;          // 接続有効フラグ
  metadata: ConnectionMetadata;
}

interface ConnectionMetadata {
  createdAt: Date;
  label?: string;             // 接続ラベル
  description?: string;       // 接続説明
  color?: string;             // 接続線の色
  isConditional: boolean;     // 条件付き接続
  condition?: string;         // 条件式
}

interface DataTransform {
  type: TransformType;
  config: any;                // 変換設定
  validation?: ValidationRule;
}

enum TransformType {
  NONE = 'none',              // 変換なし
  TYPE_CAST = 'typeCast',     // 型変換
  FORMAT = 'format',          // フォーマット変換
  FILTER = 'filter',          // フィルタリング
  MAP = 'map',                // マッピング
  AGGREGATE = 'aggregate',    // 集約
  CUSTOM = 'custom'           // カスタム変換
}
```

### 2. ハンドルシステム実装

#### NodeHandle コンポーネント
```typescript
interface NodeHandleProps {
  id: string;
  type: 'input' | 'output';
  dataType: DataType;
  position: HandlePosition;
  isConnected: boolean;
  isRequired: boolean;
  label?: string;
  description?: string;
  onConnect: (connection: Connection) => void;
  onDisconnect: (connectionId: string) => void;
}

interface HandleConfig {
  allowMultipleConnections: boolean; // 複数接続許可
  compatibleTypes: DataType[];       // 互換データ型
  maxConnections?: number;           // 最大接続数
  autoConvert: boolean;              // 自動型変換
}
```

#### ハンドル配置システム
```typescript
interface HandleLayout {
  autoPosition: boolean;             // 自動配置
  inputHandles: HandlePosition[];    // 入力ハンドル位置
  outputHandles: HandlePosition[];   // 出力ハンドル位置
  spacing: number;                   // ハンドル間隔
  offset: { x: number; y: number };  // オフセット
}

const generateHandlePositions = (
  nodeType: NodeType,
  inputCount: number,
  outputCount: number
): HandleLayout => {
  // ノードタイプに応じたハンドル配置ロジック
};
```

### 3. データフロー管理

#### DataFlowManager
```typescript
interface DataFlowManager {
  validateConnection(connection: NodeConnection): ValidationResult;
  executeDataFlow(startNodeId: string): Promise<ExecutionResult>;
  getExecutionOrder(nodeIds: string[]): string[];
  detectCycles(connections: NodeConnection[]): string[][] | null;
  transformData(data: any, transform: DataTransform): any;
}

interface ExecutionPlan {
  executionOrder: string[];          // 実行順序
  parallelGroups: string[][];        // 並列実行グループ
  dependencies: Record<string, string[]>; // 依存関係
  estimatedDuration: number;         // 推定実行時間
}
```

#### データ変換エンジン
```typescript
interface DataTransformEngine {
  registerTransform(type: TransformType, transformer: DataTransformer): void;
  transform(data: any, config: DataTransform): any;
  validateTransform(config: DataTransform): ValidationResult;
}

interface DataTransformer {
  transform(input: any, config: any): any;
  validate(input: any, config: any): boolean;
  getOutputType(inputType: DataType, config: any): DataType;
}

// 組み込み変換器
const builtinTransformers: Record<TransformType, DataTransformer> = {
  [TransformType.TYPE_CAST]: new TypeCastTransformer(),
  [TransformType.FORMAT]: new FormatTransformer(),
  [TransformType.FILTER]: new FilterTransformer(),
  [TransformType.MAP]: new MapTransformer(),
  [TransformType.AGGREGATE]: new AggregateTransformer()
};
```

### 4. 接続UI コンポーネント

#### ConnectionLine コンポーネント
```typescript
interface ConnectionLineProps {
  connection: NodeConnection;
  isActive: boolean;
  isSelected: boolean;
  onSelect: (connectionId: string) => void;
  onDelete: (connectionId: string) => void;
  onEdit: (connectionId: string) => void;
}

interface ConnectionLineStyle {
  strokeColor: string;
  strokeWidth: number;
  strokeDasharray?: string;
  animation?: ConnectionAnimation;
  markers?: ConnectionMarker[];
}

enum ConnectionAnimation {
  NONE = 'none',
  FLOW = 'flow',
  PULSE = 'pulse',
  DASH = 'dash'
}
```

#### ConnectionEditor
```typescript
interface ConnectionEditorProps {
  connection: NodeConnection;
  onUpdate: (connection: NodeConnection) => void;
  onCancel: () => void;
}

interface ConnectionEditorState {
  selectedTransform: TransformType;
  transformConfig: any;
  validationErrors: ValidationError[];
  previewData: any;
}
```

### 5. 実行制御システム

#### ExecutionController
```typescript
interface ExecutionController {
  startExecution(nodeId: string): Promise<void>;
  pauseExecution(): void;
  resumeExecution(): void;
  stopExecution(): void;
  stepExecution(): Promise<void>;
  
  onExecutionStart: (callback: (nodeId: string) => void) => void;
  onExecutionComplete: (callback: (result: ExecutionResult) => void) => void;
  onExecutionError: (callback: (error: Error) => void) => void;
}

interface ExecutionState {
  status: ExecutionStatus;
  currentNode?: string;
  completedNodes: string[];
  failedNodes: string[];
  startTime?: Date;
  endTime?: Date;
  results: Record<string, any>;
}

enum ExecutionStatus {
  IDLE = 'idle',
  RUNNING = 'running',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}
```

### 6. 条件分岐システム

#### ConditionalConnection
```typescript
interface ConditionalConnection extends NodeConnection {
  condition: ConditionExpression;
  alternativeTarget?: string;       // 条件不一致時の接続先
}

interface ConditionExpression {
  type: ConditionType;
  expression: string;               // 条件式
  variables: string[];              // 使用変数
}

enum ConditionType {
  JAVASCRIPT = 'javascript',        // JavaScript式
  SIMPLE = 'simple',                // 簡単な比較
  REGEX = 'regex',                  // 正規表現
  CUSTOM = 'custom'                 // カスタム条件
}

// 条件式の例
const conditionExamples = [
  'input.length > 0',              // 文字列長チェック
  'output.exitCode === 0',         // 終了コード確認
  'data.type === "success"',       // データ型確認
  '/^[a-zA-Z]+$/.test(input)'      // 正規表現マッチ
];
```

### 7. デバッグ・監視機能

#### DataFlowDebugger
```typescript
interface DataFlowDebugger {
  setBreakpoint(nodeId: string): void;
  removeBreakpoint(nodeId: string): void;
  inspectData(connectionId: string): any;
  getExecutionTrace(): ExecutionTrace[];
  exportDebugInfo(): DebugInfo;
}

interface ExecutionTrace {
  timestamp: Date;
  nodeId: string;
  action: TraceAction;
  data?: any;
  duration?: number;
}

enum TraceAction {
  NODE_START = 'nodeStart',
  NODE_COMPLETE = 'nodeComplete',
  DATA_TRANSFORM = 'dataTransform',
  CONNECTION_FLOW = 'connectionFlow',
  ERROR = 'error'
}
```

## 技術詳細

### ファイル構造
```
src/webview/components/connections/
├── ConnectionSystem.tsx          # 接続システムメイン
├── NodeHandle.tsx                # ノードハンドル
├── ConnectionLine.tsx            # 接続線
├── ConnectionEditor.tsx          # 接続エディタ
├── DataFlowManager.ts            # データフロー管理
├── ExecutionController.ts        # 実行制御
├── transformers/
│   ├── TypeCastTransformer.ts    # 型変換
│   ├── FormatTransformer.ts      # フォーマット変換
│   ├── FilterTransformer.ts      # フィルタリング
│   ├── MapTransformer.ts         # マッピング
│   └── AggregateTransformer.ts   # 集約
├── conditions/
│   ├── ConditionEvaluator.ts     # 条件評価
│   └── ConditionEditor.tsx       # 条件エディタ
└── debug/
    ├── DataFlowDebugger.ts       # デバッガ
    ├── ExecutionViewer.tsx       # 実行ビューア
    └── TraceViewer.tsx           # トレースビューア
```

### React Flow統合
```typescript
// React FlowのEdge型の拡張
interface CustomEdge extends Edge {
  data: NodeConnection;
  animated: boolean;
  style: CSSProperties;
}

// カスタムエッジコンポーネント
const CustomConnectionEdge: React.FC<EdgeProps> = (props) => {
  // 接続線の描画ロジック
};
```

## 完了条件

- [ ] 接続システムのデータ構造が定義されている
- [ ] NodeHandleコンポーネントが実装されている
- [ ] ConnectionLineコンポーネントが実装されている
- [ ] DataFlowManagerが実装されている
- [ ] データ変換エンジンが実装されている
- [ ] ExecutionControllerが実装されている
- [ ] 条件分岐システムが実装されている
- [ ] ノード間の接続が正常に動作する
- [ ] データフローの実行が動作する
- [ ] データ変換が正しく動作する
- [ ] 循環依存の検出が動作する
- [ ] デバッグ機能が利用できる

## テスト項目

- [ ] 基本的なノード間接続が動作する
- [ ] データ型の互換性チェックが動作する
- [ ] データ変換が正しく実行される
- [ ] 実行順序が正しく決定される
- [ ] 循環依存が適切に検出される
- [ ] 条件分岐が正しく動作する
- [ ] 並列実行が正常に動作する
- [ ] エラー時の適切な処理が動作する
- [ ] 大規模なフローでの性能が適切
- [ ] デバッグ機能が正常に動作する

## 参考資料

- [React Flow Edge Types](https://reactflow.dev/docs/api/edge-types/)
- [Directed Acyclic Graph (DAG)](https://en.wikipedia.org/wiki/Directed_acyclic_graph)
- [Data Flow Programming](https://en.wikipedia.org/wiki/Dataflow_programming)
- [ComfyUI Execution Model](https://github.com/comfyanonymous/ComfyUI/wiki/How-ComfyUI-Works)

## 実装順序

1. 接続システムのデータ構造定義
2. NodeHandleコンポーネントの実装
3. 基本的な接続機能の実装
4. DataFlowManagerの実装
5. データ変換エンジンの実装
6. ExecutionControllerの実装
7. 条件分岐システムの実装
8. デバッグ・監視機能の実装
9. UI/UXの改善
10. テストとパフォーマンス最適化