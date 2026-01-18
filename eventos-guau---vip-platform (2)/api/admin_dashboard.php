<?php
// api/admin_dashboard.php
require_once 'config.php';

if (!isAdmin()) jsonResponse(['error' => 'No autorizado'], 403);

$action = $_GET['action'] ?? 'get_alerts';

if ($action === 'get_alerts') {
    // 1. Dudas pendientes (Premium primero)
    $stmtDudas = $pdo->query("SELECT f.*, u.dogName, u.subscription, e.name as exercise_name 
                              FROM exercise_feedback f 
                              JOIN users u ON f.user_email = u.email 
                              JOIN assignments a ON f.assignment_id = a.id
                              JOIN exercises_library e ON a.exercise_id = e.id
                              WHERE f.admin_response IS NULL 
                              ORDER BY CASE WHEN u.subscription = 'premium' THEN 1 ELSE 2 END ASC, f.created_at ASC");
    $dudas = $stmtDudas->fetchAll();

    // 2. Solicitudes de salud pendientes
    $stmtHealth = $pdo->query("SELECT r.*, u.dogName FROM health_requests r 
                               JOIN users u ON r.user_email = u.email 
                               WHERE r.status = 'pending' ORDER BY r.created_at ASC");
    $health = $stmtHealth->fetchAll();

    // 3. Onboardings / Nuevos usuarios activos sin ejercicios asignados esta semana
    $startOfWeek = date('Y-m-d', strtotime('monday this week'));
    $stmtNew = $pdo->query("SELECT email, dogName, created_at FROM users 
                            WHERE role = 'client' AND status = 'active' 
                            AND email NOT IN (SELECT DISTINCT user_email FROM assignments WHERE date >= '$startOfWeek')
                            ORDER BY created_at DESC");
    $onboardings = $stmtNew->fetchAll();

    jsonResponse([
        'dudas' => $dudas,
        'health_requests' => $health,
        'new_users' => $onboardings
    ]);
}
?>