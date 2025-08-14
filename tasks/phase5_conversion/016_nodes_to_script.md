# タスク016: ノード→スクリプト生成

## 目的
ビジュアルノードグラフからBashスクリプトを生成する機能を実装する

## 前提条件
- タスク015が完了している
- ノードからASTへの変換が可能

## 実装内容

### 1. スクリプトジェネレーターのインターフェース
```typescript
// src/generator/scriptGenerator.ts
import { Node as FlowNode, Edge as FlowEdge } from 'reactflow';
import * as AST from '../parser/ast/types';

export interface GeneratorOptions {
  indentSize?: number;
  indentChar?: ' ' | '\t';
  addComments?: boolean;
  preserveFormatting?: boolean;
}

export class ScriptGenerator {
  private options: Required<GeneratorOptions>;
  private indentLevel: number = 0;

  constructor(options: GeneratorOptions = {}) {
    this.options = {
      indentSize: options.indentSize ?? 2,
      indentChar: options.indentChar ?? ' ',
      addComments: options.addComments ?? false,
      preserveFormatting: options.preserveFormatting ?? true,
    };
  }

  generate(nodes: FlowNode[], edges: FlowEdge[]): string {
    const ast = this.nodesToAST(nodes, edges);
    return this.astToScript(ast);
  }

  private nodesToAST(nodes: FlowNode[], edges: FlowEdge[]): AST.Script {
    const graph = this.buildGraph(nodes, edges);
    const rootNodes = this.findRootNodes(nodes, edges);
    const statements = this.traverseGraph(rootNodes, graph);

    return {
      type: 'Script',
      body: statements,
    };
  }

  private astToScript(ast: AST.Script): string {
    const lines: string[] = [];

    if (ast.shebang) {
      lines.push(ast.shebang);
    }

    for (const statement of ast.body) {
      lines.push(this.generateStatement(statement));
    }

    return lines.join('\n');
  }

  private indent(): string {
    return this.options.indentChar.repeat(
      this.options.indentSize * this.indentLevel
    );
  }

  private increaseIndent(): void {
    this.indentLevel++;
  }

  private decreaseIndent(): void {
    this.indentLevel = Math.max(0, this.indentLevel - 1);
  }
}
```

### 2. グラフ構造の構築
```typescript
// src/generator/graphBuilder.ts
export interface NodeGraph {
  nodes: Map<string, FlowNode>;
  edges: Map<string, FlowEdge[]>;
  incomingEdges: Map<string, FlowEdge[]>;
}

export class GraphBuilder {
  buildGraph(nodes: FlowNode[], edges: FlowEdge[]): NodeGraph {
    const nodeMap = new Map<string, FlowNode>();
    const edgeMap = new Map<string, FlowEdge[]>();
    const incomingMap = new Map<string, FlowEdge[]>();

    // Build node map
    for (const node of nodes) {
      nodeMap.set(node.id, node);
    }

    // Build edge maps
    for (const edge of edges) {
      // Outgoing edges
      if (!edgeMap.has(edge.source)) {
        edgeMap.set(edge.source, []);
      }
      edgeMap.get(edge.source)!.push(edge);

      // Incoming edges
      if (!incomingMap.has(edge.target)) {
        incomingMap.set(edge.target, []);
      }
      incomingMap.get(edge.target)!.push(edge);
    }

    return {
      nodes: nodeMap,
      edges: edgeMap,
      incomingEdges: incomingMap,
    };
  }

  findRootNodes(nodes: FlowNode[], edges: FlowEdge[]): FlowNode[] {
    const targetNodeIds = new Set(edges.map(e => e.target));
    return nodes.filter(node => !targetNodeIds.has(node.id));
  }

  topologicalSort(nodes: FlowNode[], edges: FlowEdge[]): FlowNode[] {
    const graph = this.buildGraph(nodes, edges);
    const visited = new Set<string>();
    const sorted: FlowNode[] = [];

    const visit = (nodeId: string) => {
      if (visited.has(nodeId)) return;
      visited.add(nodeId);

      const node = graph.nodes.get(nodeId);
      if (!node) return;

      const outgoingEdges = graph.edges.get(nodeId) || [];
      for (const edge of outgoingEdges) {
        visit(edge.target);
      }

      sorted.unshift(node);
    };

    const rootNodes = this.findRootNodes(nodes, edges);
    for (const root of rootNodes) {
      visit(root.id);
    }

    return sorted;
  }
}
```

