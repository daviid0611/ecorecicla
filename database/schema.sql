-- =====================================================================
--  EcoRecicla - Esquema de base de datos (MySQL 8.0)
--  Proyecto PLANETA VERDE - Universidad Manuela Beltran
--  Uso:  mysql -u root -p < database/schema.sql
--  Los usuarios NO se insertan aqui: los crea database/seed.js con
--  hashes reales de bcrypt (nunca hashes escritos a mano).
-- =====================================================================

DROP DATABASE IF EXISTS ecorecicla;
CREATE DATABASE ecorecicla CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE ecorecicla;

-- ---------------------------- ESTRUCTURA ----------------------------
CREATE TABLE rol (
  id_rol   TINYINT UNSIGNED NOT NULL AUTO_INCREMENT,
  nombre   VARCHAR(30) NOT NULL,
  PRIMARY KEY (id_rol),
  UNIQUE KEY uq_rol_nombre (nombre)
) ENGINE=InnoDB;

CREATE TABLE punto_reciclaje (
  id_punto   INT UNSIGNED NOT NULL AUTO_INCREMENT,
  nombre     VARCHAR(100) NOT NULL,
  direccion  VARCHAR(150) NOT NULL,
  localidad  VARCHAR(60)  NOT NULL,
  latitud    DECIMAL(9,6) NULL,
  longitud   DECIMAL(9,6) NULL,
  horario    VARCHAR(100) NULL,
  estado     ENUM('activo','inactivo') NOT NULL DEFAULT 'activo',
  PRIMARY KEY (id_punto)
) ENGINE=InnoDB;

-- usuario.id_punto: solo lo usan los Operadores. Indica que punto validan.
-- Se declara despues de punto_reciclaje para poder crear la FK.
CREATE TABLE usuario (
  id_usuario      INT UNSIGNED NOT NULL AUTO_INCREMENT,
  id_rol          TINYINT UNSIGNED NOT NULL,
  id_punto        INT UNSIGNED NULL,
  nombre          VARCHAR(100) NOT NULL,
  correo          VARCHAR(120) NOT NULL,
  contrasena_hash VARCHAR(100) NOT NULL,
  telefono        VARCHAR(20) NULL,
  fecha_registro  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  estado          ENUM('activo','inactivo') NOT NULL DEFAULT 'activo',
  PRIMARY KEY (id_usuario),
  UNIQUE KEY uq_usuario_correo (correo),
  CONSTRAINT fk_usuario_rol   FOREIGN KEY (id_rol)   REFERENCES rol (id_rol),
  CONSTRAINT fk_usuario_punto FOREIGN KEY (id_punto) REFERENCES punto_reciclaje (id_punto)
) ENGINE=InnoDB;

CREATE TABLE tipo_residuo (
  id_tipo        SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT,
  nombre         VARCHAR(50)  NOT NULL,
  descripcion    VARCHAR(200) NULL,
  factor_co2_kg  DECIMAL(6,3) NOT NULL COMMENT 'kg de CO2 evitados por kg reciclado',
  PRIMARY KEY (id_tipo),
  UNIQUE KEY uq_tipo_nombre (nombre),
  CONSTRAINT ck_factor_pos CHECK (factor_co2_kg > 0)
) ENGINE=InnoDB;

-- Relacion N:M: que residuos acepta cada punto. El backend la consulta
-- antes de guardar un registro (un punto no puede recibir lo que no acepta).
CREATE TABLE punto_tipo_residuo (
  id_punto INT UNSIGNED NOT NULL,
  id_tipo  SMALLINT UNSIGNED NOT NULL,
  PRIMARY KEY (id_punto, id_tipo),
  CONSTRAINT fk_ptr_punto FOREIGN KEY (id_punto) REFERENCES punto_reciclaje (id_punto) ON DELETE CASCADE,
  CONSTRAINT fk_ptr_tipo  FOREIGN KEY (id_tipo)  REFERENCES tipo_residuo (id_tipo)
) ENGINE=InnoDB;

