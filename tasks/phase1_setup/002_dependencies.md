# タスク002: 依存関係インストール

## 目的
VSCode拡張機能とノードエディタに必要な依存関係をインストールする

## 前提条件
- タスク001が完了している
- package.jsonが存在する

## 実装内容

### 1. VSCode拡張機能開発用依存関係
```bash
npm install --save-dev @types/vscode vscode-test @vscode/test-electron
```

### 2. Reactとノードエディタ関連
```bash
npm install react react-dom reactflow
npm install --save-dev @types/react @types/react-dom
```

### 3. ビルドツール
```bash
npm install --save-dev webpack webpack-cli ts-loader css-loader style-loader
npm install --save-dev @webpack/cli html-webpack-plugin
```

### 4. Bashパーサー関連
```bash
npm install bash-parser
```

### 5. ユーティリティ
```bash
npm install --save-dev eslint prettier @typescript-eslint/parser @typescript-eslint/eslint-plugin
```

### 6. package.jsonのスクリプト追加
```json
"scripts": {
  "vscode:prepublish": "npm run compile",
  "compile": "webpack --mode production",
  "watch": "webpack --mode development --watch",
  "lint": "eslint src --ext ts,tsx",
  "format": "prettier --write \"src/**/*.{ts,tsx}\"",
  "test": "node ./out/test/runTest.js"
}
```

## 成果物
- 更新されたpackage.json
- 更新されたpackage-lock.json
- node_modulesディレクトリ

## テスト方法
1. `npm list` ですべての依存関係が正しくインストールされていることを確認
2. `npm run compile` がエラーなく実行されることを確認

## 完了条件
- [ ] VSCode拡張機能用の型定義がインストールされている
- [ ] ReactとReact Flowがインストールされている
- [ ] Webpackがインストールされている
- [ ] Bashパーサーがインストールされている
- [ ] npmスクリプトが追加されている