### 3. ノードタイプ別のスクリプト生成
```typescript
// src/generator/generators/commandGenerator.ts
export class CommandGenerator {
  generateCommand(node: FlowNode): string {
    const { command, args, options, redirections } = node.data;
    let script = command;

    // Add options
    if (options && Object.keys(options).length > 0) {
      for (const [key, value] of Object.entries(options)) {
        if (value === 'true') {
          script += ` ${key}`;
        } else {
          script += ` ${key} ${this.escapeArg(value)}`;
        }
      }
    }

    // Add arguments
    if (args && args.length > 0) {
      script += ' ' + args.map(arg => this.escapeArg(arg)).join(' ');
    }

    // Add redirections
    if (redirections && redirections.length > 0) {
      for (const redir of redirections) {
        script += this.generateRedirection(redir);
      }
    }

    return script;
  }

  private escapeArg(arg: string): string {
    // Check if arg needs quotes
    if (/[\s\$\"\'\`\\\|\&\;\<\>\(\)\[\]\{\}\*\?\#\~\=]/.test(arg)) {
      // Use double quotes and escape special characters
      return `"${arg.replace(/[\"\$\`\\]/g, '\\$&')}"`;
    }
    return arg;
  }

  private generateRedirection(redir: any): string {
    const fd = redir.fd ? `${redir.fd}` : '';
    
    switch (redir.type) {
      case 'input':
        return ` ${fd}< ${redir.target}`;
      case 'output':
        return ` ${fd}> ${redir.target}`;
      case 'append':
        return ` ${fd}>> ${redir.target}`;
      case 'heredoc':
        return ` ${fd}<< ${redir.target}`;
      default:
        return '';
    }
  }
}
```

### 4. パイプライン生成
```typescript
// src/generator/generators/pipelineGenerator.ts
export class PipelineGenerator {
  generatePipeline(nodes: FlowNode[], edges: FlowEdge[]): string {
    const commandGen = new CommandGenerator();
    const sortedNodes = this.sortPipelineNodes(nodes, edges);
    const commands: string[] = [];

    for (let i = 0; i < sortedNodes.length; i++) {
      const node = sortedNodes[i];
      
      if (node.type === 'command') {
        commands.push(commandGen.generateCommand(node));
      } else if (node.type === 'pipe') {
        // Pipe type is stored in node data
        const pipeType = node.data.pipeType || '|';
        if (commands.length > 0 && i < sortedNodes.length - 1) {
          // The pipe operator will be added between commands
        }
      }
    }

    return commands.join(' | ');
  }

  private sortPipelineNodes(nodes: FlowNode[], edges: FlowEdge[]): FlowNode[] {
    // Find the start node (no incoming edges in this subgraph)
    const incomingCount = new Map<string, number>();
    
    for (const node of nodes) {
      incomingCount.set(node.id, 0);
    }
    
    for (const edge of edges) {
      if (incomingCount.has(edge.target)) {
        incomingCount.set(edge.target, incomingCount.get(edge.target)! + 1);
      }
    }

    // Start from nodes with no incoming edges
    const queue: string[] = [];
    for (const [nodeId, count] of incomingCount) {
      if (count === 0) {
        queue.push(nodeId);
      }
    }

    const sorted: FlowNode[] = [];
    const nodeMap = new Map(nodes.map(n => [n.id, n]));

    while (queue.length > 0) {
      const nodeId = queue.shift()!;
      const node = nodeMap.get(nodeId);
      if (node) {
        sorted.push(node);

        // Process outgoing edges
        for (const edge of edges) {
          if (edge.source === nodeId) {
            const targetCount = incomingCount.get(edge.target)! - 1;
            incomingCount.set(edge.target, targetCount);
            if (targetCount === 0) {
              queue.push(edge.target);
            }
          }
        }
      }
    }

    return sorted;
  }
}
```

