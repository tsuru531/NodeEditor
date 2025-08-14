# タスク001: プロジェクト初期化

## 目的
NodeEditor VSCode拡張機能プロジェクトの基本セットアップを行う

## 前提条件
- Node.js (v16以上) がインストールされている
- npm または yarn が使用可能
- VSCodeがインストールされている

## 実装内容

### 1. npmプロジェクトの初期化
```bash
npm init -y
```

### 2. TypeScript設定
```bash
npm install --save-dev typescript @types/node
npx tsc --init
```

### 3. VSCode拡張機能用の設定追加
package.jsonに以下を追加:
- `publisher`: 拡張機能の発行者名
- `engines.vscode`: サポートするVSCodeのバージョン
- `categories`: 拡張機能のカテゴリ
- `main`: エントリーポイント

### 4. .gitignoreファイルの作成
```
node_modules/
out/
dist/
*.vsix
.vscode-test/
```

## 成果物
- package.json
- tsconfig.json
- .gitignore

## テスト方法
1. `npm list` で依存関係が正しくインストールされていることを確認
2. `npx tsc --version` でTypeScriptが使用可能なことを確認

## 完了条件
- [ ] package.jsonが作成されている
- [ ] tsconfig.jsonが作成されている
- [ ] TypeScriptがインストールされている
- [ ] .gitignoreが作成されている