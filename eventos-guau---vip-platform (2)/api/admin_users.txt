<?php
// api/admin_users.php
require_once 'config.php';

if (!isAdmin()) jsonResponse(['error' => 'No autorizado'], 403);

$action = $_GET['action'] ?? '';

if ($action === 'list_segmented') {
    $today = date('Y-m-d');
    $next7Days = date('Y-m-d', strtotime('+7 days'));

    // Usuarios sin tareas en los próximos 7 días (Pendientes)
    $stmtPend = $pdo->query("SELECT u.email, u.dogName, u.subscription, u.status, u.training_days,
                             (SELECT MAX(date) FROM assignments WHERE user_email = u.email) as last_assign
                             FROM users u 
                             WHERE u.role = 'client' AND u.status = 'active'
                             AND u.email NOT IN (SELECT DISTINCT user_email FROM assignments WHERE date BETWEEN '$today' AND '$next7Days')
                             ORDER BY u.subscription DESC, last_assign ASC");
    $pending = $stmtPend->fetchAll();

    // Usuarios con tareas ya programadas
    $stmtPlan = $pdo->query("SELECT u.email, u.dogName, u.subscription, u.status, u.training_days,
                             (SELECT COUNT(*) FROM assignments WHERE user_email = u.email AND date BETWEEN '$today' AND '$next7Days') as total_week
                             FROM users u 
                             WHERE u.role = 'client' AND u.status = 'active'
                             AND u.email IN (SELECT DISTINCT user_email FROM assignments WHERE date BETWEEN '$today' AND '$next7Days')
                             ORDER BY total_week ASC");
    $planned = $stmtPlan->fetchAll();

    jsonResponse(['pending' => $pending, 'planned' => $planned]);
}

if ($action === 'get_full_profile') {
    $email = $_GET['email'];
    // Perfil + Salud
    $stmt = $pdo->prepare("SELECT * FROM users WHERE email = ?");
    $stmt->execute([$email]);
    $user = $stmt->fetch();
    
    // Dudas del usuario
    $stmtF = $pdo->prepare("SELECT f.*, e.name as exercise_name 
                            FROM exercise_feedback f 
                            JOIN assignments a ON f.assignment_id = a.id
                            JOIN exercises_library e ON a.exercise_id = e.id
                            WHERE f.user_email = ? ORDER BY f.created_at DESC");
    $stmtF->execute([$email]);
    $doubts = $stmtF->fetchAll();

    jsonResponse(['user' => $user, 'doubts' => $doubts]);
}

if ($action === 'update_trainer_notes') {
    $data = json_decode(file_get_contents('php://input'), true);
    $stmt = $pdo->prepare("UPDATE users SET trainer_notes = ? WHERE email = ?");
    $stmt->execute([$data['notes'], $data['email']]);
    jsonResponse(['message' => 'Notas del entrenador actualizadas']);
}

if ($action === 'list') {
    $stmt = $pdo->query("SELECT email, dogName, subscription, status, created_at FROM users WHERE role = 'client' ORDER BY created_at DESC");
    jsonResponse($stmt->fetchAll());
}

if ($action === 'update_status') {
    $data = json_decode(file_get_contents('php://input'), true);
    $stmt = $pdo->prepare("UPDATE users SET status = ?, subscription = ?, dogName = ?, dogObjective = ?, trainer_notes = ? WHERE email = ?");
    $stmt->execute([$data['status'], $data['subscription'], $data['dogName'] ?? '', $data['dogObjective'] ?? '', $data['trainer_notes'] ?? '', $data['email']]);
    jsonResponse(['message' => 'Usuario actualizado correctamente']);
}
?>