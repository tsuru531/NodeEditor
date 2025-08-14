# タスク015: AST→ノード変換

## 目的
BashスクリプトのASTをビジュアルノードグラフに変換する機能を実装する

## 前提条件
- Phase 4のタスクが完了している
- ASTパーサーが動作している
- ノードタイプが定義されている

## 実装内容

### 1. ノードコンバーターのインターフェース
```typescript
// src/generator/nodeConverter.ts
import { Node as FlowNode, Edge as FlowEdge } from 'reactflow';
import * as AST from '../parser/ast/types';

export interface NodeGraph {
  nodes: FlowNode[];
  edges: FlowEdge[];
}

export interface NodePosition {
  x: number;
  y: number;
}

export class NodeConverter {
  private nodeId: number = 0;
  private nodes: FlowNode[] = [];
  private edges: FlowEdge[] = [];
  private currentPosition: NodePosition = { x: 0, y: 0 };
  private nodeSpacing = { x: 250, y: 100 };

  convert(ast: AST.Script): NodeGraph {
    this.reset();
    this.convertScript(ast);
    return {
      nodes: this.nodes,
      edges: this.edges,
    };
  }

  private reset(): void {
    this.nodeId = 0;
    this.nodes = [];
    this.edges = [];
    this.currentPosition = { x: 100, y: 100 };
  }

  private generateNodeId(): string {
    return `node_${this.nodeId++}`;
  }

  private convertScript(script: AST.Script): void {
    let previousNodeId: string | null = null;

    for (const statement of script.body) {
      const nodeId = this.convertStatement(statement);
      
      if (previousNodeId && nodeId) {
        this.addEdge(previousNodeId, nodeId);
      }
      
      previousNodeId = nodeId;
      this.currentPosition.y += this.nodeSpacing.y;
    }
  }

  private convertStatement(statement: AST.Statement): string | null {
    const node = statement.node;
    
    switch (node.type) {
      case 'Command':
        return this.convertCommand(node);
      case 'Pipeline':
        return this.convertPipeline(node);
      case 'List':
        return this.convertList(node);
      case 'If':
        return this.convertConditional(node);
      case 'For':
      case 'While':
      case 'Until':
        return this.convertLoop(node);
      case 'Function':
        return this.convertFunction(node);
      case 'Assignment':
        return this.convertVariable(node);
      default:
        return null;
    }
  }

  private addEdge(source: string, target: string, label?: string): void {
    this.edges.push({
      id: `edge_${source}_${target}`,
      source,
      target,
      label,
      type: 'smoothstep',
    });
  }
}
```

### 2. コマンドノード変換
```typescript
// src/generator/converters/commandConverter.ts
export class CommandConverter {
  convertCommand(command: AST.Command, position: NodePosition): FlowNode {
    const nodeId = this.generateNodeId();
    
    return {
      id: nodeId,
      type: 'command',
      position,
      data: {
        command: command.name.text,
        args: command.args?.map(arg => arg.text) || [],
        options: this.extractOptions(command.args),
        redirections: this.convertRedirections(command.redirections),
      },
    };
  }

  private extractOptions(args: AST.Word[]): Record<string, string> {
    const options: Record<string, string> = {};
    
    if (!args) return options;

    for (let i = 0; i < args.length; i++) {
      const arg = args[i].text;
      if (arg.startsWith('-')) {
        const key = arg;
        const value = args[i + 1]?.text || 'true';
        options[key] = value;
        i++; // Skip next arg if it's a value
      }
    }

    return options;
  }

  private convertRedirections(redirections?: AST.Redirection[]): any[] {
    if (!redirections) return [];

    return redirections.map(redir => ({
      type: redir.kind,
      target: typeof redir.target === 'object' ? redir.target.text : redir.target,
      fd: redir.fd,
    }));
  }
}
```

