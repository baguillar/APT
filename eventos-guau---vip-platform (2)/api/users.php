<?php
// api/users.php - v20.7 Extreme Stability
require_once 'config.php';

if (!isLoggedIn()) jsonResponse(['error' => 'No autorizado'], 401);

$action = $_GET['action'] ?? '';
$email = $_SESSION['user_email'] ?? '';

try {
    if ($action === 'get_profile') {
        $targetEmail = (isAdmin() && isset($_GET['email'])) ? $_GET['email'] : $email;
        $stmt = $pdo->prepare("SELECT * FROM users WHERE email = ?");
        $stmt->execute([$targetEmail]);
        $user = $stmt->fetch();
        if (!$user) jsonResponse(['error' => 'Usuario no encontrado'], 404);
        unset($user['password']);
        jsonResponse($user);
    }

    if ($action === 'get_health') {
        $targetEmail = (isAdmin() && isset($_GET['email'])) ? $_GET['email'] : $email;
        $stmtC = $pdo->prepare("SELECT * FROM health_status WHERE user_email = ?");
        $stmtC->execute([$targetEmail]);
        $current = $stmtC->fetch() ?: ['physical'=>5, 'cognitive'=>5, 'social'=>5, 'emotional'=>5];

        $stmtP = $pdo->prepare("SELECT * FROM health_requests WHERE user_email = ? AND status = 'pending' ORDER BY created_at DESC LIMIT 1");
        $stmtP->execute([$targetEmail]);
        $pending = $stmtP->fetch() ?: null;

        $stmtL = $pdo->prepare("SELECT admin_comment FROM health_requests WHERE user_email = ? AND admin_comment IS NOT NULL ORDER BY responded_at DESC LIMIT 1");
        $stmtL->execute([$targetEmail]);
        $last = $stmtL->fetch() ?: null;

        jsonResponse(['current' => $current, 'pending' => $pending, 'last_request' => $last]);
    }

    if ($action === 'admin_update_health' && isAdmin()) {
        $data = json_decode(file_get_contents('php://input'), true);
        if (!isset($data['email'])) jsonResponse(['error' => 'Email faltante'], 400);
        
        // No incluimos updated_at para que MySQL lo maneje solo
        $stmtU = $pdo->prepare("REPLACE INTO health_status (user_email, physical, cognitive, social, emotional) VALUES (?,?,?,?,?)");
        $stmtU->execute([$data['email'], $data['physical'], $data['cognitive'], $data['social'], $data['emotional']]);
        jsonResponse(['success' => true]);
    }

    if ($action === 'validate_health' && isAdmin()) {
        $data = json_decode(file_get_contents('php://input'), true);
        $requestId = intval($data['request_id'] ?? 0);
        $status = $data['status'] ?? 'rejected';
        $adminComment = $data['admin_comment'] ?? '';

        if ($requestId <= 0) jsonResponse(['error' => 'ID de solicitud invalido'], 400);
        
        $pdo->beginTransaction();
        
        $stmtVals = $pdo->prepare("SELECT * FROM health_requests WHERE id = ?");
        $stmtVals->execute([$requestId]);
        $req = $stmtVals->fetch();

        if (!$req) {
            $pdo->rollBack();
            jsonResponse(['error' => 'La solicitud no existe'], 404);
        }

        // Actualizar solicitud
        $stmtR = $pdo->prepare("UPDATE health_requests SET status = ?, admin_comment = ?, responded_at = NOW() WHERE id = ?");
        $stmtR->execute([$status, $adminComment, $requestId]);

        if ($status === 'approved') {
            // No incluimos updated_at para máxima compatibilidad
            $stmtU = $pdo->prepare("REPLACE INTO health_status (user_email, physical, cognitive, social, emotional) VALUES (?,?,?,?,?)");
            $stmtU->execute([$req['user_email'], $req['p_physical'], $req['p_cognitive'], $req['p_social'], $req['p_emotional']]);
        }
        
        $pdo->commit();
        jsonResponse(['success' => true]);
    }

    if ($action === 'request_health_review') {
        $data = json_decode(file_get_contents('php://input'), true);
        $stmt = $pdo->prepare("INSERT INTO health_requests (user_email, p_physical, p_cognitive, p_social, p_emotional, user_comment) VALUES (?,?,?,?,?,?)");
        $stmt->execute([$email, $data['physical'], $data['cognitive'], $data['social'], $data['emotional'], $data['comment']]);
        jsonResponse(['success' => true]);
    }

    if ($action === 'update_training_days') {
        $data = json_decode(file_get_contents('php://input'), true);
        $stmt = $pdo->prepare("UPDATE users SET training_days = ? WHERE email = ?");
        $stmt->execute([$data['training_days'], $email]);
        jsonResponse(['success' => true]);
    }

    jsonResponse(['error' => 'Accion no valida'], 400);
} catch (Exception $e) {
    if (isset($pdo) && $pdo->inTransaction()) $pdo->rollBack();
    error_log("Health Error: " . $e->getMessage());
    jsonResponse(['error' => 'Error en el servidor', 'detail' => $e->getMessage()], 500);
}
?>