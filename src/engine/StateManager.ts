import { 
  ExecutionContext,
  NodeExecutionState,
  ExecutionStatus,
  ExecutionStats,
  ExecutionError
} from './types';

/**
 * 状態変更リスナーの型定義
 */
export type StateChangeListener = (change: StateChange) => void;

/**
 * 状態変更イベント
 */
export interface StateChange {
  type: 'node' | 'context' | 'error';
  nodeId?: string;
  previous?: any;
  current: any;
  timestamp: number;
}

/**
 * 状態スナップショット
 */
export interface StateSnapshot {
  executionId: string;
  timestamp: number;
  context: ExecutionContext;
  statistics: ExecutionStats;
}

/**
 * 実行状態管理システム
 */
export class StateManager {
  private context: ExecutionContext;
  private listeners: StateChangeListener[] = [];
  private history: StateSnapshot[] = [];
  private maxHistorySize: number = 100;
  private autoSaveInterval?: NodeJS.Timeout;

  constructor(context: ExecutionContext, maxHistorySize: number = 100) {
    this.context = context;
    this.maxHistorySize = maxHistorySize;
    this.startAutoSave();
  }

  /**
   * 実行コンテキストを取得
   */
  public getContext(): ExecutionContext {
    return this.context;
  }

  /**
   * 状態変更リスナーを追加
   */
  public addListener(listener: StateChangeListener): void {
    this.listeners.push(listener);
  }

  /**
   * 状態変更リスナーを削除
   */
  public removeListener(listener: StateChangeListener): void {
    const index = this.listeners.indexOf(listener);
    if (index !== -1) {
      this.listeners.splice(index, 1);
    }
  }

  /**
   * ノード実行状態を更新
   */
  public updateNodeState(nodeId: string, updates: Partial<NodeExecutionState>): void {
    const previousState = this.context.nodeStates.get(nodeId);
    const currentState: NodeExecutionState = {
      nodeId,
      status: ExecutionStatus.PENDING,
      ...previousState,
      ...updates
    };

    this.context.nodeStates.set(nodeId, currentState);

    // 状態変更を通知
    this.notifyListeners({
      type: 'node',
      nodeId,
      previous: previousState,
      current: currentState,
      timestamp: Date.now()
    });

    // 実行コンテキストの状態を更新
    this.updateContextState();
  }

  /**
   * 実行コンテキストの状態を更新
   */
  private updateContextState(): void {
    const states = Array.from(this.context.nodeStates.values());
    const runningStates = states.filter(s => s.status === ExecutionStatus.RUNNING);
    
    // 実行中ノードがある場合は実行中に設定
    const wasRunning = this.context.isRunning;
    this.context.isRunning = runningStates.length > 0;

    // 実行開始時刻を設定
    if (!wasRunning && this.context.isRunning && !this.context.startTime) {
      this.context.startTime = Date.now();
    }

    // 実行終了時刻を設定
    if (wasRunning && !this.context.isRunning && this.context.startTime && !this.context.endTime) {
      this.context.endTime = Date.now();
    }
  }

  /**
   * エラー状態を追加
   */
  public addError(error: ExecutionError): void {
    // エラー履歴をグローバルデータに保存
    const errorsKey = 'execution_errors';
    let errors = this.context.globalData.get(errorsKey) || [];
    
    if (!Array.isArray(errors)) {
      errors = [];
    }
    
    errors.push(error);
    this.context.globalData.set(errorsKey, errors);

    // エラー通知
    this.notifyListeners({
      type: 'error',
      current: error,
      timestamp: Date.now()
    });
  }

