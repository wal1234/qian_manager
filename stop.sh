#!/bin/bash

# 停止所有服务
docker-compose down

# 清理未使用的容器、网络和镜像
docker system prune -f

echo "所有服务已停止并清理完成" 