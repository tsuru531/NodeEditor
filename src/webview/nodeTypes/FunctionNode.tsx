import React, { useState, useCallback, useRef, useEffect, useContext } from 'react';
import { Handle, Position, useReactFlow } from 'reactflow';
import { NodeExecutionContext } from '../components/NodeEditor';

interface FunctionNodeData {
  functionName: string;
  parameters: string[];
  functionBody: string;
  language: string;
  isEditing: boolean;
  executionResult?: string;
  isExecuting?: boolean;
}

interface FunctionNodeProps {
  data: FunctionNodeData;
  id: string;
  selected: boolean;
}

const supportedLanguages = ['bash'];

const getLanguageIcon = (language: string): string => {
  switch (language) {
    case 'bash': return '⚡';
    default: return '🔧';
  }
};

export const FunctionNode: React.FC<FunctionNodeProps> = React.memo(({ data, id, selected }) => {
  const [functionName, setFunctionName] = useState(data.functionName || 'my_function');
  const [parameters, setParameters] = useState<string[]>(data.parameters || ['param1']);
  const [functionBody, setFunctionBody] = useState(data.functionBody || 'echo "Hello $1"');
  const [language, setLanguage] = useState(data.language || 'bash');
  const [isEditing, setIsEditing] = useState(data.isEditing || false);
  const [executionResult, setExecutionResult] = useState(data.executionResult || '');
  const [isExecuting, setIsExecuting] = useState(data.isExecuting || false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const executionContext = useContext(NodeExecutionContext);
  const { setNodes } = useReactFlow();

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isEditing]);

  // React Flowのノードデータを更新する関数
  const updateNodeData = useCallback((updates: Partial<FunctionNodeData>) => {
    console.log('Updating node data:', updates);
    setNodes((nds) =>
      nds.map((node) =>
        node.id === id ? { ...node, data: { ...node.data, ...updates } } : node
      )
    );
  }, [id, setNodes]);

  // functionBodyが変更された時にReact Flowのノードデータも更新
  useEffect(() => {
    if (functionBody !== data.functionBody) {
      console.log('FunctionBody changed, updating node data:', functionBody);
      updateNodeData({ functionBody });
    }
  }, [functionBody, data.functionBody, updateNodeData]);

  // functionNameが変更された時にReact Flowのノードデータも更新
  useEffect(() => {
    if (functionName !== data.functionName) {
      updateNodeData({ functionName });
    }
  }, [functionName, data.functionName, updateNodeData]);

  // parametersが変更された時にReact Flowのノードデータも更新
  useEffect(() => {
    if (JSON.stringify(parameters) !== JSON.stringify(data.parameters)) {
      updateNodeData({ parameters });
    }
  }, [parameters, data.parameters, updateNodeData]);

  // bash関数の本体から引数を自動解析
  const parseParametersFromBody = useCallback((body: string): string[] => {
    const paramRegex = /\$(\d+)/g;
    const matches = [...body.matchAll(paramRegex)];
    const paramNumbers = matches.map(match => parseInt(match[1])).filter(num => !isNaN(num));
    const maxParam = Math.max(0, ...paramNumbers);
    
    const detectedParams: string[] = [];
    for (let i = 1; i <= maxParam; i++) {
      detectedParams.push(`param${i}`);
    }
    return detectedParams;
  }, []);

  // 関数本体が変更されたときに引数を自動更新
  useEffect(() => {
    const detectedParams = parseParametersFromBody(functionBody);
    if (detectedParams.length > 0 && JSON.stringify(detectedParams) !== JSON.stringify(parameters)) {
      setParameters(detectedParams);
    }
  }, [functionBody, parseParametersFromBody, parameters]);

  const addParameter = useCallback(() => {
    setParameters([...parameters, `param${parameters.length + 1}`]);
  }, [parameters]);

  const removeParameter = useCallback((index: number) => {
    setParameters(parameters.filter((_, i) => i !== index));
  }, [parameters]);

  const updateParameter = useCallback((index: number, value: string) => {
    const newParams = [...parameters];
    newParams[index] = value;
    setParameters(newParams);
  }, [parameters]);

  const generateFunctionCode = useCallback(() => {
    const paramList = parameters.join(' ');
    return `function ${functionName}() {
  local ${parameters.map((p, i) => `${p}="$${i + 1}"`).join('\n  local ')}
  
  ${functionBody}
}`;
  }, [functionName, parameters, functionBody]);

  const executeFunction = useCallback(async () => {
    console.log('executeFunction called, executionContext:', executionContext);
    console.log('Node ID:', id);
    console.log('=== FUNCTION NODE DEBUG ===');
    console.log('Current functionBody state:', functionBody);
    console.log('Current data.functionBody:', data.functionBody);
    console.log('Current parameters:', parameters);
    console.log('Current data.parameters:', data.parameters);
    
    if (!executionContext) {
      console.error('Execution context not available');
      return;
    }

    setIsExecuting(true);
    setExecutionResult('');

    try {
      // NodeExecutionContextを使用してノードを実行
      console.log('Calling executionContext.executeNode with ID:', id);
      const result = await executionContext.executeNode(id);
      console.log('Execution result:', result);
      setExecutionResult(result.stdout);
      if (result.stderr) {
        setExecutionResult(prev => prev + '\nError: ' + result.stderr);
      }
    } catch (error) {
      console.error('Execution error:', error);
      setExecutionResult(`実行エラー: ${error}`);
    } finally {
      setIsExecuting(false);
    }
  }, [id, executionContext]);

  const toggleCollapse = useCallback(() => {
    setIsCollapsed(!isCollapsed);
  }, [isCollapsed]);

  return (
    <div 
      className={`function-node ${selected ? 'selected' : ''}`}
      style={{
        minWidth: '350px',
        maxWidth: '500px',
        background: 'var(--node-background)',
        border: `2px solid ${selected ? 'var(--selection-color)' : 'var(--function-node-color)'}`,
        borderRadius: '8px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
      }}
    >
      {/* ヘッダー */}
      <div 
        className="function-header"
        style={{
          padding: '8px 12px',
          background: 'var(--node-header-background)',
          borderBottom: '1px solid var(--node-border)',
          borderRadius: '6px 6px 0 0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1 }}>
          <span style={{ 
            fontSize: '12px', 
            fontWeight: 'bold',
            color: 'var(--function-node-color)',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}>
            <span style={{ fontSize: '14px' }}>{getLanguageIcon(language)}</span> {functionName}()
          </span>
          <span
            onClick={toggleCollapse}
            style={{
              fontSize: '12px',
              color: 'var(--text-color)',
              cursor: 'pointer',
              userSelect: 'none',
              padding: '2px',
            }}
          >
            {isCollapsed ? '▶' : '▼'}
          </span>
        </div>
        <div style={{ display: 'flex', gap: '4px' }}>
          <button
            onClick={() => {
              console.log('Execute button clicked');
              executeFunction();
            }}
            disabled={isExecuting}
            style={{
              padding: '2px 6px',
              fontSize: '10px',
              border: '1px solid var(--button-border)',
              borderRadius: '3px',
              background: isExecuting ? 'var(--button-disabled)' : 'var(--button-success)',
              color: 'var(--button-text)',
              cursor: isExecuting ? 'not-allowed' : 'pointer',
            }}
          >
            {isExecuting ? '実行中...' : '実行'}
          </button>
        </div>
      </div>

      {/* 設定項目 */}
      {!isCollapsed && (
        <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--node-border)' }}>
        {/* ラベル */}
        <div style={{ marginBottom: '8px' }}>
          <label style={{ 
            display: 'block', 
            fontSize: '10px', 
            color: 'var(--text-muted)', 
            marginBottom: '4px' 
          }}>
            表示名:
          </label>
          <input
            type="text"
            value={functionName}
            onChange={(e) => setFunctionName(e.target.value)}
            className="nodrag"
            style={{
              width: 'calc(100% - 12px)',
              padding: '4px 6px',
              border: '1px solid var(--input-border)',
              borderRadius: '3px',
              background: 'var(--input-background)',
              color: 'var(--text-color)',
              fontSize: '11px',
              fontFamily: 'Monaco, "Cascadia Code", "Roboto Mono", monospace',
              boxSizing: 'border-box',
            }}
            placeholder="関数名を入力..."
          />
        </div>

        {/* 言語 */}
        <div style={{ marginBottom: '8px' }}>
          <label style={{ 
            display: 'block', 
            fontSize: '10px', 
            color: 'var(--text-muted)', 
            marginBottom: '4px' 
          }}>
            言語:
          </label>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="nodrag"
            style={{
              width: 'calc(100% - 12px)',
              padding: '4px 6px',
              border: '1px solid var(--input-border)',
              borderRadius: '3px',
              background: 'var(--input-background)',
              color: 'var(--text-color)',
              fontSize: '11px',
              boxSizing: 'border-box',
            }}
          >
            {supportedLanguages.map((lang) => (
              <option key={lang} value={lang}>
                {lang}
              </option>
            ))}
          </select>
        </div>

        </div>
      )}

      {/* 関数本体 */}
      {!isCollapsed && (
        <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--node-border)' }}>
          <label style={{ 
            display: 'block', 
            fontSize: '10px', 
            color: 'var(--text-muted)', 
            marginBottom: '4px' 
          }}>
            関数:
          </label>
          <textarea
            ref={textareaRef}
            value={functionBody}
            onChange={(e) => setFunctionBody(e.target.value)}
            className="nodrag"
            style={{
              width: 'calc(100% - 12px)',
              minHeight: '60px',
              height: `${Math.max(60, functionBody.split('\n').length * 14 + 20)}px`,
              border: '1px solid var(--input-border)',
              borderRadius: '3px',
              background: 'var(--input-background)',
              color: 'var(--text-color)',
              fontSize: '10px',
              fontFamily: 'Monaco, "Cascadia Code", "Roboto Mono", monospace',
              lineHeight: '1.4',
              resize: 'none',
              outline: 'none',
              padding: '6px',
              boxSizing: 'border-box',
            }}
            placeholder="関数の本体を入力..."
          />
        </div>
      )}



      {/* ハンドルフッターセクション */}
      <div style={{
        position: 'relative',
        padding: '8px 12px',
        borderTop: '1px solid var(--node-border)',
        background: 'var(--node-header-background)',
        borderRadius: '0 0 6px 6px',
        minHeight: `${Math.max(70, 20 + parameters.length * 20)}px`,
      }}>
        {/* セクションタイトル */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: '12px',
          fontSize: '8px',
          color: 'var(--text-muted)',
          fontWeight: 'bold',
        }}>
          <span>args</span>
          <span>output</span>
        </div>

        {/* 入力ハンドル（左側） */}
        {parameters.map((param, index) => (
          <div key={`input-container-${index}`}>
            <Handle
              key={`input-${index}`}
              type="target"
              position={Position.Left}
              id={`input-${index}`}
              style={{
                position: 'absolute',
                background: 'var(--handle-color)',
                border: '2px solid var(--handle-border)',
                left: '-8px',
                top: `${32 + index * 20}px`,
              }}
            />
            <div style={{
              position: 'absolute',
              left: '8px',
              top: `${32 + index * 20 - 5}px`,
              fontSize: '7px',
              color: 'var(--text-muted)',
            }}>
              {param}
            </div>
          </div>
        ))}

        {/* 出力ハンドル（右側） */}
        <div>
          <Handle
            type="source"
            position={Position.Right}
            id="stdout"
            style={{
              position: 'absolute',
              background: '#4CAF50',
              border: '2px solid var(--handle-border)',
              right: '-8px',
              top: '32px',
            }}
          />
          <div style={{
            position: 'absolute',
            right: '8px',
            top: '27px',
            fontSize: '7px',
            color: 'var(--text-muted)',
            textAlign: 'right',
          }}>
            stdout
          </div>

          <Handle
            type="source"
            position={Position.Right}
            id="stderr"
            style={{
              position: 'absolute',
              background: '#f44336',
              border: '2px solid var(--handle-border)',
              right: '-8px',
              top: '52px',
            }}
          />
          <div style={{
            position: 'absolute',
            right: '8px',
            top: '47px',
            fontSize: '7px',
            color: 'var(--text-muted)',
            textAlign: 'right',
          }}>
            stderr
          </div>

          <Handle
            type="source"
            position={Position.Right}
            id="exitCode"
            style={{
              position: 'absolute',
              background: '#FF9800',
              border: '2px solid var(--handle-border)',
              right: '-8px',
              top: '72px',
            }}
          />
          <div style={{
            position: 'absolute',
            right: '8px',
            top: '67px',
            fontSize: '7px',
            color: 'var(--text-muted)',
            textAlign: 'right',
          }}>
            exit
          </div>
        </div>
      </div>
    </div>
  );
});