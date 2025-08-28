-- Script para verificar el estado actual de las comisiones
-- Ejecutar este script primero para ver qué tenemos en la BD

-- 1. Verificar estructura de la tabla comisiones_mecanicos
DESCRIBE comisiones_mecanicos;

-- 2. Verificar si existen comisiones
SELECT 
    COUNT(*) as total_comisiones,
    COUNT(CASE WHEN estado_comision IS NOT NULL THEN 1 END) as con_estado,
    COUNT(CASE WHEN quincena IS NOT NULL THEN 1 END) as con_quincena
FROM comisiones_mecanicos;

-- 3. Mostrar algunas comisiones de ejemplo
SELECT 
    id,
    id_mecanico,
    id_trabajo,
    monto_comision,
    estado_comision,
    quincena,
    fecha_calculo
FROM comisiones_mecanicos 
LIMIT 5;

-- 4. Verificar si hay comisiones para el mecánico ID 3 (Macho)
SELECT 
    cm.id,
    cm.id_mecanico,
    m.nombre as nombre_mecanico,
    cm.id_trabajo,
    t.descripcion as trabajo_descripcion,
    t.fecha as fecha_trabajo,
    cm.monto_comision,
    cm.estado_comision,
    cm.quincena,
    cm.fecha_calculo
FROM comisiones_mecanicos cm
JOIN mecanicos m ON cm.id_mecanico = m.id
JOIN trabajos t ON cm.id_trabajo = t.id
WHERE cm.id_mecanico = 3
ORDER BY t.fecha;

-- 5. Verificar trabajos del mecánico ID 3
SELECT 
    tm.id_trabajo,
    t.descripcion,
    t.fecha,
    t.mano_obra,
    tm.porcentaje_comision,
    tm.monto_comision
FROM trabajos_mecanicos tm
JOIN trabajos t ON tm.id_trabajo = t.id
WHERE tm.id_mecanico = 3
ORDER BY t.fecha;
