# NodeCanvas - Visual Workflow Editor

Canvas型ノードエディタ - メモ、ファイル、関数を自由に配置し実行可能なワークフローを構築

## 概要

NodeCanvasは、無限キャンバス上でメモ、ファイル、bash関数などを自由に配置し、視覚的なワークフローを構築できるVSCode拡張機能です。ObsidianのCanvasやComfyUIからインスピレーションを得た、新しいタイプのビジュアルエディタです。

## 主な機能

- 🎨 **無限キャンバス**: 制限のない2D空間でのノード配置
- 📝 **多様なノードタイプ**: メモ、ファイル、bash関数などの様々なコンテンツ
- 🔗 **ワークフロー実行**: ノード間の接続による実行可能なワークフロー
- 🔧 **VSCode統合**: VSCode拡張機能として完全統合

## インストール

### 前提条件

- Node.js (v16以上)
- VSCode (v1.74.0以上)

### 開発環境のセットアップ

```bash
# リポジトリのクローン
git clone https://github.com/yourusername/NodeCanvas.git
cd NodeCanvas

# 依存関係のインストール
npm install

# ビルド
npm run compile

# VSCodeでデバッグ実行
# VSCodeでプロジェクトを開き、F5キーを押す
```

## 使い方

1. VSCodeでコマンドパレットを開く（Ctrl+Shift+P）
2. 「NodeCanvas: Open Canvas Editor」を実行
3. 無限キャンバス上で様々なノードを配置・編集
4. ノード間を接続してワークフローを構築

## サポートするノードタイプ

- **Memo Node**: Markdownテキストメモ
- **File Node**: ローカルファイル参照・プレビュー
- **Bash Function Node**: bash関数定義・実行
- **Connector Node**: データフロー制御・条件分岐

## 開発

### プロジェクト構造

```
NodeCanvas/
├── src/                    # ソースコード
│   ├── extension/         # VSCode拡張機能
│   ├── webview/          # React キャンバスUI
│   ├── parser/           # bash関数パーサー
│   ├── generator/        # ワークフロー実行
│   └── sync/             # 状態同期
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

### 開発フェーズ

開発は段階的なフェーズで進められています：
- **Canvas Phase 1**: プロジェクト再定義とコンセプト明確化
- **Canvas Phase 2**: 新ノードタイプの実装
- **Canvas Phase 3**: ワークフロー実行エンジン
- **Canvas Phase 4**: UI/UX改善とポリッシュ
- **Canvas Phase 5**: ファイル管理とプロジェクト機能

## コントリビューション

プルリクエストを歓迎します！以下のガイドラインに従ってください：

1. Forkしてfeatureブランチを作成
2. 変更をコミット
3. プルリクエストを送信

## ライセンス

MIT License

## 作者

tsuru531

## 謝辞

- [React Flow](https://reactflow.dev/) - ノードエディタUI
- [bash-parser](https://www.npmjs.com/package/bash-parser) - Bashパーサー