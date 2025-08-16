import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Handle, Position } from 'reactflow';

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
    case 'bash': return '🐚';
    default: return '🔧';
  }
};

export const FunctionNode: React.FC<FunctionNodeProps> = ({ data, id, selected }) => {
  const [functionName, setFunctionName] = useState(data.functionName || 'my_function');
  const [parameters, setParameters] = useState<string[]>(data.parameters || ['param1']);
  const [functionBody, setFunctionBody] = useState(data.functionBody || 'echo "Hello $param1"');
  const [language, setLanguage] = useState(data.language || 'bash');
  const [isEditing, setIsEditing] = useState(data.isEditing || false);
  const [executionResult, setExecutionResult] = useState(data.executionResult || '');
  const [isExecuting, setIsExecuting] = useState(data.isExecuting || false);
  const [editingTab, setEditingTab] = useState<'name' | 'params' | 'body' | 'lang'>('body');
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isEditing]);

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
    setIsExecuting(true);
    setExecutionResult('');

    // VSCodeのbash実行API呼び出し（実装時）
    if (typeof window !== 'undefined' && (window as any).vscode) {
      (window as any).vscode.postMessage({
        command: 'executeBashFunction',
        nodeId: id,
        functionCode: generateFunctionCode(),
        functionName: functionName,
        parameters: parameters,
      });
    } else {
      // 開発時のモック
      setTimeout(() => {
        setExecutionResult(`実行結果（モック）:\nfunction ${functionName} executed successfully`);
        setIsExecuting(false);
      }, 1000);
    }
  }, [id, generateFunctionCode, functionName, parameters]);

  const toggleEditMode = useCallback(() => {
    setIsEditing(!isEditing);
  }, [isEditing]);

  return (
    <div 
      className={`function-node ${selected ? 'selected' : ''}`}
      style={{
        minWidth: '280px',
        maxWidth: '500px',
        background: 'var(--node-background)',
        border: `2px solid ${selected ? 'var(--selection-color)' : 'var(--node-border)'}`,
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
        <span style={{ 
          fontSize: '12px', 
          fontWeight: 'bold',
          color: 'var(--text-color)',
        }}>
          {getLanguageIcon(language)} {functionName}() [{language}]
        </span>
        <div style={{ display: 'flex', gap: '4px' }}>
          <button
            onClick={toggleEditMode}
            style={{
              padding: '2px 6px',
              fontSize: '10px',
              border: '1px solid var(--button-border)',
              borderRadius: '3px',
              background: isEditing ? 'var(--button-active)' : 'var(--button-background)',
              color: 'var(--button-text)',
              cursor: 'pointer',
            }}
          >
            {isEditing ? '完了' : '編集'}
          </button>
          <button
            onClick={executeFunction}
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

      {isEditing && (
        <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--node-border)' }}>
          {/* タブ */}
          <div style={{ display: 'flex', gap: '4px', marginBottom: '8px' }}>
            {(['name', 'params', 'body', 'lang'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setEditingTab(tab)}
                style={{
                  padding: '4px 8px',
                  fontSize: '10px',
                  border: '1px solid var(--button-border)',
                  borderRadius: '3px',
                  background: editingTab === tab ? 'var(--button-active)' : 'var(--button-background)',
                  color: 'var(--button-text)',
                  cursor: 'pointer',
                }}
              >
                {tab === 'name' ? '関数名' : tab === 'params' ? '引数' : tab === 'body' ? '本体' : '言語'}
              </button>
            ))}
          </div>

          {/* 関数名編集 */}
          {editingTab === 'name' && (
            <input
              type="text"
              value={functionName}
              onChange={(e) => setFunctionName(e.target.value)}
              style={{
                width: '100%',
                padding: '6px 8px',
                border: '1px solid var(--input-border)',
                borderRadius: '4px',
                background: 'var(--input-background)',
                color: 'var(--text-color)',
                fontSize: '12px',
                fontFamily: 'Monaco, "Cascadia Code", "Roboto Mono", monospace',
              }}
              placeholder="関数名を入力..."
            />
          )}

          {/* 引数編集 */}
          {editingTab === 'params' && (
            <div>
              {parameters.map((param, index) => (
                <div key={index} style={{ display: 'flex', gap: '4px', marginBottom: '4px' }}>
                  <input
                    type="text"
                    value={param}
                    onChange={(e) => updateParameter(index, e.target.value)}
                    style={{
                      flex: 1,
                      padding: '4px 6px',
                      border: '1px solid var(--input-border)',
                      borderRadius: '3px',
                      background: 'var(--input-background)',
                      color: 'var(--text-color)',
                      fontSize: '11px',
                      fontFamily: 'Monaco, "Cascadia Code", "Roboto Mono", monospace',
                    }}
                  />
                  <button
                    onClick={() => removeParameter(index)}
                    style={{
                      padding: '4px 6px',
                      fontSize: '10px',
                      border: '1px solid var(--button-border)',
                      borderRadius: '3px',
                      background: 'var(--button-danger)',
                      color: 'var(--button-text)',
                      cursor: 'pointer',
                    }}
                  >
                    削除
                  </button>
                </div>
              ))}
              <button
                onClick={addParameter}
                style={{
                  padding: '4px 8px',
                  fontSize: '10px',
                  border: '1px solid var(--button-border)',
                  borderRadius: '3px',
                  background: 'var(--button-background)',
                  color: 'var(--button-text)',
                  cursor: 'pointer',
                }}
              >
                + 引数追加
              </button>
            </div>
          )}

          {/* 関数本体編集 */}
          {editingTab === 'body' && (
            <textarea
              ref={textareaRef}
              value={functionBody}
              onChange={(e) => setFunctionBody(e.target.value)}
              style={{
                width: '100%',
                height: '120px',
                border: '1px solid var(--input-border)',
                borderRadius: '4px',
                background: 'var(--input-background)',
                color: 'var(--text-color)',
                fontSize: '11px',
                fontFamily: 'Monaco, "Cascadia Code", "Roboto Mono", monospace',
                lineHeight: '1.4',
                resize: 'vertical',
                outline: 'none',
                padding: '8px',
              }}
              placeholder="関数の本体を入力..."
            />
          )}

          {/* 言語選択 */}
          {editingTab === 'lang' && (
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              style={{
                width: '100%',
                padding: '6px 8px',
                border: '1px solid var(--input-border)',
                borderRadius: '4px',
                background: 'var(--input-background)',
                color: 'var(--text-color)',
                fontSize: '12px',
                fontFamily: 'Monaco, "Cascadia Code", "Roboto Mono", monospace',
              }}
            >
              {supportedLanguages.map((lang) => (
                <option key={lang} value={lang}>
                  {lang}
                </option>
              ))}
            </select>
          )}
        </div>
      )}

      {/* 関数プレビュー */}
      {!isEditing && (
        <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--node-border)' }}>
          <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '4px' }}>
            {language} | 引数: {parameters.join(', ')}
          </div>
          <pre style={{
            fontSize: '10px',
            fontFamily: 'Monaco, "Cascadia Code", "Roboto Mono", monospace',
            color: 'var(--text-color)',
            background: 'var(--code-background)',
            padding: '6px',
            borderRadius: '3px',
            margin: 0,
            overflow: 'auto',
            maxHeight: '100px',
            lineHeight: '1.3',
          }}>
            {generateFunctionCode()}
          </pre>
        </div>
      )}

      {/* 実行結果 */}
      {executionResult && (
        <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--node-border)' }}>
          <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '4px' }}>
            実行結果:
          </div>
          <pre style={{
            fontSize: '10px',
            fontFamily: 'Monaco, "Cascadia Code", "Roboto Mono", monospace',
            color: 'var(--text-color)',
            background: 'var(--output-background)',
            padding: '6px',
            borderRadius: '3px',
            margin: 0,
            overflow: 'auto',
            maxHeight: '80px',
            lineHeight: '1.3',
            whiteSpace: 'pre-wrap',
          }}>
            {executionResult}
          </pre>
        </div>
      )}

      {/* 入力ハンドル（動的生成） */}
      {parameters.map((param, index) => (
        <Handle
          key={`input-${index}`}
          type="target"
          position={Position.Left}
          id={`input-${index}`}
          style={{
            background: 'var(--handle-color)',
            border: '2px solid var(--handle-border)',
            top: `${30 + (index + 1) * 20}px`,
          }}
        />
      ))}

      {/* 出力ハンドル */}
      <Handle
        type="source"
        position={Position.Right}
        style={{
          background: 'var(--handle-color)',
          border: '2px solid var(--handle-border)',
        }}
      />
    </div>
  );
};