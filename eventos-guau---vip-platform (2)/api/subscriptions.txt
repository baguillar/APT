<?php
// api/subscriptions.php
require_once 'config.php';

if (!isLoggedIn()) jsonResponse(['error' => 'No autorizado'], 401);

$action = $_GET['action'] ?? '';
$email = $_SESSION['user_email'];

if ($action === 'upgrade') {
    $data = json_decode(file_get_contents('php://input'), true);
    $newPlan = $data['plan'];
    
    // In production, this would be called after a successful Redsys IPN notification
    $stmt = $pdo->prepare("UPDATE users SET subscription = ?, status = 'active' WHERE email = ?");
    $stmt->execute([$newPlan, $email]);
    
    $_SESSION['user_sub'] = $newPlan;
    $_SESSION['user_status'] = 'active';
    
    jsonResponse(['message' => 'Plan actualizado a ' . $newPlan]);
}

if ($action === 'get_plans') {
    jsonResponse([
        ['id' => 'basic', 'name' => 'Básico', 'price' => PLAN_BASIC_PRICE],
        ['id' => 'premium', 'name' => 'Premium', 'price' => PLAN_PREMIUM_PRICE]
    ]);
}
?>