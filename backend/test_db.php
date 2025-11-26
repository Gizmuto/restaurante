<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

$conn = new mysqli("127.0.0.1", "root", "", "app_comidas", 3306);

if ($conn->connect_error) {
    die("ERROR CONEXIÓN: " . $conn->connect_error);
}

echo "Conexion exitosa";
?>
