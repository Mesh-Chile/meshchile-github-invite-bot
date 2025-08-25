# Docker Configuration for MeshChile GitHub Bot

Este directorio contiene todos los archivos relacionados con Docker para el proyecto.

## 📁 Estructura

```
docker/
├── Dockerfile              # Imagen de producción optimizada
├── docker-compose.yml      # Producción (usa imagen del registry)
├── docker-compose.dev.yml  # Desarrollo (build local)
└── README.md              # Esta documentación
```

## 🚀 Uso Rápido

### Desarrollo (build local)
```bash
# Desde el root del proyecto
npm run docker:dev

# O manualmente desde este directorio
cd docker
docker-compose -f docker-compose.dev.yml up --build
```

### Producción (imagen del registry)
```bash
# Desde el root del proyecto
npm run docker:prod

# O manualmente desde este directorio
cd docker
docker-compose up -d
```

### Comandos útiles
```bash
# Ver logs
docker-compose logs -f

# Rebuild imagen de desarrollo
docker-compose -f docker-compose.dev.yml up --build --force-recreate

# Parar servicios
docker-compose down

# Parar y limpiar volúmenes
docker-compose down -v
```

## 🔧 Configuración

### Variables de entorno
Ambos compose files buscan el archivo `.env` en el directorio padre (`../.env`).

### Volúmenes
- `../logs:/app/logs` - Logs persistentes
- `..:/app` - Código fuente (solo en desarrollo)

### Puertos
- `3000:3000` - Puerto de la aplicación

## 🏗️ Build Process

### Desarrollo
- Usa `build: context: .. dockerfile: ./docker/Dockerfile`
- Monta el código fuente para hot reload
- `NODE_ENV=development`

### Producción
- Usa imagen pre-construida `ghcr.io/mesh-chile/meshchile-github-invite-bot:latest`
- Sin mount de código fuente
- `NODE_ENV=production`

## 📦 Imagen Docker

La imagen se construye automáticamente en GitHub Actions y se publica en:
- **Registry**: GitHub Container Registry (GHCR)
- **URL**: `ghcr.io/mesh-chile/meshchile-github-invite-bot`
- **Tags**: `latest`, `develop`, `v1.2.3`, etc.

## 🐛 Troubleshooting

### Error: Cannot find Dockerfile
- Verificar que estés en el directorio correcto
- El Dockerfile está en `./docker/Dockerfile` desde el root

### Error: .env not found
- El archivo `.env` debe estar en el root del proyecto
- Los compose files buscan `../.env`

### Error: Permission denied en logs
```bash
mkdir -p ../logs
chmod 755 ../logs
```

### Rebuild desde cero
```bash
docker-compose down -v
docker system prune -f
docker-compose up --build
```
