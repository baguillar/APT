-- Estructura de Base de Datos Eventos GUAU - v20.7 REPAIR
SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;

-- 1. Usuarios
CREATE TABLE IF NOT EXISTS `users` (
  `email` VARCHAR(100) NOT NULL,
  `password` VARCHAR(255) NOT NULL,
  `role` ENUM('admin', 'client') DEFAULT 'client',
  `ownerName` VARCHAR(100) DEFAULT NULL,
  `ownerPhone` VARCHAR(20) DEFAULT NULL,
  `subscription` ENUM('none', 'basic', 'premium') DEFAULT 'none',
  `status` ENUM('pending', 'active', 'blocked') DEFAULT 'pending',
  `dogName` VARCHAR(100) DEFAULT NULL,
  `dogBreed` VARCHAR(100) DEFAULT NULL,
  `dogSex` ENUM('Macho', 'Hembra', 'Desconocido') DEFAULT 'Desconocido',
  `dogWeight` DECIMAL(5,2) DEFAULT NULL,
  `dogBirthdate` DATE DEFAULT NULL,
  `dogCharacter` TEXT DEFAULT NULL,
  `dogObjective` TEXT DEFAULT NULL,
  `trainer_notes` TEXT DEFAULT NULL,
  `training_days` VARCHAR(50) DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. Salud (Asegurar columna updated_at)
CREATE TABLE IF NOT EXISTS `health_status` (
  `user_email` VARCHAR(100) PRIMARY KEY,
  `physical` INT DEFAULT 5,
  `cognitive` INT DEFAULT 5,
  `social` INT DEFAULT 5,
  `emotional` INT DEFAULT 5,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_email`) REFERENCES `users`(`email`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

ALTER TABLE `health_status` ADD COLUMN IF NOT EXISTS `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

-- 3. Solicitudes (Asegurar columna responded_at)
CREATE TABLE IF NOT EXISTS `health_requests` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_email` VARCHAR(100) NOT NULL,
  `p_physical` INT NOT NULL,
  `p_cognitive` INT NOT NULL,
  `p_social` INT NOT NULL,
  `p_emotional` INT NOT NULL,
  `user_comment` TEXT,
  `admin_comment` TEXT,
  `status` ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `responded_at` DATETIME DEFAULT NULL,
  FOREIGN KEY (`user_email`) REFERENCES `users`(`email`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

ALTER TABLE `health_requests` ADD COLUMN IF NOT EXISTS `responded_at` DATETIME DEFAULT NULL AFTER `status`;

COMMIT;