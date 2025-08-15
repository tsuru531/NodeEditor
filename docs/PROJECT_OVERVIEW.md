# NodeEditor プロジェクト概要

## 🎯 プロジェクトの目的

NodeEditorは、Bashスクリプトをビジュアルノードエディタで編集できるVSCode拡張機能です。
複雑なBashスクリプトを視覚的に理解・編集できるようにすることで、開発効率を向上させます。

## 🌟 主要機能

### 現在実装済み
- ✅ VSCode拡張機能としての基本フレームワーク
- ✅ Bashファイル（.sh, .bash）の検出と読み込み
- ✅ WebViewパネルでのReact Flowノードエディタ表示
- ✅ VSCodeテーマとの統合（ダーク/ライトテーマ対応）

### 今後実装予定
- 🔲 Bashスクリプトの構文解析（AST生成）
- 🔲 スクリプトからノードへの自動変換
- 🔲 ノードからスクリプトへの変換
- 🔲 リアルタイム双方向同期
- 🔲 ドラッグ&ドロップによる編集

## 📸 スクリーンショット

### ノードエディタの表示
現在はデモノードが表示されます。実際のBashスクリプト解析は今後実装予定です。

```
┌─────────────────────────────────────┐
│         #!/bin/bash                 │
└─────────────────┬───────────────────┘
                  │
        ┌─────────▼──────────┐
        │ echo "Hello World" │
        └─────────┬──────────┘
                  │
     ┌────────────┴────────────┐
     ▼                         ▼
┌──────────┐            ┌──────────┐
│  ls -la  │            │   pwd    │
└────┬─────┘            └─────┬────┘
     │                         │
     └────────────┬────────────┘
                  ▼
           ┌──────────┐
           │  exit 0  │
           └──────────┘
```

## 🚀 クイックスタート

### インストール
```bash
git clone https://github.com/tsuru531/NodeEditor
cd NodeEditor
npm install
```

### 開発環境での実行
```bash
# ビルド
npm run compile

# VSCodeでF5キーを押してデバッグ実行
```

### 使い方
1. デバッグ実行後、新しいVSCodeウィンドウが開きます
2. Bashファイル（.shまたは.bash）を開きます
3. 以下のいずれかの方法でNodeEditorを起動：
   - コマンドパレット（Cmd/Ctrl+Shift+P）→「NodeEditor: Open Visual Editor」
   - エディタ右クリック → 「NodeEditor: Open Visual Editor」
   - ステータスバーの「NodeEditor」ボタンをクリック

## 🛠 技術スタック

- **フロントエンド**: React 19 + TypeScript
- **ノードエディタ**: React Flow 11
- **バンドラー**: Webpack 5
- **拡張機能API**: VSCode Extension API
- **パーサー**: bash-parser（予定）
- **スタイリング**: CSS with VSCode Theme Integration

## 📂 プロジェクト構造

```
NodeEditor/
├── src/
│   ├── extension/          # VSCode拡張機能のコア
│   │   ├── extension.ts    # エントリーポイント
│   │   └── NodeEditorPanel.ts # WebViewパネル管理
│   ├── webview/           # React製ノードエディタUI
│   │   ├── App.tsx        # メインコンポーネント
│   │   ├── index.tsx      # エントリーポイント
│   │   ├── config/        # React Flow設定
│   │   ├── providers/     # コンテキストプロバイダー
│   │   └── styles/        # スタイルシート
│   ├── parser/            # Bashパーサー（未実装）
│   ├── generator/         # コード生成（未実装）
│   └── sync/              # リアルタイム同期（未実装）
├── out/                   # ビルド出力
├── resources/             # 静的リソース
├── tasks/                 # 開発タスク定義
└── docs/                  # ドキュメント
```

## 👥 コントリビューション

プルリクエストを歓迎します！詳細は[CONTRIBUTING.md](../CONTRIBUTING.md)をご覧ください。

## 📄 ライセンス

MIT License - 詳細は[LICENSE](../LICENSE)ファイルをご覧ください。

## 🔗 関連リンク

- [GitHub リポジトリ](https://github.com/tsuru531/NodeEditor)
- [Issue トラッカー](https://github.com/tsuru531/NodeEditor/issues)
- [開発ロードマップ](./IMPLEMENTATION_STATUS.md)