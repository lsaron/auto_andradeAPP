-- ========================================
-- Script para limpiar datos de las tablas relacionadas
-- ========================================
-- IMPORTANTE: Este script eliminará TODOS los datos de las tablas especificadas
-- Asegúrate de hacer un backup antes de ejecutar este script

-- Deshabilitar verificación de claves foráneas temporalmente
SET FOREIGN_KEY_CHECKS = 0;

-- Deshabilitar modo safe update
SET SQL_SAFE_UPDATES = 0;

-- ========================================
-- 1. LIMPIAR TABLAS DEPENDIENTES PRIMERO
-- ========================================

-- Limpiar detalles de gastos (depende de trabajos)
DELETE FROM detalles_gastos;
SELECT 'Detalles de gastos limpiados' as status;

-- Limpiar comisiones de mecánicos (depende de trabajos y mecánicos)
DELETE FROM comisiones_mecanicos;
SELECT 'Comisiones de mecánicos limpiadas' as status;

-- Limpiar trabajos_mecanicos (depende de trabajos y mecánicos)
DELETE FROM trabajos_mecanicos;
SELECT 'Trabajos_mecanicos limpiados' as status;

-- Limpiar pagos de salarios (depende de mecánicos)
DELETE FROM pagos_salarios;
SELECT 'Pagos de salarios limpiados' as status;

-- ========================================
-- 2. LIMPIAR TABLAS PRINCIPALES
-- ========================================

-- Limpiar trabajos (tabla principal)
DELETE FROM trabajos;
SELECT 'Trabajos limpiados' as status;

-- ========================================
-- 3. OPCIONAL: LIMPIAR MECÁNICOS
-- ========================================
-- Descomenta la siguiente línea si también quieres limpiar los mecánicos
-- DELETE FROM mecanicos;
-- SELECT 'Mecánicos limpiados' as status;

-- ========================================
-- 4. REINICIAR AUTO_INCREMENT
-- ========================================

-- Reiniciar los contadores de auto_increment
ALTER TABLE detalles_gastos AUTO_INCREMENT = 1;
ALTER TABLE comisiones_mecanicos AUTO_INCREMENT = 1;
ALTER TABLE trabajos_mecanicos AUTO_INCREMENT = 1;
ALTER TABLE pagos_salarios AUTO_INCREMENT = 1;
ALTER TABLE trabajos AUTO_INCREMENT = 1;
-- ALTER TABLE mecanicos AUTO_INCREMENT = 1; -- Descomenta si limpiaste mecánicos

SELECT 'Contadores de auto_increment reiniciados' as status;

-- ========================================
-- 5. VERIFICAR LIMPIEZA
-- ========================================

-- Verificar que las tablas están vacías
SELECT 
    'detalles_gastos' as tabla, COUNT(*) as registros FROM detalles_gastos
UNION ALL
SELECT 
    'comisiones_mecanicos' as tabla, COUNT(*) as registros FROM comisiones_mecanicos
UNION ALL
SELECT 
    'trabajos_mecanicos' as tabla, COUNT(*) as registros FROM trabajos_mecanicos
UNION ALL
SELECT 
    'pagos_salarios' as tabla, COUNT(*) as registros FROM pagos_salarios
UNION ALL
SELECT 
    'trabajos' as tabla, COUNT(*) as registros FROM trabajos;

-- Rehabilitar verificación de claves foráneas
SET FOREIGN_KEY_CHECKS = 1;

-- Rehabilitar modo safe update
SET SQL_SAFE_UPDATES = 1;

SELECT 'Verificación de claves foráneas y modo safe update reabilitados' as status;

-- ========================================
-- Script completado
-- ========================================
SELECT 'Limpieza de datos completada exitosamente' as resultado;
