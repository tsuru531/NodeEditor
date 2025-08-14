# タスク017: 変換検証

## 目的
AST⇔ノード間の変換が正しく行われることを検証するシステムを実装する

## 前提条件
- タスク015, 016が完了している
- 双方向変換が実装されている

## 実装内容

### 1. 変換バリデーターのインターフェース
```typescript
// src/generator/validation/conversionValidator.ts
import { Node as FlowNode, Edge as FlowEdge } from 'reactflow';
import * as AST from '../../parser/ast/types';

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  type: 'error';
  code: string;
  message: string;
  location?: {
    nodeId?: string;
    line?: number;
    column?: number;
  };
}

export interface ValidationWarning {
  type: 'warning';
  code: string;
  message: string;
  location?: {
    nodeId?: string;
    line?: number;
    column?: number;
  };
}

export class ConversionValidator {
  validateASTToNodes(ast: AST.Script, nodes: FlowNode[], edges: FlowEdge[]): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Validate that all AST nodes are represented
    this.validateASTCoverage(ast, nodes, errors, warnings);

    // Validate node connections match AST flow
    this.validateNodeConnections(ast, nodes, edges, errors, warnings);

    // Validate data integrity
    this.validateDataIntegrity(ast, nodes, errors, warnings);

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  validateNodesToAST(nodes: FlowNode[], edges: FlowEdge[], ast: AST.Script): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Validate that all nodes are represented in AST
    this.validateNodeCoverage(nodes, ast, errors, warnings);

    // Validate script generation correctness
    this.validateScriptGeneration(nodes, edges, ast, errors, warnings);

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  private validateASTCoverage(
    ast: AST.Script,
    nodes: FlowNode[],
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    // Implementation details...
  }

  private validateNodeConnections(
    ast: AST.Script,
    nodes: FlowNode[],
    edges: FlowEdge[],
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    // Implementation details...
  }

  private validateDataIntegrity(
    ast: AST.Script,
    nodes: FlowNode[],
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    // Implementation details...
  }

  private validateNodeCoverage(
    nodes: FlowNode[],
    ast: AST.Script,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    // Implementation details...
  }

  private validateScriptGeneration(
    nodes: FlowNode[],
    edges: FlowEdge[],
    ast: AST.Script,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    // Implementation details...
  }
}
```

