# タスク 203: ファイルノード実装

## タスク概要

ローカルファイルを参照・表示するFileNodeの実装を行う。ファイル内容のプレビュー、監視、編集機能を提供する。

## 前提条件

- タスク201（基本ノード構造）の完了
- VS Code Workspace APIの理解
- ファイル監視ライブラリ（chokidar）の理解

## 実装内容

### 1. FileNode データ構造

#### FileNodeData インターフェース
```typescript
interface FileNodeData extends BaseNodeData {
  type: NodeType.FILE;
  filePath: string;           // ファイルパス（相対または絶対）
  fileType: FileType;         // ファイルタイプ
  displayMode: FileDisplayMode; // 表示モード
  maxPreviewLines: number;    // プレビュー最大行数
  isWatchingChanges: boolean; // ファイル変更監視ON/OFF
  lastModified: Date;         // 最終更新日時
  fileSize: number;           // ファイルサイズ（バイト）
  encoding: FileEncoding;     // エンコーディング
  isReadOnly: boolean;        // 読み取り専用フラグ
}

enum FileType {
  TEXT = 'text',
  MARKDOWN = 'markdown',
  JSON = 'json',
  YAML = 'yaml',
  XML = 'xml',
  CODE = 'code',
  IMAGE = 'image',
  BINARY = 'binary',
  UNKNOWN = 'unknown'
}

enum FileDisplayMode {
  PREVIEW = 'preview',        // プレビュー表示
  THUMBNAIL = 'thumbnail',    // サムネイル表示
  METADATA = 'metadata',      // メタデータ表示
  EDIT = 'edit'              // 編集モード
}

enum FileEncoding {
  UTF8 = 'utf8',
  UTF16 = 'utf16',
  SHIFT_JIS = 'shift_jis',
  EUC_JP = 'euc-jp'
}
```

### 2. FileNodeコンポーネント実装

#### コンポーネント構造
```typescript
interface FileNodeProps extends BaseNodeProps {
  data: FileNodeData;
  onFilePathChange: (nodeId: string, filePath: string) => void;
  onFileContentChange: (nodeId: string, content: string) => void;
  onDisplayModeChange: (nodeId: string, mode: FileDisplayMode) => void;
}

interface FileNodeState {
  fileContent: string;
  fileExists: boolean;
  isLoading: boolean;
  error: string | null;
  isEditing: boolean;
  editedContent: string;
}
```

### 3. ファイル操作機能

#### ファイル読み込み機能
```typescript
interface FileReader {
  readFile(filePath: string, encoding?: FileEncoding): Promise<string>;
  readBinaryFile(filePath: string): Promise<Buffer>;
  getFileMetadata(filePath: string): Promise<FileMetadata>;
  checkFileExists(filePath: string): Promise<boolean>;
}

interface FileMetadata {
  size: number;
  createdAt: Date;
  modifiedAt: Date;
  permissions: FilePermissions;
  mimeType: string;
  isDirectory: boolean;
}

interface FilePermissions {
  readable: boolean;
  writable: boolean;
  executable: boolean;
}
```

#### ファイル監視機能
```typescript
import { watch } from 'chokidar';

interface FileWatcher {
  watchFile(filePath: string, callback: (event: FileChangeEvent) => void): () => void;
  unwatchFile(filePath: string): void;
}

interface FileChangeEvent {
  type: 'change' | 'rename' | 'delete';
  filePath: string;
  timestamp: Date;
  stats?: FileMetadata;
}
```

### 4. ファイルタイプ別プレビュー

#### テキストファイルプレビュー
```typescript
interface TextPreviewConfig {
  maxLines: number;           // 最大表示行数
  showLineNumbers: boolean;   // 行番号表示
  syntaxHighlighting: boolean; // シンタックスハイライト
  wordWrap: boolean;          // 行折り返し
  fontSize: number;           // フォントサイズ
}
```

#### 画像ファイルプレビュー
```typescript
interface ImagePreviewConfig {
  maxWidth: number;           // 最大幅
  maxHeight: number;          // 最大高さ
  maintainAspectRatio: boolean; // アスペクト比維持
  showMetadata: boolean;      // EXIF等メタデータ表示
  allowZoom: boolean;         // ズーム機能
}
```

#### JSONファイルプレビュー
```typescript
interface JsonPreviewConfig {
  formatJson: boolean;        // JSON整形
  collapsibleObjects: boolean; // オブジェクト折りたたみ
  maxDepth: number;           // 最大表示深度
  showDataTypes: boolean;     // データ型表示
}
```

### 5. ファイル編集機能

#### エディタ統合
```typescript
interface FileEditor {
  language: string;           // エディタ言語モード
  readOnly: boolean;          // 読み取り専用
  autoSave: boolean;          // 自動保存
  saveDelay: number;          // 保存遅延（ms）
}
```

