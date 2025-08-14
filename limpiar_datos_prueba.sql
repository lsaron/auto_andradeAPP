-- Script de limpieza de datos de prueba
-- Auto Andrade - Sistema de Comisiones de Mecánicos
-- Fecha: 2025-08-13
-- OBJETIVO: Limpiar todos los datos de prueba sin afectar la estructura de las tablas

-- Seleccionar la base de datos
USE auto_andrade;

-- Desactivar verificación de foreign keys temporalmente para evitar errores
SET FOREIGN_KEY_CHECKS = 0;

-- 1. LIMPIAR TABLA trabajos_mecanicos (está vacía, pero por si acaso)
TRUNCATE TABLE trabajos_mecanicos;

-- 2. LIMPIAR TABLA comisiones_mecanicos (está vacía, pero por si acaso)
TRUNCATE TABLE comisiones_mecanicos;

-- 3. LIMPIAR TABLA detalles_gastos (datos de prueba)
TRUNCATE TABLE detalles_gastos;

-- 4. LIMPIAR TABLA trabajos (datos de prueba)
TRUNCATE TABLE trabajos;

-- 5. LIMPIAR TABLA historial_duenos (datos de prueba)
TRUNCATE TABLE historial_duenos;

-- 6. LIMPIAR TABLA carros (datos de prueba)
TRUNCATE TABLE carros;

-- 7. LIMPIAR TABLA clientes (datos de prueba)
TRUNCATE TABLE clientes;

-- 8. LIMPIAR TABLA mecanicos (datos de prueba)
TRUNCATE TABLE mecanicos;

-- Reactivar verificación de foreign keys
SET FOREIGN_KEY_CHECKS = 1;

-- 9. VERIFICAR QUE LAS TABLAS ESTÁN VACÍAS
SELECT 
    'carros' as tabla,
    COUNT(*) as registros
FROM carros
UNION ALL
SELECT 
    'clientes' as tabla,
    COUNT(*) as registros
FROM clientes
UNION ALL
SELECT 
    'mecanicos' as tabla,
    COUNT(*) as registros
FROM mecanicos
UNION ALL
SELECT 
    'trabajos' as tabla,
    COUNT(*) as registros
FROM trabajos
UNION ALL
SELECT 
    'detalles_gastos' as tabla,
    COUNT(*) as registros
FROM detalles_gastos
UNION ALL
SELECT 
    'historial_duenos' as tabla,
    COUNT(*) as registros
FROM historial_duenos
UNION ALL
SELECT 
    'trabajos_mecanicos' as tabla,
    COUNT(*) as registros
FROM trabajos_mecanicos
UNION ALL
SELECT 
    'comisiones_mecanicos' as tabla,
    COUNT(*) as registros
FROM comisiones_mecanicos;

-- 10. VERIFICAR QUE LAS TABLAS SIGUEN EXISTIENDO
SHOW TABLES;

-- 11. VERIFICAR LA ESTRUCTURA DE LAS TABLAS PRINCIPALES
DESCRIBE carros;
DESCRIBE clientes;
DESCRIBE mecanicos;
DESCRIBE trabajos;
DESCRIBE trabajos_mecanicos;
DESCRIBE comisiones_mecanicos;

-- NOTA: Después de ejecutar este script, todas las tablas estarán vacías
-- pero mantendrán su estructura completa, índices y restricciones
-- Podrás insertar nuevos datos limpios para probar el sistema
