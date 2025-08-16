# Canvas Phase 3 - タスク007: 実行状態可視化UI

## 概要
ワークフロー実行状態をリアルタイムで可視化するUIコンポーネントを実装する。

## 実装内容

### 対象ファイル
- `src/webview/components/ExecutionPanel.tsx` (新規作成)
- `src/webview/components/execution/` (新規ディレクトリ)
  - `ExecutionControls.tsx`
  - `ExecutionProgress.tsx`
  - `NodeExecutionStatus.tsx`
  - `ExecutionLogs.tsx`
  - `ErrorDisplay.tsx`

### 実行制御パネル

#### ExecutionControls コンポーネント
```typescript
interface ExecutionControlsProps {
  workflowStatus: WorkflowStatus;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  onReset: () => void;
  disabled?: boolean;
}

const ExecutionControls: React.FC<ExecutionControlsProps> = ({
  workflowStatus,
  onStart,
  onPause,
  onResume,
  onStop,
  onReset,
  disabled
}) => {
  return (
    <div className="execution-controls">
      <button onClick={onStart} disabled={disabled || workflowStatus === 'running'}>
        ▶️ 開始
      </button>
      <button onClick={onPause} disabled={workflowStatus !== 'running'}>
        ⏸️ 一時停止
      </button>
      <button onClick={onResume} disabled={workflowStatus !== 'paused'}>
        ▶️ 再開
      </button>
      <button onClick={onStop} disabled={workflowStatus === 'idle'}>
        ⏹️ 停止
      </button>
      <button onClick={onReset}>
        🔄 リセット
      </button>
    </div>
  );
};
```

### 実行進捗表示

#### ExecutionProgress コンポーネント
```typescript
interface ExecutionProgressProps {
  totalNodes: number;
  completedNodes: number;
  failedNodes: number;
  runningNodes: number;
  estimatedTimeRemaining?: number;
  startTime?: Date;
}

const ExecutionProgress: React.FC<ExecutionProgressProps> = ({
  totalNodes,
  completedNodes,
  failedNodes,
  runningNodes,
  estimatedTimeRemaining,
  startTime
}) => {
  const progressPercentage = totalNodes > 0 ? (completedNodes / totalNodes) * 100 : 0;
  const elapsedTime = startTime ? Date.now() - startTime.getTime() : 0;
  
  return (
    <div className="execution-progress">
      <div className="progress-header">
        <h4>実行進捗</h4>
        <span className="progress-text">
          {completedNodes}/{totalNodes} ノード完了 ({progressPercentage.toFixed(1)}%)
        </span>
      </div>
      
      <div className="progress-bar">
        <div 
          className="progress-fill" 
          style={{ width: `${progressPercentage}%` }}
        />
      </div>
      
      <div className="progress-stats">
        <div className="stat">
          <span className="stat-label">実行中:</span>
          <span className="stat-value">{runningNodes}</span>
        </div>
        <div className="stat">
          <span className="stat-label">完了:</span>
          <span className="stat-value success">{completedNodes}</span>
        </div>
        <div className="stat">
          <span className="stat-label">失敗:</span>
          <span className="stat-value error">{failedNodes}</span>
        </div>
        <div className="stat">
          <span className="stat-label">経過時間:</span>
          <span className="stat-value">{formatDuration(elapsedTime)}</span>
        </div>
        {estimatedTimeRemaining && (
          <div className="stat">
            <span className="stat-label">残り時間:</span>
            <span className="stat-value">{formatDuration(estimatedTimeRemaining)}</span>
          </div>
        )}
      </div>
    </div>
  );
};
```

### ノード実行状態表示

#### NodeExecutionStatus コンポーネント
ノードエディタ上での各ノードの実行状態をオーバーレイ表示

