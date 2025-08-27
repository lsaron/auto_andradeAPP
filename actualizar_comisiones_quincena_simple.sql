-- Script alternativo más simple para actualizar comisiones por quincena
-- Usa múltiples UPDATEs individuales para evitar problemas con el modo seguro

-- Primero, verificar el estado actual
SELECT 
    'Estado actual de comisiones' as info,
    COUNT(*) as total_comisiones,
    COUNT(CASE WHEN quincena IS NULL THEN 1 END) as sin_quincena,
    COUNT(CASE WHEN quincena IS NOT NULL THEN 1 END) as con_quincena
FROM comisiones_mecanicos;

-- Actualizar comisiones del primer trimestre (Q1) - Enero a Marzo
UPDATE comisiones_mecanicos 
SET quincena = (
    SELECT CONCAT(YEAR(t.fecha), '-Q1')
    FROM trabajos t 
    WHERE t.id = comisiones_mecanicos.id_trabajo
)
WHERE id IN (
    SELECT cm.id 
    FROM comisiones_mecanicos cm
    JOIN trabajos t ON cm.id_trabajo = t.id
    WHERE MONTH(t.fecha) BETWEEN 1 AND 3
    AND (cm.quincena IS NULL OR cm.quincena = '')
);

-- Actualizar comisiones del segundo trimestre (Q2) - Abril a Junio
UPDATE comisiones_mecanicos 
SET quincena = (
    SELECT CONCAT(YEAR(t.fecha), '-Q2')
    FROM trabajos t 
    WHERE t.id = comisiones_mecanicos.id_trabajo
)
WHERE id IN (
    SELECT cm.id 
    FROM comisiones_mecanicos cm
    JOIN trabajos t ON cm.id_trabajo = t.id
    WHERE MONTH(t.fecha) BETWEEN 4 AND 6
    AND (cm.quincena IS NULL OR cm.quincena = '')
);

-- Actualizar comisiones del tercer trimestre (Q3) - Julio a Septiembre
UPDATE comisiones_mecanicos 
SET quincena = (
    SELECT CONCAT(YEAR(t.fecha), '-Q3')
    FROM trabajos t 
    WHERE t.id = comisiones_mecanicos.id_trabajo
)
WHERE id IN (
    SELECT cm.id 
    FROM comisiones_mecanicos cm
    JOIN trabajos t ON cm.id_trabajo = t.id
    WHERE MONTH(t.fecha) BETWEEN 7 AND 9
    AND (cm.quincena IS NULL OR cm.quincena = '')
);

-- Actualizar comisiones del cuarto trimestre (Q4) - Octubre a Diciembre
UPDATE comisiones_mecanicos 
SET quincena = (
    SELECT CONCAT(YEAR(t.fecha), '-Q4')
    FROM trabajos t 
    WHERE t.id = comisiones_mecanicos.id_trabajo
)
WHERE id IN (
    SELECT cm.id 
    FROM comisiones_mecanicos cm
    JOIN trabajos t ON cm.id_trabajo = t.id
    WHERE MONTH(t.fecha) BETWEEN 10 AND 12
    AND (cm.quincena IS NULL OR cm.quincena = '')
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
