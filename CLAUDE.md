# CLAUDE.md

## 言語設定
日本語での対応を行います。コメント、ドキュメント、ユーザーとのコミュニケーションは日本語で行ってください。

## プロジェクト概要
NodeEditor - Bashスクリプトをビジュアルノードエディタで編集できるVSCode拡張機能

### 主要機能
- Bashスクリプトのビジュアル編集
- ノードベースのドラッグ&ドロップUI
- スクリプト⇔ノードの双方向リアルタイム同期
- VSCode拡張機能として動作

## ブランチ運用
- **機能開発**: `feature/phase{番号}-{機能名}` 例: `feature/phase2-extension-entry`
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
├── webview/        # React製ノードエディタUI
├── parser/         # Bashパーサー
├── generator/      # コード生成
└── sync/           # リアルタイム同期
```

## 技術スタック
- TypeScript / React / React Flow
- VSCode Extension API / Webpack
- bash-parser (npm)

## ノードタイプ
- CommandNode (コマンド実行)
- PipeNode (パイプ処理)  
- ConditionNode (if/then/else)
- LoopNode (for/while/until)
- VariableNode (変数定義・参照)
- FunctionNode (関数定義)

## 開発フェーズ
1. **Phase 1**: プロジェクト初期セットアップ ✅
2. **Phase 2**: VSCode拡張機能基盤構築 ← 現在
3. **Phase 3**: ノードエディタUI実装
4. **Phase 4**: Bashパーサー実装
5. **Phase 5**: 相互変換システム実装
6. **Phase 6**: リアルタイム同期実装

詳細は`tasks/`ディレクトリ参照。