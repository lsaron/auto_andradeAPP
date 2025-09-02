-- Script para verificar el estado de las comisiones denegadas
-- Ejecutar después de denegar comisiones para verificar que se actualizaron correctamente

-- Verificar todas las comisiones del mecánico 4 para la quincena 2025-Q2
SELECT 
    cm.id,
    cm.id_trabajo,
    cm.id_mecanico,
    cm.monto_comision,
    cm.estado_comision,
    cm.quincena,
    cm.fecha_calculo,
    t.descripcion as descripcion_trabajo,
    t.fecha as fecha_trabajo
FROM comisiones_mecanicos cm
LEFT JOIN trabajos t ON cm.id_trabajo = t.id
WHERE cm.id_mecanico = 4 
    AND cm.quincena = '2025-Q2'
ORDER BY cm.id;

-- Verificar comisiones PENDIENTES con monto > 0 (deberían ser 0 después de denegar)
SELECT 
    COUNT(*) as total_comisiones_pendientes_con_monto,
    SUM(cm.monto_comision) as total_monto_pendiente
FROM comisiones_mecanicos cm
WHERE cm.id_mecanico = 4 
    AND cm.quincena = '2025-Q2'
    AND cm.estado_comision = 'PENDIENTE'
    AND cm.monto_comision > 0;

-- Verificar comisiones DENEGADAS (deberían tener monto = 0)
SELECT 
    COUNT(*) as total_comisiones_denegadas,
    SUM(cm.monto_comision) as total_monto_denegado
FROM comisiones_mecanicos cm
WHERE cm.id_mecanico = 4 
    AND cm.quincena = '2025-Q2'
    AND cm.estado_comision = 'DENEGADA';

-- Verificar todas las comisiones por estado
SELECT 
    cm.estado_comision,
    COUNT(*) as cantidad,
    SUM(cm.monto_comision) as total_monto
FROM comisiones_mecanicos cm
WHERE cm.id_mecanico = 4 
    AND cm.quincena = '2025-Q2'
GROUP BY cm.estado_comision
ORDER BY cm.estado_comision;

-- Verificar que no hay comisiones con estado inconsistente
SELECT 
    'COMISIONES CON MONTO > 0 Y ESTADO DENEGADA' as tipo_error,
    COUNT(*) as cantidad
FROM comisiones_mecanicos cm
WHERE cm.id_mecanico = 4 
    AND cm.quincena = '2025-Q2'
    AND cm.estado_comision = 'DENEGADA'
    AND cm.monto_comision > 0

UNION ALL

SELECT 
    'COMISIONES CON MONTO = 0 Y ESTADO PENDIENTE' as tipo_error,
    COUNT(*) as cantidad
FROM comisiones_mecanicos cm
WHERE cm.id_mecanico = 4 
    AND cm.quincena = '2025-Q2'
    AND cm.estado_comision = 'PENDIENTE'
    AND cm.monto_comision = 0;
