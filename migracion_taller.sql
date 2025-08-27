-- Migración para crear tablas del módulo de taller
-- Este archivo debe ejecutarse en la base de datos para crear las nuevas tablas

-- 1. Crear tabla gastos_taller
CREATE TABLE IF NOT EXISTS gastos_taller (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    descripcion TEXT NOT NULL,
    monto DECIMAL(10,2) NOT NULL,
    categoria VARCHAR(100) NOT NULL,
    fecha_gasto DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. Crear tabla pagos_salarios
CREATE TABLE IF NOT EXISTS pagos_salarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    id_mecanico INTEGER NOT NULL,
    monto_salario DECIMAL(10,2) NOT NULL,
    semana_pago VARCHAR(1) NOT NULL,
    fecha_pago DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_mecanico) REFERENCES mecanicos(id) ON DELETE CASCADE
);

-- 3. Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_gastos_taller_categoria ON gastos_taller(categoria);
CREATE INDEX IF NOT EXISTS idx_gastos_taller_fecha ON gastos_taller(fecha_gasto);
CREATE INDEX IF NOT EXISTS idx_pagos_salarios_mecanico ON pagos_salarios(id_mecanico);
CREATE INDEX IF NOT EXISTS idx_pagos_salarios_semana ON pagos_salarios(semana_pago);
CREATE INDEX IF NOT EXISTS idx_pagos_salarios_fecha ON pagos_salarios(fecha_pago);

-- 4. Insertar datos de ejemplo para gastos del taller (opcional)
INSERT INTO gastos_taller (descripcion, monto, categoria, fecha_gasto) VALUES
('Pago de luz del mes', 45000.00, 'luz', '2025-01-15 10:00:00'),
('Pago de agua', 15000.00, 'agua', '2025-01-10 10:00:00'),
('Compra de herramientas', 25000.00, 'herramientas', '2025-01-12 10:00:00'),
('Materiales de limpieza', 8000.00, 'materiales', '2025-01-08 10:00:00');

-- 5. Insertar datos de ejemplo para pagos de salarios (opcional)
-- Nota: Asegúrate de que existan mecánicos con estos IDs
INSERT INTO pagos_salarios (id_mecanico, monto_salario, semana_pago, fecha_pago) VALUES
(1, 80000.00, '1', '2025-01-06 10:00:00'),
(2, 75000.00, '1', '2025-01-06 10:00:00'),
(3, 70000.00, '1', '2025-01-06 10:00:00');

-- 6. Verificar que las tablas se crearon correctamente
SELECT 'gastos_taller' as tabla, COUNT(*) as registros FROM gastos_taller
UNION ALL
SELECT 'pagos_salarios' as tabla, COUNT(*) as registros FROM pagos_salarios;
