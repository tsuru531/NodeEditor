import { 
  ExecutionPlan,
  NodeExecutionState, 
  ExecutionStatus,
  ExecutionContext,
  ExecutionError
} from './types';

/**
 * 実行キューシステム
 * タスクの並列実行と優先度管理を行う
 */
export class ExecutionQueue {
  private queue: Array<{
    nodeId: string;
    level: number;
    priority: number;
    promise?: Promise<any>;
    resolve?: (value: any) => void;
    reject?: (error: any) => void;
  }> = [];
  
  private running = new Map<string, Promise<any>>();
  private maxConcurrency: number;
  private context: ExecutionContext;
  private onStateChange?: (nodeId: string, state: NodeExecutionState) => void;
  private onQueueChange?: (queueSize: number, runningSize: number) => void;

  constructor(
    maxConcurrency: number = 4,
    context: ExecutionContext,
    onStateChange?: (nodeId: string, state: NodeExecutionState) => void,
    onQueueChange?: (queueSize: number, runningSize: number) => void
  ) {
    this.maxConcurrency = maxConcurrency;
    this.context = context;
    this.onStateChange = onStateChange;
    this.onQueueChange = onQueueChange;
  }

  /**
   * 実行計画に基づいてタスクをキューに追加
   */
  public enqueuePlan(plan: ExecutionPlan): void {
    plan.levels.forEach((level, levelIndex) => {
      level.forEach(nodeId => {
        this.enqueue(nodeId, levelIndex, this.calculatePriority(nodeId, levelIndex));
      });
    });
    
    this.notifyQueueChange();
  }

  /**
   * 単一ノードをキューに追加
   */
  public enqueue(nodeId: string, level: number, priority: number = 0): Promise<any> {
    return new Promise((resolve, reject) => {
      this.queue.push({
        nodeId,
        level,
        priority,
        resolve,
        reject
      });
      
      // 優先度順にソート（高い優先度が先）
      this.queue.sort((a, b) => b.priority - a.priority || a.level - b.level);
      
      this.notifyQueueChange();
      this.processQueue();
    });
  }

  /**
   * キューからタスクを削除
   */
  public dequeue(nodeId: string): boolean {
    const index = this.queue.findIndex(item => item.nodeId === nodeId);
    if (index !== -1) {
      const item = this.queue.splice(index, 1)[0];
      if (item.reject) {
        item.reject(new Error('タスクがキャンセルされました'));
      }
      this.notifyQueueChange();
      return true;
    }
    return false;
  }

  /**
   * キューを処理して実行可能なタスクを開始
   */
  private async processQueue(): Promise<void> {
    while (this.queue.length > 0 && this.running.size < this.maxConcurrency) {
      const item = this.findExecutableTask();
      if (!item) break;
      
      // キューから削除
      const index = this.queue.indexOf(item);
      this.queue.splice(index, 1);
      
      // 実行開始
      this.startExecution(item);
    }
    
    this.notifyQueueChange();
  }

  /**
   * 実行可能なタスクを検索
   */
  private findExecutableTask(): typeof this.queue[0] | null {
    return this.queue.find(item => this.canExecute(item.nodeId)) || null;
  }

  /**
   * ノードが実行可能かチェック
   */
  private canExecute(nodeId: string): boolean {
    const node = this.context.nodes.find(n => n.id === nodeId);
    if (!node) return false;
    
    // 依存関係チェック
    const dependencies = this.getDependencies(nodeId);
    return dependencies.every(depId => {
      const depState = this.context.nodeStates.get(depId);
      return depState && depState.status === ExecutionStatus.COMPLETED;
    });
  }

  /**
   * ノードの依存関係を取得
   */
  private getDependencies(nodeId: string): string[] {
    const dependencies: string[] = [];
    
    this.context.edges.forEach(edge => {
      if (edge.target === nodeId) {
        dependencies.push(edge.source);
      }
    });
    
    return dependencies;
  }

