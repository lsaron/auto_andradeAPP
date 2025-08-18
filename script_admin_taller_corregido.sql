-- Script corregido para crear la tabla admin_taller con la contraseña correcta
USE auto_andrade;

-- Borrar la tabla existente si existe
DROP TABLE IF EXISTS admin_taller;

-- Crear tabla nueva para el administrador del taller
CREATE TABLE IF NOT EXISTS admin_taller (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    nombre_completo VARCHAR(100) NOT NULL,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insertar el administrador Leonardo con la contraseña correcta: Andrade1207
-- Hash SHA1 de 'Andrade1207': dd69f29e407db6bd0c3bf964ae6f2fa752bd04d2
INSERT INTO admin_taller (username, password_hash, nombre_completo) 
VALUES ('leonardo', 'dd69f29e407db6bd0c3bf964ae6f2fa752bd04d2', 'Leonardo Andrade');

-- Crear índice para búsquedas rápidas
CREATE INDEX idx_admin_username ON admin_taller(username);

-- Verificar que se insertó correctamente
SELECT * FROM admin_taller;
