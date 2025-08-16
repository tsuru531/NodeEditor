import { Node, Edge } from 'reactflow';
import { 
  GraphNode, 
  ExecutionPlan, 
  GraphAnalysisResult,
  ExecutionError 
} from './types';

/**
 * グラフ解析エンジン
 * ノードグラフの依存関係を解析し、実行順序を決定する
 */
export class GraphAnalyzer {
  /**
   * ノードグラフを解析し、実行計画を生成する
   */
  public analyzeGraph(nodes: Node[], edges: Edge[]): GraphAnalysisResult {
    try {
      // 1. グラフノードを構築
      const graphNodes = this.buildGraphNodes(nodes, edges);
      
      // 2. 循環参照を検出
      const cycles = this.detectCycles(graphNodes);
      if (cycles.length > 0) {
        return {
          isValid: false,
          errors: [`循環参照が検出されました: ${cycles.map(cycle => cycle.join(' -> ')).join(', ')}`],
          cycles
        };
      }
      
      // 3. トポロジカルソートで実行順序を決定
      const sortedLevels = this.topologicalSort(graphNodes);
      
      // 4. 実行計画を生成
      const plan = this.createExecutionPlan(sortedLevels, graphNodes);
      
      return {
        isValid: true,
        errors: [],
        plan
      };
    } catch (error) {
      return {
        isValid: false,
        errors: [`グラフ解析エラー: ${error instanceof Error ? error.message : '不明なエラー'}`]
      };
    }
  }

  /**
   * React FlowのノードとエッジからGraphNodeを構築
   */
  private buildGraphNodes(nodes: Node[], edges: Edge[]): Map<string, GraphNode> {
    const graphNodes = new Map<string, GraphNode>();
    
    // 各ノードを初期化
    nodes.forEach(node => {
      graphNodes.set(node.id, {
        id: node.id,
        type: node.type || 'default',
        dependencies: [],
        dependents: [],
        level: 0,
        data: node.data
      });
    });
    
    // エッジから依存関係を構築
    edges.forEach(edge => {
      const sourceNode = graphNodes.get(edge.source);
      const targetNode = graphNodes.get(edge.target);
      
      if (sourceNode && targetNode) {
        // source -> target: targetはsourceに依存する
        targetNode.dependencies.push(edge.source);
        sourceNode.dependents.push(edge.target);
      }
    });
    
    return graphNodes;
  }

  /**
   * DFS（深度優先探索）による循環参照検出
   */
  private detectCycles(graphNodes: Map<string, GraphNode>): string[][] {
    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    const cycles: string[][] = [];
    
    const dfs = (nodeId: string, path: string[]): void => {
      if (recursionStack.has(nodeId)) {
        // 循環を発見
        const cycleStart = path.indexOf(nodeId);
        const cycle = path.slice(cycleStart).concat(nodeId);
        cycles.push(cycle);
        return;
      }
      
      if (visited.has(nodeId)) {
        return;
      }
      
      visited.add(nodeId);
      recursionStack.add(nodeId);
      
      const node = graphNodes.get(nodeId);
      if (node) {
        node.dependents.forEach(dependentId => {
          dfs(dependentId, path.concat(nodeId));
        });
      }
      
      recursionStack.delete(nodeId);
    };
    
    // 全ノードをチェック
    graphNodes.forEach((_, nodeId) => {
      if (!visited.has(nodeId)) {
        dfs(nodeId, []);
      }
    });
    
    return cycles;
  }

