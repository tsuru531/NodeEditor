# Canvas Phase 2 - タスク004: 言語選択機能追加

## 概要
FunctionNodeに言語選択機能を追加する。現在はbashのみサポートし、将来的な拡張に備える。

## 実装内容

### 対象ファイル
- `src/webview/nodeTypes/FunctionNode.tsx`

### 変更内容

#### FunctionNodeData interface
```typescript
interface FunctionNodeData {
  functionName: string;
  parameters: string[];
  functionBody: string;
  language: string; // 追加
  isEditing: boolean;
  executionResult?: string;
  isExecuting?: boolean;
}
```

#### UI変更
1. ヘッダーに言語表示を追加
2. 編集モードに言語選択タブを追加
3. 言語に応じたアイコン表示

#### 言語設定
- デフォルト言語: 'bash'
- サポート言語リスト: ['bash'] (将来拡張予定)

### UI実装

#### ヘッダー変更
```typescript
<span style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-color)' }}>
  {getLanguageIcon(language)} {functionName}() [{language}]
</span>
```

#### 編集タブ追加
- 'name', 'params', 'body', 'lang' の4タブ構成
- 言語選択はセレクトボックスで実装

#### 関数コード生成の言語対応
- 現在はbashのみ
- 将来的に他言語への拡張可能な構造

## 完了条件
- [ ] FunctionNodeDataに言語フィールドが追加されている
- [ ] ヘッダーに言語表示が追加されている
- [ ] 編集モードに言語選択タブが追加されている
- [ ] デフォルトでbashが選択されている
- [ ] 言語変更が正常に動作する
- [ ] ビルドエラーが発生しない

## 関連タスク
- 003_function_node_rename.mdの後に実行
- Canvas Phase 2の最終タスク