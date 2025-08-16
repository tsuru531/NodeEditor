import { Node, Edge } from 'reactflow';
import { 
  ExecutionContext,
  ExecutionStatus,
  NodeExecutionState,
  ExecutionStats,
  ExecutionError
} from './types';
import { GraphAnalyzer } from './GraphAnalyzer';
import { ExecutionQueue } from './ExecutionQueue';
import { NodeExecutor } from './NodeExecutor';
import { DataTransferSystem } from './DataTransfer';
import { StateManager } from './StateManager';
import { ErrorHandler } from './ErrorHandler';

/**
 * ワークフロー実行エンジンのオプション
 */
export interface WorkflowEngineOptions {
  maxConcurrency?: number;
  maxHistorySize?: number;
  autoSave?: boolean;
  enableErrorRecovery?: boolean;
}

/**
 * 実行イベントリスナー
 */
export interface ExecutionEventListeners {
  onStart?: () => void;
  onComplete?: (stats: ExecutionStats) => void;
  onError?: (error: ExecutionError) => void;
  onNodeStart?: (nodeId: string) => void;
  onNodeComplete?: (nodeId: string, result: any) => void;
  onNodeError?: (nodeId: string, error: string) => void;
  onProgress?: (progress: { percentage: number; completed: number; total: number }) => void;
}

/**
 * ワークフロー実行エンジンの中央管理クラス
 */
export class WorkflowEngine {
  private context: ExecutionContext;
  private analyzer: GraphAnalyzer;
  private queue: ExecutionQueue;
  private executor: NodeExecutor;
  private dataTransfer: DataTransferSystem;
  private stateManager: StateManager;
  private errorHandler: ErrorHandler;
  private listeners: ExecutionEventListeners = {};
  private options: Required<WorkflowEngineOptions>;

  constructor(options: WorkflowEngineOptions = {}) {
    this.options = {
      maxConcurrency: 4,
      maxHistorySize: 100,
      autoSave: true,
      enableErrorRecovery: true,
      ...options
    };

    // 実行コンテキストを初期化
    this.context = {
      executionId: this.generateExecutionId(),
      nodes: [],
      edges: [],
      nodeStates: new Map(),
      globalData: new Map(),
      isRunning: false
    };

    // コンポーネントを初期化
    this.analyzer = new GraphAnalyzer();
    this.executor = new NodeExecutor();
    this.dataTransfer = new DataTransferSystem();
    this.stateManager = new StateManager(this.context, this.options.maxHistorySize);
    this.errorHandler = new ErrorHandler();
    
    // ExecutionQueueは後で初期化（イベントリスナー設定後）
    this.queue = new ExecutionQueue(
      this.options.maxConcurrency,
      this.context,
      this.onNodeStateChange.bind(this),
      this.onQueueChange.bind(this)
    );

    this.setupEventHandlers();
  }

  /**
   * イベントハンドラーを設定
   */
  private setupEventHandlers(): void {
    // エラーハンドラーのコールバック設定
    this.errorHandler.setErrorCallback(async (error, result) => {
      if (this.listeners.onError) {
        this.listeners.onError(error);
      }

      // エラー復旧処理
      if (this.options.enableErrorRecovery && result.success) {
        await this.handleErrorRecovery(error, result);
      }
    });

    // 状態変更リスナー設定
    this.stateManager.addListener((change) => {
      if (change.type === 'node' && change.nodeId) {
        const state = change.current as NodeExecutionState;
        
        switch (state.status) {
          case ExecutionStatus.RUNNING:
            if (this.listeners.onNodeStart) {
              this.listeners.onNodeStart(change.nodeId);
            }
            break;
          case ExecutionStatus.COMPLETED:
            if (this.listeners.onNodeComplete) {
              this.listeners.onNodeComplete(change.nodeId, state.output);
            }
            this.handleNodeCompletion(change.nodeId);
            break;
          case ExecutionStatus.FAILED:
            if (this.listeners.onNodeError) {
              this.listeners.onNodeError(change.nodeId, state.error || '不明なエラー');
            }
            break;
        }

        // 進捗更新
        this.updateProgress();
      }
    });
  }

  /**
   * イベントリスナーを設定
   */
  public setEventListeners(listeners: ExecutionEventListeners): void {
    this.listeners = { ...this.listeners, ...listeners };
  }

