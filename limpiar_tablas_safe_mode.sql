-- Script para limpiar las tablas principales del sistema
-- Compatible con Safe Update Mode activado

-- Deshabilitar Safe Update Mode temporalmente
SET SQL_SAFE_UPDATES = 0;

-- Limpiar tabla de trabajos (orden de trabajo)
DELETE FROM trabajos;
-- Resetear el auto-incremento si existe
ALTER TABLE trabajos AUTO_INCREMENT = 1;

-- Limpiar tabla de detalles de gastos
DELETE FROM detalles_gastos;
-- Resetear el auto-incremento si existe
ALTER TABLE detalles_gastos AUTO_INCREMENT = 1;

-- Limpiar tabla de gastos del taller
DELETE FROM gastos_taller;
-- Resetear el auto-incremento si existe
ALTER TABLE gastos_taller AUTO_INCREMENT = 1;

-- Limpiar tabla de trabajos de mecánicos
DELETE FROM trabajos_mecanicos;
-- Resetear el auto-incremento si existe
ALTER TABLE trabajos_mecanicos AUTO_INCREMENT = 1;

-- Limpiar tabla de comisiones de mecánicos
DELETE FROM comisiones_mecanicos;
-- Resetear el auto-incremento si existe
ALTER TABLE comisiones_mecanicos AUTO_INCREMENT = 1;

-- Limpiar tabla de historial de dueños
DELETE FROM historial_duenos;
-- Resetear el auto-incremento si existe
ALTER TABLE historial_duenos AUTO_INCREMENT = 1;

-- Rehabilitar Safe Update Mode
SET SQL_SAFE_UPDATES = 1;

-- Verificar que las tablas estén vacías
SELECT 'trabajos' as tabla, COUNT(*) as registros FROM trabajos
UNION ALL
SELECT 'detalles_gastos' as tabla, COUNT(*) as registros FROM detalles_gastos
UNION ALL
SELECT 'gastos_taller' as tabla, COUNT(*) as registros FROM gastos_taller
UNION ALL
SELECT 'trabajos_mecanicos' as tabla, COUNT(*) as registros FROM trabajos_mecanicos
UNION ALL
SELECT 'comisiones_mecanicos' as tabla, COUNT(*) as registros FROM comisiones_mecanicos
UNION ALL
SELECT 'historial_duenos' as tabla, COUNT(*) as registros FROM historial_duenos;

-- Mensaje de confirmación
SELECT 'TABLAS LIMPIADAS EXITOSAMENTE' as mensaje;
