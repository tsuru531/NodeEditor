# Canvas Phase 2 - タスク001: Mini Map削除

## 概要
現在のNodeEditorに表示されているMini Mapは不要との判断により削除する。

## 実装内容

### 対象ファイル
- `src/webview/components/NodeEditor.tsx`

### 変更内容
1. MiniMapコンポーネントのimportを削除
2. ReactFlowコンポーネント内の`<MiniMap />`を削除

### コード変更
```typescript
// 削除対象
import { MiniMap } from 'reactflow';

// 削除対象
<MiniMap />
```

## 完了条件
- [ ] MiniMapのimportが削除されている
- [ ] ReactFlow内のMiniMapコンポーネントが削除されている
- [ ] ビルドエラーが発生しない
- [ ] 動作確認でMini Mapが表示されない

## 関連タスク
- Canvas Phase 2全体のUI改善の一部