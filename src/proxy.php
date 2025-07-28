<?php
header('Access-Control-Allow-Origin: https://patcolyn.github.io'); 
header('Content-Type: application/json');

if (!isset($_GET['csurl'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing csurl parameter']);
    exit;
}

$url = $_GET['csurl'];
$params = $_GET;
unset($params['csurl']);

$allowedDomains = [
    'api.steampowered.com',
];

$parsedUrl = parse_url($url);
if (!in_array($parsedUrl['host'], $allowedDomains)) {
    http_response_code(403);
    echo json_encode(['error' => 'Disallowed domain']);
    exit;
}

$queryString = http_build_query($params);
$fullUrl = $url . '?' . $queryString;

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $fullUrl);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);

if (curl_errno($ch)) {
    http_response_code(500);
    echo json_encode(['error' => 'Curl error: ' . curl_error($ch)]);
    curl_close($ch);
    exit;
}

curl_close($ch);

http_response_code($httpCode);
echo $response;
?>