### 2. ラウンドトリップテスト
```typescript
// src/generator/validation/roundTripValidator.ts
import { BashScriptParser } from '../../parser/BashScriptParser';
import { ASTToNodeConverter } from '../ASTToNodeConverter';
import { NodeToScriptGenerator } from '../NodeToScriptGenerator';

export class RoundTripValidator {
  private parser: BashScriptParser;
  private astToNode: ASTToNodeConverter;
  private nodeToScript: NodeToScriptGenerator;

  constructor() {
    this.parser = new BashScriptParser();
    this.astToNode = new ASTToNodeConverter();
    this.nodeToScript = new NodeToScriptGenerator();
  }

  validateScriptRoundTrip(originalScript: string): RoundTripResult {
    try {
      // Parse original script
      const originalAST = this.parser.parse(originalScript);

      // Convert to nodes
      const { nodes, edges } = this.astToNode.convert(originalAST);

      // Convert back to script
      const regeneratedScript = this.nodeToScript.generateFromNodes(nodes, edges);

      // Parse regenerated script
      const regeneratedAST = this.parser.parse(regeneratedScript);

      // Compare ASTs
      const astMatch = this.compareASTs(originalAST, regeneratedAST);

      // Normalize and compare scripts
      const scriptMatch = this.compareScripts(originalScript, regeneratedScript);

      return {
        success: astMatch.isEqual && scriptMatch.isEqual,
        originalScript,
        regeneratedScript,
        astComparison: astMatch,
        scriptComparison: scriptMatch,
      };
    } catch (error) {
      return {
        success: false,
        originalScript,
        regeneratedScript: '',
        error: error.message,
      };
    }
  }

  validateNodeRoundTrip(nodes: FlowNode[], edges: FlowEdge[]): RoundTripResult {
    try {
      // Generate script from nodes
      const script = this.nodeToScript.generateFromNodes(nodes, edges);

      // Parse script to AST
      const ast = this.parser.parse(script);

      // Convert back to nodes
      const regenerated = this.astToNode.convert(ast);

      // Compare node graphs
      const graphMatch = this.compareNodeGraphs(
        { nodes, edges },
        regenerated
      );

      return {
        success: graphMatch.isEqual,
        originalNodes: nodes,
        regeneratedNodes: regenerated.nodes,
        graphComparison: graphMatch,
      };
    } catch (error) {
      return {
        success: false,
        originalNodes: nodes,
        regeneratedNodes: [],
        error: error.message,
      };
    }
  }

  private compareASTs(ast1: AST.Script, ast2: AST.Script): ASTComparison {
    // Deep comparison of AST structures
    return {
      isEqual: this.deepEqual(ast1, ast2),
      differences: this.findASTDifferences(ast1, ast2),
    };
  }

  private compareScripts(script1: string, script2: string): ScriptComparison {
    // Normalize scripts for comparison
    const normalized1 = this.normalizeScript(script1);
    const normalized2 = this.normalizeScript(script2);

    return {
      isEqual: normalized1 === normalized2,
      differences: this.findScriptDifferences(normalized1, normalized2),
    };
  }

  private compareNodeGraphs(graph1: NodeGraph, graph2: NodeGraph): GraphComparison {
    // Compare node graphs structurally
    return {
      isEqual: this.graphsAreEqual(graph1, graph2),
      differences: this.findGraphDifferences(graph1, graph2),
    };
  }

  private normalizeScript(script: string): string {
    // Remove comments, normalize whitespace, etc.
    return script
      .split('\n')
      .map(line => line.trim())
      .filter(line => line && !line.startsWith('#'))
      .join('\n');
  }

  private deepEqual(obj1: any, obj2: any): boolean {
    // Deep equality check implementation
    if (obj1 === obj2) return true;
    if (!obj1 || !obj2) return false;
    if (typeof obj1 !== typeof obj2) return false;

    if (Array.isArray(obj1)) {
      if (!Array.isArray(obj2) || obj1.length !== obj2.length) return false;
      return obj1.every((item, i) => this.deepEqual(item, obj2[i]));
    }

    if (typeof obj1 === 'object') {
      const keys1 = Object.keys(obj1);
      const keys2 = Object.keys(obj2);
      if (keys1.length !== keys2.length) return false;
      return keys1.every(key => this.deepEqual(obj1[key], obj2[key]));
    }

    return false;
  }
}
```

