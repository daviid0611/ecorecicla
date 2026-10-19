-- =====================================================================
--  EcoRecicla - Export de la base de datos
--  Proyecto PLANETA VERDE - Universidad Manuela Beltran
--  Generado con mysqldump despues de correr database/seed.js
--  Restaurar con:  mysql -u root -p < ecorecicla_export.sql
--  Los hashes de contrasena son reales (bcrypt), generados por el seed.
-- =====================================================================

-- MariaDB dump 10.19  Distrib 10.4.32-MariaDB, for Win64 (AMD64)
--
-- Host: localhost    Database: ecorecicla
-- ------------------------------------------------------
-- Server version	10.4.32-MariaDB

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Current Database: `ecorecicla`
--

CREATE DATABASE /*!32312 IF NOT EXISTS*/ `ecorecicla` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci */;

USE `ecorecicla`;

--
-- Table structure for table `punto_reciclaje`
--

DROP TABLE IF EXISTS `punto_reciclaje`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `punto_reciclaje` (
  `id_punto` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) NOT NULL,
  `direccion` varchar(150) NOT NULL,
  `localidad` varchar(60) NOT NULL,
  `latitud` decimal(9,6) DEFAULT NULL,
  `longitud` decimal(9,6) DEFAULT NULL,
  `horario` varchar(100) DEFAULT NULL,
  `estado` enum('activo','inactivo') NOT NULL DEFAULT 'activo',
  PRIMARY KEY (`id_punto`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `punto_reciclaje`
--

LOCK TABLES `punto_reciclaje` WRITE;
/*!40000 ALTER TABLE `punto_reciclaje` DISABLE KEYS */;
INSERT INTO `punto_reciclaje` VALUES (1,'EcoPunto Suba','Calle 145 # 91-19','Suba',4.746000,-74.083000,'Lun-Sab 8:00-17:00','activo'),(2,'EcoPunto Chapinero','Carrera 13 # 60-10','Chapinero',4.646000,-74.064000,'Lun-Vie 9:00-18:00','activo'),(3,'EcoPunto Kennedy','Avenida 1 de Mayo # 68-30','Kennedy',4.626000,-74.140000,'Lun-Dom 7:00-16:00','activo');
/*!40000 ALTER TABLE `punto_reciclaje` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `punto_tipo_residuo`
--

DROP TABLE IF EXISTS `punto_tipo_residuo`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `punto_tipo_residuo` (
  `id_punto` int(10) unsigned NOT NULL,
  `id_tipo` smallint(5) unsigned NOT NULL,
  PRIMARY KEY (`id_punto`,`id_tipo`),
  KEY `fk_ptr_tipo` (`id_tipo`),
  CONSTRAINT `fk_ptr_punto` FOREIGN KEY (`id_punto`) REFERENCES `punto_reciclaje` (`id_punto`) ON DELETE CASCADE,
  CONSTRAINT `fk_ptr_tipo` FOREIGN KEY (`id_tipo`) REFERENCES `tipo_residuo` (`id_tipo`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `punto_tipo_residuo`
--

LOCK TABLES `punto_tipo_residuo` WRITE;
/*!40000 ALTER TABLE `punto_tipo_residuo` DISABLE KEYS */;
INSERT INTO `punto_tipo_residuo` VALUES (1,1),(1,2),(1,3),(1,4),(2,1),(2,2),(2,5),(3,1),(3,2),(3,3),(3,4),(3,5);
/*!40000 ALTER TABLE `punto_tipo_residuo` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `registro_reciclaje`
--

DROP TABLE IF EXISTS `registro_reciclaje`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `registro_reciclaje` (
  `id_registro` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `id_usuario` int(10) unsigned NOT NULL,
  `id_punto` int(10) unsigned NOT NULL,
  `id_tipo` smallint(5) unsigned NOT NULL,
  `cantidad_kg` decimal(8,2) NOT NULL,
  `fecha_registro` datetime NOT NULL DEFAULT current_timestamp(),
  `observaciones` varchar(200) DEFAULT NULL,
  `estado` enum('pendiente','aprobado','rechazado') NOT NULL DEFAULT 'pendiente',
  `id_validador` int(10) unsigned DEFAULT NULL,
  `fecha_validacion` datetime DEFAULT NULL,
  `observacion_validacion` varchar(200) DEFAULT NULL,
  PRIMARY KEY (`id_registro`),
  KEY `idx_reg_usuario_fecha` (`id_usuario`,`fecha_registro`),
  KEY `idx_reg_punto_estado` (`id_punto`,`estado`),
  KEY `fk_reg_tipo` (`id_tipo`),
  KEY `fk_reg_validador` (`id_validador`),
  CONSTRAINT `fk_reg_punto` FOREIGN KEY (`id_punto`) REFERENCES `punto_reciclaje` (`id_punto`),
  CONSTRAINT `fk_reg_tipo` FOREIGN KEY (`id_tipo`) REFERENCES `tipo_residuo` (`id_tipo`),
  CONSTRAINT `fk_reg_usuario` FOREIGN KEY (`id_usuario`) REFERENCES `usuario` (`id_usuario`),
  CONSTRAINT `fk_reg_validador` FOREIGN KEY (`id_validador`) REFERENCES `usuario` (`id_usuario`),
  CONSTRAINT `ck_cantidad_pos` CHECK (`cantidad_kg` > 0)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `registro_reciclaje`
--

LOCK TABLES `registro_reciclaje` WRITE;
/*!40000 ALTER TABLE `registro_reciclaje` DISABLE KEYS */;
INSERT INTO `registro_reciclaje` VALUES (1,3,1,1,2.50,'2026-08-03 10:15:00','Botellas PET','aprobado',NULL,NULL,NULL),(2,3,1,2,4.00,'2026-08-10 16:40:00',NULL,'aprobado',NULL,NULL,NULL),(3,3,3,4,0.80,'2026-08-17 09:05:00','Latas de aluminio','pendiente',NULL,NULL,NULL),(4,4,2,5,1.20,'2026-08-20 11:30:00','Cargadores','aprobado',NULL,NULL,NULL),(5,4,3,3,6.00,'2026-09-02 15:00:00',NULL,'pendiente',NULL,NULL,NULL),(6,4,1,1,3.10,'2026-09-08 12:20:00',NULL,'aprobado',NULL,NULL,NULL);
/*!40000 ALTER TABLE `registro_reciclaje` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `reporte`
--

DROP TABLE IF EXISTS `reporte`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `reporte` (
  `id_reporte` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `id_usuario` int(10) unsigned NOT NULL,
  `tipo` enum('personal','global') NOT NULL DEFAULT 'personal',
  `fecha_inicio` date NOT NULL,
  `fecha_fin` date NOT NULL,
  `total_kg` decimal(10,2) NOT NULL DEFAULT 0.00,
  `co2_evitado_kg` decimal(10,2) NOT NULL DEFAULT 0.00,
  `fecha_generacion` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id_reporte`),
  KEY `fk_reporte_usuario` (`id_usuario`),
  CONSTRAINT `fk_reporte_usuario` FOREIGN KEY (`id_usuario`) REFERENCES `usuario` (`id_usuario`),
  CONSTRAINT `ck_reporte_fechas` CHECK (`fecha_fin` >= `fecha_inicio`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `reporte`
--

LOCK TABLES `reporte` WRITE;
/*!40000 ALTER TABLE `reporte` DISABLE KEYS */;
/*!40000 ALTER TABLE `reporte` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `rol`
--

DROP TABLE IF EXISTS `rol`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `rol` (
  `id_rol` tinyint(3) unsigned NOT NULL AUTO_INCREMENT,
  `nombre` varchar(30) NOT NULL,
  PRIMARY KEY (`id_rol`),
  UNIQUE KEY `uq_rol_nombre` (`nombre`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `rol`
--

LOCK TABLES `rol` WRITE;
/*!40000 ALTER TABLE `rol` DISABLE KEYS */;
INSERT INTO `rol` VALUES (3,'Administrador'),(1,'Ciudadano'),(2,'Operador');
/*!40000 ALTER TABLE `rol` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tipo_residuo`
--

DROP TABLE IF EXISTS `tipo_residuo`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `tipo_residuo` (
  `id_tipo` smallint(5) unsigned NOT NULL AUTO_INCREMENT,
  `nombre` varchar(50) NOT NULL,
  `descripcion` varchar(200) DEFAULT NULL,
  `factor_co2_kg` decimal(6,3) NOT NULL COMMENT 'kg de CO2 evitados por kg reciclado',
  PRIMARY KEY (`id_tipo`),
  UNIQUE KEY `uq_tipo_nombre` (`nombre`),
  CONSTRAINT `ck_factor_pos` CHECK (`factor_co2_kg` > 0)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tipo_residuo`
--

LOCK TABLES `tipo_residuo` WRITE;
/*!40000 ALTER TABLE `tipo_residuo` DISABLE KEYS */;
INSERT INTO `tipo_residuo` VALUES (1,'Plastico','Botellas y envases PET/HDPE limpios',1.500),(2,'Papel y carton','Papel de oficina, periodico y cajas',0.900),(3,'Vidrio','Botellas y frascos de vidrio',0.300),(4,'Metal','Latas de aluminio y acero',9.000),(5,'Residuos electronicos','Pequenos aparatos y cables',2.000);
/*!40000 ALTER TABLE `tipo_residuo` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `usuario`
--

DROP TABLE IF EXISTS `usuario`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `usuario` (
  `id_usuario` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `id_rol` tinyint(3) unsigned NOT NULL,
  `id_punto` int(10) unsigned DEFAULT NULL,
  `nombre` varchar(100) NOT NULL,
  `correo` varchar(120) NOT NULL,
  `contrasena_hash` varchar(100) NOT NULL,
  `telefono` varchar(20) DEFAULT NULL,
  `fecha_registro` datetime NOT NULL DEFAULT current_timestamp(),
  `estado` enum('activo','inactivo') NOT NULL DEFAULT 'activo',
  PRIMARY KEY (`id_usuario`),
  UNIQUE KEY `uq_usuario_correo` (`correo`),
  KEY `fk_usuario_rol` (`id_rol`),
  KEY `fk_usuario_punto` (`id_punto`),
  CONSTRAINT `fk_usuario_punto` FOREIGN KEY (`id_punto`) REFERENCES `punto_reciclaje` (`id_punto`),
  CONSTRAINT `fk_usuario_rol` FOREIGN KEY (`id_rol`) REFERENCES `rol` (`id_rol`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `usuario`
--

LOCK TABLES `usuario` WRITE;
/*!40000 ALTER TABLE `usuario` DISABLE KEYS */;
INSERT INTO `usuario` VALUES (1,3,NULL,'Admin EcoRecicla','admin@ecorecicla.test','$2b$10$.hPp/N9MMncnK34NZUq54eSq5FBZL/Qt.w3rGy4W6fZ5ZLc24.RYG','3000000001','2026-09-20 23:50:26','activo'),(2,2,1,'Operador Suba','operador@ecorecicla.test','$2b$10$cEbt8UqasTHffMFimXCoYe1tT93t3X/8etnawSB1hMirSiFrTaYKG','3000000002','2026-09-20 23:50:26','activo'),(3,1,NULL,'Laura Gomez','laura@ecorecicla.test','$2b$10$P8BmAQ31t0YcB8rcXDrjsOp42HddaOVXlL136Mn8JHACdyBH5nS0u','3000000003','2026-09-20 23:50:26','activo'),(4,1,NULL,'Carlos Perez','carlos@ecorecicla.test','$2b$10$PkHgSHGNbeqo.Kl1cVmBkeCg3ckUA7pyHcLr.Vkdu2m5uWY./w4Oi','3000000004','2026-09-20 23:50:26','activo');
/*!40000 ALTER TABLE `usuario` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Temporary table structure for view `v_estadisticas_mensuales`
--

DROP TABLE IF EXISTS `v_estadisticas_mensuales`;
/*!50001 DROP VIEW IF EXISTS `v_estadisticas_mensuales`*/;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8;
/*!50001 CREATE VIEW `v_estadisticas_mensuales` AS SELECT
 1 AS `mes`,
  1 AS `tipo_residuo`,
  1 AS `total_kg`,
  1 AS `co2_evitado_kg` */;
SET character_set_client = @saved_cs_client;

--
-- Temporary table structure for view `v_impacto_registro`
--

DROP TABLE IF EXISTS `v_impacto_registro`;
/*!50001 DROP VIEW IF EXISTS `v_impacto_registro`*/;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8;
/*!50001 CREATE VIEW `v_impacto_registro` AS SELECT
 1 AS `id_registro`,
  1 AS `id_usuario`,
  1 AS `id_punto`,
  1 AS `id_tipo`,
  1 AS `tipo_residuo`,
  1 AS `cantidad_kg`,
  1 AS `co2_evitado_kg`,
  1 AS `fecha_registro` */;
SET character_set_client = @saved_cs_client;

--
-- Dumping events for database 'ecorecicla'
--

--
-- Dumping routines for database 'ecorecicla'
--

--
-- Current Database: `ecorecicla`
--

USE `ecorecicla`;

--
-- Final view structure for view `v_estadisticas_mensuales`
--

/*!50001 DROP VIEW IF EXISTS `v_estadisticas_mensuales`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = cp850 */;
/*!50001 SET character_set_results     = cp850 */;
/*!50001 SET collation_connection      = cp850_general_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`localhost` SQL SECURITY DEFINER */
/*!50001 VIEW `v_estadisticas_mensuales` AS select date_format(`v_impacto_registro`.`fecha_registro`,'%Y-%m') AS `mes`,`v_impacto_registro`.`tipo_residuo` AS `tipo_residuo`,sum(`v_impacto_registro`.`cantidad_kg`) AS `total_kg`,sum(`v_impacto_registro`.`co2_evitado_kg`) AS `co2_evitado_kg` from `v_impacto_registro` group by date_format(`v_impacto_registro`.`fecha_registro`,'%Y-%m'),`v_impacto_registro`.`tipo_residuo` */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;

--
-- Final view structure for view `v_impacto_registro`
--

/*!50001 DROP VIEW IF EXISTS `v_impacto_registro`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = cp850 */;
/*!50001 SET character_set_results     = cp850 */;
/*!50001 SET collation_connection      = cp850_general_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`localhost` SQL SECURITY DEFINER */
/*!50001 VIEW `v_impacto_registro` AS select `r`.`id_registro` AS `id_registro`,`r`.`id_usuario` AS `id_usuario`,`r`.`id_punto` AS `id_punto`,`r`.`id_tipo` AS `id_tipo`,`t`.`nombre` AS `tipo_residuo`,`r`.`cantidad_kg` AS `cantidad_kg`,round(`r`.`cantidad_kg` * `t`.`factor_co2_kg`,2) AS `co2_evitado_kg`,`r`.`fecha_registro` AS `fecha_registro` from (`registro_reciclaje` `r` join `tipo_residuo` `t` on(`t`.`id_tipo` = `r`.`id_tipo`)) where `r`.`estado` = 'aprobado' */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-09-20 23:50:27
