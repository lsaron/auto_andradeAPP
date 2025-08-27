-- Migración para cambiar la longitud del campo semana_pago en la tabla pagos_salarios
-- De String(1) a String(2) para permitir valores como "10", "11", etc.

-- Para SQLite (si estás usando SQLite)
-- Nota: SQLite no soporta ALTER COLUMN para cambiar tipos, se necesita recrear la tabla

-- Para PostgreSQL/MySQL
ALTER TABLE pagos_salarios ALTER COLUMN semana_pago TYPE VARCHAR(2);

-- Para SQLite (alternativa - recrear tabla)
-- 1. Crear tabla temporal
CREATE TABLE pagos_salarios_temp (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    id_mecanico INTEGER NOT NULL,
    monto_salario DECIMAL(10,2) NOT NULL,
    semana_pago VARCHAR(2) NOT NULL,
    fecha_pago DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_mecanico) REFERENCES mecanicos(id) ON DELETE CASCADE
);

-- 2. Copiar datos
INSERT INTO pagos_salarios_temp 
SELECT id, id_mecanico, monto_salario, semana_pago, fecha_pago, created_at 
FROM pagos_salarios;

-- 3. Eliminar tabla original
DROP TABLE pagos_salarios;

-- 4. Renombrar tabla temporal
ALTER TABLE pagos_salarios_temp RENAME TO pagos_salarios;

-- 5. Recrear índices si los hay
-- CREATE INDEX idx_pagos_salarios_mecanico ON pagos_salarios(id_mecanico);
-- CREATE INDEX idx_pagos_salarios_fecha ON pagos_salarios(fecha_pago);
