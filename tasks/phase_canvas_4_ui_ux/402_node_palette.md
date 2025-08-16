# タスク 402: ノードパレット

## タスク概要

新しいノードを追加するためのノードパレットUIの実装。

## 実装内容

### 1. ノードパレット機能
```typescript
interface NodePalette {
  nodeTypes: NodeTypeDefinition[];
  categories: NodeCategory[];
  searchNodes(query: string): NodeTypeDefinition[];
  addNodeToCanvas(type: NodeType, position: Point): void;
}

interface NodeCategory {
  name: string;
  icon: string;
  nodeTypes: NodeType[];
  color: string;
}
```

### 2. UI機能
- ドラッグ&ドロップ
- 検索・フィルタリング
- カテゴリ分類
- プレビュー機能

## 完了条件
- [ ] ノードパレットが表示される
- [ ] ドラッグ&ドロップが動作する
- [ ] 検索機能が動作する
- [ ] カテゴリ分類が動作する