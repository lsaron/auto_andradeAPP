-- ========================================
-- Script para agregar estado DENEGADA al enum estado_comision
-- ========================================

-- Verificar el estado actual del enum
SELECT COLUMN_TYPE 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'autoandrade' 
AND TABLE_NAME = 'comisiones_mecanicos' 
AND COLUMN_NAME = 'estado_comision';

-- Agregar el estado DENEGADA al enum
ALTER TABLE comisiones_mecanicos 
MODIFY COLUMN estado_comision ENUM('PENDIENTE', 'APROBADA', 'PENALIZADA', 'DENEGADA') NULL;

-- Verificar que se agregó correctamente
SELECT COLUMN_TYPE 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'autoandrade' 
AND TABLE_NAME = 'comisiones_mecanicos' 
AND COLUMN_NAME = 'estado_comision';

-- Verificar comisiones existentes
SELECT id, id_mecanico, id_trabajo, estado_comision, quincena, monto_comision 
FROM comisiones_mecanicos 
LIMIT 5;

-- ========================================
-- Script completado
-- ========================================
