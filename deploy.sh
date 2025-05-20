#!/bin/bash

# 设置环境变量
export COMPOSE_PROJECT_NAME=qian_blog
export TZ=Asia/Shanghai

# 创建必要的目录
mkdir -p mysql/data mysql/conf mysql/init mysql/logs
mkdir -p nacos/logs nacos/data nacos/conf
mkdir -p redis/data redis/conf
mkdir -p tomcat/webapps tomcat/logs tomcat/conf
mkdir -p nginx/conf nginx/conf.d nginx/html nginx/logs nginx/ssl
mkdir -p portainer/data

# 停止并删除现有容器
docker-compose down

# 清理旧的构建缓存
docker system prune -f

# 重新构建并启动服务
docker-compose up -d --build

# 等待服务启动
echo "等待服务启动..."
sleep 10

# 检查服务状态
docker-compose ps

# 显示服务日志
echo "显示服务日志..."
docker-compose logs -f 