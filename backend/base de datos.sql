-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1
-- Tiempo de generación: 28-11-2025 a las 23:18:40
-- Versión del servidor: 10.4.32-MariaDB
-- Versión de PHP: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de datos: `app_comidas`
--

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `empresas`
--

CREATE TABLE `empresas` (
  `id` int(11) NOT NULL,
  `nombre` varchar(150) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `empresas`
--

INSERT INTO `empresas` (`id`, `nombre`) VALUES
(1, 'PalomitasVIP'),
(2, 'LalosVIP'),
(3, 'LaurasClub');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `menus`
--

CREATE TABLE `menus` (
  `id` int(11) NOT NULL,
  `nombre` varchar(255) NOT NULL,
  `descripcion` text DEFAULT NULL,
  `empresa_id` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `menus`
--

INSERT INTO `menus` (`id`, `nombre`, `descripcion`, `empresa_id`, `created_at`) VALUES
(17, 'CENA', 'comida para cenar', 3, '2025-11-26 16:50:38'),
(18, 'CENA', 'comida para cenar', 1, '2025-11-26 16:50:46'),
(19, 'Menu', 'comidas para noviembre', 2, '2025-11-26 17:03:25');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `menu_opciones`
--

CREATE TABLE `menu_opciones` (
  `id` int(11) NOT NULL,
  `menu_id` int(11) NOT NULL,
  `opcion_idx` tinyint(4) NOT NULL,
  `nombre` varchar(255) NOT NULL,
  `descripcion` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `menu_opciones`
--

INSERT INTO `menu_opciones` (`id`, `menu_id`, `opcion_idx`, `nombre`, `descripcion`) VALUES
(59, 17, 1, 'carne de res', 'ensalada y arroz'),
(60, 17, 2, 'albondiga', 'spaguetti'),
(61, 17, 3, 'huevo', 'con arroz'),
(62, 18, 1, 'carne de res', 'ensalada y arroz'),
(63, 18, 2, 'albondiga', 'spaguetti'),
(64, 18, 3, 'huevo', 'con arroz'),
(65, 19, 1, 'papotas', 'con sal'),
(66, 19, 2, 'papitas', 'sin sal'),
(67, 19, 3, 'papas', 'con azucar');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `menu_precios`
--

CREATE TABLE `menu_precios` (
  `id` int(11) NOT NULL,
  `menu_opcion_id` int(11) NOT NULL,
  `empresa_id` int(11) NOT NULL,
  `precio` decimal(10,2) NOT NULL DEFAULT 0.00
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `menu_precios`
--

INSERT INTO `menu_precios` (`id`, `menu_opcion_id`, `empresa_id`, `precio`) VALUES
(58, 59, 3, 12000.00),
(59, 60, 3, 12000.00),
(60, 61, 3, 1200.00),
(61, 62, 1, 12000.00),
(62, 63, 1, 12000.00),
(63, 64, 1, 1200.00),
(64, 65, 2, 12000.00),
(65, 66, 2, 11000.00),
(66, 67, 2, 10000.00);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `pedidos`
--

CREATE TABLE `pedidos` (
  `id` int(11) NOT NULL,
  `trabajador_id` int(11) NOT NULL,
  `opcion_id` int(11) NOT NULL,
  `fecha` date NOT NULL,
  `observaciones` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `pedidos`
--

INSERT INTO `pedidos` (`id`, `trabajador_id`, `opcion_id`, `fecha`, `observaciones`, `created_at`) VALUES
(16, 17, 66, '2025-11-26', NULL, '2025-11-26 21:33:45');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `usuarios`
--

CREATE TABLE `usuarios` (
  `id` int(11) NOT NULL,
  `identificacion` varchar(50) NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `perfil` enum('administrador','supervisor','vendedor','trabajador') DEFAULT 'trabajador',
  `empresa_id` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `usuarios`
--

INSERT INTO `usuarios` (`id`, `identificacion`, `nombre`, `email`, `password`, `perfil`, `empresa_id`, `created_at`, `updated_at`) VALUES
(6, '1144212587', 'Brad Collazos Vasquez', 'collazos.brad@correounivalle.edu.co', '$2y$10$U.lTV6/ejtnvD1t1QeNE2OxZMxJ/lYIrUO5L2aE8SzGPJ5MzNUJUa', 'administrador', NULL, '2025-11-12 05:26:15', '2025-11-12 05:37:59'),
(11, '114421258', 'Brad Collazos Vasquez', 'collazos.bra@correounivalle.edu.co', '$2y$10$/BC0rSo/xZX.XwcYP3w4suEjq.AB6DagxWw70Eoh.APUdKQPjOQWS', 'supervisor', NULL, '2025-11-12 05:44:41', '2025-11-12 05:44:41'),
(12, '11442125', 'Brad Collazos Vasquez', 'collazos.br@correounivalle.edu.co', '$2y$10$Yd6x5xCQWfAjkb1bLKD8RuYtrH0Z2HVc.I/IIOf8OHi7dp1O0GJym', 'vendedor', NULL, '2025-11-12 05:45:24', '2025-11-12 05:45:24'),
(13, '1144212', 'Brad Collazos Vasquez', 'collazos.bh@correounivalle.edu.co', '$2y$10$o0Sndh8VZQeDXscnQ.OqBOhTBDjxNwV6qyqAMl/wq2sLJSk/YTcUm', 'trabajador', 2, '2025-11-12 05:45:46', '2025-11-26 16:09:31'),
(16, '1006234415', 'Norman Sanchez', 'norma@mail.com', '$2y$10$ivZdrD4GdMZOU.vKdJz7rOAdGiXivjPE7EvZfrGyCAMYgjtUN37Pa', 'administrador', NULL, '2025-11-26 16:33:50', '2025-11-26 16:34:18'),
(17, '1122', 'Juan', 'juan@mail.com', '$2y$10$.n8470.JCcg0bgNhiMBMgewhyy7i5jLBk8MtEE88Jn6jMJbB4aZ.S', 'trabajador', 2, '2025-11-26 17:00:45', '2025-11-26 17:00:45');

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `empresas`
--
ALTER TABLE `empresas`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `menus`
--
ALTER TABLE `menus`
  ADD PRIMARY KEY (`id`),
  ADD KEY `menus_ibfk_empresa` (`empresa_id`);

--
-- Indices de la tabla `menu_opciones`
--
ALTER TABLE `menu_opciones`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `ux_menu_opcion` (`menu_id`,`opcion_idx`);

--
-- Indices de la tabla `menu_precios`
--
ALTER TABLE `menu_precios`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `ux_opcion_empresa` (`menu_opcion_id`,`empresa_id`);

--
-- Indices de la tabla `pedidos`
--
ALTER TABLE `pedidos`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_pedido_diario` (`trabajador_id`,`fecha`),
  ADD KEY `opcion_id` (`opcion_id`);

--
-- Indices de la tabla `usuarios`
--
ALTER TABLE `usuarios`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `identificacion` (`identificacion`),
  ADD UNIQUE KEY `email` (`email`),
  ADD KEY `idx_usuarios_empresa` (`empresa_id`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `empresas`
--
ALTER TABLE `empresas`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT de la tabla `menus`
--
ALTER TABLE `menus`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=20;

--
-- AUTO_INCREMENT de la tabla `menu_opciones`
--
ALTER TABLE `menu_opciones`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=68;

--
-- AUTO_INCREMENT de la tabla `menu_precios`
--
ALTER TABLE `menu_precios`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=67;

--
-- AUTO_INCREMENT de la tabla `pedidos`
--
ALTER TABLE `pedidos`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=17;

--
-- AUTO_INCREMENT de la tabla `usuarios`
--
ALTER TABLE `usuarios`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=18;

--
-- Restricciones para tablas volcadas
--

--
-- Filtros para la tabla `menus`
--
ALTER TABLE `menus`
  ADD CONSTRAINT `menus_ibfk_empresa` FOREIGN KEY (`empresa_id`) REFERENCES `empresas` (`id`) ON DELETE SET NULL;

--
-- Filtros para la tabla `menu_opciones`
--
ALTER TABLE `menu_opciones`
  ADD CONSTRAINT `menu_opciones_ibfk_1` FOREIGN KEY (`menu_id`) REFERENCES `menus` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `menu_precios`
--
ALTER TABLE `menu_precios`
  ADD CONSTRAINT `menu_precios_ibfk_1` FOREIGN KEY (`menu_opcion_id`) REFERENCES `menu_opciones` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `pedidos`
--
ALTER TABLE `pedidos`
  ADD CONSTRAINT `pedidos_ibfk_1` FOREIGN KEY (`trabajador_id`) REFERENCES `usuarios` (`id`),
  ADD CONSTRAINT `pedidos_ibfk_2` FOREIGN KEY (`opcion_id`) REFERENCES `menu_opciones` (`id`);

--
-- Filtros para la tabla `usuarios`
--
ALTER TABLE `usuarios`
  ADD CONSTRAINT `usuarios_ibfk_1` FOREIGN KEY (`empresa_id`) REFERENCES `empresas` (`id`) ON DELETE SET NULL;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