### 5. 条件分岐生成
```typescript
// src/generator/generators/conditionalGenerator.ts
export class ConditionalGenerator {
  generateConditional(
    node: FlowNode,
    thenBranch: string[],
    elseBranch: string[]
  ): string[] {
    const lines: string[] = [];
    const condition = this.generateCondition(node.data);

    lines.push(`if ${condition}; then`);
    
    // Then branch
    for (const line of thenBranch) {
      lines.push(`  ${line}`);
    }

    // Else branch
    if (elseBranch && elseBranch.length > 0) {
      lines.push('else');
      for (const line of elseBranch) {
        lines.push(`  ${line}`);
      }
    }

    lines.push('fi');

    return lines;
  }

  private generateCondition(data: any): string {
    const { condition, operator, value } = data;

    // Handle test expressions
    if (operator && operator !== 'command') {
      return this.generateTestExpression(condition, operator, value);
    }

    // Handle command conditions
    return condition || 'true';
  }

  private generateTestExpression(
    left: string,
    operator: string,
    right?: string
  ): string {
    const ops: Record<string, string> = {
      'eq': '==',
      'ne': '!=',
      'gt': '>',
      'lt': '<',
      'ge': '>=',
      'le': '<=',
      'exists': '-e',
      'empty': '-z',
    };

    const op = ops[operator] || operator;

    if (operator === 'exists') {
      return `[[ -e ${left} ]]`;
    }
    
    if (operator === 'empty') {
      return `[[ -z ${left} ]]`;
    }

    return `[[ ${left} ${op} ${right || ''} ]]`;
  }
}
```

### 6. ループ生成
```typescript
// src/generator/generators/loopGenerator.ts
export class LoopGenerator {
  generateLoop(node: FlowNode, body: string[]): string[] {
    const { loopType, variable, list, condition } = node.data;
    const lines: string[] = [];

    switch (loopType) {
      case 'for':
        lines.push(this.generateForLoop(variable, list));
        break;
      case 'while':
        lines.push(`while ${condition || 'true'}; do`);
        break;
      case 'until':
        lines.push(`until ${condition || 'false'}; do`);
        break;
      default:
        lines.push('do');
    }

    // Add body
    for (const line of body) {
      lines.push(`  ${line}`);
    }

    lines.push('done');

    return lines;
  }

  private generateForLoop(variable: string, list: string): string {
    if (!variable) {
      return 'for item in *; do';
    }

    if (!list) {
      return `for ${variable} in *; do`;
    }

    // Check if list is a range like {1..10}
    if (list.match(/^\{.*\.\.*\}$/)) {
      return `for ${variable} in ${list}; do`;
    }

    // Check if list is a command substitution
    if (list.startsWith('$(') || list.startsWith('`')) {
      return `for ${variable} in ${list}; do`;
    }

    // Otherwise treat as space-separated list
    return `for ${variable} in ${list}; do`;
  }
}
```

### 7. 統合スクリプトジェネレーター
```typescript
// src/generator/NodeToScriptGenerator.ts
import { ScriptGenerator } from './scriptGenerator';
import { GraphBuilder } from './graphBuilder';
import { CommandGenerator } from './generators/commandGenerator';
import { PipelineGenerator } from './generators/pipelineGenerator';
import { ConditionalGenerator } from './generators/conditionalGenerator';
import { LoopGenerator } from './generators/loopGenerator';

export class NodeToScriptGenerator extends ScriptGenerator {
  private graphBuilder: GraphBuilder;
  private commandGen: CommandGenerator;
  private pipelineGen: PipelineGenerator;
  private conditionalGen: ConditionalGenerator;
  private loopGen: LoopGenerator;

  constructor(options?: GeneratorOptions) {
    super(options);
    this.graphBuilder = new GraphBuilder();
    this.commandGen = new CommandGenerator();
    this.pipelineGen = new PipelineGenerator();
    this.conditionalGen = new ConditionalGenerator();
    this.loopGen = new LoopGenerator();
  }

  generateFromNodes(nodes: FlowNode[], edges: FlowEdge[]): string {
    const sorted = this.graphBuilder.topologicalSort(nodes, edges);
    const lines: string[] = [];

    for (const node of sorted) {
      const script = this.generateNode(node, nodes, edges);
      if (script) {
        lines.push(...(Array.isArray(script) ? script : [script]));
      }
    }

    return lines.join('\n');
  }

