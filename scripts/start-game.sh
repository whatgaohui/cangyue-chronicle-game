#!/bin/bash
# 启动游戏开发服务器
# 用法: ./scripts/start-game.sh
cd "$(dirname "$0")/.."
exec npx next dev -p 3000
