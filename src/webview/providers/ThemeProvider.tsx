import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark' | 'high-contrast';

interface ThemeContextType {
    theme: Theme;
    setTheme: (theme: Theme) => void;
    isVSCodeTheme: boolean;
}

const ThemeContext = createContext<ThemeContextType>({
    theme: 'dark',
    setTheme: () => {},
    isVSCodeTheme: true,
});

export const useTheme = () => useContext(ThemeContext);

interface ThemeProviderProps {
    children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
    const [theme, setTheme] = useState<Theme>('dark');
    const [isVSCodeTheme, setIsVSCodeTheme] = useState(true);

    useEffect(() => {
        // VSCodeのテーマを検出
        const detectTheme = () => {
            const body = document.body;
            
            if (body.classList.contains('vscode-light')) {
                setTheme('light');
            } else if (body.classList.contains('vscode-high-contrast')) {
                setTheme('high-contrast');
            } else {
                // デフォルトはダークテーマ
                setTheme('dark');
            }
        };

        detectTheme();

        // MutationObserverでテーマ変更を監視
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                    detectTheme();
                }
            });
        });

        observer.observe(document.body, {
            attributes: true,
            attributeFilter: ['class']
        });

        return () => observer.disconnect();
    }, []);

    // テーマに応じたカスタムスタイルを適用
    useEffect(() => {
        const root = document.documentElement;
        
        // テーマ固有のカスタマイズ
        if (theme === 'high-contrast') {
            root.style.setProperty('--node-border-width', '2px');
            root.style.setProperty('--edge-width', '3px');
        } else {
            root.style.setProperty('--node-border-width', '1px');
            root.style.setProperty('--edge-width', '2px');
        }
    }, [theme]);

    return (
        <ThemeContext.Provider value={{ theme, setTheme, isVSCodeTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};