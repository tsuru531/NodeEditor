import React, { useState, useCallback, useEffect } from 'react';
import { Handle, Position } from 'reactflow';

interface FileNodeData {
  filePath: string;
  fileName?: string;
  fileType?: string;
  previewContent?: string;
  isConnected?: boolean;
}

interface FileNodeProps {
  data: FileNodeData;
  id: string;
  selected: boolean;
}

export const FileNode: React.FC<FileNodeProps> = ({ data, id, selected }) => {
  const [filePath, setFilePath] = useState(data.filePath || '');
  const [fileName, setFileName] = useState(data.fileName || '');
  const [fileType, setFileType] = useState(data.fileType || '');
  const [previewContent, setPreviewContent] = useState(data.previewContent || '');
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (filePath) {
      const pathParts = filePath.split(/[/\\]/);
      const name = pathParts[pathParts.length - 1];
      setFileName(name);
      
      const extension = name.split('.').pop()?.toLowerCase() || '';
      setFileType(getFileType(extension));
    }
  }, [filePath]);

  const getFileType = useCallback((extension: string): string => {
    const typeMap: { [key: string]: string } = {
      'js': 'javascript',
      'ts': 'typescript', 
      'jsx': 'react',
      'tsx': 'react',
      'py': 'python',
      'sh': 'bash',
      'bash': 'bash',
      'json': 'json',
      'md': 'markdown',
      'txt': 'text',
      'css': 'css',
      'html': 'html',
      'yml': 'yaml',
      'yaml': 'yaml',
    };
    return typeMap[extension] || 'file';
  }, []);

  const getFileIcon = useCallback((type: string): string => {
    const iconMap: { [key: string]: string } = {
      'javascript': '📄',
      'typescript': '📘',
      'react': '⚛️',
      'python': '🐍',
      'bash': '📜',
      'json': '📋',
      'markdown': '📝',
      'text': '📄',
      'css': '🎨',
      'html': '🌐',
      'yaml': '⚙️',
      'file': '📁',
    };
    return iconMap[type] || '📄';
  }, []);

  const handleFilePathChange = useCallback((value: string) => {
    setFilePath(value);
  }, []);

  const handleFileSelect = useCallback(async () => {
    // VSCodeのファイル選択API呼び出し（実装時）
    if (typeof window !== 'undefined' && (window as any).vscode) {
      (window as any).vscode.postMessage({
        command: 'selectFile',
        nodeId: id,
      });
    }
  }, [id]);

  const loadFilePreview = useCallback(async () => {
    if (!filePath) return;
    
    // ファイル内容のプレビュー読み込み（実装時）
    if (typeof window !== 'undefined' && (window as any).vscode) {
      (window as any).vscode.postMessage({
        command: 'loadFilePreview',
        nodeId: id,
        filePath: filePath,
      });
    }
  }, [id, filePath]);

  const openFile = useCallback(async () => {
    if (!filePath) return;
    
    if (typeof window !== 'undefined' && (window as any).vscode) {
      (window as any).vscode.postMessage({
        command: 'openFile',
        filePath: filePath,
      });
    }
  }, [filePath]);

  return (
    <div 
      className={`file-node ${selected ? 'selected' : ''}`}
      style={{
        minWidth: '220px',
        maxWidth: '400px',
        background: 'var(--node-background)',
        border: `2px solid ${selected ? 'var(--selection-color)' : 'var(--node-border)'}`,
        borderRadius: '8px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
      }}
    >
      {/* ヘッダー */}
      <div 
        className="file-header"
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
          {getFileIcon(fileType)} ファイル参照
        </span>
        <span style={{ 
          fontSize: '10px', 
          color: 'var(--text-muted)',
        }}>
          {fileType}
        </span>
      </div>

      {/* ファイルパス入力 */}
      <div style={{ padding: '12px', borderBottom: '1px solid var(--node-border)' }}>
        {isEditing ? (
          <input
            type="text"
            value={filePath}
            onChange={(e) => handleFilePathChange(e.target.value)}
            onBlur={() => setIsEditing(false)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                setIsEditing(false);
                loadFilePreview();
              }
              if (e.key === 'Escape') {
                setIsEditing(false);
              }
            }}
            style={{
              width: '100%',
              padding: '6px 8px',
              border: '1px solid var(--input-border)',
              borderRadius: '4px',
              background: 'var(--input-background)',
              color: 'var(--text-color)',
              fontSize: '12px',
            }}
            placeholder="ファイルパスを入力..."
            autoFocus
          />
        ) : (
          <div
            onClick={() => setIsEditing(true)}
            style={{
              padding: '6px 8px',
              border: '1px solid var(--input-border)',
              borderRadius: '4px',
              background: 'var(--input-background)',
              color: filePath ? 'var(--text-color)' : 'var(--text-muted)',
              fontSize: '12px',
              cursor: 'pointer',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {filePath || 'ファイルパスを入力...'}
          </div>
        )}
      </div>

      {/* ファイル情報 */}
      {fileName && (
        <div style={{ padding: '8px 12px', fontSize: '11px' }}>
          <div style={{ color: 'var(--text-color)', marginBottom: '4px' }}>
            <strong>ファイル名:</strong> {fileName}
          </div>
          {previewContent && (
            <div style={{ 
              color: 'var(--text-muted)',
              fontFamily: 'Monaco, "Cascadia Code", "Roboto Mono", monospace',
              maxHeight: '80px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}>
              {previewContent.substring(0, 150)}
              {previewContent.length > 150 && '...'}
            </div>
          )}
        </div>
      )}

      {/* アクションボタン */}
      <div 
        style={{ 
          padding: '8px 12px',
          display: 'flex',
          gap: '8px',
          borderTop: '1px solid var(--node-border)',
        }}
      >
        <button
          onClick={handleFileSelect}
          style={{
            flex: 1,
            padding: '4px 8px',
            fontSize: '10px',
            border: '1px solid var(--button-border)',
            borderRadius: '4px',
            background: 'var(--button-background)',
            color: 'var(--button-text)',
            cursor: 'pointer',
          }}
        >
          選択
        </button>
        <button
          onClick={loadFilePreview}
          disabled={!filePath}
          style={{
            flex: 1,
            padding: '4px 8px',
            fontSize: '10px',
            border: '1px solid var(--button-border)',
            borderRadius: '4px',
            background: filePath ? 'var(--button-background)' : 'var(--button-disabled)',
            color: filePath ? 'var(--button-text)' : 'var(--text-muted)',
            cursor: filePath ? 'pointer' : 'not-allowed',
          }}
        >
          読込
        </button>
        <button
          onClick={openFile}
          disabled={!filePath}
          style={{
            flex: 1,
            padding: '4px 8px',
            fontSize: '10px',
            border: '1px solid var(--button-border)',
            borderRadius: '4px',
            background: filePath ? 'var(--button-background)' : 'var(--button-disabled)',
            color: filePath ? 'var(--button-text)' : 'var(--text-muted)',
            cursor: filePath ? 'pointer' : 'not-allowed',
          }}
        >
          開く
        </button>
      </div>

      {/* ハンドル */}
      <Handle
        type="source"
        position={Position.Right}
        style={{
          background: 'var(--handle-color)',
          border: '2px solid var(--handle-border)',
        }}
      />
      <Handle
        type="target"
        position={Position.Left}
        style={{
          background: 'var(--handle-color)',
          border: '2px solid var(--handle-border)',
        }}
      />
    </div>
  );
};