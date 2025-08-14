-- Script de migración para sistema de mecánicos y comisiones
-- Auto Andrade - Sistema de Comisiones de Mecánicos
-- Fecha: 2025-01-13

-- Seleccionar la base de datos
USE auto_andrade;

-- Desactivar verificación de foreign keys temporalmente
SET FOREIGN_KEY_CHECKS = 0;

-- 1. Crear tabla de mecánicos
CREATE TABLE IF NOT EXISTS `mecanicos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `id_nacional` varchar(20) NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `correo` varchar(100) DEFAULT NULL,
  `telefono` varchar(20) DEFAULT NULL,
  `porcentaje_comision` decimal(5,2) NOT NULL DEFAULT 2.00,
  `fecha_contratacion` datetime DEFAULT CURRENT_TIMESTAMP,
  `activo` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_id_nacional` (`id_nacional`),
  KEY `idx_activo` (`activo`),
  KEY `idx_nombre` (`nombre`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 2. Crear tabla de relación trabajos-mecánicos (muchos a muchos)
CREATE TABLE IF NOT EXISTS `trabajos_mecanicos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `id_trabajo` int NOT NULL,
  `id_mecanico` int NOT NULL,
  `porcentaje_comision` decimal(5,2) NOT NULL DEFAULT 2.00,
  `monto_comision` decimal(10,2) NOT NULL DEFAULT 0.00,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_trabajo_mecanico` (`id_trabajo`, `id_mecanico`),
  KEY `idx_trabajo` (`id_trabajo`),
  KEY `idx_mecanico` (`id_mecanico`),
  CONSTRAINT `fk_trabajos_mecanicos_trabajo` FOREIGN KEY (`id_trabajo`) REFERENCES `trabajos` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_trabajos_mecanicos_mecanico` FOREIGN KEY (`id_mecanico`) REFERENCES `mecanicos` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 3. Crear tabla de historial de comisiones
CREATE TABLE IF NOT EXISTS `comisiones_mecanicos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `id_trabajo` int NOT NULL,
  `id_mecanico` int NOT NULL,
  `ganancia_trabajo` decimal(10,2) NOT NULL,
  `porcentaje_comision` decimal(5,2) NOT NULL,
  `monto_comision` decimal(10,2) NOT NULL,
  `fecha_calculo` datetime DEFAULT CURRENT_TIMESTAMP,
  `mes_reporte` varchar(7) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_trabajo` (`id_trabajo`),
  KEY `idx_mecanico` (`id_mecanico`),
  KEY `idx_mes_reporte` (`mes_reporte`),
  KEY `idx_fecha_calculo` (`fecha_calculo`),
  CONSTRAINT `fk_comisiones_trabajos` FOREIGN KEY (`id_trabajo`) REFERENCES `trabajos` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_comisiones_mecanicos` FOREIGN KEY (`id_mecanico`) REFERENCES `mecanicos` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Reactivar verificación de foreign keys
SET FOREIGN_KEY_CHECKS = 1;

-- 4. Crear índices adicionales para optimizar consultas
CREATE INDEX `idx_mecanicos_activo_nombre` ON `mecanicos` (`activo`, `nombre`);
CREATE INDEX `idx_comisiones_mecanico_mes` ON `comisiones_mecanicos` (`id_mecanico`, `mes_reporte`);
CREATE INDEX `idx_trabajos_mecanicos_trabajo` ON `trabajos_mecanicos` (`id_trabajo`);

-- 5. Verificar que las tablas se crearon correctamente
SELECT 
    TABLE_NAME,
    TABLE_ROWS,
    DATA_LENGTH,
    INDEX_LENGTH
FROM information_schema.TABLES 
WHERE TABLE_SCHEMA = 'auto_andrade' 
AND TABLE_NAME IN ('mecanicos', 'trabajos_mecanicos', 'comisiones_mecanicos');

-- 6. Verificar la estructura de las nuevas tablas
DESCRIBE `mecanicos`;
DESCRIBE `trabajos_mecanicos`;
DESCRIBE `comisiones_mecanicos`;

-- NOTA: Las tablas se crean vacías. Los mecánicos se pueden agregar desde la interfaz web
-- o mediante la API una vez que el sistema esté funcionando.