#### 編集操作
- ファイル内容の直接編集
- 変更の一時保存
- 元ファイルへの書き戻し
- 変更の破棄
- 差分表示

### 6. ファイル選択UI

#### ファイルピッカー
```typescript
interface FilePicker {
  allowedExtensions: string[]; // 許可する拡張子
  initialDirectory: string;    // 初期ディレクトリ
  multiSelect: boolean;        // 複数選択
  showHiddenFiles: boolean;    // 隠しファイル表示
}
```

#### ドラッグ&ドロップ
- OS からのファイルドロップ対応
- 複数ファイル同時ドロップ
- ファイルタイプ判定
- エラーハンドリング

## 技術詳細

### ファイル構造
```
src/webview/components/nodes/FileNode/
├── index.tsx                 # FileNodeメインコンポーネント
├── FileNode.module.css       # スタイル定義
├── FilePreview.tsx           # ファイルプレビュー
├── FileEditor.tsx            # ファイルエディタ
├── FileMetadata.tsx          # メタデータ表示
├── FilePicker.tsx            # ファイル選択UI
├── previews/
│   ├── TextPreview.tsx       # テキストプレビュー
│   ├── ImagePreview.tsx      # 画像プレビュー
│   ├── JsonPreview.tsx       # JSONプレビュー
│   ├── MarkdownPreview.tsx   # Markdownプレビュー
│   └── BinaryPreview.tsx     # バイナリファイル表示
└── hooks/
    ├── useFileContent.ts     # ファイル内容管理
    ├── useFileWatcher.ts     # ファイル監視
    └── useFileEditor.ts      # ファイル編集
```

### 依存関係追加
```json
{
  "dependencies": {
    "chokidar": "^3.5.3",
    "mime-types": "^2.1.35",
    "file-type": "^18.5.0",
    "image-size": "^1.0.2"
  },
  "devDependencies": {
    "@types/mime-types": "^2.1.1"
  }
}
```

### VS Code API利用
```typescript
// ファイル操作にVS Code APIを活用
interface VSCodeFileAPI {
  readFile(uri: vscode.Uri): Promise<Uint8Array>;
  writeFile(uri: vscode.Uri, content: Uint8Array): Promise<void>;
  showOpenDialog(options: vscode.OpenDialogOptions): Promise<vscode.Uri[]>;
  onDidChangeTextDocument: vscode.Event<vscode.TextDocumentChangeEvent>;
}
```

## 完了条件

- [ ] FileNodeDataインターフェースが定義されている
- [ ] FileNodeコンポーネントが実装されている
- [ ] ファイル読み込み機能が動作する
- [ ] ファイル監視機能が動作する
- [ ] テキストファイルプレビューが表示される
- [ ] 画像ファイルプレビューが表示される
- [ ] JSONファイルプレビューが表示される
- [ ] ファイル編集機能が動作する
- [ ] ファイル選択UIが動作する
- [ ] ドラッグ&ドロップが動作する
- [ ] ファイルメタデータが表示される
- [ ] エラーハンドリングが適切に動作する

## テスト項目

- [ ] 存在するファイルの読み込みが正常に動作する
- [ ] 存在しないファイルのエラーハンドリングが動作する
- [ ] 各ファイルタイプのプレビューが正しく表示される
- [ ] ファイル変更が検知される
- [ ] ファイル編集と保存が動作する
- [ ] 大きなファイルでの動作が正常
- [ ] バイナリファイルのハンドリングが適切
- [ ] パーミッションエラーの処理が適切
- [ ] 文字エンコーディングが正しく判定される
- [ ] ノードリサイズでプレビューが調整される

## 参考資料

- [VS Code File System API](https://code.visualstudio.com/api/references/vscode-api#FileSystem)
- [Chokidar File Watcher](https://github.com/paulmillr/chokidar)
- [file-type Library](https://github.com/sindresorhus/file-type)
- [MIME Types](https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/MIME_types)
- [Monaco Editor File Languages](https://github.com/microsoft/monaco-editor/tree/main/src/basic-languages)

## 実装順序

1. FileNodeDataインターフェースの定義
2. 基本的なFileNodeコンポーネントの実装
3. ファイル読み込み機能の実装
4. テキストファイルプレビューの実装
5. 画像ファイルプレビューの実装
6. ファイル監視機能の実装
7. ファイル編集機能の実装
8. ファイル選択UIの実装
9. ドラッグ&ドロップ機能の実装
10. エラーハンドリングとテスト

## セキュリティ考慮事項

- ファイルパスの検証（パストラバーサル攻撃対策）
- 読み取り権限の確認
- バイナリファイルの安全な処理
- メモリ使用量の制限（大ファイル対策）
- サンドボックス内での実行確保