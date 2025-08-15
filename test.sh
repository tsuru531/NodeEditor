#!/bin/bash

# テスト用のBashスクリプト
echo "Hello, World!"

# 変数定義
NAME="NodeEditor"
VERSION="0.0.1"

# 条件分岐
if [ -n "$NAME" ]; then
    echo "Project: $NAME"
fi

# ループ
for i in 1 2 3; do
    echo "Count: $i"
done
