import { 
  ExecutionError,
  ExecutionContext,
  NodeExecutionState,
  ExecutionStatus
} from './types';

/**
 * エラーハンドリング戦略のインターフェース
 */
export interface IErrorStrategy {
  canHandle(error: ExecutionError): boolean;
  handle(error: ExecutionError, context: ExecutionContext): Promise<ErrorHandlingResult>;
}

/**
 * エラーハンドリング結果
 */
export interface ErrorHandlingResult {
  success: boolean;
  action: 'retry' | 'skip' | 'stop' | 'fallback';
  message: string;
  retryDelay?: number;
  fallbackNodeId?: string;
}

/**
 * リトライ設定
 */
export interface RetryConfig {
  maxRetries: number;
  initialDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  retryableErrors: string[];
}

/**
 * 基本的なリトライ戦略
 */
export class RetryStrategy implements IErrorStrategy {
  private retryConfig: RetryConfig;
  private retryCount = new Map<string, number>();

  constructor(config: Partial<RetryConfig> = {}) {
    this.retryConfig = {
      maxRetries: 3,
      initialDelay: 1000,
      maxDelay: 30000,
      backoffMultiplier: 2,
      retryableErrors: ['timeout', 'network', 'temporary'],
      ...config
    };
  }

  canHandle(error: ExecutionError): boolean {
    const nodeId = error.nodeId;
    if (!nodeId) return false;

    const currentRetries = this.retryCount.get(nodeId) || 0;
    const isRetryableError = this.retryConfig.retryableErrors.some(
      retryableType => error.type === retryableType || 
      error.message.toLowerCase().includes(retryableType)
    );

    return currentRetries < this.retryConfig.maxRetries && isRetryableError;
  }

  async handle(error: ExecutionError, context: ExecutionContext): Promise<ErrorHandlingResult> {
    const nodeId = error.nodeId!;
    const currentRetries = this.retryCount.get(nodeId) || 0;
    
    this.retryCount.set(nodeId, currentRetries + 1);

    const delay = Math.min(
      this.retryConfig.initialDelay * Math.pow(this.retryConfig.backoffMultiplier, currentRetries),
      this.retryConfig.maxDelay
    );

    return {
      success: true,
      action: 'retry',
      message: `リトライします (${currentRetries + 1}/${this.retryConfig.maxRetries}) - ${delay}ms後`,
      retryDelay: delay
    };
  }

  resetRetryCount(nodeId: string): void {
    this.retryCount.delete(nodeId);
  }

  clearAllRetries(): void {
    this.retryCount.clear();
  }
}

/**
 * フォールバック戦略
 */
export class FallbackStrategy implements IErrorStrategy {
  private fallbackMap = new Map<string, string>();

  constructor(fallbackMap: Record<string, string> = {}) {
    Object.entries(fallbackMap).forEach(([nodeId, fallbackId]) => {
      this.fallbackMap.set(nodeId, fallbackId);
    });
  }

  canHandle(error: ExecutionError): boolean {
    return error.nodeId ? this.fallbackMap.has(error.nodeId) : false;
  }

  async handle(error: ExecutionError, context: ExecutionContext): Promise<ErrorHandlingResult> {
    const nodeId = error.nodeId!;
    const fallbackNodeId = this.fallbackMap.get(nodeId)!;

    return {
      success: true,
      action: 'fallback',
      message: `フォールバックノード ${fallbackNodeId} を実行します`,
      fallbackNodeId
    };
  }

  addFallback(nodeId: string, fallbackNodeId: string): void {
    this.fallbackMap.set(nodeId, fallbackNodeId);
  }

  removeFallback(nodeId: string): void {
    this.fallbackMap.delete(nodeId);
  }
}

/**
 * スキップ戦略
 */
export class SkipStrategy implements IErrorStrategy {
  private skippableNodeTypes: Set<string>;

  constructor(skippableNodeTypes: string[] = ['memo', 'connector']) {
    this.skippableNodeTypes = new Set(skippableNodeTypes);
  }

  canHandle(error: ExecutionError): boolean {
    if (!error.nodeId) return false;
    
    // ノードタイプがスキップ可能かチェック（実際の実装では context から取得）
    return true; // 簡易実装
  }