-- estado reemplaza al antiguo "validado TINYINT": un registro rechazado no
-- es lo mismo que uno pendiente, y el operador debe poder justificar.
CREATE TABLE registro_reciclaje (
  id_registro             INT UNSIGNED NOT NULL AUTO_INCREMENT,
  id_usuario              INT UNSIGNED NOT NULL,
  id_punto                INT UNSIGNED NOT NULL,
  id_tipo                 SMALLINT UNSIGNED NOT NULL,
  cantidad_kg             DECIMAL(8,2) NOT NULL,
  fecha_registro          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  observaciones           VARCHAR(200) NULL,
  estado                  ENUM('pendiente','aprobado','rechazado') NOT NULL DEFAULT 'pendiente',
  id_validador            INT UNSIGNED NULL,
  fecha_validacion        DATETIME NULL,
  observacion_validacion  VARCHAR(200) NULL,
  PRIMARY KEY (id_registro),
  KEY idx_reg_usuario_fecha (id_usuario, fecha_registro),
  KEY idx_reg_punto_estado (id_punto, estado),
  CONSTRAINT fk_reg_usuario   FOREIGN KEY (id_usuario)   REFERENCES usuario (id_usuario),
  CONSTRAINT fk_reg_punto     FOREIGN KEY (id_punto)     REFERENCES punto_reciclaje (id_punto),
  CONSTRAINT fk_reg_tipo      FOREIGN KEY (id_tipo)      REFERENCES tipo_residuo (id_tipo),
  CONSTRAINT fk_reg_validador FOREIGN KEY (id_validador) REFERENCES usuario (id_usuario),
  CONSTRAINT ck_cantidad_pos  CHECK (cantidad_kg > 0)
) ENGINE=InnoDB;

CREATE TABLE reporte (
  id_reporte       INT UNSIGNED NOT NULL AUTO_INCREMENT,
  id_usuario       INT UNSIGNED NOT NULL,
  tipo             ENUM('personal','global') NOT NULL DEFAULT 'personal',
  fecha_inicio     DATE NOT NULL,
  fecha_fin        DATE NOT NULL,
  total_kg         DECIMAL(10,2) NOT NULL DEFAULT 0,
  co2_evitado_kg   DECIMAL(10,2) NOT NULL DEFAULT 0,
  fecha_generacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id_reporte),
  CONSTRAINT fk_reporte_usuario FOREIGN KEY (id_usuario) REFERENCES usuario (id_usuario),
  CONSTRAINT ck_reporte_fechas CHECK (fecha_fin >= fecha_inicio)
) ENGINE=InnoDB;

-- ------------------------------ DATOS BASE -------------------------------
INSERT INTO rol (nombre) VALUES ('Ciudadano'), ('Operador'), ('Administrador');

INSERT INTO punto_reciclaje (nombre, direccion, localidad, latitud, longitud, horario) VALUES
 ('EcoPunto Suba',      'Calle 145 # 91-19',  'Suba',       4.746000, -74.083000, 'Lun-Sab 8:00-17:00'),
 ('EcoPunto Chapinero', 'Carrera 13 # 60-10', 'Chapinero',  4.646000, -74.064000, 'Lun-Vie 9:00-18:00'),
 ('EcoPunto Kennedy',   'Avenida 1 de Mayo # 68-30', 'Kennedy', 4.626000, -74.140000, 'Lun-Dom 7:00-16:00');

INSERT INTO tipo_residuo (nombre, descripcion, factor_co2_kg) VALUES
 ('Plastico', 'Botellas y envases PET/HDPE limpios', 1.500),
 ('Papel y carton', 'Papel de oficina, periodico y cajas', 0.900),
 ('Vidrio', 'Botellas y frascos de vidrio', 0.300),
 ('Metal', 'Latas de aluminio y acero', 9.000),
 ('Residuos electronicos', 'Pequenos aparatos y cables', 2.000);

INSERT INTO punto_tipo_residuo (id_punto, id_tipo) VALUES
 (1,1),(1,2),(1,3),(1,4),
 (2,1),(2,2),(2,5),
 (3,1),(3,2),(3,3),(3,4),(3,5);

-- --------------------- VISTAS PARA REPORTES / ESTADISTICAS ---------------------
-- Solo cuentan los registros aprobados: un dato sin validar no puede
-- sumar al impacto ambiental que reporta el proyecto.
CREATE OR REPLACE VIEW v_impacto_registro AS
SELECT r.id_registro, r.id_usuario, r.id_punto, r.id_tipo, t.nombre AS tipo_residuo,
       r.cantidad_kg, ROUND(r.cantidad_kg * t.factor_co2_kg, 2) AS co2_evitado_kg,
       r.fecha_registro
FROM registro_reciclaje r
JOIN tipo_residuo t ON t.id_tipo = r.id_tipo
WHERE r.estado = 'aprobado';

CREATE OR REPLACE VIEW v_estadisticas_mensuales AS
SELECT DATE_FORMAT(fecha_registro, '%Y-%m') AS mes, tipo_residuo,
       SUM(cantidad_kg) AS total_kg, SUM(co2_evitado_kg) AS co2_evitado_kg
FROM v_impacto_registro
GROUP BY DATE_FORMAT(fecha_registro, '%Y-%m'), tipo_residuo;
