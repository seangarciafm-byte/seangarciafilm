<?php
// Contact form handler for seangarciafilm.com (runs on DreamHost's PHP).
// Emails each message to the address below, with Reply-To set to the sender.
// It sends through Gmail using the app password in gmail-password.php, so Gmail
// trusts the message. Without that file it falls back to PHP mail(), which Gmail
// usually drops.

$TO = 'seangarciafm@gmail.com';
$FROM = 'seangarciafm@gmail.com';
$SUBJECT_PREFIX = 'Website enquiry';
$PASSWORD_FILE = __DIR__ . '/gmail-password.php';

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
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: 8bit',
    'X-Mailer: seangarciafilm.com contact form',
];

$encodedSubject = '=?UTF-8?B?' . base64_encode($subject) . '?=';
$password = is_file($PASSWORD_FILE) ? trim((string) (include $PASSWORD_FILE)) : '';
if ($password !== '') {
    $sent = gmail_send($FROM, str_replace(' ', '', $password), $TO, $encodedSubject, $body, $headers);
} else {
    $sent = mail($TO, $encodedSubject, $body, implode("\r\n", $headers), '-f' . $FROM);
}

finish(
    $sent,
    $sent ? 'Thanks! Your message has been sent.' : 'Sorry, something went wrong. Please try again in a moment.',
    $wantsJson
);

// Send one message through Gmail's SMTP server, logged in with an app password.
function gmail_send($user, $password, $to, $subject, $body, $headers)
{
    $smtp = @stream_socket_client('ssl://smtp.gmail.com:465', $errno, $errstr, 15);
    if (!$smtp) {
        error_log("Contact form: can't reach smtp.gmail.com ($errstr)");
        return false;
    }
    stream_set_timeout($smtp, 15);

    // Read a reply (which can span several lines) and check its status code.
    $expect = function ($code) use ($smtp) {
        $reply = '';
        while (($line = fgets($smtp, 515)) !== false) {
            $reply .= $line;
            if (strlen($line) < 4 || $line[3] !== '-') break;
        }
        if (substr($reply, 0, 3) !== (string) $code) {
            error_log('Contact form: Gmail said ' . trim($reply));
            return false;
        }
        return true;
    };
    $say = function ($line, $code) use ($smtp, $expect) {
        fwrite($smtp, $line . "\r\n");
        return $expect($code);
    };

    $message = implode("\r\n", array_merge($headers, [
        'To: ' . $to,
        'Subject: ' . $subject,
        'Date: ' . date('r'),
        'Message-ID: <' . bin2hex(random_bytes(12)) . '@seangarciafilm.com>',
    ])) . "\r\n\r\n" . preg_replace('/^\./m', '..', str_replace(["\r\n", "\r", "\n"], "\r\n", $body));

    $ok = $expect(220)
        && $say('EHLO seangarciafilm.com', 250)
        && $say('AUTH LOGIN', 334)
        && $say(base64_encode($user), 334)
        && $say(base64_encode($password), 235)
        && $say('MAIL FROM:<' . $user . '>', 250)
        && $say('RCPT TO:<' . $to . '>', 250)
        && $say('DATA', 354)
        && $say($message . "\r\n.", 250);
    fwrite($smtp, "QUIT\r\n");
    fclose($smtp);
    return $ok;
}
