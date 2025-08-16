# タスク 202: メモノード実装

## タスク概要

Markdownテキストメモ機能を持つMemoNodeの実装を行う。ObsidianのCanvasメモノードライクな自由度の高いテキスト編集機能を提供する。

## 前提条件

- タスク201（基本ノード構造）の完了
- Markdown-itライブラリの理解
- Monaco Editorの基本操作理解

## 実装内容

### 1. MemoNode データ構造

#### MemoNodeData インターフェース
```typescript
interface MemoNodeData extends BaseNodeData {
  type: NodeType.MEMO;
  content: string;           // Markdownテキスト
  renderMode: RenderMode;    // 表示モード
  fontSize: number;          // フォントサイズ
  fontFamily: string;        // フォントファミリー
  textAlign: TextAlign;      // テキスト配置
  backgroundColor: string;   // 背景色
  isMarkdownEnabled: boolean; // Markdown機能ON/OFF
}

enum RenderMode {
  EDIT = 'edit',           // 編集モード
  PREVIEW = 'preview',     // プレビューモード  
  SPLIT = 'split'          // 分割表示モード
}

enum TextAlign {
  LEFT = 'left',
  CENTER = 'center',
  RIGHT = 'right',
  JUSTIFY = 'justify'
}
```

### 2. MemoNodeコンポーネント実装

#### コンポーネント構造
```typescript
interface MemoNodeProps extends BaseNodeProps {
  data: MemoNodeData;
  onContentChange: (nodeId: string, content: string) => void;
  onModeChange: (nodeId: string, mode: RenderMode) => void;
}

interface MemoNodeState {
  isEditing: boolean;
  content: string;
  renderMode: RenderMode;
  cursorPosition: number;
  selectionRange: [number, number];
}
```

#### 主要機能
1. **Markdownエディタ**: シンタックスハイライト付きエディタ
2. **リアルタイムプレビュー**: Markdown→HTMLリアルタイム変換
3. **分割表示**: エディタ/プレビューの同時表示
4. **フォント設定**: サイズ、ファミリー、色の調整
5. **テキスト配置**: 左寄せ、中央、右寄せ、両端揃え

### 3. Markdownレンダリング機能

#### Markdown-it設定
```typescript
import MarkdownIt from 'markdown-it';
import hljs from 'highlight.js';

const markdownRenderer = new MarkdownIt({
  html: true,           // HTMLタグ許可
  linkify: true,        // URLの自動リンク化
  typographer: true,    // 自動引用符変換
  highlight: (str, lang) => {
    if (lang && hljs.getLanguage(lang)) {
      return hljs.highlight(str, { language: lang }).value;
    }
    return '';
  }
});

// プラグイン追加
markdownRenderer.use(require('markdown-it-checkbox'));  // チェックボックス
markdownRenderer.use(require('markdown-it-footnote')); // 脚注
markdownRenderer.use(require('markdown-it-table'));    // テーブル拡張
```

### 4. エディタ機能実装

#### Monaco Editor統合
```typescript
import * as monaco from 'monaco-editor';

interface EditorConfig {
  language: 'markdown';
  theme: 'vs-dark' | 'vs-light';
  fontSize: number;
  fontFamily: string;
  wordWrap: 'on' | 'off';
  minimap: { enabled: boolean };
  lineNumbers: 'on' | 'off';
  scrollBeyondLastLine: false;
}
```

#### キーボードショートカット
- `Ctrl+B`: 太字
- `Ctrl+I`: 斜体  
- `Ctrl+K`: リンク挿入
- `Ctrl+Shift+P`: プレビューモード切替
- `Ctrl+S`: 保存（親への通知）

### 5. カスタマイズ機能

#### スタイルカスタマイズ
```typescript
interface MemoStyles {
  fontSize: number;        // 8-72px
  fontFamily: string;      // フォント選択
  lineHeight: number;      // 行間
  padding: number;         // 内部余白
  backgroundColor: string; // 背景色
  textColor: string;       // テキスト色
  borderStyle: BorderStyle; // ボーダースタイル
}

interface BorderStyle {
  width: number;
  style: 'solid' | 'dashed' | 'dotted' | 'none';
  color: string;
  radius: number;
}
```

