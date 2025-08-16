import React, { useState, useCallback } from 'react';
import { Handle, Position } from 'reactflow';

interface ConnectorNodeData {
  connectorType: 'merge' | 'split' | 'condition' | 'transform';
  condition?: string;
  transformation?: string;
  inputs: number;
  outputs: number;
}

interface ConnectorNodeProps {
  data: ConnectorNodeData;
  id: string;
  selected: boolean;
}

export const ConnectorNode: React.FC<ConnectorNodeProps> = ({ data, id, selected }) => {
  const [connectorType, setConnectorType] = useState<'merge' | 'split' | 'condition' | 'transform'>(
    data.connectorType || 'merge'
  );
  const [condition, setCondition] = useState(data.condition || '');
  const [transformation, setTransformation] = useState(data.transformation || '');
  const [inputs, setInputs] = useState(data.inputs || 2);
  const [outputs, setOutputs] = useState(data.outputs || 1);
  const [isEditing, setIsEditing] = useState(false);

  const getConnectorIcon = useCallback((type: string): string => {
    const iconMap: { [key: string]: string } = {
      'merge': '🔗',
      'split': '📈',
      'condition': '❓',
      'transform': '🔄',
    };
    return iconMap[type] || '🔗';
  }, []);

  const getConnectorDescription = useCallback((type: string): string => {
    const descMap: { [key: string]: string } = {
      'merge': '複数入力を統合',
      'split': '1つの入力を分岐',
      'condition': '条件による分岐',
      'transform': 'データ変換',
    };
    return descMap[type] || '接続';
  }, []);

  const addInput = useCallback(() => {
    if (inputs < 8) {
      setInputs(inputs + 1);
    }
  }, [inputs]);

  const removeInput = useCallback(() => {
    if (inputs > 1) {
      setInputs(inputs - 1);
    }
  }, [inputs]);

  const addOutput = useCallback(() => {
    if (outputs < 8) {
      setOutputs(outputs + 1);
    }
  }, [outputs]);

  const removeOutput = useCallback(() => {
    if (outputs > 1) {
      setOutputs(outputs - 1);
    }
  }, [outputs]);

  const renderConfigUI = useCallback(() => {
    switch (connectorType) {
      case 'condition':
        return (
          <div style={{ margin: '8px 0' }}>
            <label style={{ 
              display: 'block', 
              fontSize: '10px', 
              color: 'var(--text-muted)', 
              marginBottom: '4px' 
            }}>
              条件式:
            </label>
            <input
              type="text"
              value={condition}
              onChange={(e) => setCondition(e.target.value)}
              style={{
                width: '100%',
                padding: '4px 6px',
                border: '1px solid var(--input-border)',
                borderRadius: '3px',
                background: 'var(--input-background)',
                color: 'var(--text-color)',
                fontSize: '11px',
                fontFamily: 'Monaco, "Cascadia Code", "Roboto Mono", monospace',
              }}
              placeholder="例: $1 -gt 10"
            />
          </div>
        );
      
      case 'transform':
        return (
          <div style={{ margin: '8px 0' }}>
            <label style={{ 
              display: 'block', 
              fontSize: '10px', 
              color: 'var(--text-muted)', 
              marginBottom: '4px' 
            }}>
              変換処理:
            </label>
            <textarea
              value={transformation}
              onChange={(e) => setTransformation(e.target.value)}
              style={{
                width: '100%',
                height: '60px',
                border: '1px solid var(--input-border)',
                borderRadius: '3px',
                background: 'var(--input-background)',
                color: 'var(--text-color)',
                fontSize: '11px',
                fontFamily: 'Monaco, "Cascadia Code", "Roboto Mono", monospace',
                resize: 'vertical',
                outline: 'none',
                padding: '4px 6px',
              }}
              placeholder="例: echo $1 | tr '[:lower:]' '[:upper:]'"
            />
          </div>
        );
      
      default:
        return null;
    }
  }, [connectorType, condition, transformation]);

  return (
    <div 
      className={`connector-node ${selected ? 'selected' : ''}`}
      style={{
        minWidth: '160px',
        maxWidth: '280px',
        background: 'var(--node-background)',
        border: `2px solid ${selected ? 'var(--selection-color)' : 'var(--node-border)'}`,
        borderRadius: '8px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
      }}
    >
      {/* ヘッダー */}
      <div 
        className="connector-header"
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
          {getConnectorIcon(connectorType)} コネクタ
        </span>
        <button
          onClick={() => setIsEditing(!isEditing)}
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
          {isEditing ? '完了' : '設定'}
        </button>
      </div>

      {/* コンテンツ */}
      <div style={{ padding: '12px' }}>
        {/* タイプ選択 */}
        {isEditing && (
          <div style={{ marginBottom: '8px' }}>
            <label style={{ 
              display: 'block', 
              fontSize: '10px', 
              color: 'var(--text-muted)', 
              marginBottom: '4px' 
            }}>
              タイプ:
            </label>
            <select
              value={connectorType}
              onChange={(e) => setConnectorType(e.target.value as any)}
              style={{
                width: '100%',
                padding: '4px 6px',
                border: '1px solid var(--input-border)',
                borderRadius: '3px',
                background: 'var(--input-background)',
                color: 'var(--text-color)',
                fontSize: '11px',
              }}
            >
              <option value="merge">統合 (Merge)</option>
              <option value="split">分岐 (Split)</option>
              <option value="condition">条件分岐 (Condition)</option>
              <option value="transform">変換 (Transform)</option>
            </select>
          </div>
        )}

        {/* 説明 */}
        <div style={{ 
          fontSize: '11px', 
          color: 'var(--text-muted)', 
          marginBottom: '8px',
          textAlign: 'center',
        }}>
          {getConnectorDescription(connectorType)}
        </div>

        {/* 設定UI */}
        {isEditing && renderConfigUI()}

        {/* 入出力数設定 */}
        {isEditing && (
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', fontSize: '10px' }}>
            <div style={{ flex: 1 }}>
              <span style={{ color: 'var(--text-muted)' }}>入力: {inputs}</span>
              <div style={{ display: 'flex', gap: '2px', marginTop: '2px' }}>
                <button
                  onClick={removeInput}
                  disabled={inputs <= 1}
                  style={{
                    padding: '2px 4px',
                    border: '1px solid var(--button-border)',
                    borderRadius: '2px',
                    background: inputs > 1 ? 'var(--button-background)' : 'var(--button-disabled)',
                    color: 'var(--button-text)',
                    cursor: inputs > 1 ? 'pointer' : 'not-allowed',
                    fontSize: '8px',
                  }}
                >
                  -
                </button>
                <button
                  onClick={addInput}
                  disabled={inputs >= 8}
                  style={{
                    padding: '2px 4px',
                    border: '1px solid var(--button-border)',
                    borderRadius: '2px',
                    background: inputs < 8 ? 'var(--button-background)' : 'var(--button-disabled)',
                    color: 'var(--button-text)',
                    cursor: inputs < 8 ? 'pointer' : 'not-allowed',
                    fontSize: '8px',
                  }}
                >
                  +
                </button>
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <span style={{ color: 'var(--text-muted)' }}>出力: {outputs}</span>
              <div style={{ display: 'flex', gap: '2px', marginTop: '2px' }}>
                <button
                  onClick={removeOutput}
                  disabled={outputs <= 1}
                  style={{
                    padding: '2px 4px',
                    border: '1px solid var(--button-border)',
                    borderRadius: '2px',
                    background: outputs > 1 ? 'var(--button-background)' : 'var(--button-disabled)',
                    color: 'var(--button-text)',
                    cursor: outputs > 1 ? 'pointer' : 'not-allowed',
                    fontSize: '8px',
                  }}
                >
                  -
                </button>
                <button
                  onClick={addOutput}
                  disabled={outputs >= 8}
                  style={{
                    padding: '2px 4px',
                    border: '1px solid var(--button-border)',
                    borderRadius: '2px',
                    background: outputs < 8 ? 'var(--button-background)' : 'var(--button-disabled)',
                    color: 'var(--button-text)',
                    cursor: outputs < 8 ? 'pointer' : 'not-allowed',
                    fontSize: '8px',
                  }}
                >
                  +
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 入力ハンドル */}
      {Array.from({ length: inputs }, (_, index) => (
        <Handle
          key={`input-${index}`}
          type="target"
          position={Position.Left}
          id={`input-${index}`}
          style={{
            background: 'var(--handle-color)',
            border: '2px solid var(--handle-border)',
            top: `${30 + (index + 1) * (100 / (inputs + 1))}%`,
          }}
        />
      ))}

      {/* 出力ハンドル */}
      {Array.from({ length: outputs }, (_, index) => (
        <Handle
          key={`output-${index}`}
          type="source"
          position={Position.Right}
          id={`output-${index}`}
          style={{
            background: 'var(--handle-color)',
            border: '2px solid var(--handle-border)',
            top: `${30 + (index + 1) * (100 / (outputs + 1))}%`,
          }}
        />
      ))}
    </div>
  );
};