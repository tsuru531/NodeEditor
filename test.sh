#!/bin/bash
# NodeEditor動作確認用スクリプト

echo "NodeEditor Test Script"
echo "======================"

# 変数定義
NAME="NodeEditor"
VERSION="0.0.1"

# 条件分岐
if [ -z "$NAME" ]; then
    echo "名前が設定されていません"
else
    echo "プロジェクト: $NAME"
    echo "バージョン: $VERSION"
fi

# ループ処理
for i in 1 2 3; do
    echo "カウント: $i"
done

# パイプ処理
ls -la | grep "\.json" | head -5

# 関数定義
function greeting() {
    echo "Hello from $1!"
}

greeting "NodeEditor"
