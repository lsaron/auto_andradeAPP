-- Script para restaurar datos de administrador del taller
-- Basado en la documentación README_AUTH.md

-- Usar la base de datos correcta
USE auto_andrade;

-- Verificar que la tabla existe
SHOW TABLES LIKE 'admin_taller';

-- Insertar el usuario administrador por defecto
INSERT INTO admin_taller (username, password_hash, nombre_completo, fecha_creacion) 
VALUES (
    'leonardo', 
    'dd69f29e407db6bd0c3bf964ae6f2fa752bd04d2', 
    'Leonardo Andrade',
    NOW()
);

-- Verificar que el usuario se insertó correctamente
SELECT 
    id,
    username,
    password_hash,
    nombre_completo,
    fecha_creacion
FROM admin_taller 
WHERE username = 'leonardo';

-- Mostrar información de autenticación
SELECT 
    'Usuario administrador restaurado exitosamente' as mensaje,
    'leonardo' as username,
    'Andrade1207' as password_plana,
    'dd69f29e407db6bd0c3bf964ae6f2fa752bd04d2' as password_hash,
    'Leonardo Andrade' as nombre_completo;

-- Verificar el índice de username
SHOW INDEX FROM admin_taller WHERE Key_name = 'username';

-- Si el índice no existe, crearlo
CREATE INDEX IF NOT EXISTS idx_admin_username ON admin_taller(username);

-- Mostrar estructura final de la tabla
DESCRIBE admin_taller;
