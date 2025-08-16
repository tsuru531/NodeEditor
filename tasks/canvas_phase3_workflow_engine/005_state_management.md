# Canvas Phase 3 - タスク005: 実行状態管理

## 概要
ワークフロー実行の状態をリアルタイムで管理し、UIとの同期を行うシステムを実装する。

## 実装内容

### 対象ファイル
- `src/engine/StateManager.ts` (新規作成)
- `src/engine/ExecutionState.ts` (新規作成)
- `src/webview/stores/ExecutionStore.ts` (新規作成)

### StateManager クラス

#### 主要機能
1. **状態管理**: 実行状態の一元管理
2. **リアルタイム同期**: WebViewとExtensionの状態同期
3. **履歴管理**: 実行履歴の保存と管理
4. **状態復元**: 中断されたワークフローの復元

#### インターフェース定義
```typescript
interface ExecutionState {
  id: string;
  workflowId: string;
  status: WorkflowStatus;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  nodeStates: Record<string, NodeExecutionState>;
  globalData: Record<string, any>;
  errors: ExecutionError[];
  metadata: ExecutionMetadata;
}

interface NodeExecutionState {
  nodeId: string;
  status: NodeStatus;
  progress: number;
  startTime?: Date;
  endTime?: Date;
  inputs: Record<string, any>;
  outputs: Record<string, any>;
  logs: LogEntry[];
  error?: string;
}

enum WorkflowStatus {
  IDLE = 'idle',
  PREPARING = 'preparing',
  RUNNING = 'running',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

enum NodeStatus {
  PENDING = 'pending',
  PREPARING = 'preparing',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  SKIPPED = 'skipped',
  CANCELLED = 'cancelled'
}
```

#### 実装メソッド
1. `createExecutionState(workflowId): ExecutionState`
2. `updateNodeState(nodeId, state): void`
3. `updateWorkflowStatus(status): void`
4. `getExecutionState(): ExecutionState`
5. `subscribeToStateChanges(callback): void`
6. `saveExecutionHistory(state): void`
7. `restoreExecutionState(id): ExecutionState`

### リアルタイム同期

#### 同期メカニズム
- WebSocket風のメッセージングシステム
- VSCode Extension ↔ WebView間の双方向通信
- 状態変更の即座な反映

#### メッセージ型
```typescript
interface StateUpdateMessage {
  type: 'state:update';
  payload: {
    nodeId?: string;
    field: string;
    value: any;
    timestamp: Date;
  };
}

interface ExecutionCommandMessage {
  type: 'execution:command';
  payload: {
    command: 'start' | 'pause' | 'resume' | 'cancel';
    workflowId: string;
    options?: any;
  };
}
```

### 状態ストア（WebView側）

#### ExecutionStore
```typescript
class ExecutionStore {
  private state: ExecutionState;
  private subscribers: Set<Function>;
  
  getState(): ExecutionState;
  updateNodeStatus(nodeId: string, status: NodeStatus): void;
  updateNodeProgress(nodeId: string, progress: number): void;
  addNodeLog(nodeId: string, log: LogEntry): void;
  subscribe(callback: Function): () => void;
  
  // Redux-like actions
  dispatch(action: ExecutionAction): void;
}

interface ExecutionAction {
  type: string;
  payload: any;
}
```

#### 状態選択子（Selectors）
```typescript
const ExecutionSelectors = {
  getWorkflowStatus: (state) => state.status,
  getNodeState: (state, nodeId) => state.nodeStates[nodeId],
  getRunningNodes: (state) => Object.values(state.nodeStates)
    .filter(node => node.status === NodeStatus.RUNNING),
  getCompletionProgress: (state) => {
    const total = Object.keys(state.nodeStates).length;
    const completed = Object.values(state.nodeStates)
      .filter(node => node.status === NodeStatus.COMPLETED).length;
    return total > 0 ? completed / total : 0;
  }
};
```

### 履歴管理

#### 実行履歴
```typescript
interface ExecutionHistory {
  id: string;
  workflowId: string;
  executionTime: Date;
  duration: number;
  status: WorkflowStatus;
  nodeCount: number;
  successRate: number;
  errorCount: number;
  summary: string;
}

class HistoryManager {
  saveExecution(state: ExecutionState): void;
  getExecutionHistory(workflowId?: string): ExecutionHistory[];
  getExecutionDetails(id: string): ExecutionState;
  deleteExecution(id: string): void;
  exportHistory(format: 'json' | 'csv'): string;
}
```

### パフォーマンス最適化

#### 状態更新の最適化
- バッチ更新による描画回数削減
- デバウンス処理で過度な更新を抑制
- 差分更新による最小限のDOM操作

#### メモリ管理
- 古い実行状態の自動削除
- 大容量データの圧縮保存
- ガベージコレクション対応

## WebView UI連携

### 状態表示コンポーネント
```typescript
// ExecutionStatus.tsx
const ExecutionStatus: React.FC = () => {
  const state = useExecutionStore(state => state);
  const progress = ExecutionSelectors.getCompletionProgress(state);
  
  return (
    <div className="execution-status">
      <ProgressBar progress={progress} />
      <StatusIndicator status={state.status} />
      <NodeStatusGrid nodeStates={state.nodeStates} />
    </div>
  );
};
```

## 完了条件
- [ ] StateManager クラスが実装されている
- [ ] リアルタイム状態同期が動作する
- [ ] WebView側のストアが正常に動作する
- [ ] 実行履歴の保存/復元が動作する
- [ ] パフォーマンスが要件を満たす

## パフォーマンス要件
- 状態更新の遅延: < 50ms
- 同時接続数: > 10
- メモリ使用量: < 50MB
- 履歴検索速度: < 100ms

## 関連タスク
- 004_data_transfer.mdと連携
- 007_execution_ui.mdでUI表示