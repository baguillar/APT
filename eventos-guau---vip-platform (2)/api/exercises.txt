<?php
// api/exercises.php
require_once 'config.php';

if (!isLoggedIn()) jsonResponse(['error' => 'No autorizado'], 401);

$action = $_GET['action'] ?? '';

if ($action === 'list') {
    $stmt = $pdo->query("SELECT * FROM exercises_library ORDER BY name ASC");
    jsonResponse($stmt->fetchAll());
}

if ($action === 'create' && isAdmin()) {
    $data = json_decode(file_get_contents('php://input'), true);
    $stmt = $pdo->prepare("INSERT INTO exercises_library (name, duration, description, videoURL) VALUES (?,?,?,?)");
    $stmt->execute([$data['name'], $data['duration'], $data['description'], $data['videoURL']]);
    jsonResponse(['message' => 'Ejercicio creado correctamente']);
}

if ($action === 'import_csv' && isAdmin()) {
    if (!isset($_FILES['csv']) || $_FILES['csv']['error'] !== UPLOAD_ERR_OK) {
        jsonResponse(['error' => 'Error al subir el archivo'], 400);
    }

    $handle = fopen($_FILES['csv']['tmp_name'], 'r');
    $header = fgetcsv($handle); // Skip header row
    
    $imported = 0;
    while (($row = fgetcsv($handle)) !== FALSE) {
        if (count($row) < 3) continue;
        $stmt = $pdo->prepare("INSERT INTO exercises_library (name, duration, description, videoURL) VALUES (?,?,?,?)");
        $stmt->execute([$row[0], $row[1], $row[2], $row[3] ?? '']);
        $imported++;
    }
    fclose($handle);
    jsonResponse(['message' => "Se han importado $imported ejercicios."]);
}

if ($action === 'delete' && isAdmin()) {
    $id = $_GET['id'];
    $stmt = $pdo->prepare("DELETE FROM exercises_library WHERE id = ?");
    $stmt->execute([$id]);
    jsonResponse(['message' => 'Ejercicio eliminado']);
}
?>