  /**
   * 実行統計を計算
   */
  public calculateStatistics(): ExecutionStats {
    const states = Array.from(this.context.nodeStates.values());
    const totalNodes = states.length;
    const completedNodes = states.filter(s => s.status === ExecutionStatus.COMPLETED).length;
    const failedNodes = states.filter(s => s.status === ExecutionStatus.FAILED).length;

    // 平均実行時間を計算
    const completedStates = states.filter(s => 
      s.status === ExecutionStatus.COMPLETED && s.startTime && s.endTime
    );
    const averageExecutionTime = completedStates.length > 0
      ? completedStates.reduce((sum, state) => 
          sum + (state.endTime! - state.startTime!), 0
        ) / completedStates.length
      : 0;

    // 総実行時間を計算
    const totalExecutionTime = this.context.startTime && this.context.endTime
      ? this.context.endTime - this.context.startTime
      : this.context.startTime
        ? Date.now() - this.context.startTime
        : 0;

    // 並列実行効率を計算
    const parallelismUtilization = totalNodes > 0 && totalExecutionTime > 0
      ? (completedStates.reduce((sum, state) => 
          sum + (state.endTime! - state.startTime!), 0
        ) / totalExecutionTime) * 100
      : 0;

    return {
      totalNodes,
      completedNodes,
      failedNodes,
      averageExecutionTime,
      totalExecutionTime,
      parallelismUtilization
    };
  }

  /**
   * 現在の状態スナップショットを作成
   */
  public createSnapshot(): StateSnapshot {
    return {
      executionId: this.context.executionId,
      timestamp: Date.now(),
      context: this.deepCloneContext(this.context),
      statistics: this.calculateStatistics()
    };
  }

  /**
   * 状態履歴に保存
   */
  public saveToHistory(): void {
    const snapshot = this.createSnapshot();
    this.history.push(snapshot);

    // 履歴サイズ制限
    if (this.history.length > this.maxHistorySize) {
      this.history.shift();
    }
  }

  /**
   * 指定されたスナップショットから状態を復元
   */
  public restoreFromSnapshot(snapshot: StateSnapshot): void {
    this.context = this.deepCloneContext(snapshot.context);
    
    this.notifyListeners({
      type: 'context',
      current: this.context,
      timestamp: Date.now()
    });
  }

  /**
   * 最新の履歴から状態を復元
   */
  public restoreFromHistory(steps: number = 1): boolean {
    if (this.history.length < steps) {
      return false;
    }

    const targetSnapshot = this.history[this.history.length - steps];
    this.restoreFromSnapshot(targetSnapshot);
    return true;
  }

  /**
   * 状態をリセット
   */
  public reset(): void {
    this.context.nodeStates.clear();
    this.context.globalData.clear();
    this.context.isRunning = false;
    this.context.startTime = undefined;
    this.context.endTime = undefined;

    this.notifyListeners({
      type: 'context',
      current: this.context,
      timestamp: Date.now()
    });
  }

  /**
   * 実行進捗を取得
   */
  public getProgress(): {
    percentage: number;
    completed: number;
    total: number;
    running: number;
    failed: number;
  } {
    const states = Array.from(this.context.nodeStates.values());
    const total = states.length;
    const completed = states.filter(s => s.status === ExecutionStatus.COMPLETED).length;
    const running = states.filter(s => s.status === ExecutionStatus.RUNNING).length;
    const failed = states.filter(s => s.status === ExecutionStatus.FAILED).length;
    
    const percentage = total > 0 ? (completed / total) * 100 : 0;

    return {
      percentage,
      completed,
      total,
      running,
      failed
    };
  }

  /**
   * ノード別の詳細状態を取得
   */
  public getNodeDetails(nodeId: string): {
    state?: NodeExecutionState;
    inputs?: Map<string, any>;
    dependencies?: string[];
    dependents?: string[];
  } {
    const state = this.context.nodeStates.get(nodeId);
    const inputs = this.context.globalData.get(`${nodeId}_inputs`) as Map<string, any>;
    
    // 依存関係を計算
    const dependencies: string[] = [];
    const dependents: string[] = [];
    
    this.context.edges.forEach(edge => {
      if (edge.target === nodeId) {
        dependencies.push(edge.source);
      }
      if (edge.source === nodeId) {
        dependents.push(edge.target);
      }
    });

    return {
      state,
      inputs,
      dependencies,
      dependents
    };
  }

