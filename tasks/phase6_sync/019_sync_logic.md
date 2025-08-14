# タスク019: 同期ロジック

## 目的
スクリプトファイルとノードエディタ間の双方向リアルタイム同期ロジックを実装する

## 前提条件
- タスク018が完了している
- ファイル監視機能が動作している

## 実装内容

### 1. 同期コーディネーターの実装
```typescript
// src/sync/syncCoordinator.ts
import { Node as FlowNode, Edge as FlowEdge } from 'reactflow';
import * as vscode from 'vscode';

export interface SyncState {
  scriptContent: string;
  nodes: FlowNode[];
  edges: FlowEdge[];
  ast: AST.Script;
  lastModified: 'script' | 'nodes' | 'none';
  timestamp: number;
  version: number;
}

export class SyncCoordinator {
  private state: SyncState;
  private syncInProgress: boolean = false;
  private pendingUpdates: Array<() => Promise<void>> = [];
  private parser: BashScriptParser;
  private astToNode: ASTToNodeConverter;
  private nodeToScript: NodeToScriptGenerator;

  constructor(initialContent: string = '') {
    this.parser = new BashScriptParser();
    this.astToNode = new ASTToNodeConverter();
    this.nodeToScript = new NodeToScriptGenerator();

    this.state = this.initializeState(initialContent);
  }

  private initializeState(content: string): SyncState {
    try {
      const ast = this.parser.parse(content);
      const { nodes, edges } = this.astToNode.convert(ast);

      return {
        scriptContent: content,
        nodes,
        edges,
        ast,
        lastModified: 'none',
        timestamp: Date.now(),
        version: 0,
      };
    } catch (error) {
      console.error('Failed to initialize state:', error);
      return {
        scriptContent: content,
        nodes: [],
        edges: [],
        ast: { type: 'Script', body: [] },
        lastModified: 'none',
        timestamp: Date.now(),
        version: 0,
      };
    }
  }

  async syncFromScript(newContent: string): Promise<SyncState> {
    if (this.syncInProgress) {
      // Queue the update
      return new Promise((resolve) => {
        this.pendingUpdates.push(async () => {
          const result = await this.syncFromScript(newContent);
          resolve(result);
        });
      });
    }

    this.syncInProgress = true;

    try {
      // Check if content actually changed
      if (newContent === this.state.scriptContent) {
        return this.state;
      }

      // Parse new content
      const ast = this.parser.parse(newContent);
      
      // Convert to nodes
      const { nodes, edges } = this.astToNode.convert(ast);

      // Update state
      this.state = {
        scriptContent: newContent,
        nodes,
        edges,
        ast,
        lastModified: 'script',
        timestamp: Date.now(),
        version: this.state.version + 1,
      };

      return this.state;
    } catch (error) {
      console.error('Sync from script failed:', error);
      throw error;
    } finally {
      this.syncInProgress = false;
      this.processPendingUpdates();
    }
  }

  async syncFromNodes(nodes: FlowNode[], edges: FlowEdge[]): Promise<SyncState> {
    if (this.syncInProgress) {
      // Queue the update
      return new Promise((resolve) => {
        this.pendingUpdates.push(async () => {
          const result = await this.syncFromNodes(nodes, edges);
          resolve(result);
        });
      });
    }

    this.syncInProgress = true;

    try {
      // Check if nodes actually changed
      if (this.nodesEqual(nodes, this.state.nodes) && 
          this.edgesEqual(edges, this.state.edges)) {
        return this.state;
      }

      // Generate script from nodes
      const scriptContent = this.nodeToScript.generateFromNodes(nodes, edges);
      
      // Parse to get AST (for consistency)
      const ast = this.parser.parse(scriptContent);

      // Update state
      this.state = {
        scriptContent,
        nodes,
        edges,
        ast,
        lastModified: 'nodes',
        timestamp: Date.now(),
        version: this.state.version + 1,
      };

      return this.state;
    } catch (error) {
      console.error('Sync from nodes failed:', error);
      throw error;
    } finally {
      this.syncInProgress = false;
      this.processPendingUpdates();
    }
  }

  private async processPendingUpdates(): Promise<void> {
    while (this.pendingUpdates.length > 0) {
      const update = this.pendingUpdates.shift();
      if (update) {
        await update();
      }
    }
  }

  private nodesEqual(nodes1: FlowNode[], nodes2: FlowNode[]): boolean {
    if (nodes1.length !== nodes2.length) return false;
    
    // Sort nodes by ID for comparison
    const sorted1 = [...nodes1].sort((a, b) => a.id.localeCompare(b.id));
    const sorted2 = [...nodes2].sort((a, b) => a.id.localeCompare(b.id));

    return sorted1.every((node, i) => {
      const other = sorted2[i];
      return node.id === other.id &&
             node.type === other.type &&
             JSON.stringify(node.data) === JSON.stringify(other.data) &&
             node.position.x === other.position.x &&
             node.position.y === other.position.y;
    });
  }

  private edgesEqual(edges1: FlowEdge[], edges2: FlowEdge[]): boolean {
    if (edges1.length !== edges2.length) return false;

    const sorted1 = [...edges1].sort((a, b) => a.id.localeCompare(b.id));
    const sorted2 = [...edges2].sort((a, b) => a.id.localeCompare(b.id));

    return sorted1.every((edge, i) => {
      const other = sorted2[i];
      return edge.id === other.id &&
             edge.source === other.source &&
             edge.target === other.target;
    });
  }

  getState(): SyncState {
    return { ...this.state };
  }

  getVersion(): number {
    return this.state.version;
  }

  isModified(): boolean {
    return this.state.lastModified !== 'none';
  }
}
```

