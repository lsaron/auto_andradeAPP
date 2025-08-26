-- ========================================
-- MIGRACIÓN: ESTADOS DE COMISIONES
-- ========================================
-- Este script actualiza las comisiones existentes para incluir
-- los nuevos campos de estado y quincena

-- 1. Actualizar comisiones existentes con estado por defecto
UPDATE `comisiones_mecanicos` 
SET `estado_comision` = 'APROBADA'
WHERE `estado_comision` IS NULL;

-- 2. Calcular y asignar quincenas basándose en fecha_calculo
UPDATE `comisiones_mecanicos` 
SET `quincena` = CASE 
    WHEN DAY(fecha_calculo) <= 15 THEN 
        CONCAT(YEAR(fecha_calculo), '-Q1')
    ELSE 
        CONCAT(YEAR(fecha_calculo), '-Q2')
    END
WHERE `quincena` IS NULL;

-- 3. Verificar que todas las comisiones tengan estado y quincena
SELECT 
    COUNT(*) as total_comisiones,
    COUNT(CASE WHEN estado_comision IS NOT NULL THEN 1 END) as con_estado,
    COUNT(CASE WHEN quincena IS NOT NULL THEN 1 END) as con_quincena,
    COUNT(CASE WHEN estado_comision IS NOT NULL AND quincena IS NOT NULL THEN 1 END) as completas
FROM `comisiones_mecanicos`;

-- 4. Mostrar distribución por estado
SELECT 
    estado_comision,
    COUNT(*) as cantidad,
    SUM(monto_comision) as total_monto
FROM `comisiones_mecanicos` 
GROUP BY estado_comision;

-- 5. Mostrar distribución por quincena
SELECT 
    quincena,
    COUNT(*) as cantidad,
    SUM(monto_comision) as total_monto
FROM `comisiones_mecanicos` 
GROUP BY quincena
ORDER BY quincena;

-- 6. Verificar integridad de datos
SELECT 
    'Comisiones sin estado' as problema,
    COUNT(*) as cantidad
FROM `comisiones_mecanicos` 
WHERE estado_comision IS NULL

UNION ALL

SELECT 
    'Comisiones sin quincena' as problema,
    COUNT(*) as cantidad
FROM `comisiones_mecanicos` 
WHERE quincena IS NULL

UNION ALL

SELECT 
    'Comisiones con estado inválido' as problema,
    COUNT(*) as cantidad
FROM `comisiones_mecanicos` 
WHERE estado_comision NOT IN ('PENDIENTE', 'APROBADA', 'PENALIZADA');
