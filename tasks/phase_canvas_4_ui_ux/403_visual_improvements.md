# タスク 403: ビジュアル改善

## タスク概要

ノードタイプ別のスタイリングと実行状態の可視化機能の実装。

## 実装内容

### 1. ノードタイプ別スタイリング
```typescript
interface NodeTheme {
  [NodeType.MEMO]: {
    backgroundColor: string;
    borderColor: string;
    icon: string;
  };
  [NodeType.FILE]: {
    backgroundColor: string;
    borderColor: string;
    icon: string;
  };
  // 他のノードタイプ...
}
```

### 2. 実行状態表示
- 実行中アニメーション
- 成功/失敗インジケータ
- プログレスバー
- エラー表示

### 3. テーマシステム
- VS Codeテーマ連動
- カスタムテーマ対応
- ダーク/ライトモード

## 完了条件
- [ ] ノードタイプ別スタイリングが適用される
- [ ] 実行状態が可視化される
- [ ] テーマシステムが動作する
- [ ] アニメーションが適切に動作する