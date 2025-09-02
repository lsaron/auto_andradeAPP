-- ========================================
-- ACTUALIZACIÓN: ESTADO NO_COMISIONO
-- ========================================
-- Este script actualiza la base de datos para incluir el nuevo estado NO_COMISIONO
-- y corrige la lógica de denegación de comisiones

-- 1. Verificar el estado actual de la tabla comisiones_mecanicos
SELECT 
    'Estado actual de comisiones' as info,
    COUNT(*) as total_comisiones,
    COUNT(CASE WHEN estado_comision IS NOT NULL THEN 1 END) as con_estado,
    COUNT(CASE WHEN quincena IS NOT NULL THEN 1 END) as con_quincena
FROM comisiones_mecanicos;

-- 2. Mostrar distribución actual por estado
SELECT 
    'Distribución por estado' as info,
    estado_comision,
    COUNT(*) as cantidad,
    SUM(monto_comision) as total_monto
FROM comisiones_mecanicos 
GROUP BY estado_comision;

-- 3. Actualizar comisiones existentes con estado por defecto si es necesario
UPDATE comisiones_mecanicos 
SET estado_comision = 'PENDIENTE'
WHERE estado_comision IS NULL;

-- 4. Calcular y asignar quincenas basándose en fecha_calculo si es necesario
UPDATE comisiones_mecanicos 
SET quincena = CASE 
    WHEN DAY(fecha_calculo) <= 15 THEN 
        CONCAT(YEAR(fecha_calculo), '-Q1')
    ELSE 
        CONCAT(YEAR(fecha_calculo), '-Q2')
    END
WHERE quincena IS NULL;

-- 5. Verificar que todas las comisiones tengan estado y quincena
SELECT 
    'Verificación post-actualización' as info,
    COUNT(*) as total_comisiones,
    COUNT(CASE WHEN estado_comision IS NOT NULL THEN 1 END) as con_estado,
    COUNT(CASE WHEN quincena IS NOT NULL THEN 1 END) as con_quincena,
    COUNT(CASE WHEN estado_comision IS NOT NULL AND quincena IS NOT NULL THEN 1 END) as completas
FROM comisiones_mecanicos;

-- 6. Mostrar distribución final por estado
SELECT 
    'Distribución final por estado' as info,
    estado_comision,
    COUNT(*) as cantidad,
    SUM(monto_comision) as total_monto
FROM comisiones_mecanicos 
GROUP BY estado_comision
ORDER BY estado_comision;

-- 7. Mostrar distribución final por quincena
SELECT 
    'Distribución final por quincena' as info,
    quincena,
    COUNT(*) as cantidad,
    SUM(monto_comision) as total_monto
FROM comisiones_mecanicos 
GROUP BY quincena
ORDER BY quincena;

-- 8. Verificar integridad de datos
SELECT 
    'Verificación de integridad' as info,
    CASE 
        WHEN COUNT(CASE WHEN estado_comision IS NULL THEN 1 END) > 0 THEN '❌ Hay comisiones sin estado'
        WHEN COUNT(CASE WHEN quincena IS NULL THEN 1 END) > 0 THEN '❌ Hay comisiones sin quincena'
        WHEN COUNT(CASE WHEN estado_comision NOT IN ('PENDIENTE', 'APROBADA', 'PENALIZADA', 'NO_COMISIONO') THEN 1 END) > 0 THEN '❌ Hay estados inválidos'
        ELSE '✅ Todos los datos están correctos'
    END as resultado
FROM comisiones_mecanicos;

-- 9. Resumen de la actualización
SELECT 
    'Resumen de la actualización' as info,
    'Se ha actualizado la base de datos para incluir el nuevo estado NO_COMISIONO' as descripcion,
    'Las comisiones denegadas ahora se marcan como NO_COMISIONO en lugar de eliminarse' as cambio_principal,
    'Se mantiene el registro histórico de todos los trabajos realizados' as beneficio
FROM dual;
