# タスク020: 競合解決

## 目的
スクリプトとノードエディタ間で発生する同期の競合を検出し、解決するメカニズムを実装する

## 前提条件
- タスク019が完了している
- 同期ロジックが実装されている

## 実装内容

### 1. 競合検出器の実装
```typescript
// src/sync/conflictDetector.ts
export interface Conflict {
  id: string;
  type: ConflictType;
  location: ConflictLocation;
  scriptValue: any;
  nodeValue: any;
  description: string;
  severity: 'high' | 'medium' | 'low';
  suggestedResolution?: ResolutionStrategy;
}

export enum ConflictType {
  StructuralMismatch = 'structural_mismatch',
  DataInconsistency = 'data_inconsistency',
  OrderingConflict = 'ordering_conflict',
  DuplicateDefinition = 'duplicate_definition',
  MissingReference = 'missing_reference',
  TypeMismatch = 'type_mismatch',
}

export interface ConflictLocation {
  scriptLine?: number;
  scriptColumn?: number;
  nodeId?: string;
  astPath?: string[];
}

export enum ResolutionStrategy {
  UseScript = 'use_script',
  UseNodes = 'use_nodes',
  Merge = 'merge',
  Manual = 'manual',
  AutoResolve = 'auto_resolve',
}

export class ConflictDetector {
  detectConflicts(
    scriptState: SyncState,
    nodeState: SyncState
  ): Conflict[] {
    const conflicts: Conflict[] = [];

    // Check structural conflicts
    conflicts.push(...this.detectStructuralConflicts(scriptState, nodeState));

    // Check data conflicts
    conflicts.push(...this.detectDataConflicts(scriptState, nodeState));

    // Check ordering conflicts
    conflicts.push(...this.detectOrderingConflicts(scriptState, nodeState));

    // Check reference conflicts
    conflicts.push(...this.detectReferenceConflicts(scriptState, nodeState));

    return conflicts;
  }

  private detectStructuralConflicts(
    scriptState: SyncState,
    nodeState: SyncState
  ): Conflict[] {
    const conflicts: Conflict[] = [];

    // Compare AST structure with node graph
    const scriptCommands = this.extractCommands(scriptState.ast);
    const nodeCommands = this.extractNodeCommands(nodeState.nodes);

    // Check for mismatched command counts
    if (scriptCommands.length !== nodeCommands.length) {
      conflicts.push({
        id: `struct_count_${Date.now()}`,
        type: ConflictType.StructuralMismatch,
        location: {},
        scriptValue: scriptCommands.length,
        nodeValue: nodeCommands.length,
        description: `Script has ${scriptCommands.length} commands, nodes have ${nodeCommands.length}`,
        severity: 'high',
        suggestedResolution: ResolutionStrategy.Manual,
      });
    }

    // Check for structural differences in control flow
    const scriptFlow = this.analyzeControlFlow(scriptState.ast);
    const nodeFlow = this.analyzeNodeFlow(nodeState.nodes, nodeState.edges);

    if (!this.flowsMatch(scriptFlow, nodeFlow)) {
      conflicts.push({
        id: `struct_flow_${Date.now()}`,
        type: ConflictType.StructuralMismatch,
        location: {},
        scriptValue: scriptFlow,
        nodeValue: nodeFlow,
        description: 'Control flow structure differs between script and nodes',
        severity: 'high',
        suggestedResolution: ResolutionStrategy.UseScript,
      });
    }

    return conflicts;
  }

  private detectDataConflicts(
    scriptState: SyncState,
    nodeState: SyncState
  ): Conflict[] {
    const conflicts: Conflict[] = [];

    // Map nodes to AST elements
    const mapping = this.createNodeASTMapping(nodeState.nodes, scriptState.ast);

    for (const [nodeId, astElement] of mapping) {
      const node = nodeState.nodes.find(n => n.id === nodeId);
      if (!node) continue;

      // Compare data values
      const nodeData = node.data;
      const astData = this.extractASTData(astElement);

      if (!this.dataMatches(nodeData, astData)) {
        conflicts.push({
          id: `data_${nodeId}`,
          type: ConflictType.DataInconsistency,
          location: { nodeId },
          scriptValue: astData,
          nodeValue: nodeData,
          description: `Data mismatch for node ${nodeId}`,
          severity: 'medium',
          suggestedResolution: ResolutionStrategy.UseScript,
        });
      }
    }

    return conflicts;
  }

  private detectOrderingConflicts(
    scriptState: SyncState,
    nodeState: SyncState
  ): Conflict[] {
    const conflicts: Conflict[] = [];

    // Get execution order from both representations
    const scriptOrder = this.getExecutionOrder(scriptState.ast);
    const nodeOrder = this.getNodeExecutionOrder(nodeState.nodes, nodeState.edges);

    // Compare orders
    for (let i = 0; i < Math.min(scriptOrder.length, nodeOrder.length); i++) {
      if (scriptOrder[i] !== nodeOrder[i]) {
        conflicts.push({
          id: `order_${i}`,
          type: ConflictType.OrderingConflict,
          location: { scriptLine: i + 1 },
          scriptValue: scriptOrder[i],
          nodeValue: nodeOrder[i],
          description: `Execution order differs at position ${i + 1}`,
          severity: 'medium',
          suggestedResolution: ResolutionStrategy.UseScript,
        });
      }
    }

    return conflicts;
  }

  private detectReferenceConflicts(
    scriptState: SyncState,
    nodeState: SyncState
  ): Conflict[] {
    const conflicts: Conflict[] = [];

    // Check variable references
    const scriptVars = this.extractVariables(scriptState.ast);
    const nodeVars = this.extractNodeVariables(nodeState.nodes);

    // Check for undefined references in nodes
    for (const node of nodeState.nodes) {
      const refs = this.extractReferences(node);
      
      for (const ref of refs) {
        if (!nodeVars.has(ref) && !scriptVars.has(ref)) {
          conflicts.push({
            id: `ref_${node.id}_${ref}`,
            type: ConflictType.MissingReference,
            location: { nodeId: node.id },
            scriptValue: null,
            nodeValue: ref,
            description: `Undefined reference to '${ref}' in node ${node.id}`,
            severity: 'high',
            suggestedResolution: ResolutionStrategy.Manual,
          });
        }
      }
    }

    return conflicts;
  }

  // Helper methods
  private extractCommands(ast: AST.Script): any[] {
    // Implementation to extract commands from AST
    return [];
  }

  private extractNodeCommands(nodes: FlowNode[]): any[] {
    return nodes.filter(n => n.type === 'command');
  }

  private analyzeControlFlow(ast: AST.Script): any {
    // Analyze control flow from AST
    return {};
  }

  private analyzeNodeFlow(nodes: FlowNode[], edges: FlowEdge[]): any {
    // Analyze control flow from nodes
    return {};
  }

  private flowsMatch(flow1: any, flow2: any): boolean {
    return JSON.stringify(flow1) === JSON.stringify(flow2);
  }

  private createNodeASTMapping(
    nodes: FlowNode[],
    ast: AST.Script
  ): Map<string, any> {
    // Create mapping between nodes and AST elements
    return new Map();
  }

  private extractASTData(astElement: any): any {
    // Extract data from AST element
    return {};
  }

  private dataMatches(data1: any, data2: any): boolean {
    return JSON.stringify(data1) === JSON.stringify(data2);
  }

  private getExecutionOrder(ast: AST.Script): string[] {
    // Get execution order from AST
    return [];
  }

  private getNodeExecutionOrder(nodes: FlowNode[], edges: FlowEdge[]): string[] {
    // Get execution order from nodes
    return [];
  }

  private extractVariables(ast: AST.Script): Set<string> {
    // Extract variable definitions from AST
    return new Set();
  }

  private extractNodeVariables(nodes: FlowNode[]): Set<string> {
    const vars = new Set<string>();
    
    for (const node of nodes) {
      if (node.type === 'variable') {
        vars.add(node.data.name);
      }
    }
    
    return vars;
  }

  private extractReferences(node: FlowNode): string[] {
    // Extract variable references from node
    const refs: string[] = [];
    
    if (node.type === 'command') {
      // Parse command and args for variable references
      const varPattern = /\$\{?(\w+)\}?/g;
      let match;
      
      while ((match = varPattern.exec(node.data.command)) !== null) {
        refs.push(match[1]);
      }
      
      for (const arg of node.data.args || []) {
        varPattern.lastIndex = 0;
        while ((match = varPattern.exec(arg)) !== null) {
          refs.push(match[1]);
        }
      }
    }
    
    return refs;
  }
}
```

