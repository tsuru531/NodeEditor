const path = require('path');

module.exports = [
    // 拡張機能本体のビルド設定
    {
        target: 'node',
        mode: 'development',
        entry: './src/extension/extension.ts',
        output: {
            path: path.resolve(__dirname, 'out', 'extension'),
            filename: 'extension.js',
            libraryTarget: 'commonjs2'
        },
        externals: {
            vscode: 'commonjs vscode'
        },
        resolve: {
            extensions: ['.ts', '.js']
        },
        module: {
            rules: [
                {
                    test: /\.ts$/,
                    exclude: [/node_modules/, /src\/webview/],
                    use: {
                        loader: 'ts-loader',
                        options: {
                            configFile: 'tsconfig.json'
                        }
                    }
                }
            ]
        },
        devtool: 'source-map'
    },
    // WebViewのビルド設定
    {
        target: 'web',
        mode: 'development',
        entry: './src/webview/App.tsx',
        output: {
            path: path.resolve(__dirname, 'out', 'webview'),
            filename: 'index.js'
        },
        resolve: {
            extensions: ['.ts', '.tsx', '.js', '.jsx', '.css']
        },
        module: {
            rules: [
                {
                    test: /\.tsx?$/,
                    exclude: /node_modules/,
                    use: {
                        loader: 'ts-loader',
                        options: {
                            configFile: 'tsconfig.webview.json',
                            transpileOnly: true
                        }
                    }
                },
                {
                    test: /\.css$/,
                    use: ['style-loader', 'css-loader']
                }
            ]
        },
        devtool: 'source-map'
    }
];