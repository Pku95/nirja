<?php
/**
 * Contact / enquiry form handler for cPanel (PHP 7.4+).
 * Replaces the original Next.js /api/contact route + PostgreSQL insert.
 * Sends each enquiry by email.
 */

// ====== EDIT THESE TWO LINES ======
$TO_EMAIL   = 'info@nariatravels.com';   // where enquiries are delivered
$FROM_EMAIL = 'noreply@nariatravels.com'; // MUST be an address on your own domain (helps avoid spam filtering)
// ==================================

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');

function respond($status, $data) {
    http_response_code($status);
    echo json_encode($data);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    respond(405, ['success' => false, 'error' => 'Method not allowed']);
}

$raw  = file_get_contents('php://input');
$data = json_decode($raw, true);
if (!is_array($data)) {
    $data = $_POST; // plain form post fallback
}

// Honeypot: real visitors never fill this in
if (!empty($data['website'])) {
    respond(200, ['success' => true]);
}

function clean($v, $max = 2000) {
    $v = is_string($v) ? trim($v) : '';
    $v = str_replace(["\r", "\0"], '', $v);
    return mb_substr($v, 0, $max);
}
function oneline($v, $max = 255) {
    return preg_replace('/[\r\n]+/', ' ', clean($v, $max));
}

$name        = oneline($data['name'] ?? '', 150);
$email       = oneline($data['email'] ?? '', 150);
$phone       = oneline($data['phone'] ?? '', 50);
$serviceType = oneline($data['serviceType'] ?? '', 100);
$destination = oneline($data['destination'] ?? '', 255);
$message     = clean($data['message'] ?? '', 4000);

if ($name === '' || $email === '') {
    respond(400, ['success' => false, 'error' => 'Name and email are required']);
}
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    respond(400, ['success' => false, 'error' => 'Please enter a valid email address']);
}

// Very small rate limit: 1 submission per 15 seconds per visitor session
session_start();
$now = time();
if (isset($_SESSION['last_send']) && ($now - $_SESSION['last_send']) < 15) {
    respond(429, ['success' => false, 'error' => 'Please wait a few seconds before sending again.']);
}

$isNewsletter = ($serviceType === 'newsletter');
$subject = $isNewsletter
    ? 'New newsletter subscriber - ' . $email
    : 'New website enquiry from ' . $name;

$body  = "New message from the Naria Travels & Tours website\n";
$body .= "------------------------------------------------\n";
$body .= "Name:         $name\n";
$body .= "Email:        $email\n";
$body .= "Phone:        " . ($phone ?: '-') . "\n";
$body .= "Service:      " . ($serviceType ?: '-') . "\n";
$body .= "Destination:  " . ($destination ?: '-') . "\n";
$body .= "Date:         " . date('Y-m-d H:i:s') . "\n\n";
$body .= "Message:\n" . ($message ?: '-') . "\n";

$headers  = "From: Naria Travels Website <$FROM_EMAIL>\r\n";
$headers .= "Reply-To: $name <$email>\r\n";
$headers .= "MIME-Version: 1.0\r\n";
$headers .= "Content-Type: text/plain; charset=UTF-8\r\n";

$subjectEnc = '=?UTF-8?B?' . base64_encode($subject) . '?=';

if (@mail($TO_EMAIL, $subjectEnc, $body, $headers, '-f' . $FROM_EMAIL)) {
    $_SESSION['last_send'] = $now;
    respond(201, ['success' => true, 'message' => 'Inquiry submitted successfully']);
}

respond(500, ['success' => false, 'error' => 'Failed to submit inquiry']);
