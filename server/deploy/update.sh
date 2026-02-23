#!/bin/bash
# ============================================
# Le 19e — Mise à jour du serveur
# À lancer depuis la Freebox après avoir copié les nouveaux fichiers
# ============================================

set -e

cd /opt/le-19e

echo "=== Mise à jour du serveur Le 19e ==="

echo "[1/3] Installation des dépendances..."
npm install --production

echo "[2/3] Build TypeScript..."
npm run build

echo "[3/3] Redémarrage du service..."
sudo systemctl restart le-19e

echo ""
echo "=== Serveur mis à jour et redémarré ==="
sudo systemctl status le-19e --no-pager
