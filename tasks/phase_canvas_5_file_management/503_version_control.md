# タスク 503: バージョン管理

## タスク概要

プロジェクトの履歴管理とバージョン制御機能の実装。

## 実装内容

### 1. 履歴管理
```typescript
interface VersionManager {
  saveSnapshot(project: CanvasProject): string; // スナップショットID
  restoreSnapshot(snapshotId: string): CanvasProject;
  getHistory(): ProjectSnapshot[];
  compareVersions(v1: string, v2: string): VersionDiff;
}

interface ProjectSnapshot {
  id: string;
  timestamp: Date;
  description: string;
  changes: ChangeRecord[];
}
```

### 2. 変更追跡
- ノード追加/削除/変更
- 接続の追加/削除
- プロパティ変更
- 差分表示

### 3. アンドゥ/リドゥ
- 操作履歴の管理
- 細かい粒度での取り消し
- ブランチ履歴対応

## 完了条件
- [ ] 履歴管理が動作する
- [ ] スナップショット機能が動作する
- [ ] アンドゥ/リドゥが動作する
- [ ] 変更追跡が正確に動作する