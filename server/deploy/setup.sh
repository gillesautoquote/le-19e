#!/bin/bash
# ============================================
# Le 19e — Setup serveur Freebox Delta
# À exécuter UNE SEULE FOIS sur la VM Debian ARM64
# ============================================

set -e

echo "=== Le 19e — Installation serveur ==="
echo ""

# 1. Mise à jour système
echo "[1/4] Mise à jour système..."
sudo apt update && sudo apt upgrade -y

# 2. Installer Node.js 20 LTS
echo "[2/4] Installation de Node.js 20..."
if command -v node &> /dev/null; then
  echo "  Node.js déjà installé: $(node -v)"
else
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo bash -
  sudo apt install -y nodejs
  echo "  Node.js installé: $(node -v)"
fi

# 3. Installer git
echo "[3/4] Installation de git..."
sudo apt install -y git

# 4. Créer le dossier et cloner
echo "[4/4] Préparation du dossier..."
sudo mkdir -p /opt/le-19e
sudo chown "$USER:$USER" /opt/le-19e

echo ""
echo "=== Installation terminée ==="
echo ""
echo "Prochaine étape : copie les fichiers du serveur."
echo "Depuis ton Mac, lance :"
echo ""
echo "  scp -r le-19e/server/* user@IP_FREEBOX:/opt/le-19e/"
echo ""
echo "Puis reviens ici et lance :"
echo ""
echo "  cd /opt/le-19e && npm install && npm run build"
echo ""
