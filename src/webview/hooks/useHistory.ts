import { useCallback, useRef, useState } from 'react';
import { Node, Edge } from 'reactflow';

interface HistoryState {
  nodes: Node[];
  edges: Edge[];
}

interface UseHistoryReturn {
  canUndo: boolean;
  canRedo: boolean;
  undo: () => HistoryState | null;
  redo: () => HistoryState | null;
  pushState: (nodes: Node[], edges: Edge[]) => void;
  clear: () => void;
}

export const useHistory = (maxHistorySize: number = 50): UseHistoryReturn => {
  const [historyIndex, setHistoryIndex] = useState(-1);
  const history = useRef<HistoryState[]>([]);

  const pushState = useCallback((nodes: Node[], edges: Edge[]) => {
    const newState: HistoryState = {
      nodes: JSON.parse(JSON.stringify(nodes)),
      edges: JSON.parse(JSON.stringify(edges))
    };

    // 現在のインデックス以降の履歴をクリア
    if (historyIndex < history.current.length - 1) {
      history.current = history.current.slice(0, historyIndex + 1);
    }

    // 新しい状態を追加
    history.current.push(newState);

    // 最大サイズを超えた場合、古い履歴を削除
    if (history.current.length > maxHistorySize) {
      history.current = history.current.slice(1);
    } else {
      setHistoryIndex(prev => prev + 1);
    }
  }, [historyIndex, maxHistorySize]);

  const undo = useCallback((): HistoryState | null => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      return JSON.parse(JSON.stringify(history.current[newIndex]));
    }
    return null;
  }, [historyIndex]);

  const redo = useCallback((): HistoryState | null => {
    if (historyIndex < history.current.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      return JSON.parse(JSON.stringify(history.current[newIndex]));
    }
    return null;
  }, [historyIndex]);

  const clear = useCallback(() => {
    history.current = [];
    setHistoryIndex(-1);
  }, []);

  return {
    canUndo: historyIndex > 0,
    canRedo: historyIndex < history.current.length - 1,
    undo,
    redo,
    pushState,
    clear
  };
};