#### テンプレート機能
```typescript
interface MemoTemplate {
  name: string;
  description: string;
  content: string;
  styles: Partial<MemoStyles>;
}

const defaultTemplates: MemoTemplate[] = [
  {
    name: 'Simple Note',
    content: '# メモ\n\n',
    styles: { fontSize: 14 }
  },
  {
    name: 'Task List',
    content: '# タスク\n\n- [ ] タスク1\n- [ ] タスク2\n',
    styles: { fontSize: 12 }
  },
  {
    name: 'Code Snippet',
    content: '# コードメモ\n\n```typescript\n// ここにコード\n```\n',
    styles: { fontFamily: 'monospace' }
  }
];
```

## 技術詳細

### ファイル構造
```
src/webview/components/nodes/MemoNode/
├── index.tsx                 # MemoNodeメインコンポーネント
├── MemoNode.module.css       # スタイル定義
├── MemoEditor.tsx            # エディタコンポーネント
├── MemoPreview.tsx           # プレビューコンポーネント
├── MemoToolbar.tsx           # ツールバー
├── MemoSettings.tsx          # 設定パネル
├── MemoTemplates.tsx         # テンプレート選択
└── hooks/
    ├── useMemoContent.ts     # コンテンツ管理
    ├── useMemoStyles.ts      # スタイル管理
    └── useMarkdownRenderer.ts # Markdownレンダリング
```

### 依存関係追加
```json
{
  "dependencies": {
    "markdown-it": "^13.0.1",
    "markdown-it-checkbox": "^1.1.0",
    "markdown-it-footnote": "^3.0.3",
    "highlight.js": "^11.8.0",
    "monaco-editor": "^0.44.0"
  },
  "devDependencies": {
    "@types/markdown-it": "^13.0.1"
  }
}
```

### パフォーマンス最適化
- デバウンシング: リアルタイムプレビューの更新頻度制御
- メモ化: Markdownレンダリング結果のキャッシュ
- 仮想スクロール: 大量テキスト時のスクロール最適化

## 完了条件

- [ ] MemoNodeDataインターフェースが定義されている
- [ ] MemoNodeコンポーネントが実装されている
- [ ] Markdownエディタが動作する
- [ ] Markdownプレビューが表示される
- [ ] 分割表示モードが動作する
- [ ] フォント設定が反映される
- [ ] テキスト配置設定が動作する
- [ ] 背景色設定が反映される
- [ ] キーボードショートカットが動作する
- [ ] テンプレート機能が動作する
- [ ] VS Codeテーマに連動する
- [ ] リサイズに追従してレイアウトが調整される

## テスト項目

- [ ] 新規メモノード作成が動作する
- [ ] テキスト入力が正常に動作する
- [ ] Markdownレンダリングが正しく動作する
- [ ] 編集/プレビューモード切替が動作する
- [ ] フォント設定変更が反映される
- [ ] ノードリサイズが正常に動作する
- [ ] コンテンツの保存/復元が動作する
- [ ] シンタックスハイライトが動作する
- [ ] チェックボックスが動作する
- [ ] 長文での動作が正常

## 参考資料

- [Markdown-it Documentation](https://markdown-it.github.io/)
- [Monaco Editor API](https://microsoft.github.io/monaco-editor/api/index.html)
- [highlight.js Languages](https://highlightjs.org/static/demo/)
- [Obsidian Canvas](https://help.obsidian.md/Plugins/Canvas)
- [React Flow Custom Nodes](https://reactflow.dev/docs/guides/custom-nodes/)

## 実装順序

1. MemoNodeDataインターフェースの定義
2. 基本的なMemoNodeコンポーネントの実装
3. Monaco Editorの統合
4. Markdown-itによるプレビュー機能
5. 表示モード切替機能
6. スタイルカスタマイズ機能
7. テンプレート機能
8. キーボードショートカット
9. パフォーマンス最適化
10. テストとデバッグ