### 3. パイプラインノード変換
```typescript
// src/generator/converters/pipelineConverter.ts
export class PipelineConverter {
  convertPipeline(pipeline: AST.Pipeline, startPosition: NodePosition): string {
    const nodes: FlowNode[] = [];
    const edges: FlowEdge[] = [];
    let position = { ...startPosition };
    let previousNodeId: string | null = null;

    for (const command of pipeline.commands) {
      const nodeId = this.generateNodeId();
      
      // Create command node
      nodes.push({
        id: nodeId,
        type: 'command',
        position,
        data: {
          command: command.name.text,
          args: command.args?.map(arg => arg.text) || [],
        },
      });

      // Create pipe node if not first command
      if (previousNodeId) {
        const pipeNodeId = this.generateNodeId();
        const pipePosition = {
          x: position.x - 125,
          y: position.y,
        };

        nodes.push({
          id: pipeNodeId,
          type: 'pipe',
          position: pipePosition,
          data: {
            pipeType: '|',
          },
        });

        // Connect previous command to pipe
        edges.push({
          id: `edge_${previousNodeId}_${pipeNodeId}`,
          source: previousNodeId,
          target: pipeNodeId,
        });

        // Connect pipe to current command
        edges.push({
          id: `edge_${pipeNodeId}_${nodeId}`,
          source: pipeNodeId,
          target: nodeId,
        });
      }

      previousNodeId = nodeId;
      position.x += 250;
    }

    this.nodes.push(...nodes);
    this.edges.push(...edges);

    return nodes[0]?.id || null;
  }
}
```

### 4. 条件分岐ノード変換
```typescript
// src/generator/converters/conditionalConverter.ts
export class ConditionalConverter {
  convertConditional(conditional: AST.Conditional, position: NodePosition): string {
    const conditionNodeId = this.generateNodeId();
    
    // Create condition node
    const conditionNode: FlowNode = {
      id: conditionNodeId,
      type: 'condition',
      position,
      data: {
        condition: this.extractCondition(conditional.condition),
        operator: this.extractOperator(conditional.condition),
      },
    };

    this.nodes.push(conditionNode);

    // Convert then branch
    const thenPosition = {
      x: position.x - 150,
      y: position.y + 150,
    };
    const thenNodes = this.convertStatements(conditional.then, thenPosition);

    // Convert else branch if exists
    if (conditional.else) {
      const elsePosition = {
        x: position.x + 150,
        y: position.y + 150,
      };
      const elseNodes = this.convertStatements(conditional.else, elsePosition);

      // Connect condition to else branch
      if (elseNodes.length > 0) {
        this.addEdge(conditionNodeId, elseNodes[0].id, 'false');
      }
    }

    // Connect condition to then branch
    if (thenNodes.length > 0) {
      this.addEdge(conditionNodeId, thenNodes[0].id, 'true');
    }

    return conditionNodeId;
  }

  private extractCondition(condition: AST.Expression | AST.Command): string {
    if ('type' in condition && condition.type === 'Expression') {
      return this.expressionToString(condition);
    }
    
    if ('type' in condition && condition.type === 'Command') {
      return `${condition.name.text} ${condition.args?.map(a => a.text).join(' ')}`;
    }

    return '';
  }

  private extractOperator(condition: AST.Expression | AST.Command): string {
    if ('type' in condition && condition.type === 'Expression') {
      return condition.operator || 'eq';
    }
    return 'command';
  }

  private expressionToString(expr: AST.Expression): string {
    // Simplified expression to string conversion
    if (expr.left && expr.right) {
      return `${expr.left} ${expr.operator} ${expr.right}`;
    }
    return expr.operator || '';
  }
}
```

### 5. ループノード変換
```typescript
// src/generator/converters/loopConverter.ts
export class LoopConverter {
  convertLoop(loop: AST.Loop, position: NodePosition): string {
    const loopNodeId = this.generateNodeId();
    
    const loopNode: FlowNode = {
      id: loopNodeId,
      type: 'loop',
      position,
      data: {
        loopType: loop.type.toLowerCase(),
        variable: loop.variable,
        list: loop.list?.map(w => w.text).join(' '),
        condition: this.extractLoopCondition(loop),
      },
    };

    this.nodes.push(loopNode);

    // Convert loop body
    const bodyPosition = {
      x: position.x + 200,
      y: position.y,
    };
    const bodyNodes = this.convertStatements(loop.body, bodyPosition);

    // Connect loop to body
    if (bodyNodes.length > 0) {
      this.addEdge(loopNodeId, bodyNodes[0].id, 'loop-body');
      
      // Connect last body node back to loop (for visual representation)
      const lastBodyNode = bodyNodes[bodyNodes.length - 1];
      this.addEdge(lastBodyNode.id, loopNodeId, 'continue');
    }

    return loopNodeId;
  }

  private extractLoopCondition(loop: AST.Loop): string {
    if (loop.type === 'For') {
      return `${loop.variable} in ${loop.list?.map(w => w.text).join(' ')}`;
    }
    
    if (loop.condition) {
      if ('type' in loop.condition && loop.condition.type === 'Command') {
        return `${loop.condition.name.text} ${loop.condition.args?.map(a => a.text).join(' ')}`;
      }
      
      if ('type' in loop.condition && loop.condition.type === 'Expression') {
        return this.expressionToString(loop.condition);
      }
    }

    return '';
  }
}
```