```typescript
interface NodeExecutionStatusProps {
  nodeId: string;
  status: NodeStatus;
  progress?: number;
  duration?: number;
  error?: string;
}

const NodeExecutionStatus: React.FC<NodeExecutionStatusProps> = ({
  nodeId,
  status,
  progress,
  duration,
  error
}) => {
  const getStatusIcon = (status: NodeStatus) => {
    switch (status) {
      case 'pending': return '⏳';
      case 'running': return '🔄';
      case 'completed': return '✅';
      case 'failed': return '❌';
      case 'cancelled': return '⏹️';
      default: return '⚪';
    }
  };

  const getStatusColor = (status: NodeStatus) => {
    switch (status) {
      case 'running': return '#2196F3';
      case 'completed': return '#4CAF50';
      case 'failed': return '#F44336';
      case 'cancelled': return '#9E9E9E';
      default: return '#FFC107';
    }
  };

  return (
    <div 
      className="node-execution-status"
      style={{
        position: 'absolute',
        top: '4px',
        right: '4px',
        background: getStatusColor(status),
        color: 'white',
        borderRadius: '12px',
        padding: '2px 6px',
        fontSize: '10px',
        fontWeight: 'bold',
        display: 'flex',
        alignItems: 'center',
        gap: '2px',
        zIndex: 1000
      }}
    >
      <span>{getStatusIcon(status)}</span>
      {status === 'running' && progress !== undefined && (
        <span>{progress.toFixed(0)}%</span>
      )}
      {duration && (
        <span>{formatDuration(duration)}</span>
      )}
    </div>
  );
};
```

### 実行ログ表示

#### ExecutionLogs コンポーネント
```typescript
interface LogEntry {
  id: string;
  nodeId: string;
  timestamp: Date;
  level: 'info' | 'warning' | 'error' | 'debug';
  message: string;
  details?: string;
}

interface ExecutionLogsProps {
  logs: LogEntry[];
  maxEntries?: number;
  autoScroll?: boolean;
  filterLevel?: LogLevel;
}

const ExecutionLogs: React.FC<ExecutionLogsProps> = ({
  logs,
  maxEntries = 1000,
  autoScroll = true,
  filterLevel
}) => {
  const logsRef = useRef<HTMLDivElement>(null);
  const [selectedLogId, setSelectedLogId] = useState<string | null>(null);
  
  const filteredLogs = useMemo(() => {
    let filtered = logs;
    if (filterLevel) {
      filtered = logs.filter(log => log.level === filterLevel);
    }
    return filtered.slice(-maxEntries);
  }, [logs, filterLevel, maxEntries]);

  useEffect(() => {
    if (autoScroll && logsRef.current) {
      logsRef.current.scrollTop = logsRef.current.scrollHeight;
    }
  }, [filteredLogs, autoScroll]);

  return (
    <div className="execution-logs">
      <div className="logs-header">
        <h4>実行ログ</h4>
        <div className="logs-controls">
          <select 
            value={filterLevel || ''} 
            onChange={(e) => setFilterLevel(e.target.value || undefined)}
          >
            <option value="">すべて</option>
            <option value="info">情報</option>
            <option value="warning">警告</option>
            <option value="error">エラー</option>
            <option value="debug">デバッグ</option>
          </select>
          <button onClick={() => setLogs([])}>クリア</button>
        </div>
      </div>
      
      <div ref={logsRef} className="logs-content">
        {filteredLogs.map((log) => (
          <div 
            key={log.id}
            className={`log-entry ${log.level} ${selectedLogId === log.id ? 'selected' : ''}`}
            onClick={() => setSelectedLogId(log.id)}
          >
            <div className="log-header">
              <span className="log-timestamp">
                {log.timestamp.toLocaleTimeString()}
              </span>
              <span className="log-node-id">[{log.nodeId}]</span>
              <span className={`log-level ${log.level}`}>
                {log.level.toUpperCase()}
              </span>
            </div>
            <div className="log-message">{log.message}</div>
            {log.details && selectedLogId === log.id && (
              <div className="log-details">{log.details}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
```

### エラー表示

