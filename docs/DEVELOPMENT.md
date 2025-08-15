# NodeEditor 開発ガイド

## 🚀 開発環境のセットアップ

### 必要な環境
- Node.js 16.x以上
- npm 7.x以上
- VSCode 1.85.0以上
- Git

### 初期セットアップ
```bash
# リポジトリのクローン
git clone https://github.com/tsuru531/NodeEditor.git
cd NodeEditor

# 依存関係のインストール
npm install

# 初回ビルド
npm run compile
```

## 📝 開発コマンド一覧

```bash
# ビルド
npm run compile          # Webpackでビルド
npm run compile-tsc      # TypeScriptコンパイラでビルド（デバッグ用）

# ウォッチモード（自動ビルド）
npm run watch            # Webpackウォッチモード
npm run watch-tsc        # TypeScriptウォッチモード

# 品質チェック
npm run lint             # ESLintでコードチェック
npm run format           # Prettierでコードフォーマット

# テスト
npm run test             # テスト実行（未実装）
```

## 🐛 デバッグ方法

### VSCodeでのデバッグ
1. VSCodeでプロジェクトを開く
2. `F5`キーを押してデバッグ実行
3. 新しいVSCodeウィンドウ（Extension Development Host）が開く
4. Bashファイルを開いてNodeEditorを起動

### デバッグコンソール
- **Extension Host**: `extension.ts`のconsole.logが表示される
- **WebView DevTools**: WebViewを右クリック→「開発者ツール」で確認

### ブレークポイントの設定
- **Extension側**: `src/extension/*.ts`ファイルに直接設定可能
- **WebView側**: Chrome DevToolsで設定（Source mapが有効）

## 🏗 新機能の追加方法

### 1. 新しいコマンドを追加する場合

```typescript
// src/extension/extension.ts に追加
const myCommand = vscode.commands.registerCommand(
    'nodeeditor.myCommand',
    async () => {
        // コマンドの処理
    }
);

// package.json に追加
"contributes": {
    "commands": [{
        "command": "nodeeditor.myCommand",
        "title": "NodeEditor: My Command"
    }]
}
```

### 2. 新しいノードタイプを追加する場合

```typescript
// src/webview/nodeTypes/MyNode.tsx を作成
import React from 'react';
import { Handle, Position } from 'reactflow';

export const MyNode: React.FC<any> = ({ data }) => {
    return (
        <div className="my-node">
            <Handle type="target" position={Position.Top} />
            <div>{data.label}</div>
            <Handle type="source" position={Position.Bottom} />
        </div>
    );
};

// src/webview/config/reactFlowConfig.ts に登録
export const nodeTypes = {
    myNode: MyNode,
    // ...
};
```

### 3. WebViewとExtension間の通信を追加する場合

```typescript
// WebView側 (App.tsx)
window.vscode.postMessage({
    command: 'myMessage',
    data: { /* ... */ }
});

// Extension側 (NodeEditorPanel.ts)
this._panel.webview.onDidReceiveMessage(
    message => {
        switch (message.command) {
            case 'myMessage':
                // メッセージ処理
                break;
        }
    }
);
```

## 📁 コード構造とベストプラクティス

### ディレクトリ構造のルール
```
src/
├── extension/     # VSCode拡張機能関連（Node.js環境）
├── webview/       # React UI関連（ブラウザ環境）
├── common/        # 共通の型定義・ユーティリティ
├── parser/        # Bashパーサー関連
├── generator/     # コード生成関連
└── sync/          # 同期処理関連
```

### コーディング規約

#### TypeScript
- strictモードを有効にする
- any型の使用を避ける
- インターフェースと型エイリアスを適切に使い分ける

```typescript
// Good
interface NodeData {
    label: string;
    command: string;
}

// Bad
const data: any = { label: 'test' };
```

#### React
- 関数コンポーネントを使用する
- カスタムフックで状態管理ロジックを分離する
- React.memoで不要な再レンダリングを防ぐ

```typescript
// Good
const MyComponent: React.FC<Props> = React.memo(({ data }) => {
    const [state, setState] = useState(initialState);
    // ...
});
```

#### スタイリング
- VSCodeのテーマ変数を活用する
- BEM命名規則に従う
- グローバルスタイルの使用を最小限にする

```css
/* Good */
.node-editor__panel {
    background: var(--vscode-editor-background);
}

.node-editor__panel--active {
    border-color: var(--vscode-focusBorder);
}
```

## 🧪 テスト戦略（今後実装予定）

### ユニットテスト
- パーサーロジックのテスト
- 変換関数のテスト
- ユーティリティ関数のテスト

### 統合テスト
- Extension ⇔ WebView通信のテスト
- ファイル読み書きのテスト

### E2Eテスト
- VSCode Extension Testerを使用
- ユーザーシナリオベースのテスト

## 🔧 トラブルシューティング

### よくある問題と解決方法

#### ビルドエラー
```bash
# node_modulesをクリーンインストール
rm -rf node_modules package-lock.json
npm install
```

#### WebViewが表示されない
1. CSP設定を確認
2. コンソールでエラーを確認
3. WebViewのHTMLが正しく生成されているか確認

#### React Flowが動作しない
1. React Flowのスタイルシートがインポートされているか確認
2. ノードとエッジのデータ形式が正しいか確認
3. React Flowのプロップスが正しく設定されているか確認

## 🎯 開発のヒント

### パフォーマンス最適化
- React.memoを使用して不要な再レンダリングを防ぐ
- useCallbackとuseMemoを適切に使用
- 大きなファイルの解析は非同期で処理

### デバッグ効率化
- console.logの代わりにVSCodeのブレークポイントを活用
- Chrome DevToolsのReact Developer Toolsを使用
- ネットワークタブでメッセージング通信を確認

### コード品質向上
- 定期的にnpm run lintを実行
- コミット前にnpm run formatを実行
- 型定義を明確にしてTypeScriptの恩恵を最大化

## 📚 参考リソース

### 公式ドキュメント
- [VSCode Extension API](https://code.visualstudio.com/api)
- [React Flow Documentation](https://reactflow.dev/)
- [React Documentation](https://react.dev/)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)

### 関連ライブラリ
- [bash-parser](https://github.com/vorpaljs/bash-parser)
- [Webpack](https://webpack.js.org/)
- [ESLint](https://eslint.org/)
- [Prettier](https://prettier.io/)

## 🤝 コントリビューション

1. Issueを作成または既存のIssueを選択
2. featureブランチを作成（`git checkout -b feature/amazing-feature`）
3. 変更をコミット（日本語メッセージOK）
4. ブランチをプッシュ（`git push origin feature/amazing-feature`）
5. Pull Requestを作成

詳細は[CONTRIBUTING.md](../CONTRIBUTING.md)を参照してください。