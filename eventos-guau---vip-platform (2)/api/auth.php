<?php
// api/auth.php - v9.5 Ironclad Auth
require_once 'config.php';
$action = $_GET['action'] ?? '';

if ($action === 'login') {
    $data = json_decode(file_get_contents('php://input'), true);
    $email = filter_var($data['email'] ?? '', FILTER_VALIDATE_EMAIL);
    $stmt = $pdo->prepare("SELECT * FROM users WHERE email = ?");
    $stmt->execute([$email]);
    $user = $stmt->fetch();
    if ($user && password_verify($data['password'], $user['password'])) {
        $_SESSION['user_email'] = $user['email'];
        $_SESSION['user_role'] = $user['role'];
        jsonResponse(['success' => true, 'user' => $user]);
    } else jsonResponse(['error' => 'Credenciales incorrectas'], 401);
}

if ($action === 'register') {
    $data = json_decode(file_get_contents('php://input'), true);
    $email = filter_var($data['email'] ?? '', FILTER_VALIDATE_EMAIL);
    if (!$email || strlen($data['password']) < 6) jsonResponse(['error' => 'Datos inválidos'], 400);
    
    $password = password_hash($data['password'], PASSWORD_BCRYPT);
    try {
        $stmt = $pdo->prepare("INSERT INTO users (email, password, subscription, status, dogName) VALUES (?, ?, 'none', 'pending', '...')");
        $stmt->execute([$email, $password]);
        $_SESSION['user_email'] = $email;
        $_SESSION['user_role'] = 'client';
        jsonResponse(['success' => true]);
    } catch (PDOException $e) { jsonResponse(['error' => 'Email ya registrado'], 400); }
}

if ($action === 'check') {
    if (isLoggedIn()) {
        $stmt = $pdo->prepare("SELECT email, role, status, subscription, dogName FROM users WHERE email = ?");
        $stmt->execute([$_SESSION['user_email']]);
        $user = $stmt->fetch();
        if ($user) {
            jsonResponse(['logged' => true, 'user' => $user]);
        } else {
            session_destroy();
            jsonResponse(['logged' => false]);
        }
    } else jsonResponse(['logged' => false]);
}

if ($action === 'logout') {
    $_SESSION = array();
    if (ini_get("session.use_cookies")) {
        $params = session_get_cookie_params();
        setcookie(session_name(), '', time() - 42000,
            $params["path"], $params["domain"],
            $params["secure"], $params["httponly"]
        );
    }
    session_destroy();
    jsonResponse(['success' => true]);
}
?>