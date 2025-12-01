<?php
// api.php - simple safe proxy for a few allowed hosts
// Usage: api.php?url=<encoded-url>
// WARNING: Do not use this as an open proxy on public servers without auth.

$allowed_hosts = [
    'api.openweathermap.org',
    'api.open-meteo.com',
    'nominatim.openstreetmap.org',
    'openstreetmap.org',
    'www.openstreetmap.org',
];

if (!isset($_GET['url'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing url parameter']);
    exit;
}

$url = $_GET['url'];
$decoded = urldecode($url);

$parsed = parse_url($decoded);
if ($parsed === false || empty($parsed['host'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid URL']);
    exit;
}

$host = strtolower($parsed['host']);
$allowed = false;
foreach ($allowed_hosts as $h) {
    if (substr($host, -strlen($h)) === $h) {
        $allowed = true;
        break;
    }
}

if (!$allowed) {
    http_response_code(403);
    echo json_encode(['error' => 'Host not allowed']);
    exit;
}

// Optional: forward other headers (User-Agent) to avoid being blocked
$opts = [
    'http' => [
        'method' => 'GET',
        'header' => "User-Agent: WeatherPulseProxy/1.0\r\nAccept: */*\r\n"
    ],
    'ssl' => [
        'verify_peer' => false,
        'verify_peer_name' => false
    ]
];

$context = stream_context_create($opts);

$response = @file_get_contents($decoded, false, $context);
if ($response === false) {
    http_response_code(502);
    echo json_encode(['error' => 'Failed to fetch']);
    exit;
}

// Pass content-type if available
// Try to guess JSON else text/html
header('Content-Type: application/json; charset=utf-8');
echo $response;
