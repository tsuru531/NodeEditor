# Canvas Phase 2 - UI改善タスク

## 概要
NodeCanvasのUI改善として、不要な機能の削除と関数ノードの汎用化を行う。

## 背景
- Mini Mapが不要との判断
- 基本ノードタイプ（旧Bashスクリプト向け）が不要
- Bash関数ノードをより汎用的なFunctionノードに変更
- 将来的な言語拡張に備えた構造の準備

## タスク一覧

### 001_minimap_removal.md
Mini Mapコンポーネントの削除

### 002_basic_nodes_removal.md  
基本ノードタイプ（String, Number, Array, Command等）の削除

### 003_function_node_rename.md
BashFunctionNodeをFunctionNodeにリネーム・汎用化

### 004_language_selection.md
FunctionNodeに言語選択機能を追加（bash対応）

## 実行順序
1. 001_minimap_removal.md
2. 002_basic_nodes_removal.md
3. 003_function_node_rename.md
4. 004_language_selection.md

## 完了条件
- [ ] 全てのタスクが完了している
- [ ] ビルドエラーが発生しない
- [ ] Canvas PhaseのノードのみがUI上に表示される
- [ ] FunctionNodeが言語選択付きで動作する

## 影響範囲
- NodeEditor UI全体
- ノードパネル表示
- React Flow設定
- 関数ノードの機能拡張