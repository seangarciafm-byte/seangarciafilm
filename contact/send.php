<?php
// Contact form handler for seangarciafilm.com (runs on DreamHost's PHP).
// Emails each message to the address below, with Reply-To set to the sender.

$TO = 'seangarciafm@gmail.com';
$FROM = 'contact@seangarciafilm.com'; // must be on this domain so DreamHost will send it
$SUBJECT_PREFIX = 'Website enquiry';

$wantsJson = isset($_SERVER['HTTP_ACCEPT']) && strpos($_SERVER['HTTP_ACCEPT'], 'application/json') !== false;

function finish($ok, $message, $wantsJson)
{
    if ($wantsJson) {
        http_response_code($ok ? 200 : 400);
        header('Content-Type: application/json');
        echo json_encode(['ok' => $ok, 'message' => $message]);
    } else {
        header('Location: /contact/?status=' . ($ok ? 'sent' : 'error'), true, 303);
    }
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Location: /contact/', true, 303);
    exit;
}

// Strip line breaks from anything that goes into a mail header.
function clean_line($value, $max)
{
    $value = trim(preg_replace('/[\r\n\t]+/', ' ', (string) $value));
    return function_exists('mb_substr') ? mb_substr($value, 0, $max) : substr($value, 0, $max);
}

$name = clean_line($_POST['name'] ?? '', 120);
$email = clean_line($_POST['email'] ?? '', 200);
$company = clean_line($_POST['company'] ?? '', 160);
$message = trim((string) ($_POST['message'] ?? ''));
$message = function_exists('mb_substr') ? mb_substr($message, 0, 5000) : substr($message, 0, 5000);

// Spam checks: a hidden field only bots fill in, and a minimum time on the page.
$trap = trim((string) ($_POST['website'] ?? ''));
$started = (int) ($_POST['t'] ?? 0);
$elapsed = $started > 0 ? (time() * 1000 - $started) / 1000 : 999;
if ($trap !== '' || $elapsed < 3) {
    finish(true, 'Thanks! Your message has been sent.', $wantsJson); // pretend success for bots
}

if ($name === '' || $message === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    finish(false, 'Please fill in your name, a valid email address and a message.', $wantsJson);
}

$subject = $SUBJECT_PREFIX . ' from ' . $name . ($company !== '' ? ' (' . $company . ')' : '');
$body = "Name: $name\nEmail: $email\n" . ($company !== '' ? "Company: $company\n" : '') .
    "\n$message\n\n--\nSent from the contact form on seangarciafilm.com\n";

$headers = [
    'From: Sean Garcia website <' . $FROM . '>',
    'Reply-To: "' . str_replace(['"', '\\'], '', $name) . '" <' . $email . '>',
    'Content-Type: text/plain; charset=UTF-8',
    'X-Mailer: seangarciafilm.com contact form',
];

$encodedSubject = '=?UTF-8?B?' . base64_encode($subject) . '?=';
$sent = mail($TO, $encodedSubject, $body, implode("\r\n", $headers), '-f' . $FROM);

finish(
    $sent,
    $sent ? 'Thanks! Your message has been sent.' : 'Sorry, something went wrong. Please try again in a moment.',
    $wantsJson
);