  /**
   * ワークフローを実行
   */
  public async executeWorkflow(nodes: Node[], edges: Edge[]): Promise<ExecutionStats> {
    try {
      // コンテキストを更新
      this.context.nodes = nodes;
      this.context.edges = edges;
      this.context.executionId = this.generateExecutionId();
      this.context.nodeStates.clear();
      this.context.globalData.clear();

      // グラフ解析
      const analysisResult = this.analyzer.analyzeGraph(nodes, edges);
      if (!analysisResult.isValid) {
        throw new Error(`グラフ解析エラー: ${analysisResult.errors.join(', ')}`);
      }

      // データフロー検証
      const dataFlowErrors = this.dataTransfer.validateDataFlow(edges, this.context);
      if (dataFlowErrors.length > 0) {
        throw new Error(`データフロー検証エラー: ${dataFlowErrors.map(e => e.message).join(', ')}`);
      }

      // 実行開始
      this.context.isRunning = true;
      this.context.startTime = Date.now();
      
      if (this.listeners.onStart) {
        this.listeners.onStart();
      }

      // 実行計画をキューに登録
      this.queue.enqueuePlan(analysisResult.plan!);

      // 実行完了を待機
      await this.waitForCompletion();

      // 実行終了
      this.context.isRunning = false;
      this.context.endTime = Date.now();

      const stats = this.stateManager.calculateStatistics();
      
      if (this.listeners.onComplete) {
        this.listeners.onComplete(stats);
      }

      return stats;

    } catch (error) {
      this.context.isRunning = false;
      this.context.endTime = Date.now();

      const executionError: ExecutionError = {
        type: 'runtime',
        message: error instanceof Error ? error.message : '不明なエラー',
        timestamp: Date.now()
      };

      await this.errorHandler.handleError(executionError, this.context);
      throw error;
    }
  }

  /**
   * 実行完了を待機
   */
  private async waitForCompletion(): Promise<void> {
    return new Promise((resolve, reject) => {
      const checkCompletion = () => {
        const stats = this.queue.getStatistics();
        const states = Array.from(this.context.nodeStates.values());
        const runningNodes = states.filter(s => s.status === ExecutionStatus.RUNNING);
        const failedNodes = states.filter(s => s.status === ExecutionStatus.FAILED);

        // 実行中のノードがなく、キューも空の場合は完了
        if (stats.queueSize === 0 && stats.runningSize === 0 && runningNodes.length === 0) {
          resolve();
          return;
        }

        // 致命的エラーで停止する場合
        if (failedNodes.length > 0 && !this.options.enableErrorRecovery) {
          reject(new Error(`実行失敗: ${failedNodes.length}個のノードでエラーが発生しました`));
          return;
        }

        // 一定時間後に再チェック
        setTimeout(checkCompletion, 100);
      };

      checkCompletion();
    });
  }

  /**
   * ノード完了時の処理
   */
  private async handleNodeCompletion(nodeId: string): Promise<void> {
    try {
      // 完了したノードからの出力エッジを処理
      const outgoingEdges = this.context.edges.filter(edge => edge.source === nodeId);
      
      for (const edge of outgoingEdges) {
        await this.dataTransfer.executeTransfer(edge, this.context);
      }
    } catch (error) {
      const executionError: ExecutionError = {
        type: 'runtime',
        nodeId,
        message: `データ転送エラー: ${error instanceof Error ? error.message : '不明なエラー'}`,
        timestamp: Date.now()
      };

      await this.errorHandler.handleError(executionError, this.context);
    }
  }

  /**
   * エラー復旧処理
   */
  private async handleErrorRecovery(error: ExecutionError, result: any): Promise<void> {
    if (!error.nodeId) return;

    switch (result.action) {
      case 'retry':
        // リトライ
        if (result.retryDelay) {
          setTimeout(() => {
            this.queue.enqueue(error.nodeId!, 0);
          }, result.retryDelay);
        } else {
          this.queue.enqueue(error.nodeId!, 0);
        }
        break;

      case 'fallback':
        // フォールバック実行
        if (result.fallbackNodeId) {
          this.queue.enqueue(result.fallbackNodeId, 0, 1000); // 高優先度
        }
        break;

      case 'skip':
        // スキップ（何もしない）
        break;

      case 'stop':
        // 実行停止
        this.stopExecution();
        break;
    }
  }

