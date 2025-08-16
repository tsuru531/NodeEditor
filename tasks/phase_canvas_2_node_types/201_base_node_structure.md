# タスク 201: 基本ノード構造の定義

## タスク概要

すべてのノードタイプの基盤となる基本ノード構造とインターフェースを定義・実装する。

## 前提条件

- React Flow v11の理解
- TypeScript型システムの理解
- 新コンセプト設計の完了

## 実装内容

### 1. ベースノードインターフェースの定義

#### 共通ノードプロパティ
```typescript
interface BaseNodeData {
  id: string;
  type: NodeType;
  label: string;
  description?: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  style: NodeStyle;
  metadata: NodeMetadata;
}

interface NodeMetadata {
  createdAt: Date;
  updatedAt: Date;
  author?: string;
  tags: string[];
  isLocked: boolean;
  isMinimized: boolean;
}

interface NodeStyle {
  backgroundColor: string;
  borderColor: string;
  textColor: string;
  borderWidth: number;
  borderRadius: number;
  opacity: number;
}
```

#### ノードタイプ列挙
```typescript
enum NodeType {
  MEMO = 'memo',
  FILE = 'file',
  BASH_FUNCTION = 'bashFunction',
  CONNECTOR = 'connector'
}
```

### 2. ベースNodeコンポーネントの実装

#### コンポーネント構造
```typescript
interface BaseNodeProps {
  data: BaseNodeData;
  selected: boolean;
  dragging: boolean;
}

interface BaseNodeState {
  isEditing: boolean;
  isHovered: boolean;
  validationErrors: string[];
}
```

#### 共通機能の実装
1. **リサイズ機能**: ドラッグでのサイズ変更
2. **編集モード切替**: ダブルクリックで編集/表示モード切替
3. **コンテキストメニュー**: 右クリックでのアクション表示
4. **ホバー効果**: マウスオーバー時のハイライト
5. **選択状態表示**: 選択時のボーダー表示

### 3. ノード間接続システム

#### ハンドルシステム
```typescript
interface NodeHandle {
  id: string;
  type: 'input' | 'output';
  dataType: DataType;
  position: HandlePosition;
  isConnected: boolean;
  isRequired: boolean;
}

enum DataType {
  STRING = 'string',
  NUMBER = 'number',
  BOOLEAN = 'boolean',
  FILE = 'file',
  ARRAY = 'array',
  OBJECT = 'object',
  ANY = 'any'
}

enum HandlePosition {
  TOP = 'top',
  RIGHT = 'right',
  BOTTOM = 'bottom',
  LEFT = 'left'
}
```

### 4. 状態管理システム

#### ノード状態管理
```typescript
interface NodeState {
  executionState: ExecutionState;
  validationState: ValidationState;
  data: any; // ノードタイプ固有データ
}

enum ExecutionState {
  IDLE = 'idle',
  RUNNING = 'running',
  SUCCESS = 'success',
  ERROR = 'error',
  CANCELLED = 'cancelled'
}

interface ValidationState {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}
```

### 5. イベントシステム

#### ノードイベント
```typescript
interface NodeEvents {
  onDataChange: (nodeId: string, newData: any) => void;
  onSizeChange: (nodeId: string, newSize: Size) => void;
  onPositionChange: (nodeId: string, newPosition: Position) => void;
  onExecute: (nodeId: string) => void;
  onDelete: (nodeId: string) => void;
  onDuplicate: (nodeId: string) => void;
}
```

## 技術詳細

### ファイル構造
```
src/webview/
├── components/
│   ├── nodes/
│   │   ├── BaseNode/
│   │   │   ├── index.tsx          # ベースノードコンポーネント
│   │   │   ├── BaseNode.module.css
│   │   │   ├── NodeHeader.tsx     # ヘッダー部分
│   │   │   ├── NodeBody.tsx       # ボディ部分
│   │   │   ├── NodeFooter.tsx     # フッター部分
│   │   │   ├── NodeHandle.tsx     # 接続ハンドル
│   │   │   └── NodeResizer.tsx    # リサイズハンドル
│   │   └── ...
├── types/
│   ├── NodeTypes.ts               # ノード型定義
│   ├── ExecutionTypes.ts          # 実行関連型定義
│   └── EventTypes.ts              # イベント型定義
├── hooks/
│   ├── useNodeState.ts            # ノード状態管理
│   ├── useNodeValidation.ts       # バリデーション
│   └── useNodeEvents.ts           # イベントハンドリング
└── utils/
    ├── nodeFactory.ts             # ノード生成ユーティリティ
    ├── nodeValidator.ts           # バリデーション関数
    └── nodeSerializer.ts          # シリアライゼーション
```

### スタイリング方針
- CSS Modulesを使用
- VS Codeテーマ変数の活用
- レスポンシブデザイン対応
- アクセシビリティ考慮

### パフォーマンス考慮
- React.memoでの再描画最適化
- useCallbackでのイベントハンドラー最適化
- 仮想化の検討（大量ノード時）

## 完了条件

- [ ] ベースノード型定義が完了している
- [ ] BaseNodeコンポーネントが実装されている
- [ ] ノードハンドルシステムが実装されている
- [ ] リサイズ機能が動作する
- [ ] 編集モード切替が動作する
- [ ] コンテキストメニューが表示される
- [ ] ホバー効果が動作する
- [ ] 状態管理システムが実装されている
- [ ] イベントシステムが実装されている
- [ ] TypeScript型チェックが通る
- [ ] 基本的なスタイリングが適用されている

## テスト項目

- [ ] ノード作成が正常に動作する
- [ ] ノードの選択/非選択が動作する
- [ ] ノードのドラッグ移動が動作する
- [ ] ノードのリサイズが動作する
- [ ] 編集モードの切替が動作する
- [ ] コンテキストメニューが表示される
- [ ] VS Codeテーマに応じてスタイルが変更される
- [ ] エラー時にエラー状態が表示される

## 参考資料

- [React Flow Custom Nodes](https://reactflow.dev/docs/guides/custom-nodes/)
- [React Flow Node Types](https://reactflow.dev/docs/api/node-types/)
- [TypeScript Advanced Types](https://www.typescriptlang.org/docs/handbook/2/types-from-types.html)
- [CSS Modules](https://github.com/css-modules/css-modules)
- [VS Code Theme Colors](https://code.visualstudio.com/api/references/theme-color)

## 実装順序

1. 型定義の作成（NodeTypes.ts, ExecutionTypes.ts, EventTypes.ts）
2. ベースノードコンポーネントの骨格実装
3. ノードハンドルシステムの実装
4. リサイズ機能の実装
5. 編集モード機能の実装
6. 状態管理システムの実装
7. イベントシステムの実装
8. スタイリングの適用
9. テストの実行