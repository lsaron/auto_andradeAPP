-- Script para actualizar las comisiones existentes con la quincena correcta
-- basándose en la fecha del trabajo (compatible con modo seguro de MySQL)

-- Primero, verificar el estado actual
SELECT 
    'Estado actual de comisiones' as info,
    COUNT(*) as total_comisiones,
    COUNT(CASE WHEN quincena IS NULL THEN 1 END) as sin_quincena,
    COUNT(CASE WHEN quincena IS NOT NULL THEN 1 END) as con_quincena
FROM comisiones_mecanicos;

-- Actualizar comisiones del primer trimestre (Q1) - Enero a Marzo
UPDATE comisiones_mecanicos cm
JOIN trabajos t ON cm.id_trabajo = t.id
SET cm.quincena = CONCAT(YEAR(t.fecha), '-Q1')
WHERE cm.id IN (
    SELECT cm2.id FROM (
        SELECT cm2.id 
        FROM comisiones_mecanicos cm2
        JOIN trabajos t2 ON cm2.id_trabajo = t2.id
        WHERE MONTH(t2.fecha) BETWEEN 1 AND 3
        AND (cm2.quincena IS NULL OR cm2.quincena = '')
    ) AS temp
);

-- Actualizar comisiones del segundo trimestre (Q2) - Abril a Junio
UPDATE comisiones_mecanicos cm
JOIN trabajos t ON cm.id_trabajo = t.id
SET cm.quincena = CONCAT(YEAR(t.fecha), '-Q2')
WHERE cm.id IN (
    SELECT cm2.id FROM (
        SELECT cm2.id 
        FROM comisiones_mecanicos cm2
        JOIN trabajos t2 ON cm2.id_trabajo = t2.id
        WHERE MONTH(t2.fecha) BETWEEN 4 AND 6
        AND (cm2.quincena IS NULL OR cm2.quincena = '')
    ) AS temp
);

-- Actualizar comisiones del tercer trimestre (Q3) - Julio a Septiembre
UPDATE comisiones_mecanicos cm
JOIN trabajos t ON cm.id_trabajo = t.id
SET cm.quincena = CONCAT(YEAR(t.fecha), '-Q3')
WHERE cm.id IN (
    SELECT cm2.id FROM (
        SELECT cm2.id 
        FROM comisiones_mecanicos cm2
        JOIN trabajos t2 ON cm2.id_trabajo = t2.id
        WHERE MONTH(t2.fecha) BETWEEN 7 AND 9
        AND (cm2.quincena IS NULL OR cm2.quincena = '')
    ) AS temp
);

-- Actualizar comisiones del cuarto trimestre (Q4) - Octubre a Diciembre
UPDATE comisiones_mecanicos cm
JOIN trabajos t ON cm.id_trabajo = t.id
SET cm.quincena = CONCAT(YEAR(t.fecha), '-Q4')
WHERE cm.id IN (
    SELECT cm2.id FROM (
        SELECT cm2.id 
        FROM comisiones_mecanicos cm2
        JOIN trabajos t2 ON cm2.id_trabajo = t2.id
        WHERE MONTH(t2.fecha) BETWEEN 10 AND 12
        AND (cm2.quincena IS NULL OR cm2.quincena = '')
    ) AS temp
);

-- Verificar el resultado después de la actualización
SELECT 
    'Estado después de actualización' as info,
    COUNT(*) as total_comisiones,
    COUNT(CASE WHEN quincena IS NULL THEN 1 END) as sin_quincena,
    COUNT(CASE WHEN quincena IS NOT NULL THEN 1 END) as con_quincena
FROM comisiones_mecanicos;

-- Mostrar algunas comisiones actualizadas como ejemplo
SELECT 
    cm.id,
    cm.id_mecanico,
    m.nombre as nombre_mecanico,
    cm.id_trabajo,
    t.descripcion as trabajo_descripcion,
    t.fecha as fecha_trabajo,
    cm.quincena,
    cm.estado_comision,
    cm.monto_comision
FROM comisiones_mecanicos cm
JOIN mecanicos m ON cm.id_mecanico = m.id
JOIN trabajos t ON cm.id_trabajo = t.id
ORDER BY cm.id_mecanico, t.fecha
LIMIT 10;
