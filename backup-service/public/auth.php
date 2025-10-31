<?php
require_once __DIR__ . '/vendor/autoload.php';

$client = new Google_Client();
$client->setAuthConfig(__DIR__ . '/secret_client.json');
$client->setScopes(Google_Service_Drive::DRIVE_FILE);
$client->setRedirectUri('urn:ietf:wg:oauth:2.0:oob');
$client->setAccessType('offline');
$client->setPrompt('select_account consent');

$authUrl = $client->createAuthUrl();
echo "Abre este enlace en tu navegador:\n$authUrl\n\n";

// Esperar el código de verificación del usuario
echo "Introduce el código de verificación: ";
$authCode = trim(fgets(STDIN));

// Intercambiar el código por un token de acceso
$accessToken = $client->fetchAccessTokenWithAuthCode($authCode);

// Guardar el token en un archivo
file_put_contents(__DIR__ . '/token.json', json_encode($accessToken));
echo "Autenticación completada. Token guardado en token.json\n";