### 6. 変数ノード変換
```typescript
// src/generator/converters/variableConverter.ts
export class VariableConverter {
  convertVariable(variable: AST.Variable, position: NodePosition): string {
    const nodeId = this.generateNodeId();
    
    const variableNode: FlowNode = {
      id: nodeId,
      type: 'variable',
      position,
      data: {
        name: variable.name,
        value: this.extractValue(variable.value),
        scope: this.getScope(variable),
      },
    };

    this.nodes.push(variableNode);
    return nodeId;
  }

  private extractValue(value: AST.Word | AST.Expression): string {
    if ('type' in value && value.type === 'Word') {
      return value.text;
    }
    
    if ('type' in value && value.type === 'Expression') {
      return this.expressionToString(value);
    }

    return '';
  }

  private getScope(variable: AST.Variable): 'local' | 'export' {
    if (variable.export) return 'export';
    if (variable.local) return 'local';
    return 'local';
  }
}
```

### 7. 統合コンバーター
```typescript
// src/generator/ASTToNodeConverter.ts
import { NodeConverter } from './nodeConverter';
import { CommandConverter } from './converters/commandConverter';
import { PipelineConverter } from './converters/pipelineConverter';
import { ConditionalConverter } from './converters/conditionalConverter';
import { LoopConverter } from './converters/loopConverter';
import { VariableConverter } from './converters/variableConverter';

export class ASTToNodeConverter extends NodeConverter {
  private commandConverter: CommandConverter;
  private pipelineConverter: PipelineConverter;
  private conditionalConverter: ConditionalConverter;
  private loopConverter: LoopConverter;
  private variableConverter: VariableConverter;

  constructor() {
    super();
    this.commandConverter = new CommandConverter();
    this.pipelineConverter = new PipelineConverter();
    this.conditionalConverter = new ConditionalConverter();
    this.loopConverter = new LoopConverter();
    this.variableConverter = new VariableConverter();
  }

  convertCommand(command: AST.Command): string {
    const node = this.commandConverter.convertCommand(
      command,
      this.currentPosition
    );
    this.nodes.push(node);
    return node.id;
  }

  convertPipeline(pipeline: AST.Pipeline): string {
    return this.pipelineConverter.convertPipeline(
      pipeline,
      this.currentPosition
    );
  }

  convertConditional(conditional: AST.Conditional): string {
    return this.conditionalConverter.convertConditional(
      conditional,
      this.currentPosition
    );
  }

  convertLoop(loop: AST.Loop): string {
    return this.loopConverter.convertLoop(
      loop,
      this.currentPosition
    );
  }

  convertVariable(variable: AST.Variable): string {
    return this.variableConverter.convertVariable(
      variable,
      this.currentPosition
    );
  }
}
```

## 成果物
- src/generator/nodeConverter.ts
- src/generator/converters/commandConverter.ts
- src/generator/converters/pipelineConverter.ts
- src/generator/converters/conditionalConverter.ts
- src/generator/converters/loopConverter.ts
- src/generator/converters/variableConverter.ts
- src/generator/ASTToNodeConverter.ts

## テスト方法
1. 単純なコマンドがノードに変換される
2. パイプラインが複数のノードとエッジに変換される
3. 条件分岐が適切な分岐構造で表現される
4. ループが循環構造で表現される
5. 変数代入がノードとして表現される

## 完了条件
- [ ] コマンドノード変換が実装されている
- [ ] パイプラインノード変換が実装されている
- [ ] 条件分岐ノード変換が実装されている
- [ ] ループノード変換が実装されている
- [ ] 変数ノード変換が実装されている
- [ ] ノード間のエッジが正しく生成される