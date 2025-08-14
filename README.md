# NodeEditor - Bash Visual Script Editor

Bashスクリプトをビジュアルノードエディタで編集できるVSCode拡張機能

## 概要

NodeEditorは、Bashスクリプトをノードベースのビジュアルインターフェースで編集できるVSCode拡張機能です。複雑なスクリプトをドラッグ&ドロップで構築し、リアルタイムでスクリプトとビジュアル表現を同期させることができます。

## 主な機能

- 🎨 **ビジュアル編集**: ノードベースのドラッグ&ドロップUI
- 🔄 **双方向同期**: スクリプト⇔ノードのリアルタイム同期
- 📝 **Bash構文サポート**: コマンド、パイプ、条件分岐、ループなど
- 🔧 **VSCode統合**: VSCode拡張機能として完全統合

## インストール

### 前提条件

- Node.js (v16以上)
- VSCode (v1.74.0以上)

### 開発環境のセットアップ

```bash
# リポジトリのクローン
git clone https://github.com/yourusername/NodeEditor.git
cd NodeEditor

# 依存関係のインストール
npm install

# ビルド
npm run compile

# VSCodeでデバッグ実行
# VSCodeでプロジェクトを開き、F5キーを押す
```

## 使い方

1. VSCodeでBashスクリプトファイル（`.sh`または`.bash`）を開く
2. 右クリックメニューから「Open Bash Node Editor」を選択
3. ノードエディタでスクリプトをビジュアル編集
4. 変更は自動的にスクリプトファイルと同期

## サポートするノードタイプ

- **Command Node**: 単一のコマンド実行
- **Pipe Node**: パイプ処理（`|`, `|&`, `||`, `&&`）
- **Condition Node**: 条件分岐（if/then/else）
- **Loop Node**: ループ処理（for/while/until）
- **Variable Node**: 変数定義と参照
- **Function Node**: 関数定義

## 開発

### プロジェクト構造

```
NodeEditor/
├── src/                    # ソースコード
│   ├── extension/         # VSCode拡張機能
│   ├── webview/          # React UIコンポーネント
│   ├── parser/           # Bashパーサー
│   ├── generator/        # コード生成
│   └── sync/             # 同期機能
├── tasks/                 # 開発タスク管理
└── resources/            # 静的リソース
```

### 開発コマンド

```bash
# ウォッチモード
npm run watch

# リント
npm run lint

# フォーマット
npm run format

# テスト
npm run test
```

### タスク管理

開発タスクは`tasks/`ディレクトリで管理されています。各フェーズごとに詳細なタスクが定義されているので、順番に実行してください。

## コントリビューション

プルリクエストを歓迎します！以下のガイドラインに従ってください：

1. Forkしてfeatureブランチを作成
2. 変更をコミット
3. プルリクエストを送信

## ライセンス

MIT License

## 作者

[Your Name]

## 謝辞

- [React Flow](https://reactflow.dev/) - ノードエディタUI
- [bash-parser](https://www.npmjs.com/package/bash-parser) - Bashパーサー