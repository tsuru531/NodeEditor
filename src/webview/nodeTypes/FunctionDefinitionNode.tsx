import React, { useState, useCallback, useRef, useEffect, useContext } from 'react';
import { Handle, Position, useReactFlow } from 'reactflow';
import { NodeExecutionContext } from '../components/NodeEditor';
import { useFunctionDefinition } from '../providers/FunctionRegistryProvider';

interface FunctionDefinitionNodeData {
  functionName: string;
  parameters: string[];
  functionBody: string;
  language: string;
  description: string;
  isEditing: boolean;
  executionResult?: string;
  isExecuting?: boolean;
}

interface FunctionDefinitionNodeProps {
  data: FunctionDefinitionNodeData;
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

export const FunctionDefinitionNode: React.FC<FunctionDefinitionNodeProps> = React.memo(({ data, id, selected }) => {
  const [functionName, setFunctionName] = useState(data.functionName || 'my_function');
  const [parameters, setParameters] = useState<string[]>(data.parameters || ['param1']);
  const [functionBody, setFunctionBody] = useState(data.functionBody || 'echo "Hello $1"');
  const [language, setLanguage] = useState(data.language || 'bash');
  const [description, setDescription] = useState(data.description || '');
  const [isEditing, setIsEditing] = useState(data.isEditing || false);
  const [executionResult, setExecutionResult] = useState(data.executionResult || '');
  const [isExecuting, setIsExecuting] = useState(data.isExecuting || false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [nameError, setNameError] = useState<string>('');
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const executionContext = useContext(NodeExecutionContext);
  const { setNodes } = useReactFlow();
  const { registerDefinition, updateDefinition, removeDefinition, isFunctionNameAvailable } = useFunctionDefinition(id);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isEditing]);

  // React Flowのノードデータを更新する関数
  const updateNodeData = useCallback((updates: Partial<FunctionDefinitionNodeData>) => {
    console.log('Updating function definition node data:', updates);
    setNodes((nds) =>
      nds.map((node) =>
        node.id === id ? { ...node, data: { ...node.data, ...updates } } : node
      )
    );
  }, [id, setNodes]);

  // 関数レジストリに登録・更新
  const updateFunctionRegistry = useCallback(() => {
    const definition = {
      id: `def_${id}`,
      name: functionName,
      parameters,
      body: functionBody,
      language,
      description
    };

    // 既存の関数名と重複チェック（自分自身は除外）
    if (!isFunctionNameAvailable(functionName, id)) {
      setNameError('この関数名は既に使用されています');
      return;
    }

    setNameError('');
    
    // 古い名前の関数があれば削除
    if (data.functionName && data.functionName !== functionName) {
      removeDefinition(data.functionName);
    }
    
    registerDefinition(definition);
  }, [functionName, parameters, functionBody, language, description, id, isFunctionNameAvailable, data.functionName, registerDefinition, removeDefinition]);

  // 関数名が変更された時の処理
  useEffect(() => {
    if (functionName !== data.functionName) {
      updateNodeData({ functionName });
      updateFunctionRegistry();
    }
  }, [functionName, data.functionName, updateNodeData, updateFunctionRegistry]);

  // その他のパラメータが変更された時の処理
  useEffect(() => {
    if (JSON.stringify(parameters) !== JSON.stringify(data.parameters)) {
      updateNodeData({ parameters });
      updateFunctionRegistry();
    }
  }, [parameters, data.parameters, updateNodeData, updateFunctionRegistry]);

  useEffect(() => {
    if (functionBody !== data.functionBody) {
      updateNodeData({ functionBody });
      updateFunctionRegistry();
    }
  }, [functionBody, data.functionBody, updateNodeData, updateFunctionRegistry]);

  useEffect(() => {
    if (language !== data.language) {
      updateNodeData({ language });
      updateFunctionRegistry();
    }
  }, [language, data.language, updateNodeData, updateFunctionRegistry]);

  useEffect(() => {
    if (description !== data.description) {
      updateNodeData({ description });
      updateFunctionRegistry();
    }
  }, [description, data.description, updateNodeData, updateFunctionRegistry]);

  // コンポーネントのマウント時に関数を登録
  useEffect(() => {
    updateFunctionRegistry();
  }, []);

  // コンポーネントのアンマウント時に関数を削除
  useEffect(() => {
    return () => {
      if (functionName) {
        removeDefinition(functionName);
      }
    };
  }, [functionName, removeDefinition]);

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

  const executeFunction = useCallback(async () => {
    if (!executionContext) {
      console.error('Execution context not available');
      return;
    }

    setIsExecuting(true);
    setExecutionResult('');

    try {
      const result = await executionContext.executeNode(id);
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
      className={`function-definition-node ${selected ? 'selected' : ''}`}
      style={{
        minWidth: '380px',
        maxWidth: '500px',
        background: 'var(--node-background)',
        border: `2px solid ${selected ? 'var(--selection-color)' : '#9C27B0'}`,
        borderRadius: '8px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
      }}
    >
      {/* ヘッダー */}
      <div 
        className="function-definition-header"
        style={{
          padding: '8px 12px',
          background: 'linear-gradient(135deg, #9C27B0, #673AB7)',
          color: 'white',
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
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}>
            <span style={{ fontSize: '14px' }}>🔧</span> 定義: {functionName}()
          </span>
          <span
            onClick={toggleCollapse}
            style={{
              fontSize: '12px',
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
            onClick={executeFunction}
            disabled={isExecuting}
            style={{
              padding: '2px 6px',
              fontSize: '10px',
              border: '1px solid rgba(255,255,255,0.3)',
              borderRadius: '3px',
              background: isExecuting ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.2)',
              color: 'white',
              cursor: isExecuting ? 'not-allowed' : 'pointer',
            }}
          >
            {isExecuting ? '実行中...' : 'テスト実行'}
          </button>
        </div>
      </div>

      {/* 設定項目 */}
      {!isCollapsed && (
        <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--node-border)' }}>
          {/* 関数名 */}
          <div style={{ marginBottom: '8px' }}>
            <label style={{ 
              display: 'block', 
              fontSize: '10px', 
              color: 'var(--text-muted)', 
              marginBottom: '4px' 
            }}>
              関数名:
            </label>
            <input
              type="text"
              value={functionName}
              onChange={(e) => setFunctionName(e.target.value)}
              className="nodrag"
              style={{
                width: 'calc(100% - 12px)',
                padding: '4px 6px',
                border: `1px solid ${nameError ? '#f44336' : 'var(--input-border)'}`,
                borderRadius: '3px',
                background: 'var(--input-background)',
                color: 'var(--text-color)',
                fontSize: '11px',
                fontFamily: 'Monaco, "Cascadia Code", "Roboto Mono", monospace',
                boxSizing: 'border-box',
              }}
              placeholder="関数名を入力..."
            />
            {nameError && (
              <div style={{ fontSize: '9px', color: '#f44336', marginTop: '2px' }}>
                {nameError}
              </div>
            )}
          </div>

          {/* 説明 */}
          <div style={{ marginBottom: '8px' }}>
            <label style={{ 
              display: 'block', 
              fontSize: '10px', 
              color: 'var(--text-muted)', 
              marginBottom: '4px' 
            }}>
              説明:
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
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
              placeholder="関数の説明を入力..."
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
            関数の実装:
          </label>
          <textarea
            ref={textareaRef}
            value={functionBody}
            onChange={(e) => setFunctionBody(e.target.value)}
            className="nodrag"
            style={{
              width: 'calc(100% - 12px)',
              minHeight: '80px',
              height: `${Math.max(80, functionBody.split('\n').length * 14 + 20)}px`,
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
            placeholder="関数の実装を入力..."
          />
        </div>
      )}

      {/* 実行結果 */}
      {!isCollapsed && executionResult && (
        <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--node-border)' }}>
          <label style={{ 
            display: 'block', 
            fontSize: '10px', 
            color: 'var(--text-muted)', 
            marginBottom: '4px' 
          }}>
            実行結果:
          </label>
          <pre style={{
            margin: 0,
            padding: '6px',
            background: '#f5f5f5',
            border: '1px solid #ddd',
            borderRadius: '3px',
            fontSize: '9px',
            fontFamily: 'Monaco, "Cascadia Code", "Roboto Mono", monospace',
            whiteSpace: 'pre-wrap',
            maxHeight: '100px',
            overflow: 'auto',
          }}>
            {executionResult}
          </pre>
        </div>
      )}

      {/* パラメータとハンドル表示（情報のみ） */}
      <div style={{
        position: 'relative',
        padding: '8px 12px',
        borderTop: '1px solid var(--node-border)',
        background: 'var(--node-header-background)',
        borderRadius: '0 0 6px 6px',
        minHeight: '60px',
      }}>
        <div style={{
          fontSize: '8px',
          color: 'var(--text-muted)',
          fontWeight: 'bold',
          marginBottom: '8px',
        }}>
          パラメータ情報: {parameters.join(', ') || 'なし'}
        </div>
        
        <div style={{
          fontSize: '8px',
          color: 'var(--text-muted)',
        }}>
          このノードは関数定義のみを行います。実行には関数呼び出しノードを使用してください。
        </div>
      </div>
    </div>
  );
});