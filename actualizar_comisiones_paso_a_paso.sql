-- Script paso a paso para actualizar comisiones por quincena
-- Este script corrige el sistema de comisiones para usar 2 quincenas por mes

-- ========================================
-- PASO 1: Verificar estado actual de las comisiones
-- ========================================
SELECT 
    'Estado actual de comisiones' as info,
    COUNT(*) as total_comisiones,
    COUNT(CASE WHEN estado_comision IS NOT NULL THEN 1 END) as con_estado,
    COUNT(CASE WHEN quincena IS NOT NULL THEN 1 END) as con_quincena,
    COUNT(CASE WHEN estado_comision IS NOT NULL AND quincena IS NOT NULL THEN 1 END) as completas
FROM comisiones_mecanicos;

-- ========================================
-- PASO 2: Mostrar distribución actual por estado
-- ========================================
SELECT 
    'Distribución por estado' as info,
    estado_comision,
    COUNT(*) as cantidad,
    SUM(monto_comision) as total_monto
FROM comisiones_mecanicos 
GROUP BY estado_comision;

-- ========================================
-- PASO 3: Mostrar distribución actual por quincena
-- ========================================
SELECT 
    'Distribución por quincena' as info,
    quincena,
    COUNT(*) as cantidad,
    SUM(monto_comision) as total_monto
FROM comisiones_mecanicos 
GROUP BY quincena
ORDER BY quincena;

-- ========================================
-- PASO 4: Actualizar comisiones existentes con estado por defecto
-- ========================================
UPDATE comisiones_mecanicos 
SET estado_comision = 'PENDIENTE'
WHERE estado_comision IS NULL;

-- ========================================
-- PASO 5: Calcular y asignar quincenas basándose en fecha_calculo
-- Sistema: Q1 = Semanas 1-2 (días 1-15), Q2 = Semanas 3-4 (días 16-31)
-- ========================================
UPDATE comisiones_mecanicos 
SET quincena = CASE 
    WHEN DAY(fecha_calculo) <= 15 THEN 
        CONCAT(YEAR(fecha_calculo), '-Q1')
    ELSE 
        CONCAT(YEAR(fecha_calculo), '-Q2')
    END
WHERE quincena IS NULL;

-- ========================================
-- PASO 6: Verificar que todas las comisiones tengan estado y quincena
-- ========================================
SELECT 
    'Verificación post-actualización' as info,
    COUNT(*) as total_comisiones,
    COUNT(CASE WHEN estado_comision IS NOT NULL THEN 1 END) as con_estado,
    COUNT(CASE WHEN quincena IS NOT NULL THEN 1 END) as con_quincena,
    COUNT(CASE WHEN estado_comision IS NOT NULL AND quincena IS NOT NULL THEN 1 END) as completas
FROM comisiones_mecanicos;

-- ========================================
-- PASO 7: Mostrar distribución final por estado
-- ========================================
SELECT 
    'Distribución final por estado' as info,
    estado_comision,
    COUNT(*) as cantidad,
    SUM(monto_comision) as total_monto
FROM comisiones_mecanicos 
GROUP BY estado_comision;

-- ========================================
-- PASO 8: Mostrar distribución final por quincena
-- ========================================
SELECT 
    'Distribución final por quincena' as info,
    quincena,
    COUNT(*) as cantidad,
    SUM(monto_comision) as total_monto
FROM comisiones_mecanicos 
GROUP BY quincena
ORDER BY quincena;

-- ========================================
-- PASO 9: Verificar integridad de datos
-- ========================================
SELECT 
    'Verificación de integridad' as info,
    'Comisiones sin estado' as problema,
    COUNT(*) as cantidad
FROM comisiones_mecanicos 
WHERE estado_comision IS NULL

UNION ALL

SELECT 
    'Verificación de integridad' as info,
    'Comisiones sin quincena' as problema,
    COUNT(*) as cantidad
FROM comisiones_mecanicos 
WHERE quincena IS NULL

UNION ALL

SELECT 
    'Verificación de integridad' as info,
    'Comisiones con estado inválido' as problema,
    COUNT(*) as cantidad
FROM comisiones_mecanicos 
WHERE estado_comision NOT IN ('PENDIENTE', 'APROBADA', 'PENALIZADA');

-- ========================================
-- PASO 10: Mostrar comisiones por mecánico y quincena
-- ========================================
SELECT 
    m.nombre as mecanico,
    cm.quincena,
    cm.estado_comision,
    COUNT(*) as cantidad_comisiones,
    SUM(cm.monto_comision) as total_comisiones
FROM comisiones_mecanicos cm
JOIN mecanicos m ON cm.id_mecanico = m.id
GROUP BY m.nombre, cm.quincena, cm.estado_comision
ORDER BY m.nombre, cm.quincena, cm.estado_comision;

-- ========================================
-- PASO 11: Mostrar resumen de comisiones pendientes por quincena
-- ========================================
SELECT 
    'Comisiones pendientes por quincena' as info,
    quincena,
    COUNT(*) as cantidad_pendientes,
    SUM(monto_comision) as total_pendiente
FROM comisiones_mecanicos 
WHERE estado_comision = 'PENDIENTE'
GROUP BY quincena
ORDER BY quincena;
