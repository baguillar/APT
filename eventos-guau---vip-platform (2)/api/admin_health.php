<?php
// api/admin_health.php - v12.0 Stable
require_once 'config.php';

if (!isAdmin()) jsonResponse(['error' => 'No autorizado'], 403);

$action = $_GET['action'] ?? '';

if ($action === 'list_pending') {
    // Unir con users para tener el dogName
    $stmt = $pdo->query("SELECT hr.*, u.dogName, u.ownerName 
                         FROM health_requests hr 
                         JOIN users u ON hr.user_email = u.email 
                         WHERE hr.status = 'pending' 
                         ORDER BY hr.created_at DESC");
    jsonResponse($stmt->fetchAll());
}
?>