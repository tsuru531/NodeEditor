import React, { useState, useCallback, useEffect, useContext } from 'react';
import { Handle, Position, useReactFlow } from 'reactflow';
import { NodeExecutionContext } from '../components/NodeEditor';
import { useFunctionCall, FunctionDefinition } from '../providers/FunctionRegistryProvider';

interface FunctionCallNodeData {
  selectedFunction: string;
  inputValues: Record<string, string>;
  executionResult?: string;
  isExecuting?: boolean;
}

interface FunctionCallNodeProps {
  data: FunctionCallNodeData;
  id: string;
  selected: boolean;
}

export const FunctionCallNode: React.FC<FunctionCallNodeProps> = React.memo(({ data, id, selected }) => {
  const [selectedFunction, setSelectedFunction] = useState(data.selectedFunction || '');
  const [inputValues, setInputValues] = useState<Record<string, string>>(data.inputValues || {});
  const [executionResult, setExecutionResult] = useState(data.executionResult || '');
  const [isExecuting, setIsExecuting] = useState(data.isExecuting || false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  const executionContext = useContext(NodeExecutionContext);
  const { setNodes } = useReactFlow();
  const { getFunction, getAllFunctions } = useFunctionCall();

  // 選択中の関数定義を取得
  const currentFunction: FunctionDefinition | undefined = selectedFunction ? getFunction(selectedFunction) : undefined;
  const availableFunctions = getAllFunctions();

  // React Flowのノードデータを更新する関数
  const updateNodeData = useCallback((updates: Partial<FunctionCallNodeData>) => {
    console.log('Updating function call node data:', updates);
    setNodes((nds) =>
      nds.map((node) =>
        node.id === id ? { ...node, data: { ...node.data, ...updates } } : node
      )
    );
  }, [id, setNodes]);

  // 選択された関数が変更された時の処理
  useEffect(() => {
    if (selectedFunction !== data.selectedFunction) {
      updateNodeData({ selectedFunction });
      
      // 新しい関数の引数に合わせて入力値をリセット
      if (currentFunction) {
        const newInputValues: Record<string, string> = {};
        currentFunction.parameters.forEach(param => {
          newInputValues[param] = inputValues[param] || '';
        });
        setInputValues(newInputValues);
      }
    }
  }, [selectedFunction, data.selectedFunction, updateNodeData, currentFunction, inputValues]);

  // 入力値が変更された時の処理
  useEffect(() => {
    if (JSON.stringify(inputValues) !== JSON.stringify(data.inputValues)) {
      updateNodeData({ inputValues });
    }
  }, [inputValues, data.inputValues, updateNodeData]);

  // 関数が選択された時の処理
  const handleFunctionSelect = useCallback((functionName: string) => {
    setSelectedFunction(functionName);
    const func = getFunction(functionName);
    if (func) {
      // パラメータに応じて入力値を初期化
      const newInputValues: Record<string, string> = {};
      func.parameters.forEach(param => {
        newInputValues[param] = '';
      });
      setInputValues(newInputValues);
    }
  }, [getFunction]);

  // 入力値を更新
  const updateInputValue = useCallback((paramName: string, value: string) => {
    setInputValues(prev => ({
      ...prev,
      [paramName]: value
    }));
  }, []);

  // 関数を実行
  const executeFunction = useCallback(async () => {
    if (!executionContext || !currentFunction) {
      console.error('Execution context or function not available');
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
  }, [id, executionContext, currentFunction]);

  // 定義ノードへジャンプ
  const jumpToDefinition = useCallback(() => {
    if (currentFunction) {
      // 定義ノードを選択状態にする（実装は省略）
      console.log(`Jump to definition node: ${currentFunction.nodeId}`);
    }
  }, [currentFunction]);

  const toggleCollapse = useCallback(() => {
    setIsCollapsed(!isCollapsed);
  }, [isCollapsed]);

  return (
    <div 
      className={`function-call-node ${selected ? 'selected' : ''}`}
      style={{
        minWidth: '300px',
        maxWidth: '400px',
        background: 'var(--node-background)',
        border: `2px solid ${selected ? 'var(--selection-color)' : '#2196F3'}`,
        borderRadius: '8px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
      }}
    >
      {/* ヘッダー */}
      <div 
        className="function-call-header"
        style={{
          padding: '8px 12px',
          background: 'linear-gradient(135deg, #2196F3, #1976D2)',
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
            <span style={{ fontSize: '14px' }}>⚡</span> 
            呼び出し: {selectedFunction || '未選択'}
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
          {currentFunction && (
            <button
              onClick={jumpToDefinition}
              style={{
                padding: '2px 6px',
                fontSize: '10px',
                border: '1px solid rgba(255,255,255,0.3)',
                borderRadius: '3px',
                background: 'rgba(255,255,255,0.2)',
                color: 'white',
                cursor: 'pointer',
              }}
            >
              定義へ
            </button>
          )}
          <button
            onClick={executeFunction}
            disabled={isExecuting || !currentFunction}
            style={{
              padding: '2px 6px',
              fontSize: '10px',
              border: '1px solid rgba(255,255,255,0.3)',
              borderRadius: '3px',
              background: isExecuting || !currentFunction ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.2)',
              color: 'white',
              cursor: isExecuting || !currentFunction ? 'not-allowed' : 'pointer',
            }}
          >
            {isExecuting ? '実行中...' : '実行'}
          </button>
        </div>
      </div>

      {/* 設定項目 */}
      {!isCollapsed && (
        <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--node-border)' }}>
          {/* 関数選択 */}
          <div style={{ marginBottom: '8px' }}>
            <label style={{ 
              display: 'block', 
              fontSize: '10px', 
              color: 'var(--text-muted)', 
              marginBottom: '4px' 
            }}>
              呼び出す関数:
            </label>
            <select
              value={selectedFunction}
              onChange={(e) => handleFunctionSelect(e.target.value)}
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
              <option value="">関数を選択...</option>
              {availableFunctions.map((func) => (
                <option key={func.name} value={func.name}>
                  {func.name} ({func.parameters.length}個の引数)
                </option>
              ))}
            </select>
          </div>

          {/* 関数の説明 */}
          {currentFunction && currentFunction.description && (
            <div style={{ 
              marginBottom: '8px',
              padding: '6px',
              background: '#f8f9fa',
              border: '1px solid #e9ecef',
              borderRadius: '3px',
              fontSize: '9px',
              color: 'var(--text-muted)'
            }}>
              {currentFunction.description}
            </div>
          )}

          {/* パラメータ入力 */}
          {currentFunction && currentFunction.parameters.length > 0 && (
            <div>
              <label style={{ 
                display: 'block', 
                fontSize: '10px', 
                color: 'var(--text-muted)', 
                marginBottom: '4px' 
              }}>
                引数:
              </label>
              {currentFunction.parameters.map((param, index) => (
                <div key={param} style={{ marginBottom: '6px' }}>
                  <input
                    type="text"
                    value={inputValues[param] || ''}
                    onChange={(e) => updateInputValue(param, e.target.value)}
                    placeholder={`${param} の値`}
                    className="nodrag"
                    style={{
                      width: 'calc(100% - 12px)',
                      padding: '3px 6px',
                      border: '1px solid var(--input-border)',
                      borderRadius: '3px',
                      background: 'var(--input-background)',
                      color: 'var(--text-color)',
                      fontSize: '10px',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              ))}
            </div>
          )}
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

      {/* ハンドルセクション */}
      <div style={{
        position: 'relative',
        padding: '8px 12px',
        borderTop: '1px solid var(--node-border)',
        background: 'var(--node-header-background)',
        borderRadius: '0 0 6px 6px',
        minHeight: `${Math.max(70, 20 + (currentFunction?.parameters.length || 0) * 20)}px`,
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
        {currentFunction && currentFunction.parameters.map((param, index) => (
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