### 2. 競合解決器の実装
```typescript
// src/sync/conflictResolver.ts
export class ConflictResolver {
  private strategies: Map<ConflictType, ResolutionStrategy[]>;

  constructor() {
    this.strategies = new Map([
      [ConflictType.StructuralMismatch, [
        ResolutionStrategy.UseScript,
        ResolutionStrategy.Manual,
      ]],
      [ConflictType.DataInconsistency, [
        ResolutionStrategy.UseScript,
        ResolutionStrategy.UseNodes,
        ResolutionStrategy.Merge,
      ]],
      [ConflictType.OrderingConflict, [
        ResolutionStrategy.UseScript,
        ResolutionStrategy.Manual,
      ]],
      [ConflictType.DuplicateDefinition, [
        ResolutionStrategy.Merge,
        ResolutionStrategy.Manual,
      ]],
      [ConflictType.MissingReference, [
        ResolutionStrategy.Manual,
      ]],
      [ConflictType.TypeMismatch, [
        ResolutionStrategy.UseScript,
        ResolutionStrategy.Manual,
      ]],
    ]);
  }

  async resolveConflicts(
    conflicts: Conflict[],
    scriptState: SyncState,
    nodeState: SyncState,
    options: ConflictResolutionOptions
  ): Promise<SyncState> {
    if (conflicts.length === 0) {
      return scriptState; // No conflicts
    }

    // Group conflicts by severity
    const highSeverity = conflicts.filter(c => c.severity === 'high');
    const mediumSeverity = conflicts.filter(c => c.severity === 'medium');
    const lowSeverity = conflicts.filter(c => c.severity === 'low');

    // Handle high severity conflicts first
    if (highSeverity.length > 0) {
      if (options.autoResolve && this.canAutoResolve(highSeverity)) {
        return this.autoResolve(highSeverity, scriptState, nodeState);
      } else {
        return this.manualResolve(highSeverity, scriptState, nodeState);
      }
    }

    // Auto-resolve medium and low severity
    const resolved = await this.resolveByStrategy(
      [...mediumSeverity, ...lowSeverity],
      scriptState,
      nodeState,
      options
    );

    return resolved;
  }

  private canAutoResolve(conflicts: Conflict[]): boolean {
    return conflicts.every(c => 
      c.suggestedResolution && 
      c.suggestedResolution !== ResolutionStrategy.Manual
    );
  }

  private async autoResolve(
    conflicts: Conflict[],
    scriptState: SyncState,
    nodeState: SyncState
  ): Promise<SyncState> {
    let resolvedState = scriptState;

    for (const conflict of conflicts) {
      if (!conflict.suggestedResolution) continue;

      switch (conflict.suggestedResolution) {
        case ResolutionStrategy.UseScript:
          // Script state is already the base
          break;
        
        case ResolutionStrategy.UseNodes:
          resolvedState = this.applyNodeValue(resolvedState, conflict);
          break;
        
        case ResolutionStrategy.Merge:
          resolvedState = this.mergeValues(resolvedState, conflict);
          break;
        
        case ResolutionStrategy.AutoResolve:
          resolvedState = this.applyAutoResolution(resolvedState, conflict);
          break;
      }
    }

    return resolvedState;
  }

  private async manualResolve(
    conflicts: Conflict[],
    scriptState: SyncState,
    nodeState: SyncState
  ): Promise<SyncState> {
    // Show conflict resolution UI
    const resolution = await this.showConflictUI(conflicts, scriptState, nodeState);
    
    if (!resolution) {
      throw new Error('Conflict resolution cancelled');
    }

    return resolution;
  }

  private async showConflictUI(
    conflicts: Conflict[],
    scriptState: SyncState,
    nodeState: SyncState
  ): Promise<SyncState | null> {
    // Create webview for conflict resolution
    const panel = vscode.window.createWebviewPanel(
      'conflictResolver',
      'Resolve Sync Conflicts',
      vscode.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
      }
    );

    // Set HTML content
    panel.webview.html = this.getConflictUIHtml(conflicts, scriptState, nodeState);

    // Handle messages from webview
    return new Promise((resolve) => {
      panel.webview.onDidReceiveMessage(
        message => {
          switch (message.command) {
            case 'resolve':
              resolve(message.resolution);
              panel.dispose();
              break;
            case 'cancel':
              resolve(null);
              panel.dispose();
              break;
          }
        }
      );
    });
  }

  private getConflictUIHtml(
    conflicts: Conflict[],
    scriptState: SyncState,
    nodeState: SyncState
  ): string {
    return `<!DOCTYPE html>
      <html>
      <head>
        <style>
          /* Conflict UI styles */
        </style>
      </head>
      <body>
        <h1>Resolve Sync Conflicts</h1>
        <div id="conflicts">
          ${conflicts.map(c => this.renderConflict(c)).join('')}
        </div>
        <div class="actions">
          <button onclick="resolveAll('script')">Use All Script Values</button>
          <button onclick="resolveAll('nodes')">Use All Node Values</button>
          <button onclick="resolveManual()">Resolve Individually</button>
          <button onclick="cancel()">Cancel</button>
        </div>
        <script>
          const vscode = acquireVsCodeApi();
          
          function resolveAll(source) {
            vscode.postMessage({
              command: 'resolve',
              resolution: source === 'script' ? 
                ${JSON.stringify(scriptState)} : 
                ${JSON.stringify(nodeState)}
            });
          }
          
          function cancel() {
            vscode.postMessage({ command: 'cancel' });
          }
        </script>
      </body>
      </html>`;
  }

  private renderConflict(conflict: Conflict): string {
    return `
      <div class="conflict">
        <h3>${conflict.description}</h3>
        <div class="values">
          <div class="script-value">
            <h4>Script Value:</h4>
            <pre>${JSON.stringify(conflict.scriptValue, null, 2)}</pre>
          </div>
          <div class="node-value">
            <h4>Node Value:</h4>
            <pre>${JSON.stringify(conflict.nodeValue, null, 2)}</pre>
          </div>
        </div>
        <div class="resolution">
          <button onclick="resolve('${conflict.id}', 'script')">Use Script</button>
          <button onclick="resolve('${conflict.id}', 'nodes')">Use Nodes</button>
          <button onclick="resolve('${conflict.id}', 'merge')">Merge</button>
        </div>
      </div>
    `;
  }

  private applyNodeValue(state: SyncState, conflict: Conflict): SyncState {
    // Apply node value to resolve conflict
    return { ...state };
  }

  private mergeValues(state: SyncState, conflict: Conflict): SyncState {
    // Merge values to resolve conflict
    return { ...state };
  }

  private applyAutoResolution(state: SyncState, conflict: Conflict): SyncState {
    // Apply automatic resolution
    return { ...state };
  }

  private async resolveByStrategy(
    conflicts: Conflict[],
    scriptState: SyncState,
    nodeState: SyncState,
    options: ConflictResolutionOptions
  ): Promise<SyncState> {
    let resolvedState = scriptState;

    for (const conflict of conflicts) {
      const strategy = await this.selectStrategy(conflict, options);
      
      switch (strategy) {
        case ResolutionStrategy.UseScript:
          // Already using script state
          break;
        
        case ResolutionStrategy.UseNodes:
          resolvedState = this.applyNodeValue(resolvedState, conflict);
          break;
        
        case ResolutionStrategy.Merge:
          resolvedState = this.mergeValues(resolvedState, conflict);
          break;
        
        default:
          // Keep current state
          break;
      }
    }

    return resolvedState;
  }

  private async selectStrategy(
    conflict: Conflict,
    options: ConflictResolutionOptions
  ): Promise<ResolutionStrategy> {
    // Select resolution strategy based on conflict type and options
    const availableStrategies = this.strategies.get(conflict.type) || [];
    
    if (options.preferredStrategy && 
        availableStrategies.includes(options.preferredStrategy)) {
      return options.preferredStrategy;
    }

    return availableStrategies[0] || ResolutionStrategy.Manual;
  }
}
```

