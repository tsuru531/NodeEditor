# Canvas Phase 3 - タスク006: エラーハンドリング

## 概要
ワークフロー実行時のエラーハンドリングとリカバリー機能を実装する。

## 実装内容

### 対象ファイル
- `src/engine/ErrorHandler.ts` (新規作成)
- `src/engine/RecoveryManager.ts` (新規作成)
- `src/engine/ErrorTypes.ts` (新規作成)

### ErrorHandler クラス

#### 主要機能
1. **エラー分類**: エラーの種類と重要度の分類
2. **エラー報告**: 詳細なエラー情報の収集と報告
3. **自動復旧**: 可能な場合の自動リカバリー
4. **ユーザー通知**: 分かりやすいエラーメッセージの提供

#### インターフェース定義
```typescript
interface ExecutionError {
  id: string;
  nodeId: string;
  type: ErrorType;
  severity: ErrorSeverity;
  message: string;
  details?: string;
  timestamp: Date;
  stackTrace?: string;
  context?: ErrorContext;
  recoverable: boolean;
  suggestion?: string;
}

enum ErrorType {
  // システムエラー
  SYSTEM_ERROR = 'system_error',
  MEMORY_ERROR = 'memory_error',
  TIMEOUT_ERROR = 'timeout_error',
  
  // 実行エラー
  EXECUTION_ERROR = 'execution_error',
  PROCESS_ERROR = 'process_error',
  SCRIPT_ERROR = 'script_error',
  
  // データエラー
  DATA_ERROR = 'data_error',
  TYPE_ERROR = 'type_error',
  VALIDATION_ERROR = 'validation_error',
  
  // 接続エラー
  CONNECTION_ERROR = 'connection_error',
  DEPENDENCY_ERROR = 'dependency_error',
  
  // ユーザーエラー
  CONFIGURATION_ERROR = 'configuration_error',
  PERMISSION_ERROR = 'permission_error'
}

enum ErrorSeverity {
  LOW = 'low',          // 警告レベル
  MEDIUM = 'medium',    // 一部機能に影響
  HIGH = 'high',        // ワークフロー停止
  CRITICAL = 'critical' // システム全体に影響
}

interface ErrorContext {
  nodeType: string;
  nodeData: any;
  inputs: Record<string, any>;
  environmentInfo: {
    platform: string;
    nodeVersion: string;
    availableMemory: number;
  };
}
```

#### 実装メソッド
1. `handleError(error, context): Promise<ErrorHandlingResult>`
2. `classifyError(error): { type: ErrorType, severity: ErrorSeverity }`
3. `generateErrorReport(error): ErrorReport`
4. `suggestRecoveryAction(error): RecoveryAction[]`
5. `logError(error): void`
6. `notifyUser(error): void`

### RecoveryManager クラス

#### 主要機能
1. **自動リトライ**: 一時的エラーの自動再試行
2. **依存関係迂回**: 失敗ノードの迂回ルート探索
3. **データロールバック**: エラー時のデータ状態復元
4. **手動復旧**: ユーザー操作による復旧支援

#### リカバリー戦略
```typescript
interface RecoveryStrategy {
  name: string;
  applicable: (error: ExecutionError) => boolean;
  execute: (error: ExecutionError) => Promise<RecoveryResult>;
  priority: number;
}

enum RecoveryAction {
  RETRY = 'retry',
  SKIP = 'skip',
  ROLLBACK = 'rollback',
  SUBSTITUTE = 'substitute',
  MANUAL_FIX = 'manual_fix',
  ABORT = 'abort'
}

interface RecoveryResult {
  success: boolean;
  action: RecoveryAction;
  message: string;
  newState?: any;
  suggestions?: string[];
}
```

#### 具体的リカバリー戦略

