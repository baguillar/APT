<?php
// api/achievements.php
require_once 'config.php';

if (!isLoggedIn()) jsonResponse(['error' => 'No autorizado'], 401);

$email = $_SESSION['user_email'];

function checkAchievements($pdo, $email) {
    // 1. Streak check
    $stmt = $pdo->prepare("SELECT COUNT(*) as completed_count FROM assignments 
                           WHERE user_email = ? AND completed = 1 
                           AND completed_at >= DATE_SUB(NOW(), INTERVAL 10 DAY)");
    $stmt->execute([$email]);
    $streak = $stmt->fetch()['completed_count'];
    
    if ($streak >= 10) {
        unlockAchievement($pdo, $email, 'streak_10');
    }

    // 2. Perfect Week
    // Check if last week had all assignments completed
    $monday = date('Y-m-d', strtotime('monday last week'));
    $sunday = date('Y-m-d', strtotime('sunday last week'));
    
    $stmtW = $pdo->prepare("SELECT 
                                (SELECT COUNT(*) FROM assignments WHERE user_email = ? AND date BETWEEN ? AND ?) as total,
                                (SELECT COUNT(*) FROM assignments WHERE user_email = ? AND date BETWEEN ? AND ? AND completed = 1) as done");
    $stmtW->execute([$email, $monday, $sunday, $email, $monday, $sunday]);
    $week = $stmtW->fetch();
    
    if ($week['total'] > 0 && $week['total'] == $week['done']) {
        unlockAchievement($pdo, $email, 'perfect_week');
    }
}

function unlockAchievement($pdo, $email, $criteria) {
    $stmtA = $pdo->prepare("SELECT id FROM achievements WHERE criteria_type = ?");
    $stmtA->execute([$criteria]);
    $aid = $stmtA->fetch()['id'];

    $stmtCheck = $pdo->prepare("SELECT id FROM user_achievements WHERE user_email = ? AND achievement_id = ?");
    $stmtCheck->execute([$email, $aid]);
    
    if (!$stmtCheck->fetch()) {
        $stmtIns = $pdo->prepare("INSERT INTO user_achievements (user_email, achievement_id) VALUES (?, ?)");
        $stmtIns->execute([$email, $aid]);
    }
}

if ($_GET['action'] === 'list') {
    $stmt = $pdo->prepare("SELECT a.*, ua.unlocked_at 
                           FROM achievements a 
                           LEFT JOIN user_achievements ua ON a.id = ua.achievement_id AND ua.user_email = ?");
    $stmt->execute([$email]);
    jsonResponse($stmt->fetchAll());
}
?>