# タスク 501: プロジェクト保存/読込

## タスク概要

Canvas状態の保存と復元機能の実装。.canvas形式でのプロジェクト管理。

## 実装内容

### 1. プロジェクトデータ構造
```typescript
interface CanvasProject {
  version: string;
  metadata: ProjectMetadata;
  nodes: NodeData[];
  connections: ConnectionData[];
  viewport: ViewportState;
  settings: ProjectSettings;
}

interface ProjectMetadata {
  name: string;
  description: string;
  author: string;
  created: Date;
  modified: Date;
  version: string;
  tags: string[];
}
```

### 2. 保存/読込機能
- JSON形式での保存
- 圧縮とバージョン管理
- 増分保存
- 自動バックアップ

### 3. プロジェクト管理
- 最近のプロジェクト
- プロジェクト一覧
- プロジェクトテンプレート

## 完了条件
- [ ] プロジェクト保存が動作する
- [ ] プロジェクト読込が動作する
- [ ] 自動保存が動作する
- [ ] プロジェクト管理機能が動作する