##### 1. 自動リトライ戦略
```typescript
class RetryStrategy implements RecoveryStrategy {
  name = 'auto_retry';
  
  applicable(error: ExecutionError): boolean {
    return error.type === ErrorType.TIMEOUT_ERROR || 
           error.type === ErrorType.CONNECTION_ERROR;
  }
  
  async execute(error: ExecutionError): Promise<RecoveryResult> {
    const maxRetries = 3;
    const delayMs = 1000;
    
    for (let i = 0; i < maxRetries; i++) {
      await new Promise(resolve => setTimeout(resolve, delayMs * (i + 1)));
      
      try {
        // ノードの再実行
        const result = await this.retryNodeExecution(error.nodeId);
        return { success: true, action: RecoveryAction.RETRY, message: '自動復旧に成功しました' };
      } catch (retryError) {
        continue;
      }
    }
    
    return { success: false, action: RecoveryAction.MANUAL_FIX, message: '自動復旧に失敗しました' };
  }
}
```

##### 2. 依存関係迂回戦略
```typescript
class BypassStrategy implements RecoveryStrategy {
  name = 'dependency_bypass';
  
  applicable(error: ExecutionError): boolean {
    return error.severity <= ErrorSeverity.MEDIUM;
  }
  
  async execute(error: ExecutionError): Promise<RecoveryResult> {
    // 失敗ノードをスキップして後続ノードを実行
    const alternativePath = await this.findAlternativePath(error.nodeId);
    
    if (alternativePath) {
      return {
        success: true,
        action: RecoveryAction.SKIP,
        message: '代替パスで実行を継続します',
        suggestions: [`ノード ${error.nodeId} をスキップしました`]
      };
    }
    
    return { success: false, action: RecoveryAction.ABORT, message: '代替パスが見つかりません' };
  }
}
```

### エラー分析とレポート

#### エラー分析機能
```typescript
class ErrorAnalyzer {
  analyzeErrorPattern(errors: ExecutionError[]): ErrorAnalysis {
    return {
      commonCauses: this.identifyCommonCauses(errors),
      hotspotNodes: this.identifyErrorHotspots(errors),
      timePatterns: this.analyzeTimePatterns(errors),
      recommendations: this.generateRecommendations(errors)
    };
  }
  
  private identifyCommonCauses(errors: ExecutionError[]): string[] {
    // 共通エラーパターンの分析
  }
  
  private identifyErrorHotspots(errors: ExecutionError[]): string[] {
    // エラー頻発ノードの特定
  }
}
```

#### エラーレポート生成
```typescript
interface ErrorReport {
  summary: {
    totalErrors: number;
    errorsByType: Record<ErrorType, number>;
    errorsBySeverity: Record<ErrorSeverity, number>;
    recoveryRate: number;
  };
  details: ExecutionError[];
  analysis: ErrorAnalysis;
  recommendations: string[];
  exportedAt: Date;
}
```

### ユーザー通知システム

#### 通知レベル
- **Info**: 正常完了、警告
- **Warning**: 軽微な問題、自動復旧
- **Error**: 重要な問題、手動対応必要
- **Critical**: システム停止、緊急対応必要

#### 通知インターフェース
```typescript
interface UserNotification {
  id: string;
  level: 'info' | 'warning' | 'error' | 'critical';
  title: string;
  message: string;
  actions?: NotificationAction[];
  autoHide?: boolean;
  timestamp: Date;
}

interface NotificationAction {
  label: string;
  action: () => void;
  style: 'primary' | 'secondary' | 'danger';
}
```

## 完了条件
- [ ] ErrorHandler クラスが実装されている
- [ ] 各種リカバリー戦略が動作する
- [ ] エラー分析機能が正常に動作する
- [ ] ユーザー通知システムが動作する
- [ ] エラーレポート生成が動作する

## テストケース
1. システムエラーのハンドリング
2. 自動リトライ機能
3. 依存関係迂回機能
4. エラーレポート生成
5. ユーザー通知表示

## パフォーマンス要件
- エラー処理時間: < 200ms
- リカバリー試行時間: < 5秒
- 通知表示遅延: < 100ms

## 関連タスク
- 全ての実行関連タスクと連携
- 007_execution_ui.mdでエラー表示