### 2. 増分同期の実装
```typescript
// src/sync/incrementalSync.ts
export interface IncrementalUpdate {
  type: 'node' | 'edge' | 'script';
  operation: 'add' | 'update' | 'delete';
  target?: FlowNode | FlowEdge;
  oldValue?: any;
  newValue?: any;
  position?: { line: number; column: number };
}

export class IncrementalSyncManager {
  private updateQueue: IncrementalUpdate[] = [];
  private batchTimer: NodeJS.Timeout | null = null;
  private batchDelay: number = 100;

  queueUpdate(update: IncrementalUpdate): void {
    this.updateQueue.push(update);
    this.scheduleBatch();
  }

  private scheduleBatch(): void {
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
    }

    this.batchTimer = setTimeout(() => {
      this.processBatch();
      this.batchTimer = null;
    }, this.batchDelay);
  }

  private processBatch(): void {
    if (this.updateQueue.length === 0) return;

    // Group updates by type
    const nodeUpdates = this.updateQueue.filter(u => u.type === 'node');
    const edgeUpdates = this.updateQueue.filter(u => u.type === 'edge');
    const scriptUpdates = this.updateQueue.filter(u => u.type === 'script');

    // Process updates in order
    this.processNodeUpdates(nodeUpdates);
    this.processEdgeUpdates(edgeUpdates);
    this.processScriptUpdates(scriptUpdates);

    // Clear queue
    this.updateQueue = [];
  }

  private processNodeUpdates(updates: IncrementalUpdate[]): void {
    // Consolidate node updates
    const nodeMap = new Map<string, IncrementalUpdate>();

    for (const update of updates) {
      if (update.target && 'id' in update.target) {
        const existing = nodeMap.get(update.target.id);
        
        if (!existing || update.operation === 'delete') {
          nodeMap.set(update.target.id, update);
        } else if (update.operation === 'update') {
          // Merge updates
          nodeMap.set(update.target.id, {
            ...existing,
            newValue: update.newValue,
          });
        }
      }
    }

    // Apply consolidated updates
    for (const update of nodeMap.values()) {
      this.applyNodeUpdate(update);
    }
  }

  private processEdgeUpdates(updates: IncrementalUpdate[]): void {
    // Similar to node updates
    const edgeMap = new Map<string, IncrementalUpdate>();

    for (const update of updates) {
      if (update.target && 'id' in update.target) {
        edgeMap.set(update.target.id, update);
      }
    }

    for (const update of edgeMap.values()) {
      this.applyEdgeUpdate(update);
    }
  }

  private processScriptUpdates(updates: IncrementalUpdate[]): void {
    // Merge script updates into a single update
    if (updates.length === 0) return;

    const lastUpdate = updates[updates.length - 1];
    this.applyScriptUpdate(lastUpdate);
  }

  private applyNodeUpdate(update: IncrementalUpdate): void {
    // Apply node update to the current state
    console.log('Applying node update:', update);
  }

  private applyEdgeUpdate(update: IncrementalUpdate): void {
    // Apply edge update to the current state
    console.log('Applying edge update:', update);
  }

  private applyScriptUpdate(update: IncrementalUpdate): void {
    // Apply script update to the current state
    console.log('Applying script update:', update);
  }
}
```

