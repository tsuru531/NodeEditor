# タスク 103: ブランチ戦略とセットアップ

## タスク概要

新しいNodeCanvasコンセプトの開発に向けたブランチ戦略の策定と、開発ブランチのセットアップを行う。

## 前提条件

- 現在のブランチ状態の確認
- 既存作業のコミット状況確認
- リモートリポジトリとの同期状態確認

## 実装内容

### 1. ブランチ戦略の策定

#### 新ブランチ命名規則
```
feature/canvas-v2-{機能名}
├── feature/canvas-v2-project-redef     # Phase Canvas 1
├── feature/canvas-v2-node-types       # Phase Canvas 2
├── feature/canvas-v2-execution        # Phase Canvas 3
├── feature/canvas-v2-ui-ux           # Phase Canvas 4
└── feature/canvas-v2-file-mgmt       # Phase Canvas 5
```

#### マージ戦略
- 各フェーズ完了後に統合ブランチ `feature/canvas-v2-main` にマージ
- 最終的に `main` ブランチにマージ
- 従来の機能は `legacy/bash-script-editor` ブランチで保持

### 2. 開発環境の準備

#### 現在の作業状態の保存
```bash
# 現在の作業をコミット
git add .
git commit -m "feat: Phase 2完了状態をセーブ - Canvas v2開発開始前"

# 現在のブランチを保護ブランチとして保存
git checkout -b legacy/phase2-webview-setup-backup
git push origin legacy/phase2-webview-setup-backup
```

#### 新しい開発ブランチの作成
```bash
# Canvas v2のメインブランチを作成
git checkout main
git pull origin main
git checkout -b feature/canvas-v2-main

# Phase Canvas 1のブランチを作成
git checkout -b feature/canvas-v2-project-redef
```

### 3. 開発ワークフロー

#### コミット規約
```
feat: 新機能の追加
fix: バグ修正
docs: ドキュメントの更新
refactor: リファクタリング
test: テストの追加・修正
style: コードスタイルの修正
canvas: Canvas v2特有の変更
```

#### プルリクエスト戦略
1. 各フェーズ完了時に `feature/canvas-v2-main` へのPR作成
2. レビュー後マージ
3. 全フェーズ完了後に `main` へのPR作成

### 4. 並行開発の管理

#### 競合回避策
- 各フェーズで異なるファイル群を主に編集
- Phase 1: メタデータとドキュメント
- Phase 2: ノードタイプ実装
- Phase 3: 実行エンジン
- Phase 4: UI/UXコンポーネント
- Phase 5: ファイル管理機能

#### 依存関係管理
- 前フェーズの完了を待ってから次フェーズ開始
- 必要に応じて作業ブランチ間でのチェリーピック

## 技術詳細

### .gitignore の更新
```gitignore
# Canvas v2 固有のファイル
*.canvas
.canvas-cache/
node-execution-logs/

# 開発用一時ファイル
*.dev.md
*.temp.json
```

### package.json scripts の追加
```json
{
  "scripts": {
    "dev:canvas": "npm run watch",
    "build:canvas": "npm run compile",
    "test:canvas": "npm run test",
    "lint:canvas": "npm run lint",
    "clean:canvas": "rm -rf out/ && rm -rf .canvas-cache/"
  }
}
```

### VS Code設定
```json
// .vscode/settings.json
{
  "git.defaultCloneDirectory": "./",
  "git.autofetch": true,
  "git.autorefresh": true,
  "git.confirmSync": false
}
```

## 完了条件

- [ ] 現在の作業がコミット・プッシュされている
- [ ] バックアップブランチが作成されている
- [ ] Canvas v2メインブランチが作成されている
- [ ] Phase Canvas 1ブランチが作成されている
- [ ] .gitignoreが更新されている
- [ ] package.jsonにCanvas用scriptsが追加されている
- [ ] ブランチ戦略ドキュメントが作成されている
- [ ] リモートリポジトリと同期されている

## テスト項目

- [ ] 新ブランチでビルドが成功する
- [ ] 既存の機能が動作する
- [ ] git操作が正常に動作する
- [ ] VS Code拡張機能が起動する

## 実行コマンド

### 作業保存とブランチ作成
```bash
# 1. 現在の作業を保存
git status
git add .
git commit -m "canvas: Phase 2完了状態を保存 - Canvas v2開発開始"

# 2. バックアップブランチ作成
git checkout -b legacy/phase2-webview-setup-complete
git push origin legacy/phase2-webview-setup-complete

# 3. Canvas v2ブランチ作成
git checkout main
git pull origin main
git checkout -b feature/canvas-v2-main
git push origin feature/canvas-v2-main

# 4. Phase Canvas 1ブランチ作成
git checkout -b feature/canvas-v2-project-redef
git push origin feature/canvas-v2-project-redef
```

### 環境確認
```bash
# ビルド確認
npm run compile

# 動作確認
code . # VS Codeで開いてF5でテスト
```

## 参考資料

- [Git Branching Strategies](https://www.atlassian.com/git/tutorials/comparing-workflows)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [VS Code Extension Development](https://code.visualstudio.com/api/get-started/your-first-extension)

## 注意事項

- ブランチ作成前に必ず現在の作業をコミットする
- リモートとの同期を忘れずに行う
- 他の開発者がいる場合は事前に連絡する
- バックアップブランチは削除しない