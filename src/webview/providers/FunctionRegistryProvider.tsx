import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

// 関数定義の型
export interface FunctionDefinition {
  id: string;
  name: string;
  parameters: string[];
  body: string;
  language: string;
  description?: string;
  nodeId: string; // 定義ノードのID
}

// 関数レジストリのコンテキスト型
interface FunctionRegistryContextType {
  functions: Map<string, FunctionDefinition>;
  registerFunction: (definition: FunctionDefinition) => void;
  updateFunction: (name: string, updates: Partial<FunctionDefinition>) => void;
  removeFunction: (name: string) => void;
  getFunction: (name: string) => FunctionDefinition | undefined;
  getAllFunctions: () => FunctionDefinition[];
  isFunctionNameAvailable: (name: string, excludeId?: string) => boolean;
}

// コンテキストの作成
const FunctionRegistryContext = createContext<FunctionRegistryContextType | null>(null);

// プロバイダーのプロパティ
interface FunctionRegistryProviderProps {
  children: ReactNode;
}

// 関数レジストリプロバイダー
export const FunctionRegistryProvider: React.FC<FunctionRegistryProviderProps> = ({ children }) => {
  const [functions, setFunctions] = useState<Map<string, FunctionDefinition>>(new Map());

  // 関数を登録
  const registerFunction = useCallback((definition: FunctionDefinition) => {
    setFunctions(prev => {
      const newMap = new Map(prev);
      newMap.set(definition.name, definition);
      console.log(`Function registered: ${definition.name}`, definition);
      return newMap;
    });
  }, []);

  // 関数を更新
  const updateFunction = useCallback((name: string, updates: Partial<FunctionDefinition>) => {
    setFunctions(prev => {
      const newMap = new Map(prev);
      const existing = newMap.get(name);
      if (existing) {
        const updated = { ...existing, ...updates };
        
        // 名前が変更された場合は古いキーを削除して新しいキーで登録
        if (updates.name && updates.name !== name) {
          newMap.delete(name);
          newMap.set(updates.name, updated);
          console.log(`Function renamed: ${name} -> ${updates.name}`, updated);
        } else {
          newMap.set(name, updated);
          console.log(`Function updated: ${name}`, updated);
        }
      }
      return newMap;
    });
  }, []);

  // 関数を削除
  const removeFunction = useCallback((name: string) => {
    setFunctions(prev => {
      const newMap = new Map(prev);
      if (newMap.delete(name)) {
        console.log(`Function removed: ${name}`);
      }
      return newMap;
    });
  }, []);

  // 関数を取得
  const getFunction = useCallback((name: string): FunctionDefinition | undefined => {
    return functions.get(name);
  }, [functions]);

  // すべての関数を取得
  const getAllFunctions = useCallback((): FunctionDefinition[] => {
    return Array.from(functions.values());
  }, [functions]);

  // 関数名が利用可能かチェック
  const isFunctionNameAvailable = useCallback((name: string, excludeId?: string): boolean => {
    const existing = functions.get(name);
    if (!existing) return true;
    if (excludeId && existing.nodeId === excludeId) return true;
    return false;
  }, [functions]);

  const value: FunctionRegistryContextType = {
    functions,
    registerFunction,
    updateFunction,
    removeFunction,
    getFunction,
    getAllFunctions,
    isFunctionNameAvailable
  };

  return (
    <FunctionRegistryContext.Provider value={value}>
      {children}
    </FunctionRegistryContext.Provider>
  );
};

// カスタムフック
export const useFunctionRegistry = (): FunctionRegistryContextType => {
  const context = useContext(FunctionRegistryContext);
  if (!context) {
    throw new Error('useFunctionRegistry must be used within a FunctionRegistryProvider');
  }
  return context;
};

// 関数定義ノード用のカスタムフック
export const useFunctionDefinition = (nodeId: string) => {
  const registry = useFunctionRegistry();
  
  const registerDefinition = useCallback((definition: Omit<FunctionDefinition, 'nodeId'>) => {
    registry.registerFunction({ ...definition, nodeId });
  }, [registry, nodeId]);

  const updateDefinition = useCallback((name: string, updates: Partial<FunctionDefinition>) => {
    registry.updateFunction(name, updates);
  }, [registry]);

  const removeDefinition = useCallback((name: string) => {
    registry.removeFunction(name);
  }, [registry]);

  return {
    registerDefinition,
    updateDefinition,
    removeDefinition,
    isFunctionNameAvailable: registry.isFunctionNameAvailable,
    getAllFunctions: registry.getAllFunctions
  };
};

// 関数呼び出しノード用のカスタムフック
export const useFunctionCall = () => {
  const registry = useFunctionRegistry();
  
  return {
    getFunction: registry.getFunction,
    getAllFunctions: registry.getAllFunctions
  };
};