  private generateNode(
    node: FlowNode,
    allNodes: FlowNode[],
    allEdges: FlowEdge[]
  ): string | string[] {
    switch (node.type) {
      case 'command':
        return this.commandGen.generateCommand(node);
      
      case 'pipe':
        return this.generatePipelineFromNode(node, allNodes, allEdges);
      
      case 'condition':
        return this.generateConditionalFromNode(node, allNodes, allEdges);
      
      case 'loop':
        return this.generateLoopFromNode(node, allNodes, allEdges);
      
      case 'variable':
        return this.generateVariable(node);
      
      default:
        return '';
    }
  }

  private generateVariable(node: FlowNode): string {
    const { name, value, scope } = node.data;
    
    if (scope === 'export') {
      return `export ${name}="${value}"`;
    }
    
    return `${name}="${value}"`;
  }

  private generatePipelineFromNode(
    pipeNode: FlowNode,
    allNodes: FlowNode[],
    allEdges: FlowEdge[]
  ): string {
    // Find connected command nodes
    const connectedNodes = this.findConnectedPipelineNodes(
      pipeNode,
      allNodes,
      allEdges
    );
    
    return this.pipelineGen.generatePipeline(connectedNodes, allEdges);
  }

  private generateConditionalFromNode(
    condNode: FlowNode,
    allNodes: FlowNode[],
    allEdges: FlowEdge[]
  ): string[] {
    const thenBranch = this.findBranchNodes('true', condNode, allNodes, allEdges);
    const elseBranch = this.findBranchNodes('false', condNode, allNodes, allEdges);

    const thenScript = thenBranch.map(n => this.generateNode(n, allNodes, allEdges)).flat();
    const elseScript = elseBranch.map(n => this.generateNode(n, allNodes, allEdges)).flat();

    return this.conditionalGen.generateConditional(condNode, thenScript, elseScript);
  }

  private generateLoopFromNode(
    loopNode: FlowNode,
    allNodes: FlowNode[],
    allEdges: FlowEdge[]
  ): string[] {
    const bodyNodes = this.findLoopBodyNodes(loopNode, allNodes, allEdges);
    const bodyScript = bodyNodes.map(n => this.generateNode(n, allNodes, allEdges)).flat();

    return this.loopGen.generateLoop(loopNode, bodyScript);
  }

  // Helper methods for finding connected nodes...
  private findConnectedPipelineNodes(
    pipeNode: FlowNode,
    allNodes: FlowNode[],
    allEdges: FlowEdge[]
  ): FlowNode[] {
    // Implementation to find all nodes in a pipeline
    return [];
  }

  private findBranchNodes(
    label: string,
    condNode: FlowNode,
    allNodes: FlowNode[],
    allEdges: FlowEdge[]
  ): FlowNode[] {
    // Implementation to find nodes in a specific branch
    return [];
  }

  private findLoopBodyNodes(
    loopNode: FlowNode,
    allNodes: FlowNode[],
    allEdges: FlowEdge[]
  ): FlowNode[] {
    // Implementation to find nodes in loop body
    return [];
  }
}
```

## 成果物
- src/generator/scriptGenerator.ts
- src/generator/graphBuilder.ts
- src/generator/generators/commandGenerator.ts
- src/generator/generators/pipelineGenerator.ts
- src/generator/generators/conditionalGenerator.ts
- src/generator/generators/loopGenerator.ts
- src/generator/NodeToScriptGenerator.ts

## テスト方法
1. 単一コマンドノードからスクリプトが生成される
2. パイプラインが正しく生成される
3. 条件分岐が正しいif文として生成される
4. ループが正しく生成される
5. 複雑なグラフ構造が正しいスクリプトになる

## 完了条件
- [ ] 基本的なスクリプト生成が動作する
- [ ] グラフのトポロジカルソートが実装されている
- [ ] 各ノードタイプのジェネレーターが実装されている
- [ ] エスケープ処理が適切に行われる
- [ ] インデントが正しく処理される