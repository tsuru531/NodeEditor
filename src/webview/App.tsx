import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import { ThemeProvider } from './providers/ThemeProvider';
import { FunctionRegistryProvider } from './providers/FunctionRegistryProvider';
import { EditorLayout } from './components/EditorLayout';
import './styles/main.css';
import './styles/layout.css';
import './styles/nodes.css';

declare const vscode: any;

const App: React.FC = () => {
  const [scriptContent, setScriptContent] = useState<string>('');

  useEffect(() => {
    // VSCodeからのメッセージを受信
    const messageHandler = (event: MessageEvent) => {
      const message = event.data;
      switch (message.command) {
        case 'setScript':
          setScriptContent(message.script);
          break;
        case 'loadNodes':
          // ノードデータの読み込み処理（将来的に実装）
          break;
      }
    };

    window.addEventListener('message', messageHandler);

    // 初期スクリプトを要求
    if (typeof vscode !== 'undefined') {
      vscode.postMessage({
        command: 'getScript'
      });
    }

    return () => {
      window.removeEventListener('message', messageHandler);
    };
  }, []);

  return (
    <ThemeProvider>
      <FunctionRegistryProvider>
        <EditorLayout />
      </FunctionRegistryProvider>
    </ThemeProvider>
  );
};

// DOMのマウント
const rootElement = document.getElementById('root');
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(<App />);
} else {
  console.error('Root element not found');
}