### 3. セマンティック検証
```typescript
// src/generator/validation/semanticValidator.ts
export class SemanticValidator {
  validateNodeSemantics(nodes: FlowNode[], edges: FlowEdge[]): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Check for unreachable nodes
    this.checkUnreachableNodes(nodes, edges, warnings);

    // Check for cycles in non-loop contexts
    this.checkInvalidCycles(nodes, edges, errors);

    // Validate variable usage
    this.validateVariableUsage(nodes, edges, errors, warnings);

    // Check for invalid connections
    this.validateConnections(nodes, edges, errors);

    // Validate command syntax
    this.validateCommandSyntax(nodes, errors, warnings);

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  private checkUnreachableNodes(
    nodes: FlowNode[],
    edges: FlowEdge[],
    warnings: ValidationWarning[]
  ): void {
    const reachable = new Set<string>();
    const edgeMap = new Map<string, string[]>();

    // Build edge map
    for (const edge of edges) {
      if (!edgeMap.has(edge.source)) {
        edgeMap.set(edge.source, []);
      }
      edgeMap.get(edge.source)!.push(edge.target);
    }

    // Find root nodes
    const roots = nodes.filter(node => 
      !edges.some(edge => edge.target === node.id)
    );

    // DFS from roots
    const visit = (nodeId: string) => {
      if (reachable.has(nodeId)) return;
      reachable.add(nodeId);

      const targets = edgeMap.get(nodeId) || [];
      for (const target of targets) {
        visit(target);
      }
    };

    for (const root of roots) {
      visit(root.id);
    }

    // Report unreachable nodes
    for (const node of nodes) {
      if (!reachable.has(node.id)) {
        warnings.push({
          type: 'warning',
          code: 'UNREACHABLE_NODE',
          message: `Node ${node.id} is unreachable`,
          location: { nodeId: node.id },
        });
      }
    }
  }

  private checkInvalidCycles(
    nodes: FlowNode[],
    edges: FlowEdge[],
    errors: ValidationError[]
  ): void {
    // Detect cycles that are not part of loop structures
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const hasCycle = (nodeId: string): boolean => {
      visited.add(nodeId);
      recursionStack.add(nodeId);

      const node = nodes.find(n => n.id === nodeId);
      
      // Skip cycle check for loop nodes
      if (node && node.type === 'loop') {
        recursionStack.delete(nodeId);
        return false;
      }

      const outgoingEdges = edges.filter(e => e.source === nodeId);
      
      for (const edge of outgoingEdges) {
        if (!visited.has(edge.target)) {
          if (hasCycle(edge.target)) {
            return true;
          }
        } else if (recursionStack.has(edge.target)) {
          return true;
        }
      }

      recursionStack.delete(nodeId);
      return false;
    };

    for (const node of nodes) {
      if (!visited.has(node.id)) {
        if (hasCycle(node.id)) {
          errors.push({
            type: 'error',
            code: 'INVALID_CYCLE',
            message: `Invalid cycle detected starting from node ${node.id}`,
            location: { nodeId: node.id },
          });
        }
      }
    }
  }

  private validateVariableUsage(
    nodes: FlowNode[],
    edges: FlowEdge[],
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    const definedVars = new Set<string>();
    const usedVars = new Set<string>();

    // Traverse nodes in order
    const sortedNodes = this.topologicalSort(nodes, edges);

    for (const node of sortedNodes) {
      if (node.type === 'variable') {
        definedVars.add(node.data.name);
      } else if (node.type === 'command') {
        // Extract variable references from command
        const varRefs = this.extractVariableReferences(node.data.command, node.data.args);
        varRefs.forEach(v => usedVars.add(v));

        // Check if variables are defined
        for (const varRef of varRefs) {
          if (!definedVars.has(varRef)) {
            warnings.push({
              type: 'warning',
              code: 'UNDEFINED_VARIABLE',
              message: `Variable ${varRef} is used but not defined`,
              location: { nodeId: node.id },
            });
          }
        }
      }
    }

    // Check for unused variables
    for (const definedVar of definedVars) {
      if (!usedVars.has(definedVar)) {
        warnings.push({
          type: 'warning',
          code: 'UNUSED_VARIABLE',
          message: `Variable ${definedVar} is defined but never used`,
        });
      }
    }
  }

  private validateConnections(
    nodes: FlowNode[],
    edges: FlowEdge[],
    errors: ValidationError[]
  ): void {
    for (const edge of edges) {
      const sourceNode = nodes.find(n => n.id === edge.source);
      const targetNode = nodes.find(n => n.id === edge.target);

      if (!sourceNode || !targetNode) {
        errors.push({
          type: 'error',
          code: 'INVALID_EDGE',
          message: `Edge connects non-existent nodes`,
        });
        continue;
      }

      // Validate connection types
      if (!this.isValidConnection(sourceNode.type, targetNode.type)) {
        errors.push({
          type: 'error',
          code: 'INVALID_CONNECTION',
          message: `Invalid connection from ${sourceNode.type} to ${targetNode.type}`,
          location: { nodeId: sourceNode.id },
        });
      }
    }
  }

  private validateCommandSyntax(
    nodes: FlowNode[],
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    for (const node of nodes) {
      if (node.type === 'command') {
        const { command, args } = node.data;

        // Check for empty command
        if (!command || command.trim() === '') {
          errors.push({
            type: 'error',
            code: 'EMPTY_COMMAND',
            message: 'Command node has no command specified',
            location: { nodeId: node.id },
          });
        }

        // Check for common command issues
        if (this.isDangerousCommand(command)) {
          warnings.push({
            type: 'warning',
            code: 'DANGEROUS_COMMAND',
            message: `Command '${command}' is potentially dangerous`,
            location: { nodeId: node.id },
          });
        }
      }
    }
  }

  private extractVariableReferences(command: string, args: string[]): string[] {
    const vars: string[] = [];
    const varPattern = /\$\{?(\w+)\}?/g;

    // Check command
    let match;
    while ((match = varPattern.exec(command)) !== null) {
      vars.push(match[1]);
    }

    // Check args
    for (const arg of args || []) {
      varPattern.lastIndex = 0;
      while ((match = varPattern.exec(arg)) !== null) {
        vars.push(match[1]);
      }
    }

    return vars;
  }

  private isValidConnection(sourceType: string, targetType: string): boolean {
    // Define valid connection rules
    const validConnections: Record<string, string[]> = {
      'command': ['command', 'pipe', 'condition', 'loop', 'variable'],
      'pipe': ['command'],
      'condition': ['command', 'condition', 'loop', 'variable'],
      'loop': ['command', 'condition', 'loop', 'variable'],
      'variable': ['command', 'condition', 'loop', 'variable'],
    };

    return validConnections[sourceType]?.includes(targetType) ?? false;
  }

  private isDangerousCommand(command: string): boolean {
    const dangerous = ['rm', 'dd', 'mkfs', 'format'];
    return dangerous.some(cmd => command.startsWith(cmd));
  }

  private topologicalSort(nodes: FlowNode[], edges: FlowEdge[]): FlowNode[] {
    // Implementation of topological sort
    return nodes;
  }
}
```

