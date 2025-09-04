-- Script para limpiar la base de datos AutoAndrade
-- Mantiene la estructura de tablas y relaciones intactas
-- Solo elimina los datos (registros)

-- Deshabilitar verificaciones de claves foráneas temporalmente
SET FOREIGN_KEY_CHECKS = 0;

-- Limpiar todas las tablas en orden inverso a las dependencias
-- (de las tablas hijas a las tablas padre)

-- 1. Limpiar tabla de comisiones (depende de trabajos y mecánicos)
TRUNCATE TABLE `comisiones_mecanicos`;

-- 2. Limpiar tabla de trabajos_mecanicos (depende de trabajos y mecánicos)
TRUNCATE TABLE `trabajos_mecanicos`;

-- 3. Limpiar tabla de detalles_gastos (depende de trabajos)
TRUNCATE TABLE `detalles_gastos`;

-- 4. Limpiar tabla de trabajos (tabla principal)
TRUNCATE TABLE `trabajos`;

-- 5. Limpiar tabla de pagos_salarios (depende de mecánicos)
TRUNCATE TABLE `pagos_salarios`;

-- 6. Limpiar tabla de gastos_taller
TRUNCATE TABLE `gastos_taller`;

-- 7. Limpiar tabla de historial_duenos (depende de carros y clientes)
TRUNCATE TABLE `historial_duenos`;

-- 8. Limpiar tabla de carros (depende de clientes)
TRUNCATE TABLE `carros`;

-- 9. Limpiar tabla de mecánicos
TRUNCATE TABLE `mecanicos`;

-- 10. Limpiar tabla de clientes
TRUNCATE TABLE `clientes`;

-- 11. Limpiar tabla de admin_taller (opcional - comentar si quieres mantener admin)
-- TRUNCATE TABLE `admin_taller`;

-- Reiniciar contadores de AUTO_INCREMENT
ALTER TABLE `comisiones_mecanicos` AUTO_INCREMENT = 1;
ALTER TABLE `trabajos_mecanicos` AUTO_INCREMENT = 1;
ALTER TABLE `detalles_gastos` AUTO_INCREMENT = 1;
ALTER TABLE `trabajos` AUTO_INCREMENT = 1;
ALTER TABLE `pagos_salarios` AUTO_INCREMENT = 1;
ALTER TABLE `gastos_taller` AUTO_INCREMENT = 1;
ALTER TABLE `historial_duenos` AUTO_INCREMENT = 1;
ALTER TABLE `carros` AUTO_INCREMENT = 1;
ALTER TABLE `mecanicos` AUTO_INCREMENT = 1;
ALTER TABLE `clientes` AUTO_INCREMENT = 1;
-- ALTER TABLE `admin_taller` AUTO_INCREMENT = 1; -- Descomentar si limpiaste admin_taller

-- Rehabilitar verificaciones de claves foráneas
SET FOREIGN_KEY_CHECKS = 1;

-- Verificar que las tablas estén vacías
SELECT 
    'comisiones_mecanicos' as tabla, COUNT(*) as registros FROM comisiones_mecanicos
UNION ALL
SELECT 'trabajos_mecanicos', COUNT(*) FROM trabajos_mecanicos
UNION ALL
SELECT 'detalles_gastos', COUNT(*) FROM detalles_gastos
UNION ALL
SELECT 'trabajos', COUNT(*) FROM trabajos
UNION ALL
SELECT 'pagos_salarios', COUNT(*) FROM pagos_salarios
UNION ALL
SELECT 'gastos_taller', COUNT(*) FROM gastos_taller
UNION ALL
SELECT 'historial_duenos', COUNT(*) FROM historial_duenos
UNION ALL
SELECT 'carros', COUNT(*) FROM carros
UNION ALL
SELECT 'mecanicos', COUNT(*) FROM mecanicos
UNION ALL
SELECT 'clientes', COUNT(*) FROM clientes;

-- Mensaje de confirmación
SELECT 'Base de datos limpiada exitosamente. Todas las tablas están vacías.' as resultado;
