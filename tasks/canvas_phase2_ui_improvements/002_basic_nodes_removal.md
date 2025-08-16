# Canvas Phase 2 - タスク002: 基本ノード削除

## 概要
旧Bashスクリプト向けの基本ノードタイプが不要になったため削除する。

## 削除対象ノード
- StringNode
- NumberNode  
- ArrayNode
- CommandNode
- PipeNode
- ConditionNode
- LoopNode
- VariableNode
- OutputNode

## 実装内容

### 対象ファイル
1. `src/webview/components/NodePanel.tsx`
2. `src/webview/config/reactFlowConfig.ts`
3. `src/webview/nodeTypes/` ディレクトリ内の各ノードファイル

### 変更内容

#### NodePanel.tsx
- 基本ノードセクション（category: 'basic'）を削除
- 基本ノードのrenderNodeGroup呼び出しを削除

#### reactFlowConfig.ts
- 基本ノードのimportを削除
- nodeTypesオブジェクトから基本ノードの登録を削除

#### ノードファイル削除
- 各基本ノードのTSXファイルを削除

## 完了条件
- [ ] NodePanelから基本ノードセクションが削除されている
- [ ] reactFlowConfigから基本ノードの参照が削除されている  
- [ ] 不要なノードファイルが削除されている
- [ ] ビルドエラーが発生しない
- [ ] Canvasノードのみが表示される

## 関連タスク
- Canvas Phase 2全体のUI改善の一部
- 001_minimap_removal.mdの後に実行