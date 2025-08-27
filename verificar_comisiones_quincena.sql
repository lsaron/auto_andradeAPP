-- Script para verificar el estado de las comisiones y el campo quincena
SELECT 
    cm.id,
    cm.id_mecanico,
    m.nombre as nombre_mecanico,
    cm.id_trabajo,
    t.descripcion as trabajo_descripcion,
    cm.monto_comision,
    cm.estado_comision,
    cm.quincena,
    cm.mes_reporte,
    cm.fecha_calculo
FROM comisiones_mecanicos cm
JOIN mecanicos m ON cm.id_mecanico = m.id
JOIN trabajos t ON cm.id_trabajo = t.id
ORDER BY cm.id_mecanico, cm.fecha_calculo;

-- Verificar cuántas comisiones tienen quincena NULL
SELECT 
    COUNT(*) as total_comisiones,
    COUNT(CASE WHEN quincena IS NULL THEN 1 END) as sin_quincena,
    COUNT(CASE WHEN quincena IS NOT NULL THEN 1 END) as con_quincena
FROM comisiones_mecanicos;

-- Verificar el estado de las comisiones
SELECT 
    estado_comision,
    COUNT(*) as cantidad
FROM comisiones_mecanicos
GROUP BY estado_comision;
