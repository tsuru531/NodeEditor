# タスク 101: プロジェクト名変更とメタ情報更新

## タスク概要

NodeEditorからNodeCanvasへのプロジェクト名変更と、新しいコンセプトに合わせたメタ情報の更新を行う。

## 前提条件

- 現在のプロジェクト状態の把握
- 新しいコンセプトの明確化

## 実装内容

### 1. プロジェクト名の変更
- `package.json`のname、displayName、descriptionを更新
- README.mdのタイトルと説明を更新
- CLAUDE.mdのプロジェクト概要を更新

### 2. VS Code拡張機能メタデータの更新
- `package.json`のcontributes.commandsを新コンセプトに合わせて調整
- アクティベーションイベントの見直し
- 設定項目の更新

### 3. ドキュメントの更新
- `docs/PROJECT_OVERVIEW.md`の全面改訂
- `docs/ARCHITECTURE.md`の新アーキテクチャへの更新
- その他ドキュメントファイルの整合性確保

## 技術詳細

### package.jsonの主要変更点
```json
{
  "name": "nodecanvas",
  "displayName": "NodeCanvas - Visual Workflow Editor",
  "description": "Canvas型ノードエディタ - メモ、ファイル、関数を自由に配置し実行可能なワークフローを構築",
  "keywords": [
    "canvas",
    "node",
    "editor",
    "workflow",
    "visual",
    "memo",
    "bash",
    "function"
  ]
}
```

### コマンドの変更
- `nodeeditor.openEditor` → `nodecanvas.openCanvas`
- `nodeeditor.importScript` → `nodecanvas.importFunction`
- `nodeeditor.exportScript` → `nodecanvas.exportWorkflow`

### 設定項目の見直し
- `nodeeditor.*` → `nodecanvas.*`
- Canvas特有の設定項目追加
  - `nodecanvas.gridSnap`: グリッドスナップ機能
  - `nodecanvas.autoSave`: 自動保存機能
  - `nodecanvas.defaultNodeType`: デフォルトノードタイプ

## 完了条件

- [ ] package.jsonの名前とメタ情報が更新されている
- [ ] README.mdが新しいコンセプトを反映している
- [ ] CLAUDE.mdのプロジェクト概要が更新されている
- [ ] docs/PROJECT_OVERVIEW.mdが全面改訂されている
- [ ] VS Codeのコマンドとメニューが新しい名前になっている
- [ ] 設定項目が新しいスキーマになっている
- [ ] 既存の機能が引き続き動作する
- [ ] ビルドエラーが発生しない

## テスト項目

- [ ] `npm run compile`が成功する
- [ ] `npm run lint`が成功する
- [ ] F5でVS Code拡張機能が起動する
- [ ] 新しいコマンド名でパレットから実行できる
- [ ] 設定画面で新しい設定項目が表示される

## 参考資料

- [VS Code Extension API - Contribution Points](https://code.visualstudio.com/api/references/contribution-points)
- [package.json Extension Manifest](https://code.visualstudio.com/api/references/extension-manifest)
- [ObsidianのCanvas機能](https://help.obsidian.md/Plugins/Canvas)
- [ComfyUIの概念](https://github.com/comfyanonymous/ComfyUI)

## 注意事項

- 既存のユーザー設定が影響を受けないよう移行パスを検討する
- ブランチ作成前に現在の状態をバックアップする
- 段階的に変更を行い、各ステップで動作確認を行う