  /**
   * タスクの実行を開始
   */
  private async startExecution(item: typeof this.queue[0]): Promise<void> {
    const { nodeId, resolve, reject } = item;
    
    try {
      // 実行状態を更新
      this.updateNodeState(nodeId, {
        nodeId,
        status: ExecutionStatus.RUNNING,
        startTime: Date.now()
      });
      
      // 実行プロミスを作成
      const executionPromise = this.executeNode(nodeId);
      this.running.set(nodeId, executionPromise);
      
      // 実行完了を待機
      const result = await executionPromise;
      
      // 完了状態を更新
      this.updateNodeState(nodeId, {
        nodeId,
        status: ExecutionStatus.COMPLETED,
        endTime: Date.now(),
        output: result
      });
      
      this.running.delete(nodeId);
      
      if (resolve) resolve(result);
      
      // 次のタスクを処理
      this.processQueue();
      
    } catch (error) {
      // エラー状態を更新
      this.updateNodeState(nodeId, {
        nodeId,
        status: ExecutionStatus.FAILED,
        endTime: Date.now(),
        error: error instanceof Error ? error.message : '不明なエラー'
      });
      
      this.running.delete(nodeId);
      
      if (reject) reject(error);
      
      // エラー時も次のタスクを処理（依存関係のないタスクは継続）
      this.processQueue();
    }
  }

  /**
   * ノードを実行（具体的な実行ロジックは NodeExecutor に委譲）
   */
  private async executeNode(nodeId: string): Promise<any> {
    // この部分は NodeExecutor で実装される
    // ここでは仮の実装
    const node = this.context.nodes.find(n => n.id === nodeId);
    if (!node) {
      throw new Error(`ノードが見つかりません: ${nodeId}`);
    }
    
    // 仮の実行時間（実際の実装では NodeExecutor を使用）
    await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500));
    
    return { nodeId, result: `${node.type} executed successfully` };
  }

  /**
   * ノード状態を更新
   */
  private updateNodeState(nodeId: string, state: Partial<NodeExecutionState>): void {
    const currentState = this.context.nodeStates.get(nodeId) || {
      nodeId,
      status: ExecutionStatus.PENDING
    };
    
    const newState = { ...currentState, ...state };
    this.context.nodeStates.set(nodeId, newState);
    
    if (this.onStateChange) {
      this.onStateChange(nodeId, newState);
    }
  }

  /**
   * 優先度を計算
   */
  private calculatePriority(nodeId: string, level: number): number {
    // 基本優先度（レベルが低いほど高優先度）
    let priority = 1000 - level * 100;
    
    // ノードタイプによる調整
    const node = this.context.nodes.find(n => n.id === nodeId);
    if (node) {
      switch (node.type) {
        case 'function':
          priority += 50; // 関数ノードは高優先度
          break;
        case 'memo':
          priority -= 10; // メモノードは低優先度
          break;
        default:
          break;
      }
    }
    
    return priority;
  }

  /**
   * キューの変更を通知
   */
  private notifyQueueChange(): void {
    if (this.onQueueChange) {
      this.onQueueChange(this.queue.length, this.running.size);
    }
  }

  /**
   * 実行をキャンセル
   */
  public cancel(nodeId?: string): void {
    if (nodeId) {
      // 特定ノードのキャンセル
      this.dequeue(nodeId);
      const runningPromise = this.running.get(nodeId);
      if (runningPromise) {
        this.updateNodeState(nodeId, {
          nodeId,
          status: ExecutionStatus.CANCELLED,
          endTime: Date.now()
        });
        this.running.delete(nodeId);
      }
    } else {
      // 全実行のキャンセル
      this.queue.forEach(item => {
        if (item.reject) {
          item.reject(new Error('実行がキャンセルされました'));
        }
      });
      this.queue = [];
      
      this.running.forEach((promise, nodeId) => {
        this.updateNodeState(nodeId, {
          nodeId,
          status: ExecutionStatus.CANCELLED,
          endTime: Date.now()
        });
      });
      this.running.clear();
    }
    
    this.notifyQueueChange();
  }

  /**
   * キューの統計情報を取得
   */
  public getStatistics(): {
    queueSize: number;
    runningSize: number;
    completedCount: number;
    failedCount: number;
    averageWaitTime: number;
  } {
    const states = Array.from(this.context.nodeStates.values());
    const completedCount = states.filter(s => s.status === ExecutionStatus.COMPLETED).length;
    const failedCount = states.filter(s => s.status === ExecutionStatus.FAILED).length;
    
    // 平均待機時間を計算
    const completedStates = states.filter(s => 
      s.status === ExecutionStatus.COMPLETED && s.startTime && s.endTime
    );
    const averageWaitTime = completedStates.length > 0
      ? completedStates.reduce((sum, state) => 
          sum + (state.endTime! - state.startTime!), 0
        ) / completedStates.length
      : 0;
    
    return {
      queueSize: this.queue.length,
      runningSize: this.running.size,
      completedCount,
      failedCount,
      averageWaitTime
    };
  }

  /**
   * 実行状況をクリア
   */
  public clear(): void {
    this.cancel();
    this.context.nodeStates.clear();
  }
}