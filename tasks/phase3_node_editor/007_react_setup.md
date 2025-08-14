# タスク007: React環境構築

## 目的
ノードエディタUIのためのReact環境を構築し、基本的なスタイリングを設定する

## 前提条件
- Phase 2のタスクが完了している
- ReactとReact Flowがインストールされている

## 実装内容

### 1. TypeScript設定の更新（jsx対応）
tsconfig.jsonに以下を追加:
```json
{
  "compilerOptions": {
    "jsx": "react-jsx",
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "resolveJsonModule": true
  }
}
```

### 2. src/webview/styles/main.css の作成
```css
:root {
  --node-bg: var(--vscode-editor-background);
  --node-border: var(--vscode-panel-border);
  --node-text: var(--vscode-editor-foreground);
  --edge-color: var(--vscode-textLink-foreground);
  --selected-border: var(--vscode-focusBorder);
}

.react-flow__node {
  background: var(--node-bg);
  border: 1px solid var(--node-border);
  border-radius: 4px;
  color: var(--node-text);
  padding: 10px;
}

.react-flow__node.selected {
  border-color: var(--selected-border);
  box-shadow: 0 0 0 1px var(--selected-border);
}

.react-flow__edge-path {
  stroke: var(--edge-color);
}

.react-flow__handle {
  background: var(--edge-color);
  border: 2px solid var(--node-bg);
}
```

### 3. カスタムテーマプロバイダーの作成
```typescript
// src/webview/providers/ThemeProvider.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'dark',
  setTheme: () => {},
});

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>('dark');

  useEffect(() => {
    // Detect VSCode theme
    const isDark = document.body.classList.contains('vscode-dark');
    setTheme(isDark ? 'dark' : 'light');
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
```

### 4. React Flowの設定
```typescript
// src/webview/config/reactFlowConfig.ts
export const defaultViewport = { x: 0, y: 0, zoom: 1 };

export const nodeTypes = {
  command: CommandNode,
  pipe: PipeNode,
  condition: ConditionNode,
  loop: LoopNode,
  variable: VariableNode,
};

export const edgeTypes = {
  default: DefaultEdge,
  conditional: ConditionalEdge,
};

export const connectionLineStyle = {
  strokeWidth: 2,
  stroke: 'var(--edge-color)',
};
```

## 成果物
- 更新されたtsconfig.json
- src/webview/styles/main.css
- src/webview/providers/ThemeProvider.tsx
- src/webview/config/reactFlowConfig.ts

## テスト方法
1. `npm run compile` でコンパイルが成功する
2. WebViewにReactアプリケーションが表示される
3. VSCodeのテーマに応じてスタイルが変更される

## 完了条件
- [ ] TypeScript設定がJSX対応になっている
- [ ] カスタムCSSが適用されている
- [ ] テーマプロバイダーが実装されている
- [ ] React Flow設定が完了している