  /**
   * 実行を停止
   */
  public stopExecution(): void {
    this.queue.cancel();
    this.context.isRunning = false;
    this.context.endTime = Date.now();
  }

  /**
   * 特定ノードの実行をキャンセル
   */
  public cancelNode(nodeId: string): void {
    this.queue.cancel(nodeId);
  }

  /**
   * ノード状態変更のコールバック
   */
  private onNodeStateChange(nodeId: string, state: NodeExecutionState): void {
    this.stateManager.updateNodeState(nodeId, state);
  }

  /**
   * キュー変更のコールバック
   */
  private onQueueChange(queueSize: number, runningSize: number): void {
    // 必要に応じて処理
  }

  /**
   * 進捗更新
   */
  private updateProgress(): void {
    if (this.listeners.onProgress) {
      const progress = this.stateManager.getProgress();
      this.listeners.onProgress(progress);
    }
  }

  /**
   * 実行統計を取得
   */
  public getExecutionStatistics(): ExecutionStats {
    return this.stateManager.calculateStatistics();
  }

  /**
   * 実行状態を取得
   */
  public getExecutionState(): {
    isRunning: boolean;
    progress: any;
    nodeStates: Map<string, NodeExecutionState>;
    errors: ExecutionError[];
    queueStats: any;
  } {
    return {
      isRunning: this.context.isRunning,
      progress: this.stateManager.getProgress(),
      nodeStates: new Map(this.context.nodeStates),
      errors: this.errorHandler.getErrorLog(),
      queueStats: this.queue.getStatistics()
    };
  }

  /**
   * ノードの詳細情報を取得
   */
  public getNodeDetails(nodeId: string): any {
    return this.stateManager.getNodeDetails(nodeId);
  }

  /**
   * グラフ統計を取得
   */
  public getGraphStatistics(nodes: Node[], edges: Edge[]): any {
    return this.analyzer.getGraphStatistics(nodes, edges);
  }

  /**
   * 状態をエクスポート
   */
  public exportState(): string {
    return this.stateManager.exportState();
  }

  /**
   * 状態をインポート
   */
  public importState(jsonData: string): boolean {
    return this.stateManager.importState(jsonData);
  }

  /**
   * 実行IDを生成
   */
  private generateExecutionId(): string {
    return `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * リソースクリーンアップ
   */
  public dispose(): void {
    this.stopExecution();
    this.stateManager.dispose();
    this.errorHandler.dispose();
    this.dataTransfer.cancelAllTransfers();
    this.queue.clear();
  }

  /**
   * エンジンの健全性チェック
   */
  public healthCheck(): {
    status: 'healthy' | 'warning' | 'error';
    details: {
      components: Record<string, boolean>;
      memory: {
        nodeStates: number;
        errorLog: number;
        historySize: number;
      };
      performance: {
        averageExecutionTime: number;
        queueUtilization: number;
      };
    };
  } {
    const errorStats = this.errorHandler.getErrorStatistics();
    const queueStats = this.queue.getStatistics();
    const execStats = this.getExecutionStatistics();

    const components = {
      analyzer: true,
      executor: true,
      dataTransfer: true,
      stateManager: true,
      errorHandler: true,
      queue: true
    };

    const memory = {
      nodeStates: this.context.nodeStates.size,
      errorLog: errorStats.totalErrors,
      historySize: this.stateManager.getHistoryStatistics().totalSnapshots
    };

    const performance = {
      averageExecutionTime: execStats.averageExecutionTime,
      queueUtilization: queueStats.runningSize / this.options.maxConcurrency
    };

    let status: 'healthy' | 'warning' | 'error' = 'healthy';

    // 警告条件
    if (errorStats.totalErrors > 10 || memory.historySize > this.options.maxHistorySize * 0.9) {
      status = 'warning';
    }

    // エラー条件
    if (errorStats.totalErrors > 50 || Object.values(components).some(c => !c)) {
      status = 'error';
    }

    return {
      status,
      details: {
        components,
        memory,
        performance
      }
    };
  }
}