  async handle(error: ExecutionError, context: ExecutionContext): Promise<ErrorHandlingResult> {
    return {
      success: true,
      action: 'skip',
      message: `ノード ${error.nodeId} をスキップします`
    };
  }

  addSkippableType(nodeType: string): void {
    this.skippableNodeTypes.add(nodeType);
  }

  removeSkippableType(nodeType: string): void {
    this.skippableNodeTypes.delete(nodeType);
  }
}

/**
 * 停止戦略
 */
export class StopStrategy implements IErrorStrategy {
  private criticalErrors: Set<string>;

  constructor(criticalErrors: string[] = ['validation', 'security', 'fatal']) {
    this.criticalErrors = new Set(criticalErrors);
  }

  canHandle(error: ExecutionError): boolean {
    return this.criticalErrors.has(error.type);
  }

  async handle(error: ExecutionError, context: ExecutionContext): Promise<ErrorHandlingResult> {
    return {
      success: false,
      action: 'stop',
      message: `致命的エラーのため実行を停止します: ${error.message}`
    };
  }
}

/**
 * エラーハンドリングシステムの中央管理クラス
 */
export class ErrorHandler {
  private strategies: IErrorStrategy[] = [];
  private errorLog: ExecutionError[] = [];
  private maxLogSize: number = 1000;
  private onErrorCallback?: (error: ExecutionError, result: ErrorHandlingResult) => void;

  constructor(maxLogSize: number = 1000) {
    this.maxLogSize = maxLogSize;
    this.initializeDefaultStrategies();
  }

  /**
   * デフォルトの戦略を初期化
   */
  private initializeDefaultStrategies(): void {
    this.strategies = [
      new StopStrategy(),      // 致命的エラーは最優先
      new RetryStrategy(),     // リトライ可能エラー
      new FallbackStrategy(),  // フォールバック可能エラー
      new SkipStrategy()       // スキップ可能エラー
    ];
  }

  /**
   * エラーハンドリング戦略を追加
   */
  public addStrategy(strategy: IErrorStrategy, priority: number = -1): void {
    if (priority >= 0 && priority < this.strategies.length) {
      this.strategies.splice(priority, 0, strategy);
    } else {
      this.strategies.push(strategy);
    }
  }

  /**
   * エラーハンドリング戦略を削除
   */
  public removeStrategy(strategy: IErrorStrategy): void {
    const index = this.strategies.indexOf(strategy);
    if (index !== -1) {
      this.strategies.splice(index, 1);
    }
  }

  /**
   * エラーを処理
   */
  public async handleError(
    error: ExecutionError, 
    context: ExecutionContext
  ): Promise<ErrorHandlingResult> {
    // エラーログに追加
    this.addToLog(error);

    // 適用可能な戦略を検索
    for (const strategy of this.strategies) {
      if (strategy.canHandle(error)) {
        try {
          const result = await strategy.handle(error, context);
          
          // コールバック実行
          if (this.onErrorCallback) {
            this.onErrorCallback(error, result);
          }

          // ノード状態を更新
          this.updateNodeStateAfterError(error, result, context);

          return result;
        } catch (handlingError) {
          console.error('Error handling strategy failed:', handlingError);
          continue;
        }
      }
    }

    // どの戦略も適用できない場合のデフォルト処理
    const defaultResult: ErrorHandlingResult = {
      success: false,
      action: 'stop',
      message: `未処理エラー: ${error.message}`
    };

    this.updateNodeStateAfterError(error, defaultResult, context);
    return defaultResult;
  }

  /**
   * エラー処理後のノード状態を更新
   */
  private updateNodeStateAfterError(
    error: ExecutionError,
    result: ErrorHandlingResult,
    context: ExecutionContext
  ): void {
    if (!error.nodeId) return;

    const currentState = context.nodeStates.get(error.nodeId) || {
      nodeId: error.nodeId,
      status: ExecutionStatus.PENDING
    };

    let newStatus: ExecutionStatus;
    switch (result.action) {
      case 'retry':
        newStatus = ExecutionStatus.PENDING; // リトライのため保留に戻す
        break;
      case 'skip':
        newStatus = ExecutionStatus.COMPLETED; // スキップは完了扱い
        break;
      case 'fallback':
        newStatus = ExecutionStatus.PENDING; // フォールバック実行のため保留
        break;
      case 'stop':
      default:
        newStatus = ExecutionStatus.FAILED;
        break;
    }

    const updatedState: NodeExecutionState = {
      ...currentState,
      status: newStatus,
      error: error.message,
      endTime: Date.now()
    };

    context.nodeStates.set(error.nodeId, updatedState);
  }

