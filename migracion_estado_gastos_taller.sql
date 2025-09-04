-- Migración para agregar campo estado a gastos_taller
-- Estados: PENDIENTE, PAGADO

-- Agregar el campo estado a la tabla gastos_taller
ALTER TABLE gastos_taller 
ADD COLUMN estado ENUM('PENDIENTE', 'PAGADO') NOT NULL DEFAULT 'PENDIENTE';

-- Crear índice para optimizar consultas por estado
CREATE INDEX idx_gastos_taller_estado ON gastos_taller(estado);

-- Crear índice compuesto para consultas por estado y fecha
CREATE INDEX idx_gastos_taller_estado_fecha ON gastos_taller(estado, fecha_gasto);

-- Actualizar todos los gastos existentes a estado PAGADO (asumiendo que ya fueron pagados)
UPDATE gastos_taller SET estado = 'PAGADO' WHERE estado = 'PENDIENTE';

-- Verificar la migración
SELECT 
    estado,
    COUNT(*) as cantidad,
    SUM(monto) as total_monto
FROM gastos_taller 
GROUP BY estado;
