<?php
// api/config.php - v17.5 Ironclad Vanilla
ob_start();
error_reporting(E_ALL);
ini_set('display_errors', 0); // No mostrar errores en pantalla, solo en logs

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// DB Credentials
define('DB_HOST', 'localhost');
define('DB_NAME', 'qqxbjuzr_vip');
define('DB_USER', 'qqxbjuzr_soletevip');
define('DB_PASS', 'Ev3nt0s+Guau');
define('BASE_URL', 'https://adiestramientoparatodos.es/');

// Redsys Config
define('REDSYS_SECRET_KEY', 'sq7HjrUOBfKmC576ILgskD5srU870gJ7');
define('REDSYS_MERCHANT_CODE', '368639589');

try {
    $options = [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, 
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC, 
        PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4"
    ];
    $pdo = new PDO("mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4", DB_USER, DB_PASS, $options);
} catch (PDOException $e) {
    if (ob_get_length()) ob_clean();
    header('Content-Type: application/json; charset=utf-8');
    die(json_encode(['error' => 'Database connection failed', 'detail' => $e->getMessage()]));
}

function jsonResponse($data, $status = 200) {
    if (ob_get_length()) ob_clean();
    header('Content-Type: application/json; charset=utf-8');
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

function isLoggedIn() { return isset($_SESSION['user_email']); }
function isAdmin() { return isset($_SESSION['user_role']) && $_SESSION['user_role'] === 'admin'; }
?>