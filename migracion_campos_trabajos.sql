-- Script de migración para agregar campos de mano de obra y markup a la tabla trabajos
-- Auto Andrade - Sistema de Trabajos
-- Fecha: 2025-01-13

-- Seleccionar la base de datos
USE auto_andrade;

-- 1. Agregar campo mano_obra a la tabla trabajos
ALTER TABLE `trabajos` 
ADD COLUMN `mano_obra` DECIMAL(10,2) DEFAULT 0.00 COMMENT 'Monto de mano de obra del trabajo';

-- 2. Agregar campo markup_repuestos a la tabla trabajos
ALTER TABLE `trabajos` 
ADD COLUMN `markup_repuestos` DECIMAL(10,2) DEFAULT 0.00 COMMENT 'Markup aplicado a los repuestos';

-- 3. Agregar índices para optimizar consultas
CREATE INDEX `idx_trabajos_mano_obra` ON `trabajos` (`mano_obra`);
CREATE INDEX `idx_trabajos_markup_repuestos` ON `trabajos` (`markup_repuestos`);

-- 4. Verificar que los campos se agregaron correctamente
DESCRIBE `trabajos`;

-- 5. Comentarios sobre la nueva estructura:
-- - costo: Total cobrado al cliente (mano_obra + precios_cliente)
-- - mano_obra: Monto del trabajo en sí (sin repuestos)
-- - markup_repuestos: Ganancia por markup en repuestos
-- - total_gastos: Costo real de repuestos y materiales

-- 6. Ejemplo de uso:
-- Ganancia Base = mano_obra - total_gastos
-- Ganancia Neta = ganancia_base + markup_repuestos
-- Total Cobrado = mano_obra + (total_gastos + markup_repuestos)
