<?php
// api/feedback.php - v20.0 Robust Doubts
require_once 'config.php';

if (!isLoggedIn()) jsonResponse(['error' => 'No autorizado'], 401);

$action = $_GET['action'] ?? '';
$email = $_SESSION['user_email'];

if ($action === 'get_client_thread') {
    $stmt = $pdo->prepare("SELECT * FROM exercise_feedback WHERE user_email = ? ORDER BY created_at DESC");
    $stmt->execute([$email]);
    jsonResponse($stmt->fetchAll());
}

if ($action === 'send') {
    $data = json_decode(file_get_contents('php://input'), true);
    $stmt = $pdo->prepare("INSERT INTO exercise_feedback (assignment_id, user_email, message) VALUES (?,?,?)");
    $stmt->execute([$data['assignment_id'], $email, $data['message']]);
    jsonResponse(['success' => true]);
}

if ($action === 'get_pending' && isAdmin()) {
    $stmt = $pdo->query("SELECT f.*, u.dogName, u.subscription, e.name as exercise_name 
                         FROM exercise_feedback f 
                         JOIN users u ON f.user_email = u.email 
                         LEFT JOIN assignments a ON f.assignment_id = a.id
                         LEFT JOIN exercises_library e ON a.exercise_id = e.id
                         WHERE f.admin_response IS NULL 
                         ORDER BY u.subscription DESC, f.created_at ASC");
    jsonResponse($stmt->fetchAll());
}

if ($action === 'respond' && isAdmin()) {
    $data = json_decode(file_get_contents('php://input'), true);
    $stmt = $pdo->prepare("UPDATE exercise_feedback SET admin_response = ?, responded_at = NOW() WHERE id = ?");
    $stmt->execute([$data['response'], $data['feedback_id']]);
    jsonResponse(['success' => true]);
}

if ($action === 'get_thread') {
    $aid = $_GET['assignment_id'];
    $stmt = $pdo->prepare("SELECT * FROM exercise_feedback WHERE assignment_id = ? ORDER BY created_at ASC");
    $stmt->execute([$aid]);
    jsonResponse($stmt->fetchAll());
}
?>