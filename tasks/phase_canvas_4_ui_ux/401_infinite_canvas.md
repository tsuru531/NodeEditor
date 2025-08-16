# タスク 401: 無限キャンバス実装

## タスク概要

ObsidianのCanvasライクな無限スクロール可能なキャンバス環境の実装。

## 実装内容

### 1. 無限キャンバス機能
```typescript
interface InfiniteCanvas {
  viewport: {
    x: number; y: number;
    zoom: number;
    bounds: { width: number; height: number };
  };
  panTo(x: number, y: number): void;
  zoomTo(level: number, center?: Point): void;
  fitToNodes(nodeIds: string[]): void;
}
```

### 2. パフォーマンス最適化
- ビューポートベースの描画
- 仮想化による大量ノード対応
- スムーズなアニメーション

### 3. ナビゲーション機能
- ミニマップ
- ズーム制御
- パン操作
- フィット機能

## 完了条件
- [ ] 無限スクロールが動作する
- [ ] ズーム機能が動作する
- [ ] パフォーマンスが最適化されている
- [ ] ナビゲーション機能が動作する