  /**
   * Kahn's Algorithmによるトポロジカルソート
   */
  private topologicalSort(graphNodes: Map<string, GraphNode>): string[][] {
    const levels: string[][] = [];
    const inDegree = new Map<string, number>();
    const queue: string[] = [];
    
    // 各ノードの入次数を計算
    graphNodes.forEach((node, nodeId) => {
      inDegree.set(nodeId, node.dependencies.length);
      if (node.dependencies.length === 0) {
        queue.push(nodeId);
      }
    });
    
    let levelIndex = 0;
    
    while (queue.length > 0) {
      const currentLevel: string[] = [];
      const levelSize = queue.length;
      
      // 現在のレベルの全ノードを処理
      for (let i = 0; i < levelSize; i++) {
        const nodeId = queue.shift()!;
        currentLevel.push(nodeId);
        
        const node = graphNodes.get(nodeId);
        if (node) {
          node.level = levelIndex;
          
          // 依存ノードの入次数を減らす
          node.dependents.forEach(dependentId => {
            const currentInDegree = inDegree.get(dependentId) || 0;
            const newInDegree = currentInDegree - 1;
            inDegree.set(dependentId, newInDegree);
            
            if (newInDegree === 0) {
              queue.push(dependentId);
            }
          });
        }
      }
      
      levels.push(currentLevel);
      levelIndex++;
    }
    
    return levels;
  }

  /**
   * 実行計画を作成
   */
  private createExecutionPlan(levels: string[][], graphNodes: Map<string, GraphNode>): ExecutionPlan {
    const totalNodes = graphNodes.size;
    const maxParallelism = Math.max(...levels.map(level => level.length));
    
    // 実行時間の推定（仮の値）
    const estimatedTimePerNode = 1000; // 1秒と仮定
    const estimatedTime = levels.length * estimatedTimePerNode;
    
    return {
      levels,
      totalNodes,
      maxParallelism,
      estimatedTime
    };
  }

  /**
   * グラフの統計情報を取得
   */
  public getGraphStatistics(nodes: Node[], edges: Edge[]): {
    nodeCount: number;
    edgeCount: number;
    nodeTypes: Record<string, number>;
    maxDepth: number;
    complexity: number;
  } {
    const nodeTypes: Record<string, number> = {};
    
    nodes.forEach(node => {
      const type = node.type || 'default';
      nodeTypes[type] = (nodeTypes[type] || 0) + 1;
    });
    
    const graphNodes = this.buildGraphNodes(nodes, edges);
    const levels = this.topologicalSort(graphNodes);
    const maxDepth = levels.length;
    
    // 複雑度を計算（ノード数 + エッジ数 + 最大深度）
    const complexity = nodes.length + edges.length + maxDepth;
    
    return {
      nodeCount: nodes.length,
      edgeCount: edges.length,
      nodeTypes,
      maxDepth,
      complexity
    };
  }

  /**
   * 指定されたノードの依存関係を取得
   */
  public getNodeDependencies(nodeId: string, nodes: Node[], edges: Edge[]): {
    directDependencies: string[];
    allDependencies: string[];
    directDependents: string[];
    allDependents: string[];
  } {
    const graphNodes = this.buildGraphNodes(nodes, edges);
    const node = graphNodes.get(nodeId);
    
    if (!node) {
      return {
        directDependencies: [],
        allDependencies: [],
        directDependents: [],
        allDependents: []
      };
    }
    
    // 全依存関係を再帰的に取得
    const getAllDependencies = (id: string, visited: Set<string> = new Set()): string[] => {
      if (visited.has(id)) return [];
      visited.add(id);
      
      const node = graphNodes.get(id);
      if (!node) return [];
      
      const deps = [...node.dependencies];
      node.dependencies.forEach(depId => {
        deps.push(...getAllDependencies(depId, visited));
      });
      
      return [...new Set(deps)];
    };
    
    // 全依存元を再帰的に取得
    const getAllDependents = (id: string, visited: Set<string> = new Set()): string[] => {
      if (visited.has(id)) return [];
      visited.add(id);
      
      const node = graphNodes.get(id);
      if (!node) return [];
      
      const deps = [...node.dependents];
      node.dependents.forEach(depId => {
        deps.push(...getAllDependents(depId, visited));
      });
      
      return [...new Set(deps)];
    };
    
    return {
      directDependencies: node.dependencies,
      allDependencies: getAllDependencies(nodeId),
      directDependents: node.dependents,
      allDependents: getAllDependents(nodeId)
    };
  }
}