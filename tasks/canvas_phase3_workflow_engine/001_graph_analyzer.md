# Canvas Phase 3 - タスク001: グラフ解析エンジン

## 概要
ノードグラフを解析し、実行順序を決定するアルゴリズムを実装する。

## 実装内容

### 対象ファイル
- `src/engine/GraphAnalyzer.ts` (新規作成)
- `src/engine/types.ts` (新規作成)

### GraphAnalyzer クラス

#### 主要機能
1. **依存関係解析**: ノード間の接続から依存グラフを構築
2. **循環参照検出**: グラフの循環参照を検出しエラー報告
3. **実行順序決定**: トポロジカルソートによる実行順序計算
4. **並列実行可能性**: 同レベルで並列実行可能なノード群の特定

#### インターフェース定義
```typescript
interface GraphNode {
  id: string;
  type: string;
  dependencies: string[];
  dependents: string[];
  level: number;
}

interface ExecutionPlan {
  levels: string[][];
  totalNodes: number;
  maxParallelism: number;
  estimatedTime: number;
}

interface GraphAnalysisResult {
  isValid: boolean;
  errors: string[];
  plan?: ExecutionPlan;
  cycles?: string[][];
}
```

#### 実装メソッド
1. `analyzeGraph(nodes, edges): GraphAnalysisResult`
2. `detectCycles(graph): string[][]`
3. `topologicalSort(graph): string[][]`
4. `calculateExecutionLevels(sortedNodes): string[][]`
5. `estimateExecutionTime(plan): number`

### アルゴリズム仕様

#### トポロジカルソート
- Kahn's Algorithm を使用
- 入次数 0 のノードから開始
- 依存関係の順次削除と実行レベル決定

#### 循環参照検出
- DFS（深度優先探索）による循環検出
- 検出された循環の詳細パス情報を提供

#### 並列実行レベル
- 同じレベルのノードは並列実行可能
- 依存関係のないノード群の特定

## 完了条件
- [ ] GraphAnalyzer クラスが実装されている
- [ ] 基本的なグラフ解析が動作する
- [ ] 循環参照検出が正常に動作する
- [ ] 実行レベルの計算が正確である
- [ ] テストケースが通過する

## テストケース
1. 線形依存グラフの解析
2. 並列実行可能グラフの解析
3. 循環参照グラフの検出
4. 複雑な依存関係グラフの解析

## 関連タスク
- 002_execution_queue.md で使用される
- Canvas Phase 3の基盤となる