#### ErrorDisplay コンポーネント
```typescript
interface ErrorDisplayProps {
  errors: ExecutionError[];
  onDismiss: (errorId: string) => void;
  onRetry?: (nodeId: string) => void;
}

const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  errors,
  onDismiss,
  onRetry
}) => {
  return (
    <div className="error-display">
      {errors.map((error) => (
        <div key={error.id} className={`error-item ${error.severity}`}>
          <div className="error-header">
            <div className="error-icon">
              {error.severity === 'critical' ? '🚨' : 
               error.severity === 'high' ? '❌' : 
               error.severity === 'medium' ? '⚠️' : 'ℹ️'}
            </div>
            <div className="error-title">
              <strong>{error.type.replace('_', ' ').toUpperCase()}</strong>
              <span className="error-node">ノード: {error.nodeId}</span>
            </div>
            <div className="error-actions">
              {error.recoverable && onRetry && (
                <button 
                  className="retry-button"
                  onClick={() => onRetry(error.nodeId)}
                >
                  再試行
                </button>
              )}
              <button 
                className="dismiss-button"
                onClick={() => onDismiss(error.id)}
              >
                ×
              </button>
            </div>
          </div>
          
          <div className="error-message">{error.message}</div>
          
          {error.suggestion && (
            <div className="error-suggestion">
              <strong>提案:</strong> {error.suggestion}
            </div>
          )}
          
          {error.details && (
            <details className="error-details">
              <summary>詳細情報</summary>
              <pre>{error.details}</pre>
            </details>
          )}
        </div>
      ))}
    </div>
  );
};
```

### メイン実行パネル

#### ExecutionPanel コンポーネント
```typescript
const ExecutionPanel: React.FC = () => {
  const executionState = useExecutionStore();
  const [showLogs, setShowLogs] = useState(false);
  const [showErrors, setShowErrors] = useState(true);

  return (
    <div className="execution-panel">
      <div className="panel-header">
        <h3>ワークフロー実行</h3>
        <div className="panel-controls">
          <button 
            className={showLogs ? 'active' : ''}
            onClick={() => setShowLogs(!showLogs)}
          >
            ログ
          </button>
          <button 
            className={showErrors ? 'active' : ''}
            onClick={() => setShowErrors(!showErrors)}
          >
            エラー
          </button>
        </div>
      </div>

      <ExecutionControls
        workflowStatus={executionState.status}
        onStart={() => executionStore.dispatch({ type: 'START_EXECUTION' })}
        onPause={() => executionStore.dispatch({ type: 'PAUSE_EXECUTION' })}
        onResume={() => executionStore.dispatch({ type: 'RESUME_EXECUTION' })}
        onStop={() => executionStore.dispatch({ type: 'STOP_EXECUTION' })}
        onReset={() => executionStore.dispatch({ type: 'RESET_EXECUTION' })}
      />

      <ExecutionProgress
        totalNodes={Object.keys(executionState.nodeStates).length}
        completedNodes={ExecutionSelectors.getCompletedNodes(executionState).length}
        failedNodes={ExecutionSelectors.getFailedNodes(executionState).length}
        runningNodes={ExecutionSelectors.getRunningNodes(executionState).length}
        startTime={executionState.startTime}
      />

      {showErrors && executionState.errors.length > 0 && (
        <ErrorDisplay
          errors={executionState.errors}
          onDismiss={(errorId) => executionStore.dispatch({ 
            type: 'DISMISS_ERROR', 
            payload: { errorId } 
          })}
          onRetry={(nodeId) => executionStore.dispatch({ 
            type: 'RETRY_NODE', 
            payload: { nodeId } 
          })}
        />
      )}

      {showLogs && (
        <ExecutionLogs
          logs={ExecutionSelectors.getAllLogs(executionState)}
          autoScroll={true}
        />
      )}
    </div>
  );
};
```

## 完了条件
- [ ] 全ての実行UIコンポーネントが実装されている
- [ ] リアルタイム状態更新が正常に動作する
- [ ] エラー表示とユーザー操作が動作する
- [ ] ログ表示機能が正常に動作する
- [ ] パフォーマンスが要件を満たす

## UI/UX要件
- レスポンシブデザイン対応
- アクセシビリティ準拠
- 直感的な操作性
- 視覚的なフィードバック

## パフォーマンス要件
- UI更新頻度: 60 FPS
- 大量ログ表示: > 1000件
- メモリ使用量: < 100MB

## 関連タスク
- 005_state_management.mdと密接に連携
- Canvas Phase 3の完了を示すUI