-- Vaciar datos de las tablas relacionadas con planes y suscripciones
-- Manteniendo la estructura de las tablas intacta

-- Deshabilitar temporalmente las verificaciones de claves foráneas
SET FOREIGN_KEY_CHECKS = 0;

-- Vaciar tablas intermedias primero (relaciones many-to-many)
DELETE FROM subscription_modules;
DELETE FROM plans_modules;
DELETE FROM plan_module;

-- Vaciar tablas principales
DELETE FROM subscriptions;
DELETE FROM plans;
DELETE FROM subscription;
DELETE FROM plan;
DELETE FROM module;

-- Reestablecer las verificaciones de claves foráneas
SET FOREIGN_KEY_CHECKS = 1;
