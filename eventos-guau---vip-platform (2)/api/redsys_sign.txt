<?php
// api/redsys_sign.php - v12.0 Bulletproof Payment
require_once 'config.php';

if (!isLoggedIn()) jsonResponse(['error' => 'No autorizado'], 401);

$data = json_decode(file_get_contents('php://input'), true);
$amount = (float)($data['amount'] ?? 0);
$type = $data['type'] ?? 'subscription';
$plan = $data['plan'] ?? 'none';
$sessionId = $data['session_id'] ?? null;

if ($amount <= 0) jsonResponse(['error' => 'Importe inválido'], 400);

$order = substr(date('ymdHis') . rand(10, 99), -12);
$amountCents = (int)round($amount * 100);

// Parámetros EXACTOS requeridos por Redsys
$merchantParams = [
    'DS_MERCHANT_AMOUNT' => (string)$amountCents,
    'DS_MERCHANT_ORDER' => $order,
    'DS_MERCHANT_MERCHANTCODE' => REDSYS_MERCHANT_CODE,
    'DS_MERCHANT_CURRENCY' => '978',
    'DS_MERCHANT_TRANSACTIONTYPE' => '0',
    'DS_MERCHANT_TERMINAL' => '003', // Forzamos 003 como pide el usuario
    'DS_MERCHANT_MERCHANTURL' => BASE_URL . 'api/redsys_notify.php',
    'DS_MERCHANT_URLOK' => REDSYS_URL_OK . "&order=" . $order,
    'DS_MERCHANT_URLKO' => REDSYS_URL_KO . "&order=" . $order
];

$paramsBase64 = base64_encode(json_encode($merchantParams));

function getSignature($params, $order, $key) {
    $keyDecoded = base64_decode($key);
    // Firma HMAC SHA256 Paso 1: Derivar clave con el nº de pedido
    $resKey = hash_hmac('sha256', $order, $keyDecoded, true);
    // Paso 2: Firmar los parámetros con la clave derivada
    return base64_encode(hash_hmac('sha256', $params, $resKey, true));
}

$signature = getSignature($paramsBase64, $order, REDSYS_SECRET_KEY);

// Guardar registro de pago pendiente
$stmt = $pdo->prepare("INSERT INTO payments (user_email, type, plan, amount, status, redsys_order, session_id) VALUES (?, ?, ?, ?, 'pending', ?, ?)");
$stmt->execute([$_SESSION['user_email'], $type, $plan, $amount, $order, $sessionId]);

jsonResponse([
    'params' => $paramsBase64,
    'signature' => $signature,
    'url' => 'https://sis-t.redsys.es:25443/sis/realizarPago'
]);
?>