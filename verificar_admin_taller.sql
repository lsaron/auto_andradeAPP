-- Script para verificar la configuración de la tabla admin_taller
USE auto_andrade;

-- Verificar que la tabla existe
SHOW TABLES LIKE 'admin_taller';

-- Verificar la estructura de la tabla
DESCRIBE admin_taller;

-- Verificar los datos insertados
SELECT 
    id,
    username,
    password_hash,
    nombre_completo,
    fecha_creacion
FROM admin_taller;

-- Verificar el índice
SHOW INDEX FROM admin_taller;

-- Probar la búsqueda por username
SELECT * FROM admin_taller WHERE username = 'leonardo';

-- Verificar que el hash coincide (opcional - solo para verificación)
-- El hash SHA1 de 'Andrade1207' debería ser: dd69f29e407db6bd0c3bf964ae6f2fa752bd04d2
