#!/bin/bash

# Ejemplos de CURL para probar el Sistema de Suscripciones
# Base URL: http://localhost:8080

echo "========================================="
echo "EJEMPLOS DE API - SISTEMA DE SUSCRIPCIONES"
echo "========================================="

# ========================
# 1. GESTIÓN DE PLANES
# ========================

echo ""
echo "1. CREAR UN NUEVO PLAN"
echo "POST /api/v1/plans"
curl -X POST http://localhost:8080/api/v1/plans \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Plan Starter",
    "description": "Plan básico para comenzar",
    "price": 9.99,
    "durationDays": 30
  }'

echo ""
echo ""
echo "2. OBTENER TODOS LOS PLANES ACTIVOS"
echo "GET /api/v1/plans/active"
curl -X GET http://localhost:8080/api/v1/plans/active \
  -H "Content-Type: application/json"

echo ""
echo ""
echo "3. OBTENER UN PLAN POR ID (ID=1)"
echo "GET /api/v1/plans/1"
curl -X GET http://localhost:8080/api/v1/plans/1 \
  -H "Content-Type: application/json"

echo ""
echo ""
echo "4. ACTUALIZAR UN PLAN (ID=1)"
echo "PUT /api/v1/plans/1"
curl -X PUT http://localhost:8080/api/v1/plans/1 \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Plan Starter Plus",
    "description": "Plan mejorado",
    "price": 14.99,
    "durationDays": 30
  }'

echo ""
echo ""
echo "5. CAMBIAR ESTADO DE UN PLAN (ID=1)"
echo "PATCH /api/v1/plans/1/toggle-status"
curl -X PATCH http://localhost:8080/api/v1/plans/1/toggle-status \
  -H "Content-Type: application/json"

# ========================
# 2. GESTIÓN DE SUSCRIPCIONES
# ========================

echo ""
echo ""
echo "========================================="
echo "SUSCRIPCIONES"
echo "========================================="

echo ""
echo "6. SUSCRIBIR USUARIO A UN PLAN"
echo "POST /api/v1/subscriptions/users/1/subscribe"
echo "Nota: Reemplaza el ID del usuario (1) con el ID real"
curl -X POST http://localhost:8080/api/v1/subscriptions/users/1/subscribe \
  -H "Content-Type: application/json" \
  -d '{
    "planId": 1,
    "isAutoRenew": false
  }'

echo ""
echo ""
echo "7. OBTENER SUSCRIPCIÓN ACTIVA DE UN USUARIO"
echo "GET /api/v1/subscriptions/users/1/active"
curl -X GET http://localhost:8080/api/v1/subscriptions/users/1/active \
  -H "Content-Type: application/json"

echo ""
echo ""
echo "8. OBTENER TODAS LAS SUSCRIPCIONES DE UN USUARIO"
echo "GET /api/v1/subscriptions/users/1"
curl -X GET http://localhost:8080/api/v1/subscriptions/users/1 \
  -H "Content-Type: application/json"

echo ""
echo ""
echo "9. OBTENER UNA SUSCRIPCIÓN POR ID (ID=1)"
echo "GET /api/v1/subscriptions/1"
curl -X GET http://localhost:8080/api/v1/subscriptions/1 \
  -H "Content-Type: application/json"

echo ""
echo ""
echo "10. CANCELAR UNA SUSCRIPCIÓN (ID=1)"
echo "PATCH /api/v1/subscriptions/1/cancel"
curl -X PATCH http://localhost:8080/api/v1/subscriptions/1/cancel \
  -H "Content-Type: application/json"

echo ""
echo ""
echo "11. RENOVAR UNA SUSCRIPCIÓN (ID=1)"
echo "POST /api/v1/subscriptions/1/renew"
curl -X POST http://localhost:8080/api/v1/subscriptions/1/renew \
  -H "Content-Type: application/json"

echo ""
echo ""
echo "12. CAMBIAR DE PLAN (SUSCRIPCIÓN 1 -> PLAN 2)"
echo "PATCH /api/v1/subscriptions/1/change-plan/2"
curl -X PATCH http://localhost:8080/api/v1/subscriptions/1/change-plan/2 \
  -H "Content-Type: application/json"

echo ""
echo ""
echo "13. OBTENER SUSCRIPCIONES POR ESTADO"
echo "GET /api/v1/subscriptions/status/ACTIVE"
curl -X GET http://localhost:8080/api/v1/subscriptions/status/ACTIVE \
  -H "Content-Type: application/json"

echo ""
echo ""
echo "14. OBTENER SUSCRIPCIONES CANCELADAS"
echo "GET /api/v1/subscriptions/status/CANCELLED"
curl -X GET http://localhost:8080/api/v1/subscriptions/status/CANCELLED \
  -H "Content-Type: application/json"

echo ""
echo ""
echo "========================================="
echo "FIN DE EJEMPLOS"
echo "========================================="
echo ""
echo "Notas:"
echo "- Reemplaza los IDs con valores reales"
echo "- Reemplaza http://localhost:8080 con tu URL base"
echo "- Los usuarios deben existir en la BD antes de suscribirse"
echo "- Los planes deben existir en la BD antes de suscribirse"
echo ""
