# Canvas Phase 2 - タスク003: BashFunctionNode → FunctionNode変更

## 概要
BashFunctionNodeをより汎用的なFunctionNodeに変更し、将来的な言語拡張に備える。

## 実装内容

### ファイル変更
1. `src/webview/nodeTypes/BashFunctionNode.tsx` → `FunctionNode.tsx`
2. 関連するimportとexportの更新

### 対象ファイル
- `src/webview/nodeTypes/BashFunctionNode.tsx` (リネーム)
- `src/webview/nodeTypes/index.ts`
- `src/webview/config/reactFlowConfig.ts`
- `src/webview/components/NodePanel.tsx`

### 変更内容

#### FunctionNode.tsx
- コンポーネント名を`BashFunctionNode` → `FunctionNode`に変更
- interface名を`BashFunctionNodeData` → `FunctionNodeData`に変更
- interface名を`BashFunctionNodeProps` → `FunctionNodeProps`に変更
- className を`bash-function-node` → `function-node`に変更

#### index.ts
- exportを`BashFunctionNode` → `FunctionNode`に変更

#### reactFlowConfig.ts  
- importを`BashFunctionNode` → `FunctionNode`に変更
- nodeTypesの`bashFunction`を`function`に変更

#### NodePanel.tsx
- typeを`bashFunction` → `function`に変更
- labelを`Bash関数` → `関数`に変更
- descriptionを更新

## 完了条件
- [ ] ファイルがリネームされている
- [ ] 全てのimport/exportが更新されている
- [ ] nodeTypesの登録が更新されている
- [ ] NodePanelの表示が更新されている
- [ ] ビルドエラーが発生しない
- [ ] 動作確認でFunctionNodeが正常に動作する

## 関連タスク
- 002_basic_nodes_removal.mdの後に実行
- 004_language_selection.mdの前に実行