  /**
   * エラーログに追加
   */
  private addToLog(error: ExecutionError): void {
    this.errorLog.push(error);

    // ログサイズ制限
    if (this.errorLog.length > this.maxLogSize) {
      this.errorLog.shift();
    }
  }

  /**
   * エラーコールバックを設定
   */
  public setErrorCallback(callback: (error: ExecutionError, result: ErrorHandlingResult) => void): void {
    this.onErrorCallback = callback;
  }

  /**
   * エラーログを取得
   */
  public getErrorLog(): ExecutionError[] {
    return [...this.errorLog];
  }

  /**
   * 特定ノードのエラーログを取得
   */
  public getNodeErrorLog(nodeId: string): ExecutionError[] {
    return this.errorLog.filter(error => error.nodeId === nodeId);
  }

  /**
   * エラー統計を取得
   */
  public getErrorStatistics(): {
    totalErrors: number;
    errorsByType: Record<string, number>;
    errorsByNode: Record<string, number>;
    recentErrors: ExecutionError[];
  } {
    const errorsByType: Record<string, number> = {};
    const errorsByNode: Record<string, number> = {};

    this.errorLog.forEach(error => {
      // タイプ別統計
      errorsByType[error.type] = (errorsByType[error.type] || 0) + 1;
      
      // ノード別統計
      if (error.nodeId) {
        errorsByNode[error.nodeId] = (errorsByNode[error.nodeId] || 0) + 1;
      }
    });

    // 最近のエラー（直近10件）
    const recentErrors = this.errorLog.slice(-10);

    return {
      totalErrors: this.errorLog.length,
      errorsByType,
      errorsByNode,
      recentErrors
    };
  }

  /**
   * エラーログをクリア
   */
  public clearErrorLog(): void {
    this.errorLog = [];
  }

  /**
   * 特定ノードのエラーログをクリア
   */
  public clearNodeErrorLog(nodeId: string): void {
    this.errorLog = this.errorLog.filter(error => error.nodeId !== nodeId);
  }

  /**
   * エラーログをJSON形式でエクスポート
   */
  public exportErrorLog(): string {
    return JSON.stringify({
      timestamp: Date.now(),
      errors: this.errorLog,
      statistics: this.getErrorStatistics()
    }, null, 2);
  }

  /**
   * エラーの重要度を評価
   */
  public evaluateErrorSeverity(error: ExecutionError): 'low' | 'medium' | 'high' | 'critical' {
    // エラータイプによる重要度判定
    switch (error.type) {
      case 'validation':
        return 'high';
      case 'runtime':
        return 'medium';
      case 'timeout':
        return 'low';
      case 'dependency':
        return 'high';
      default:
        return 'medium';
    }
  }

  /**
   * エラー復旧のための推奨アクションを取得
   */
  public getRecommendedActions(error: ExecutionError): string[] {
    const actions: string[] = [];

    switch (error.type) {
      case 'validation':
        actions.push('入力データを確認してください');
        actions.push('ノードの設定を見直してください');
        break;
      case 'runtime':
        actions.push('コードの構文を確認してください');
        actions.push('必要なライブラリが利用可能か確認してください');
        break;
      case 'timeout':
        actions.push('処理時間制限を延長してください');
        actions.push('処理を軽量化してください');
        break;
      case 'dependency':
        actions.push('依存関係を確認してください');
        actions.push('必要なノードが存在するか確認してください');
        break;
      default:
        actions.push('ログを確認して詳細を調べてください');
        break;
    }

    return actions;
  }

  /**
   * リソースクリーンアップ
   */
  public dispose(): void {
    this.strategies = [];
    this.errorLog = [];
    this.onErrorCallback = undefined;
  }
}