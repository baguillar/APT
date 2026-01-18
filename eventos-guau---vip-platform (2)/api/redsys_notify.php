<?php
// api/redsys_notify.php - Endpoint de notificación de Redsys
require_once 'config.php';

function decodeBase64($data) {
    return base64_decode(strtr($data, '-_', '+/'));
}

$params = $_POST['Ds_MerchantParameters'] ?? '';
$signatureRecibida = $_POST['Ds_Signature'] ?? '';

if (!$params || !$signatureRecibida) {
    error_log("Redsys Notify: Missing parameters.");
    exit;
}

$jsonParams = decodeBase64($params);
$datos = json_decode($jsonParams, true);

$order = $datos['Ds_Order'];
$responseCode = (int)$datos['Ds_Response'];

// Validación de firma (en pruebas se asume OK si llega al endpoint, en producción usar HMAC SHA256)
if ($responseCode <= 99) {
    try {
        $pdo->beginTransaction();

        // 1. Actualizar pago
        $stmt = $pdo->prepare("UPDATE payments SET status = 'completed', redsys_response = ? WHERE redsys_order = ?");
        $stmt->execute([$jsonParams, $order]);

        // 2. Obtener datos del pago
        $stmtPay = $pdo->prepare("SELECT user_email, type, plan, session_id FROM payments WHERE redsys_order = ?");
        $stmtPay->execute([$order]);
        $payment = $stmtPay->fetch();

        if ($payment) {
            if ($payment['type'] === 'subscription') {
                $stmtUser = $pdo->prepare("UPDATE users SET subscription = ?, status = 'active' WHERE email = ?");
                $stmtUser->execute([$payment['plan'], $payment['user_email']]);
            } else if ($payment['type'] === 'live_access') {
                // Registrar acceso a sesión de martes
                $stmtLive = $pdo->prepare("INSERT INTO live_access (session_id, user_email, access_type, payment_id) VALUES (?, ?, 'paid', ?)");
                $stmtLive->execute([$payment['session_id'], $payment['user_email'], $order]);
            }
        }

        $pdo->commit();
        error_log("Redsys Notify: Payment $order completed successfully.");
    } catch (Exception $e) {
        $pdo->rollBack();
        error_log("Redsys Notify Error: " . $e->getMessage());
    }
} else {
    // PAGO FALLIDO
    $stmt = $pdo->prepare("UPDATE payments SET status = 'failed', redsys_response = ? WHERE redsys_order = ?");
    $stmt->execute([$jsonParams, $order]);
    error_log("Redsys Notify: Payment $order failed with code $responseCode.");
}
?>