### 3. 同期ストラテジーの実装
```typescript
// src/sync/syncStrategy.ts
export enum SyncMode {
  Automatic = 'automatic',
  Manual = 'manual',
  OnSave = 'onSave',
}

export interface SyncOptions {
  mode: SyncMode;
  direction: 'bidirectional' | 'scriptToNodes' | 'nodesToScript';
  conflictResolution: 'askUser' | 'preferScript' | 'preferNodes' | 'merge';
  validateBeforeSync: boolean;
}

export class SyncStrategy {
  private options: SyncOptions;
  private coordinator: SyncCoordinator;
  private validator: ConversionValidator;

  constructor(options: SyncOptions, coordinator: SyncCoordinator) {
    this.options = options;
    this.coordinator = coordinator;
    this.validator = new ConversionValidator();
  }

  async executeSync(
    source: 'script' | 'nodes',
    data: any
  ): Promise<SyncState> {
    // Check sync mode
    if (this.options.mode === SyncMode.Manual) {
      // Store pending sync but don't execute
      return this.coordinator.getState();
    }

    // Check direction
    if (!this.canSyncInDirection(source)) {
      console.log(`Sync blocked: direction is ${this.options.direction}`);
      return this.coordinator.getState();
    }

    // Validate before sync if enabled
    if (this.options.validateBeforeSync) {
      const validation = await this.validate(source, data);
      if (!validation.isValid) {
        throw new Error('Validation failed: ' + validation.errors[0]?.message);
      }
    }

    // Execute sync based on source
    if (source === 'script') {
      return this.coordinator.syncFromScript(data);
    } else {
      return this.coordinator.syncFromNodes(data.nodes, data.edges);
    }
  }

  private canSyncInDirection(source: 'script' | 'nodes'): boolean {
    const { direction } = this.options;
    
    if (direction === 'bidirectional') return true;
    if (direction === 'scriptToNodes' && source === 'script') return true;
    if (direction === 'nodesToScript' && source === 'nodes') return true;
    
    return false;
  }

  private async validate(source: string, data: any): Promise<ValidationResult> {
    if (source === 'script') {
      try {
        const ast = new BashScriptParser().parse(data);
        return { isValid: true, errors: [], warnings: [] };
      } catch (error) {
        return {
          isValid: false,
          errors: [{
            type: 'error',
            code: 'PARSE_ERROR',
            message: error.message,
          }],
          warnings: [],
        };
      }
    } else {
      // Validate nodes
      return this.validator.validateNodeSemantics(data.nodes, data.edges);
    }
  }

  async resolveConflict(
    scriptState: SyncState,
    nodeState: SyncState
  ): Promise<SyncState> {
    const { conflictResolution } = this.options;

    switch (conflictResolution) {
      case 'askUser':
        return this.askUserForResolution(scriptState, nodeState);
      
      case 'preferScript':
        return scriptState;
      
      case 'preferNodes':
        return nodeState;
      
      case 'merge':
        return this.mergeStates(scriptState, nodeState);
      
      default:
        return scriptState;
    }
  }

  private async askUserForResolution(
    scriptState: SyncState,
    nodeState: SyncState
  ): Promise<SyncState> {
    const choice = await vscode.window.showWarningMessage(
      'Conflict detected between script and nodes. Which version should be used?',
      'Use Script Version',
      'Use Node Version',
      'Cancel'
    );

    switch (choice) {
      case 'Use Script Version':
        return scriptState;
      case 'Use Node Version':
        return nodeState;
      default:
        throw new Error('Sync cancelled by user');
    }
  }

  private mergeStates(
    scriptState: SyncState,
    nodeState: SyncState
  ): SyncState {
    // Simple merge strategy: take the most recent
    if (scriptState.timestamp > nodeState.timestamp) {
      return scriptState;
    } else {
      return nodeState;
    }
  }
}
```

### 4. 同期状態の永続化
```typescript
// src/sync/syncPersistence.ts
export class SyncStatePersistence {
  private context: vscode.ExtensionContext;
  private stateKey: string;

  constructor(context: vscode.ExtensionContext, fileUri: vscode.Uri) {
    this.context = context;
    this.stateKey = `syncState_${fileUri.fsPath}`;
  }

  async saveState(state: SyncState): Promise<void> {
    // Save to workspace state
    await this.context.workspaceState.update(this.stateKey, {
      ...state,
      // Don't persist the actual nodes/edges, just metadata
      nodes: undefined,
      edges: undefined,
      ast: undefined,
    });
  }

  async loadState(): Promise<Partial<SyncState> | undefined> {
    return this.context.workspaceState.get(this.stateKey);
  }

  async clearState(): Promise<void> {
    await this.context.workspaceState.update(this.stateKey, undefined);
  }

  async saveRecoveryData(data: any): Promise<void> {
    // Save recovery data in case of crash
    const recoveryKey = `${this.stateKey}_recovery`;
    await this.context.workspaceState.update(recoveryKey, {
      timestamp: Date.now(),
      data,
    });
  }

  async loadRecoveryData(): Promise<any> {
    const recoveryKey = `${this.stateKey}_recovery`;
    const recovery = await this.context.workspaceState.get<any>(recoveryKey);
    
    if (recovery && Date.now() - recovery.timestamp < 3600000) {
      // Recovery data is less than 1 hour old
      return recovery.data;
    }
    
    return undefined;
  }
}
```

## 成果物
- src/sync/syncCoordinator.ts
- src/sync/incrementalSync.ts
- src/sync/syncStrategy.ts
- src/sync/syncPersistence.ts

## テスト方法
1. スクリプト変更が即座にノードに反映される
2. ノード変更が即座にスクリプトに反映される
3. 同期の競合が適切に解決される
4. 増分更新が正しく処理される
5. 同期状態が永続化される

## 完了条件
- [ ] 双方向同期が実装されている
- [ ] 増分同期が動作する
- [ ] 同期ストラテジーが実装されている
- [ ] 状態の永続化が実装されている
- [ ] 競合解決メカニズムが動作する