### 4. 検証レポート生成
```typescript
// src/generator/validation/validationReport.ts
export class ValidationReport {
  generateReport(results: ValidationResult[]): string {
    const report: string[] = [];
    
    report.push('=== Conversion Validation Report ===');
    report.push('');
    
    let totalErrors = 0;
    let totalWarnings = 0;

    for (const result of results) {
      totalErrors += result.errors.length;
      totalWarnings += result.warnings.length;
    }

    report.push(`Total Errors: ${totalErrors}`);
    report.push(`Total Warnings: ${totalWarnings}`);
    report.push('');

    if (totalErrors > 0) {
      report.push('## Errors');
      for (const result of results) {
        for (const error of result.errors) {
          report.push(this.formatError(error));
        }
      }
      report.push('');
    }

    if (totalWarnings > 0) {
      report.push('## Warnings');
      for (const result of results) {
        for (const warning of result.warnings) {
          report.push(this.formatWarning(warning));
        }
      }
    }

    return report.join('\n');
  }

  private formatError(error: ValidationError): string {
    const location = error.location 
      ? ` at ${this.formatLocation(error.location)}`
      : '';
    return `❌ [${error.code}] ${error.message}${location}`;
  }

  private formatWarning(warning: ValidationWarning): string {
    const location = warning.location 
      ? ` at ${this.formatLocation(warning.location)}`
      : '';
    return `⚠️  [${warning.code}] ${warning.message}${location}`;
  }

  private formatLocation(location: any): string {
    if (location.nodeId) {
      return `node ${location.nodeId}`;
    }
    if (location.line !== undefined) {
      return `line ${location.line}${location.column ? `:${location.column}` : ''}`;
    }
    return 'unknown location';
  }
}
```

## 成果物
- src/generator/validation/conversionValidator.ts
- src/generator/validation/roundTripValidator.ts
- src/generator/validation/semanticValidator.ts
- src/generator/validation/validationReport.ts

## テスト方法
1. ラウンドトリップ変換で元のデータが保持される
2. 無効な接続が検出される
3. 未定義変数の使用が警告される
4. 到達不可能なノードが検出される
5. 危険なコマンドが警告される

## 完了条件
- [ ] 基本的な検証が実装されている
- [ ] ラウンドトリップテストが実装されている
- [ ] セマンティック検証が実装されている
- [ ] 検証レポートが生成できる
- [ ] エラーと警告が適切に分類される