  /**
   * エラー履歴を取得
   */
  public getErrors(): ExecutionError[] {
    const errors = this.context.globalData.get('execution_errors');
    return Array.isArray(errors) ? errors : [];
  }

  /**
   * 自動保存を開始
   */
  private startAutoSave(): void {
    this.autoSaveInterval = setInterval(() => {
      if (this.context.isRunning) {
        this.saveToHistory();
      }
    }, 5000); // 5秒間隔で自動保存
  }

  /**
   * 自動保存を停止
   */
  public stopAutoSave(): void {
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
      this.autoSaveInterval = undefined;
    }
  }

  /**
   * リスナーに状態変更を通知
   */
  private notifyListeners(change: StateChange): void {
    this.listeners.forEach(listener => {
      try {
        listener(change);
      } catch (error) {
        console.error('State change listener error:', error);
      }
    });
  }

  /**
   * 実行コンテキストの深いコピーを作成
   */
  private deepCloneContext(context: ExecutionContext): ExecutionContext {
    return {
      executionId: context.executionId,
      nodes: JSON.parse(JSON.stringify(context.nodes)),
      edges: JSON.parse(JSON.stringify(context.edges)),
      nodeStates: new Map(context.nodeStates),
      globalData: new Map(context.globalData),
      isRunning: context.isRunning,
      startTime: context.startTime,
      endTime: context.endTime
    };
  }

  /**
   * 状態データをJSON形式でエクスポート
   */
  public exportState(): string {
    const exportData = {
      executionId: this.context.executionId,
      timestamp: Date.now(),
      nodes: this.context.nodes,
      edges: this.context.edges,
      nodeStates: Object.fromEntries(this.context.nodeStates),
      globalData: Object.fromEntries(this.context.globalData),
      statistics: this.calculateStatistics(),
      errors: this.getErrors()
    };

    return JSON.stringify(exportData, null, 2);
  }

  /**
   * JSON形式の状態データをインポート
   */
  public importState(jsonData: string): boolean {
    try {
      const data = JSON.parse(jsonData);
      
      this.context.executionId = data.executionId || this.context.executionId;
      this.context.nodes = data.nodes || this.context.nodes;
      this.context.edges = data.edges || this.context.edges;
      
      if (data.nodeStates) {
        this.context.nodeStates = new Map(Object.entries(data.nodeStates));
      }
      
      if (data.globalData) {
        this.context.globalData = new Map(Object.entries(data.globalData));
      }

      this.notifyListeners({
        type: 'context',
        current: this.context,
        timestamp: Date.now()
      });

      return true;
    } catch (error) {
      console.error('State import error:', error);
      return false;
    }
  }

  /**
   * リソースクリーンアップ
   */
  public dispose(): void {
    this.stopAutoSave();
    this.listeners = [];
    this.history = [];
  }

  /**
   * 履歴統計を取得
   */
  public getHistoryStatistics(): {
    totalSnapshots: number;
    oldestSnapshot?: number;
    newestSnapshot?: number;
    averageInterval: number;
  } {
    const totalSnapshots = this.history.length;
    
    if (totalSnapshots === 0) {
      return {
        totalSnapshots: 0,
        averageInterval: 0
      };
    }

    const timestamps = this.history.map(h => h.timestamp);
    const oldestSnapshot = Math.min(...timestamps);
    const newestSnapshot = Math.max(...timestamps);
    
    const averageInterval = totalSnapshots > 1
      ? (newestSnapshot - oldestSnapshot) / (totalSnapshots - 1)
      : 0;

    return {
      totalSnapshots,
      oldestSnapshot,
      newestSnapshot,
      averageInterval
    };
  }
}