### 3. 3-way マージの実装
```typescript
// src/sync/threeWayMerge.ts
export class ThreeWayMerge {
  merge(
    base: SyncState,
    scriptChanges: SyncState,
    nodeChanges: SyncState
  ): MergeResult {
    const conflicts: Conflict[] = [];
    const merged: SyncState = { ...base };

    // Merge script content
    const scriptMerge = this.mergeScripts(
      base.scriptContent,
      scriptChanges.scriptContent,
      nodeChanges.scriptContent
    );

    if (scriptMerge.hasConflicts) {
      conflicts.push(...scriptMerge.conflicts);
    } else {
      merged.scriptContent = scriptMerge.result;
    }

    // Merge nodes
    const nodeMerge = this.mergeNodes(
      base.nodes,
      scriptChanges.nodes,
      nodeChanges.nodes
    );

    if (nodeMerge.hasConflicts) {
      conflicts.push(...nodeMerge.conflicts);
    } else {
      merged.nodes = nodeMerge.result;
    }

    // Merge edges
    const edgeMerge = this.mergeEdges(
      base.edges,
      scriptChanges.edges,
      nodeChanges.edges
    );

    if (edgeMerge.hasConflicts) {
      conflicts.push(...edgeMerge.conflicts);
    } else {
      merged.edges = edgeMerge.result;
    }

    return {
      merged,
      conflicts,
      hasConflicts: conflicts.length > 0,
    };
  }

  private mergeScripts(
    base: string,
    script: string,
    node: string
  ): MergeResult<string> {
    // Line-by-line merge
    const baseLines = base.split('\n');
    const scriptLines = script.split('\n');
    const nodeLines = node.split('\n');

    const result: string[] = [];
    const conflicts: Conflict[] = [];

    const maxLines = Math.max(
      baseLines.length,
      scriptLines.length,
      nodeLines.length
    );

    for (let i = 0; i < maxLines; i++) {
      const baseLine = baseLines[i] || '';
      const scriptLine = scriptLines[i] || '';
      const nodeLine = nodeLines[i] || '';

      if (scriptLine === nodeLine) {
        // Both changed to same value or both unchanged
        result.push(scriptLine);
      } else if (scriptLine === baseLine) {
        // Only nodes changed
        result.push(nodeLine);
      } else if (nodeLine === baseLine) {
        // Only script changed
        result.push(scriptLine);
      } else {
        // Both changed differently - conflict
        conflicts.push({
          id: `line_${i}`,
          type: ConflictType.DataInconsistency,
          location: { scriptLine: i + 1 },
          scriptValue: scriptLine,
          nodeValue: nodeLine,
          description: `Line ${i + 1} has conflicting changes`,
          severity: 'medium',
        });
        
        // Use script version by default
        result.push(scriptLine);
      }
    }

    return {
      result: result.join('\n'),
      conflicts,
      hasConflicts: conflicts.length > 0,
    };
  }

  private mergeNodes(
    base: FlowNode[],
    script: FlowNode[],
    node: FlowNode[]
  ): MergeResult<FlowNode[]> {
    // Node merge logic
    const result: FlowNode[] = [];
    const conflicts: Conflict[] = [];

    // Create maps for easier lookup
    const baseMap = new Map(base.map(n => [n.id, n]));
    const scriptMap = new Map(script.map(n => [n.id, n]));
    const nodeMap = new Map(node.map(n => [n.id, n]));

    // Get all unique node IDs
    const allIds = new Set([
      ...baseMap.keys(),
      ...scriptMap.keys(),
      ...nodeMap.keys(),
    ]);

    for (const id of allIds) {
      const baseNode = baseMap.get(id);
      const scriptNode = scriptMap.get(id);
      const nodeNode = nodeMap.get(id);

      if (!baseNode && scriptNode && nodeNode) {
        // Both added same node
        if (this.nodesEqual(scriptNode, nodeNode)) {
          result.push(scriptNode);
        } else {
          // Conflict - both added different versions
          conflicts.push(this.createNodeConflict(id, scriptNode, nodeNode));
          result.push(scriptNode); // Use script version
        }
      } else if (baseNode && !scriptNode && !nodeNode) {
        // Both deleted - don't include
      } else if (baseNode && scriptNode && !nodeNode) {
        // Nodes deleted, script kept/modified - conflict
        conflicts.push(this.createDeleteConflict(id, baseNode, scriptNode));
        result.push(scriptNode); // Keep script version
      } else if (baseNode && !scriptNode && nodeNode) {
        // Script deleted, nodes kept/modified - conflict
        conflicts.push(this.createDeleteConflict(id, baseNode, nodeNode));
      } else if (baseNode && scriptNode && nodeNode) {
        // All three exist - check for modifications
        const merged = this.mergeNode(baseNode, scriptNode, nodeNode);
        if (merged.hasConflicts) {
          conflicts.push(...merged.conflicts);
        }
        result.push(merged.result);
      } else {
        // Simple cases - one side added or modified
        const finalNode = scriptNode || nodeNode;
        if (finalNode) {
          result.push(finalNode);
        }
      }
    }

    return {
      result,
      conflicts,
      hasConflicts: conflicts.length > 0,
    };
  }

  private mergeEdges(
    base: FlowEdge[],
    script: FlowEdge[],
    node: FlowEdge[]
  ): MergeResult<FlowEdge[]> {
    // Similar to node merge but for edges
    const result: FlowEdge[] = [];
    const conflicts: Conflict[] = [];

    // Implementation similar to mergeNodes
    
    return {
      result,
      conflicts,
      hasConflicts: conflicts.length > 0,
    };
  }

  private mergeNode(
    base: FlowNode,
    script: FlowNode,
    node: FlowNode
  ): MergeResult<FlowNode> {
    const conflicts: Conflict[] = [];
    const result: FlowNode = { ...base };

    // Merge position
    if (script.position.x !== base.position.x || 
        script.position.y !== base.position.y) {
      if (node.position.x !== base.position.x || 
          node.position.y !== base.position.y) {
        // Both changed position
        if (script.position.x !== node.position.x || 
            script.position.y !== node.position.y) {
          // Conflict
          conflicts.push({
            id: `pos_${base.id}`,
            type: ConflictType.DataInconsistency,
            location: { nodeId: base.id },
            scriptValue: script.position,
            nodeValue: node.position,
            description: `Node ${base.id} position conflict`,
            severity: 'low',
          });
        }
      }
      result.position = script.position;
    } else if (node.position.x !== base.position.x || 
               node.position.y !== base.position.y) {
      result.position = node.position;
    }

    // Merge data
    const dataMerge = this.mergeData(base.data, script.data, node.data);
    if (dataMerge.hasConflicts) {
      conflicts.push(...dataMerge.conflicts);
    }
    result.data = dataMerge.result;

    return {
      result,
      conflicts,
      hasConflicts: conflicts.length > 0,
    };
  }

  private mergeData(base: any, script: any, node: any): MergeResult<any> {
    // Deep merge of data objects
    const result: any = {};
    const conflicts: Conflict[] = [];

    const allKeys = new Set([
      ...Object.keys(base || {}),
      ...Object.keys(script || {}),
      ...Object.keys(node || {}),
    ]);

    for (const key of allKeys) {
      const baseVal = base?.[key];
      const scriptVal = script?.[key];
      const nodeVal = node?.[key];

      if (scriptVal === nodeVal) {
        result[key] = scriptVal;
      } else if (scriptVal === baseVal) {
        result[key] = nodeVal;
      } else if (nodeVal === baseVal) {
        result[key] = scriptVal;
      } else {
        // Conflict
        result[key] = scriptVal; // Use script by default
      }
    }

    return {
      result,
      conflicts,
      hasConflicts: conflicts.length > 0,
    };
  }

  private nodesEqual(node1: FlowNode, node2: FlowNode): boolean {
    return JSON.stringify(node1) === JSON.stringify(node2);
  }

  private createNodeConflict(
    id: string,
    scriptNode: FlowNode,
    nodeNode: FlowNode
  ): Conflict {
    return {
      id: `node_${id}`,
      type: ConflictType.DataInconsistency,
      location: { nodeId: id },
      scriptValue: scriptNode,
      nodeValue: nodeNode,
      description: `Node ${id} has conflicting definitions`,
      severity: 'high',
    };
  }

  private createDeleteConflict(
    id: string,
    baseNode: FlowNode,
    remainingNode: FlowNode
  ): Conflict {
    return {
      id: `delete_${id}`,
      type: ConflictType.StructuralMismatch,
      location: { nodeId: id },
      scriptValue: remainingNode,
      nodeValue: null,
      description: `Node ${id} deleted on one side but modified on other`,
      severity: 'high',
    };
  }
}

interface MergeResult<T = any> {
  result: T;
  conflicts: Conflict[];
  hasConflicts: boolean;
}
```

## 成果物
- src/sync/conflictDetector.ts
- src/sync/conflictResolver.ts
- src/sync/threeWayMerge.ts

## テスト方法
1. 同時編集時の競合が検出される
2. 自動解決可能な競合が自動解決される
3. 手動解決UIが表示される
4. 3-wayマージが正しく動作する
5. 競合解決後の状態が一貫性を保つ

## 完了条件
- [ ] 競合検出が実装されている
- [ ] 競合解決戦略が実装されている
- [ ] 3-wayマージが実装されている
- [ ] 競合解決UIが実装されている
- [ ] 全ての競合タイプが処理される