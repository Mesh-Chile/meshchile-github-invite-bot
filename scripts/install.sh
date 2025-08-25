# =====================================
# SCRIPT DE INSTALACIÓN RÁPIDA
# =====================================
#!/bin/bash
# install.sh - Script de instalación rápida

echo "🚀 Instalando MeshChile GitHub Bot..."

# Verificar Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js no está instalado. Instalarlo desde https://nodejs.org/"
    exit 1
fi

# Instalar dependencias
echo "📦 Instalando dependencias..."
npm install

# Crear archivo .env si no existe
if [ ! -f .env ]; then
    echo "📝 Creando archivo .env..."
    cat > .env << 'EOL'
# Configurar estos valores:
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxx
GITHUB_ORG=Mesh-Chile
COMMUNITY_TEAM=comunidad
COLLABORATORS_TEAM=colaboradores
RECAPTCHA_SECRET_KEY=6LcXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
RECAPTCHA_SITE_KEY=6LcYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYY
ADMIN_KEY=cambiar_esta_clave_123
GITHUB_WEBHOOK_SECRET=webhook_secret_123
WELCOME_REPO=bienvenidos
PORT=3000
NODE_ENV=development
EOL
    echo "⚠️  Configura las variables en .env antes de ejecutar"
fi

# Crear directorio public si no existe
mkdir -p public

echo "✅ Instalación completa!"
echo ""
echo "Próximos pasos:"
echo "1. Configurar variables en .env"
echo "2. Poner index.html en carpeta public/"
echo "3. npm run dev"