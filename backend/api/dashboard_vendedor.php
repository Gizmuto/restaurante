<?php
header("Content-Type: application/json");
require_once __DIR__ . '/../db.php';

$vendedor_id = $_GET['vendedor_id'] ?? null;

if (!$vendedor_id) {
    echo json_encode(["error" => "Falta vendedor_id"]);
    exit;
}

/* --- 1. Pedidos del día --- */
$sql_pedidos = "
    SELECT 
        p.id,
        p.estado,
        p.fecha,
        mo.nombre AS opcion,
        m.nombre AS menu,
        u.nombre AS cliente
    FROM pedidos p
    INNER JOIN menu_opciones mo ON p.opcion_id = mo.id
    INNER JOIN menus m ON mo.menu_id = m.id
    INNER JOIN usuarios u ON p.usuario_id = u.id
    WHERE p.vendedor_id = ?
    ORDER BY p.id DESC
";

$stmt = $conn->prepare($sql_pedidos);
$stmt->bind_param("i", $vendedor_id);
$stmt->execute();
$res_pedidos = $stmt->get_result();

$pedidos = [];
while ($row = $res_pedidos->fetch_assoc()) {
    $pedidos[] = $row;
}


/* --- 2. Resumen por opción de menú --- */
$sql_resumen = "
    SELECT 
        mo.nombre AS opcion,
        COUNT(p.id) AS total
    FROM menu_opciones mo
    LEFT JOIN pedidos p ON p.opcion_id = mo.id AND p.vendedor_id = ?
    GROUP BY mo.id
";

$stmt2 = $conn->prepare($sql_resumen);
$stmt2->bind_param("i", $vendedor_id);
$stmt2->execute();
$res_resumen = $stmt2->get_result();

$resumen = [];
while ($row = $res_resumen->fetch_assoc()) {
    $resumen[] = $row;
}


/* --- 3. Historial de acciones del vendedor --- */
$sql_historial = "
    SELECT 
        vh.id,
        vh.accion,
        vh.fecha_hora,
        mo.nombre AS opcion
    FROM vendedor_historial vh
    INNER JOIN pedidos p ON vh.pedido_id = p.id
    INNER JOIN menu_opciones mo ON p.opcion_id = mo.id
    WHERE vh.vendedor_id = ?
    ORDER BY vh.fecha_hora DESC
";

$stmt3 = $conn->prepare($sql_historial);
$stmt3->bind_param("i", $vendedor_id);
$stmt3->execute();
$res_historial = $stmt3->get_result();

$historial = [];
while ($row = $res_historial->fetch_assoc()) {
    $historial[] = $row;
}

echo json_encode([
    "pedidos"   => $pedidos,
    "resumen"   => $resumen,
    "historial" => $historial
]);

$conn->close();
?>
