<?php
// api/lives.php
require_once 'config.php';

if (!isLoggedIn()) jsonResponse(['error' => 'No autorizado'], 401);

$action = $_GET['action'] ?? '';

if ($action === 'get_current') {
    $stmt = $pdo->query("SELECT * FROM live_sessions WHERE date >= CURDATE() ORDER BY date ASC LIMIT 1");
    jsonResponse($stmt->fetch() ?: null);
}

if ($action === 'check_access') {
    $sessionId = $_GET['session_id'];
    $email = $_SESSION['user_email'];
    
    if ($_SESSION['user_sub'] === 'premium') {
        jsonResponse(['access' => true, 'type' => 'premium']);
    }
    
    $stmt = $pdo->prepare("SELECT * FROM live_access WHERE session_id = ? AND user_email = ?");
    $stmt->execute([$sessionId, $email]);
    $access = $stmt->fetch();
    
    jsonResponse(['access' => (bool)$access, 'type' => $access ? $access['access_type'] : 'none']);
}

if ($action === 'create' && isAdmin()) {
    $data = json_decode(file_get_contents('php://input'), true);
    $stmt = $pdo->prepare("INSERT INTO live_sessions (date, live_url, description) VALUES (?,?,?)");
    $stmt->execute([$data['date'], $data['live_url'], $data['description']]);
    jsonResponse(['message' => 'Sesión en directo programada']);
}

if ($action === 'update' && isAdmin()) {
    $data = json_decode(file_get_contents('php://input'), true);
    $stmt = $pdo->prepare("UPDATE live_sessions SET date = ?, live_url = ?, description = ? WHERE id = ?");
    $stmt->execute([$data['date'], $data['live_url'], $data['description'], $data['id']]);
    jsonResponse(['message' => 'Sesión actualizada correctamente']);
}

if ($action === 'delete' && isAdmin()) {
    $id = $_GET['id'];
    $stmt = $pdo->prepare("DELETE FROM live_sessions WHERE id = ?");
    $stmt->execute([$id]);
    jsonResponse(['message' => 'Sesión eliminada correctamente']);
}

if ($action === 'list' && isAdmin()) {
    $stmt = $pdo->query("SELECT * FROM live_sessions ORDER BY date DESC");
    jsonResponse($stmt->fetchAll());
}
?>