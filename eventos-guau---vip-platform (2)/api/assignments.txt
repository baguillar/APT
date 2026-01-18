<?php
// api/assignments.php - v17.5
require_once 'config.php';

if (!isLoggedIn()) jsonResponse(['error' => 'No autorizado'], 401);

$action = $_GET['action'] ?? '';

try {
    if ($action === 'get_week') {
        $email = $_GET['user'] ?? $_SESSION['user_email'];
        $start = $_GET['start'] ?? date('Y-m-d', strtotime('monday this week'));
        $end = date('Y-m-d', strtotime($start . ' + 6 days'));

        $stmt = $pdo->prepare("SELECT a.*, e.name, e.videoURL, e.description as original_desc 
                               FROM assignments a 
                               JOIN exercises_library e ON a.exercise_id = e.id 
                               WHERE a.user_email = ? AND a.date BETWEEN ? AND ?");
        $stmt->execute([$email, $start, $end]);
        $res = $stmt->fetchAll();
        jsonResponse($res ?: []);
    }

    if ($action === 'complete') {
        $data = json_decode(file_get_contents('php://input'), true);
        $id = (int)($data['id'] ?? 0);
        
        $stmtCheck = $pdo->prepare("SELECT completed FROM assignments WHERE id = ? AND user_email = ?");
        $stmtCheck->execute([$id, $_SESSION['user_email']]);
        $current = $stmtCheck->fetch();
        
        if (!$current) jsonResponse(['error' => 'No encontrado'], 404);

        $newStatus = ($current['completed'] == 1) ? 0 : 1;
        $stmt = $pdo->prepare("UPDATE assignments SET completed = ?, completed_at = NOW() WHERE id = ? AND user_email = ?");
        $stmt->execute([$newStatus, $id, $_SESSION['user_email']]);
        
        jsonResponse(['message' => 'OK', 'new_status' => $newStatus]);
    }
} catch (Exception $e) {
    jsonResponse(['error' => 'Server Error', 'detail' => $e->getMessage()], 500);
}
?>