-- Migración para simplificar el campo semana_pago
-- Este archivo actualiza la tabla pagos_salarios existente

-- 1. Crear tabla temporal con la nueva estructura
CREATE TABLE IF NOT EXISTS pagos_salarios_temp (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    id_mecanico INTEGER NOT NULL,
    monto_salario DECIMAL(10,2) NOT NULL,
    semana_pago VARCHAR(1) NOT NULL,
    fecha_pago DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_mecanico) REFERENCES mecanicos(id) ON DELETE CASCADE
);

-- 2. Copiar datos existentes, convirtiendo el formato de semana
-- Si hay datos existentes con formato YYYY-WNN, extraer solo el número de semana
INSERT INTO pagos_salarios_temp (id, id_mecanico, monto_salario, semana_pago, fecha_pago, created_at)
SELECT 
    id,
    id_mecanico,
    monto_salario,
    CASE 
        WHEN semana_pago LIKE '%-W%' THEN 
            SUBSTR(semana_pago, -1)  -- Extraer el último carácter (número de semana)
        WHEN semana_pago IN ('1', '2', '3', '4') THEN 
            semana_pago  -- Ya está en formato correcto
        ELSE 
            '1'  -- Valor por defecto si no se puede convertir
    END as semana_pago,
    fecha_pago,
    created_at
FROM pagos_salarios;

-- 3. Eliminar tabla antigua
DROP TABLE pagos_salarios;

-- 4. Renombrar tabla temporal
ALTER TABLE pagos_salarios_temp RENAME TO pagos_salarios;

-- 5. Recrear índices
CREATE INDEX IF NOT EXISTS idx_pagos_salarios_mecanico ON pagos_salarios(id_mecanico);
CREATE INDEX IF NOT EXISTS idx_pagos_salarios_semana ON pagos_salarios(semana_pago);
CREATE INDEX IF NOT EXISTS idx_pagos_salarios_fecha ON pagos_salarios(fecha_pago);

-- 6. Verificar la nueva estructura
SELECT 'pagos_salarios' as tabla, COUNT(*) as registros FROM pagos_salarios;
PRAGMA table_info(pagos_salarios);
