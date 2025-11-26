<?php
// backend/api/estado_servicio.php
header('Content-Type: application/json; charset=utf-8');
header("Access-Control-Allow-Origin: *"); // Ajusta según tu seguridad

// 1. ZONA HORARIA OBLIGATORIA
date_default_timezone_set('America/Bogota');

// 2. Obtener hora actual y límite
$hora_actual = (int)date('H');
$minutos_actual = (int)date('i');

// Regla: Cerrado si es mayor o igual a las 17 (5:00 PM)
// Si quieres ser más preciso (ej: 17:30), usa minutos. Aquí es 17:00 exacto.
$cerrado = ($hora_actual >= 17);

echo json_encode([
    'ok' => true,
    'hora_servidor' => date('h:i A'), // Para mostrar al usuario si quieres
    'hora_militar'  => date('H:i'),
    'cerrado'       => $cerrado
]);
?>