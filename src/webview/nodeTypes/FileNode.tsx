import React, { useState, useCallback, useEffect } from 'react';
import { Handle, Position } from 'reactflow';

interface FileNodeData {
  filePath: string;
  fileName?: string;
  fileType?: string;
  previewContent?: string;
  isConnected?: boolean;
  lastModified?: Date;
  fileSize?: number;
  hash?: string;
  syncStatus?: 'synced' | 'modified' | 'missing' | 'error';
  autoSync?: boolean;
  embeddedContent?: string;
  referenceType?: 'relative' | 'absolute' | 'embedded';
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
  const [syncStatus, setSyncStatus] = useState<'synced' | 'modified' | 'missing' | 'error'>(data.syncStatus || 'synced');
  const [lastModified, setLastModified] = useState<Date | undefined>(data.lastModified);
  const [fileSize, setFileSize] = useState<number | undefined>(data.fileSize);
  const [autoSync, setAutoSync] = useState(data.autoSync ?? true);
  const [referenceType, setReferenceType] = useState<'relative' | 'absolute' | 'embedded'>(data.referenceType || 'relative');

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

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      // WebではFile.pathは利用できないため、名前のみ使用
      setFilePath(file.name);
    }
  }, []);

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

  const checkFileStatus = useCallback(async () => {
    if (!filePath) return;
    
    if (typeof window !== 'undefined' && (window as any).vscode) {
      (window as any).vscode.postMessage({
        command: 'checkFileStatus',
        nodeId: id,
        filePath: filePath,
      });
    }
  }, [id, filePath]);

  const toggleAutoSync = useCallback(() => {
    const newAutoSync = !autoSync;
    setAutoSync(newAutoSync);
    
    if (typeof window !== 'undefined' && (window as any).vscode) {
      (window as any).vscode.postMessage({
        command: 'updateFileNodeSettings',
        nodeId: id,
        autoSync: newAutoSync,
        referenceType: referenceType,
      });
    }
  }, [autoSync, id, referenceType]);

  const toggleReferenceType = useCallback(() => {
    const types: ('relative' | 'absolute' | 'embedded')[] = ['relative', 'absolute', 'embedded'];
    const currentIndex = types.indexOf(referenceType);
    const newType = types[(currentIndex + 1) % types.length];
    setReferenceType(newType);
    
    if (typeof window !== 'undefined' && (window as any).vscode) {
      (window as any).vscode.postMessage({
        command: 'updateFileNodeSettings',
        nodeId: id,
        autoSync: autoSync,
        referenceType: newType,
      });
    }
  }, [autoSync, id, referenceType]);

  const getSyncStatusIcon = useCallback(() => {
    switch (syncStatus) {
      case 'synced': return '✅';
      case 'modified': return '⚠️';
      case 'missing': return '❌';
      case 'error': return '🔴';
      default: return '❓';
    }
  }, [syncStatus]);

  const getSyncStatusText = useCallback(() => {
    switch (syncStatus) {
      case 'synced': return '同期済み';
      case 'modified': return 'ファイル変更あり';
      case 'missing': return 'ファイル見つからず';
      case 'error': return 'エラー';
      default: return '不明';
    }
  }, [syncStatus]);

  const getReferenceTypeIcon = useCallback(() => {
    switch (referenceType) {
      case 'relative': return '📂';
      case 'absolute': return '🔗';
      case 'embedded': return '📦';
      default: return '❓';
    }
  }, [referenceType]);

  // ファイル状態を定期的にチェック
  useEffect(() => {
    if (autoSync && filePath) {
      const interval = setInterval(checkFileStatus, 5000); // 5秒間隔
      return () => clearInterval(interval);
    }
  }, [autoSync, filePath, checkFileStatus]);

  // WebViewからのメッセージを受信
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const message = event.data;
      if (message.nodeId === id) {
        switch (message.type) {
          case 'fileStatusUpdate':
            setSyncStatus(message.syncStatus);
            setLastModified(message.lastModified ? new Date(message.lastModified) : undefined);
            setFileSize(message.fileSize);
            if (message.previewContent) {
              setPreviewContent(message.previewContent);
            }
            break;
          case 'fileContentUpdate':
            setPreviewContent(message.content);
            setSyncStatus('synced');
            break;
        }
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('message', handleMessage);
      return () => window.removeEventListener('message', handleMessage);
    }
  }, [id]);

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
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span 
            title={getSyncStatusText()}
            style={{ fontSize: '10px' }}
          >
            {getSyncStatusIcon()}
          </span>
          <span 
            title={`参照タイプ: ${referenceType}`}
            style={{ fontSize: '10px', cursor: 'pointer' }}
            onClick={toggleReferenceType}
          >
            {getReferenceTypeIcon()}
          </span>
          <span style={{ 
            fontSize: '10px', 
            color: 'var(--text-muted)',
          }}>
            {fileType}
          </span>
        </div>
      </div>

      {/* ファイルパス入力 */}
      <div 
        style={{ padding: '12px', borderBottom: '1px solid var(--node-border)' }}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
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
              border: '2px dashed var(--input-border)',
              borderRadius: '4px',
              background: 'var(--input-background)',
              color: filePath ? 'var(--text-color)' : 'var(--text-muted)',
              fontSize: '12px',
              cursor: 'pointer',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              textAlign: 'center',
            }}
          >
            {filePath || 'ファイルをドラッグ&ドロップまたはクリック'}
          </div>
        )}
      </div>

      {/* ファイル情報 */}
      {fileName && (
        <div style={{ padding: '8px 12px', fontSize: '11px' }}>
          <div style={{ color: 'var(--text-color)', marginBottom: '4px' }}>
            <strong>ファイル名:</strong> {fileName}
          </div>
          {fileSize !== undefined && (
            <div style={{ color: 'var(--text-muted)', marginBottom: '4px' }}>
              <strong>サイズ:</strong> {fileSize < 1024 ? `${fileSize}B` : 
                fileSize < 1024 * 1024 ? `${Math.round(fileSize / 1024)}KB` : 
                `${Math.round(fileSize / (1024 * 1024))}MB`}
            </div>
          )}
          {lastModified && (
            <div style={{ color: 'var(--text-muted)', marginBottom: '4px' }}>
              <strong>更新:</strong> {lastModified.toLocaleString()}
            </div>
          )}
          <div style={{ color: 'var(--text-muted)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span><strong>同期:</strong> {getSyncStatusText()}</span>
            <button
              onClick={toggleAutoSync}
              style={{
                padding: '2px 6px',
                fontSize: '9px',
                border: '1px solid var(--button-border)',
                borderRadius: '3px',
                background: autoSync ? 'var(--success-color)' : 'var(--button-background)',
                color: autoSync ? 'white' : 'var(--button-text)',
                cursor: 'pointer',
              }}
            >
              {autoSync ? 'ON' : 'OFF'}
            </button>
          </div>
          {previewContent && (
            <div style={{ 
              color: 'var(--text-muted)',
              fontFamily: 'Monaco, "Cascadia Code", "Roboto Mono", monospace',
              maxHeight: '80px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              border: '1px solid var(--node-border)',
              borderRadius: '4px',
              padding: '6px',
              background: 'var(--code-background)',
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
          gap: '6px',
          borderTop: '1px solid var(--node-border)',
        }}
      >
        <button
          onClick={handleFileSelect}
          style={{
            flex: 1,
            padding: '4px 6px',
            fontSize: '9px',
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
            padding: '4px 6px',
            fontSize: '9px',
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
          onClick={checkFileStatus}
          disabled={!filePath}
          title="ファイル状態を再確認"
          style={{
            flex: 1,
            padding: '4px 6px',
            fontSize: '9px',
            border: '1px solid var(--button-border)',
            borderRadius: '4px',
            background: filePath ? 'var(--warning-color)' : 'var(--button-disabled)',
            color: filePath ? 'white' : 'var(--text-muted)',
            cursor: filePath ? 'pointer' : 'not-allowed',
          }}
        >
          同期
        </button>
        <button
          onClick={openFile}
          disabled={!filePath}
          style={{
            flex: 1,
            padding: '4px 6px',
            fontSize: '9px',
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