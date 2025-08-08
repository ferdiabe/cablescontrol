#!/bin/bash

set -e

echo "=========================================="
echo "DEPLOY SISTEMA CONTROLE CABOS - CADDY"
echo "=========================================="

# Verificar Docker Compose
if ! command -v docker-compose &> /dev/null; then
    echo "Instalando Docker Compose..."
    sudo apt update
    sudo apt install docker-compose -y
fi

# Verificar se Caddy está rodando
if ! docker ps | grep -q caddy; then
    echo "❌ Caddy não encontrado! Certifique-se que está rodando."
    exit 1
fi

echo "✅ Caddy encontrado"

# Criar rede se não existir
docker network create --driver bridge iot-network 2>/dev/null || echo "Rede já existe"

# Conectar Caddy à rede
docker network connect iot-network $(docker ps -q --filter "name=caddy") 2>/dev/null || echo "Caddy já conectado"

# Conectar outros containers
for container in $(docker ps -q --filter "name=node-red"); do
    docker network connect iot-network $container 2>/dev/null || true
done

for container in $(docker ps -q --filter "name=mosquitto"); do
    docker network connect iot-network $container 2>/dev/null || true
done

# Criar diretórios de dados
mkdir -p data/{backend,uploads,logs}

# Deploy dos containers
echo "Fazendo deploy dos containers..."
docker-compose down 2>/dev/null || true
docker-compose up -d --build

# Aguardar containers
echo "Aguardando containers ficarem prontos..."
sleep 30

# Verificar status
docker-compose ps

echo "=========================================="
echo "DEPLOY CONCLUÍDO!"
echo "=========================================="

PUBLIC_IP=$(curl -s ifconfig.me 2>/dev/null || echo "localhost")
echo "Acesse: http://$PUBLIC_IP/cabos"
