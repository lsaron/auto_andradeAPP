-- Script simple para limpiar las tablas principales
-- Solo elimina datos, mantiene la secuencia de IDs

-- Limpiar tabla de trabajos (orden de trabajo)
DELETE FROM trabajos;

-- Limpiar tabla de detalles de gastos
DELETE FROM detalles_gastos;

-- Limpiar tabla de gastos del taller
DELETE FROM gastos_taller;

-- Limpiar tabla de trabajos de mecánicos
DELETE FROM trabajos_mecanicos;

-- Limpiar tabla de comisiones de mecánicos
DELETE FROM comisiones_mecanicos;

-- Limpiar tabla de historial de dueños
DELETE FROM historial_duenos;

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
