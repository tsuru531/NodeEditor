# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 言語設定
このプロジェクトでは日本語での対応を行います。コメント、ドキュメント、ユーザーとのコミュニケーションは日本語で行ってください。

## プロジェクト概要

NodeEditor - Bashスクリプトをビジュアルノードエディタで編集できるVSCode拡張機能

### 主要機能
- Bashスクリプトのビジュアル編集
- ノードベースのドラッグ&ドロップUI
- スクリプト⇔ノードの双方向リアルタイム同期
- VSCode拡張機能として動作

## 開発コマンド

```bash
# 依存関係のインストール
npm install

# 開発モードでビルド
npm run compile

# ウォッチモードでビルド
npm run watch

# リント実行
npm run lint

# フォーマット実行
npm run format

# テスト実行
npm run test

# VSCodeでデバッグ
F5キーを押して拡張機能開発ホストを起動
```

## プロジェクト構造

```
NodeEditor/
├── src/
│   ├── extension/           # VSCode拡張機能エントリーポイント
│   │   ├── extension.ts     # メインエントリー
│   │   └── NodeEditorPanel.ts # WebViewパネル管理
│   ├── webview/            # ノードエディタUI (React)
│   │   ├── App.tsx         # メインコンポーネント
│   │   ├── components/     # UIコンポーネント
│   │   └── nodeTypes/      # カスタムノードタイプ
│   ├── parser/             # Bashスクリプトパーサー
│   │   ├── BashScriptParser.ts # メインパーサー
│   │   └── ast/            # AST定義と操作
│   ├── generator/          # コード生成
│   │   ├── ASTToNodeConverter.ts    # AST→ノード変換
│   │   └── NodeToScriptGenerator.ts # ノード→スクリプト生成
│   └── sync/               # 同期機能
│       ├── fileWatcher.ts  # ファイル監視
│       └── syncCoordinator.ts # 同期調整
├── tasks/                  # タスク管理ファイル
│   ├── phase1_setup/      # 初期セットアップ
│   ├── phase2_vscode_base/ # VSCode拡張基盤
│   ├── phase3_node_editor/ # ノードエディタUI
│   ├── phase4_bash_parser/ # Bashパーサー
│   ├── phase5_conversion/  # 相互変換
│   └── phase6_sync/        # リアルタイム同期
└── resources/             # 静的リソース
```

## 実装に関する重要事項

### ノードタイプ
- **CommandNode**: 単一コマンド実行
- **PipeNode**: パイプ処理
- **ConditionNode**: 条件分岐 (if/then/else)
- **LoopNode**: ループ処理 (for/while/until)
- **VariableNode**: 変数定義・参照
- **FunctionNode**: 関数定義

### 同期メカニズム
- ファイル変更の監視にはVSCode FileSystemWatcher APIを使用
- デバウンス処理で頻繁な更新を制御（デフォルト500ms）
- 双方向同期をサポート（スクリプト⇔ノード）
- 競合解決メカニズムを実装

### パーサー実装
- bash-parser npmパッケージをベースに使用
- カスタムAST構造への変換を実装
- 主要なBash構文をサポート（コマンド、パイプ、条件分岐、ループ、変数）

### 技術スタック
- **言語**: TypeScript
- **フレームワーク**: VSCode Extension API
- **UI**: React + React Flow
- **ビルドツール**: Webpack
- **パーサー**: bash-parser (npm)

### タスク実行順序
タスクファイルは`tasks/`ディレクトリに整理されており、以下の順序で実行することを推奨：

1. Phase 1: プロジェクト初期セットアップ
2. Phase 2: VSCode拡張機能基盤構築
3. Phase 3: ノードエディタUI実装
4. Phase 4: Bashパーサー実装
5. Phase 5: 相互変換システム実装
6. Phase 6: リアルタイム同期実装

各フェーズの詳細なタスクは対応するディレクトリ内のMarkdownファイルを参照してください。