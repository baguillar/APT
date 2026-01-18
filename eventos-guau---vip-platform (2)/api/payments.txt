<?php
// api/payments.php
require_once 'config.php';

if (!isLoggedIn()) jsonResponse(['error' => 'No autorizado'], 401);

$action = $_GET['action'] ?? '';
$email = $_SESSION['user_email'];

if ($action === 'history') {
    $stmt = $pdo->prepare("SELECT * FROM payments WHERE user_email = ? ORDER BY created_at DESC");
    $stmt->execute([$email]);
    jsonResponse($stmt->fetchAll() ?: []);
}

if ($action === 'get_order_status') {
    $order = $_GET['order'] ?? '';
    $stmt = $pdo->prepare("SELECT status FROM payments WHERE redsys_order = ? AND user_email = ?");
    $stmt->execute([$order, $email]);
    jsonResponse($stmt->fetch() ?: ['status' => 'not_found']);
}
?>