# タスク003: 基本ディレクトリ構造作成

## 目的
プロジェクトの基本的なディレクトリ構造と設定ファイルを作成する

## 前提条件
- タスク001, 002が完了している
- 必要な依存関係がインストールされている

## 実装内容

### 1. ディレクトリ構造の作成
```bash
mkdir -p src/extension
mkdir -p src/webview/components
mkdir -p src/webview/nodeTypes
mkdir -p src/parser
mkdir -p src/generator
mkdir -p src/sync
mkdir -p resources/icons
mkdir -p out
mkdir -p dist
```

### 2. webpack.config.jsの作成
```javascript
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = [
  // Extension config
  {
    target: 'node',
    mode: 'development',
    entry: './src/extension/extension.ts',
    output: {
      path: path.resolve(__dirname, 'out'),
      filename: 'extension.js',
      libraryTarget: 'commonjs2'
    },
    externals: {
      vscode: 'commonjs vscode'
    },
    resolve: {
      extensions: ['.ts', '.js']
    },
    module: {
      rules: [
        {
          test: /\.ts$/,
          exclude: /node_modules/,
          use: 'ts-loader'
        }
      ]
    }
  },
  // Webview config
  {
    target: 'web',
    mode: 'development',
    entry: './src/webview/App.tsx',
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: 'webview.js'
    },
    resolve: {
      extensions: ['.ts', '.tsx', '.js', '.jsx']
    },
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          exclude: /node_modules/,
          use: 'ts-loader'
        },
        {
          test: /\.css$/,
          use: ['style-loader', 'css-loader']
        }
      ]
    },
    plugins: [
      new HtmlWebpackPlugin({
        template: './src/webview/index.html'
      })
    ]
  }
];
```

### 3. .eslintrc.jsonの作成
```json
{
  "parser": "@typescript-eslint/parser",
  "extends": [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended"
  ],
  "parserOptions": {
    "ecmaVersion": 2020,
    "sourceType": "module",
    "ecmaFeatures": {
      "jsx": true
    }
  },
  "rules": {
    "@typescript-eslint/no-unused-vars": "warn",
    "@typescript-eslint/no-explicit-any": "warn"
  }
}
```

### 4. .prettierrcの作成
```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2
}
```

### 5. .vscodeignoreの作成
```
.vscode/**
.vscode-test/**
src/**
.gitignore
.eslintrc.json
.prettierrc
webpack.config.js
tsconfig.json
node_modules/**
!node_modules/bash-parser/**
```

## 成果物
- src/ディレクトリ構造
- webpack.config.js
- .eslintrc.json
- .prettierrc
- .vscodeignore

## テスト方法
1. ディレクトリ構造が正しく作成されていることを確認
2. `npm run lint` が正しく動作することを確認

## 完了条件
- [ ] src/ディレクトリ構造が作成されている
- [ ] webpack.config.jsが作成されている
- [ ] ESLint設定が作成されている
- [ ] Prettier設定が作成されている
- [ ] .vscodeignoreが作成されている