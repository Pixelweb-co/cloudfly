#!/bin/bash
# ============================================
# Cloudfly - Deploy / Redeploy Script
# Uso:
#   ./deploy.sh          -> Pull + rebuild + restart
#   ./deploy.sh rollback -> Volver al commit anterior
#   ./deploy.sh status   -> Ver estado de servicios
#   ./deploy.sh logs     -> Ver logs en tiempo real
# ============================================
set -e

APP_DIR="/apps/cloudfly"
BRANCH="main"
COMPOSE_FILE="docker-compose-full-vps.yml"

cd "$APP_DIR"

case "${1:-deploy}" in
  deploy)
    echo "=============================="
    echo "   CLOUDFLY - DEPLOY"
    echo "=============================="

    # Guardar commit actual por si necesitamos rollback
    CURRENT_COMMIT=$(git rev-parse HEAD)
    echo "$CURRENT_COMMIT" > .last_good_commit

    # Pull cambios
    echo "Descargando cambios de $BRANCH..."
    git fetch origin
    git checkout $BRANCH
    git pull origin $BRANCH
    NEW_COMMIT=$(git rev-parse HEAD)

    if [ "$CURRENT_COMMIT" = "$NEW_COMMIT" ]; then
      echo "Ya estas en la ultima version ($NEW_COMMIT)"
      echo "Reconstruyendo de todas formas..."
    else
      echo "Cambios: $CURRENT_COMMIT -> $NEW_COMMIT"
    fi

    # Rebuild y restart
    echo "Construyendo imagenes..."
    docker compose -f $COMPOSE_FILE build --no-cache

    echo "Reiniciando servicios..."
    docker compose -f $COMPOSE_FILE up -d

    # Limpiar imagenes no usadas
    echo "Limpiando imagenes antiguas..."
    docker image prune -f

    echo ""
    echo "Deploy completado!"
    echo "Estado:"
    docker compose -f $COMPOSE_FILE ps
    ;;

  rollback)
    echo "=============================="
    echo "   CLOUDFLY - ROLLBACK"
    echo "=============================="

    if [ -f .last_good_commit ]; then
      LAST_COMMIT=$(cat .last_good_commit)
      echo "Volviendo a commit: $LAST_COMMIT"
      git checkout $LAST_COMMIT

      docker compose -f $COMPOSE_FILE build --no-cache
      docker compose -f $COMPOSE_FILE up -d

      echo "Rollback completado a $LAST_COMMIT"
    else
      echo "No hay commit anterior para rollback"
      exit 1
    fi
    ;;

  status)
    echo "Estado de los servicios:"
    docker compose -f $COMPOSE_FILE ps
    echo ""
    echo "Uso de recursos:"
    docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}"
    ;;

  logs)
    docker compose -f $COMPOSE_FILE logs -f --tail=100
    ;;

  restart)
    echo "Reiniciando todos los servicios..."
    docker compose -f $COMPOSE_FILE restart
    echo "Servicios reiniciados"
    ;;

  stop)
    echo "Deteniendo todos los servicios..."
    docker compose -f $COMPOSE_FILE down
    echo "Servicios detenidos"
    ;;

  *)
    echo "Uso: ./deploy.sh [deploy|rollback|status|logs|restart|stop]"
    ;;
esac

