# CLAUDE.md

## 言語設定
日本語での対応を行います。コメント、ドキュメント、ユーザーとのコミュニケーションは日本語で行ってください。

## プロジェクト概要
NodeCanvas - Canvas型ノードエディタで多様なコンテンツを自由に配置し実行可能なワークフローを構築するVSCode拡張機能

### 主要機能
- 無限キャンバス上でのノード配置
- メモ、ファイル、bash関数など多様なノードタイプ
- ノード間接続による実行可能なワークフロー
- VSCode拡張機能として動作

## ブランチ運用
- **機能開発**: `feature/canvas-phase{番号}-{機能名}` 例: `feature/canvas-phase1-project-rename`
- **バグ修正**: `fix/{issue番号}-{説明}` 例: `fix/123-parser-error`
- **実験的機能**: `experiment/{機能名}`
- 各タスク/フェーズごとにブランチを作成し、完了後mainにマージ
- コミットメッセージは日本語で記述

## 開発コマンド
```bash
npm install          # 依存関係インストール
npm run compile      # ビルド
npm run watch        # ウォッチモード
npm run lint         # リント実行
npm run format       # フォーマット実行
npm run test         # テスト実行
# F5キーでVSCode拡張機能開発ホスト起動
```

## プロジェクト構造
```
src/
├── extension/       # VSCode拡張機能
├── webview/        # React製キャンバスUI
├── engine/         # ワークフロー実行エンジン
├── project/        # プロジェクト管理機能
└── types/          # 型定義
```

## 技術スタック
- TypeScript / React / React Flow
- VSCode Extension API / Webpack
- Monaco Editor (コードエディタ)
- Markdown-it (Markdownレンダリング)

## ノードタイプ
- MemoNode (Markdownテキストメモ)
- FileNode (ローカルファイル参照・プレビュー)
- FunctionNode (bash関数定義・実行)
- FunctionDefinitionNode (関数定義専用)
- FunctionCallNode (関数呼び出し専用)
- ConnectorNode (データフロー制御)

## 開発フェーズ
### 従来フェーズ（完了）
1. **Phase 1**: プロジェクト初期セットアップ ✅
2. **Phase 2**: VSCode拡張機能基盤構築 ✅
3. **Phase 3**: ノードエディタUI実装（部分完了）

### Canvas フェーズ（新コンセプト - 完了）
1. **Canvas Phase 1**: プロジェクト再定義とコンセプト明確化 ✅
2. **Canvas Phase 2**: 新ノードタイプ実装 ✅
3. **Canvas Phase 3**: ワークフロー実行エンジン ✅
4. **Canvas Phase 4**: UI/UX改善とポリッシュ ✅
5. **Canvas Phase 5**: ファイル管理とプロジェクト機能 ✅

詳細は`tasks/canvas_phase*`ディレクトリ参照。

### 現在の状況
全てのCanvas Phaseが完了しました。NodeCanvasは以下の機能を備えたVSCode拡張機能として完成しています：
- 無限キャンバス上でのノード配置・編集
- メモ、ファイル、関数などの多様なノードタイプ
- ワークフロー実行エンジンによるノード間データフロー
- プロジェクト管理とファイル入出力機能
- UI/UX最適化と履歴管理機能

今後は機能拡張、バグ修正、パフォーマンス改善などの継続的なメンテナンスフェーズに入ります。