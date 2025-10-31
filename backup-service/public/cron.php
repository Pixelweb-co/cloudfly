<?php

require __DIR__ . '/vendor/autoload.php';

// Función para obtener el ID de la carpeta "backup" en Google Drive
function obtenerIdCarpetaBackup($service) {
    $folderName = 'backup';

    $query = sprintf("name = '%s' and mimeType = 'application/vnd.google-apps.folder' and trashed = false", $folderName);
    $results = $service->files->listFiles([
        'q' => $query,
        'fields' => 'files(id, name)',
        'spaces' => 'drive',
    ]);

    if (count($results->getFiles()) > 0) {
        return $results->getFiles()[0]->getId();
    } else {
        $fileMetadata = new Google_Service_Drive_DriveFile([
            'name' => $folderName,
            'mimeType' => 'application/vnd.google-apps.folder'
        ]);

        $folder = $service->files->create($fileMetadata, [
            'fields' => 'id'
        ]);

        return $folder->getId();
    }
}

// Función para subir archivos a Google Drive
function subirAGoogleDrive($pathArchivo, $nombreEnDrive) {
    $client = new Google_Client();
    $client->setAuthConfig('/var/www/html/secret_client.json');
    $client->addScope(Google_Service_Drive::DRIVE_FILE);
    $client->setAccessType('offline');

    $tokenPath = '/var/www/html/token.json';
    if (file_exists($tokenPath)) {
        $accessToken = json_decode(file_get_contents($tokenPath), true);
        $client->setAccessToken($accessToken);
    } else {
        throw new Exception('Token no encontrado. Ejecuta auth.php primero.');
    }

    if ($client->isAccessTokenExpired()) {
        if ($client->getRefreshToken()) {
            $client->fetchAccessTokenWithRefreshToken($client->getRefreshToken());
            file_put_contents($tokenPath, json_encode($client->getAccessToken()));
        } else {
            throw new Exception('No se puede refrescar el token. Ejecuta auth.php nuevamente.');
        }
    }

    $service = new Google_Service_Drive($client);
    $folderId = obtenerIdCarpetaBackup($service);

    $fileMetadata = new Google_Service_Drive_DriveFile([
        'name' => $nombreEnDrive,
        'parents' => [$folderId]
    ]);

    $content = file_get_contents($pathArchivo);

    $file = $service->files->create($fileMetadata, [
        'data' => $content,
        'mimeType' => 'application/zip',
        'uploadType' => 'multipart',
        'fields' => 'id'
    ]);

    echo "Archivo subido a Google Drive (backup), ID: " . $file->id . "<br>";
}

// Leer el archivo databases.json
$jsonPath = __DIR__ . '/databases.json';
if (!file_exists($jsonPath)) {
    die("El archivo databases.json no existe.");
}

$databases = json_decode(file_get_contents($jsonPath), true);
if (!is_array($databases)) {
    die("El contenido de databases.json no es válido.");
}

// Crear los archivos de backup primero
$backupFiles = [];
foreach ($databases as $db) {
    if (!isset($db['dbname'])) {
        echo "Registro inválido en databases.json<br>";
        continue;
    }

    $dbname = $db['dbname'];
    $backupFile = "uploads/backup_{$dbname}_" . date("Ymd_His") . ".sql";
    $fullPath = "/var/www/html/$backupFile";

    // Usamos shell_exec() para capturar el error y la salida de mysqldump
    $cmd = sprintf(
        'mysqldump -h%s -u%s -p%s %s > %s 2>&1',  // Redirigir errores a la salida estándar
        escapeshellarg('db'),
        escapeshellarg('root'),
        escapeshellarg('widowmaker'),
        escapeshellarg($dbname),
        escapeshellarg($fullPath)
    );

    echo "Ejecutando comando: $cmd<br>";

    // Capturamos la salida completa, incluyendo errores
    $output = shell_exec($cmd);
    
    if ($output === null) {
        echo "Error al ejecutar mysqldump. No se puede conectar a la base de datos o el comando falló.<br>";
        continue;
    }

    // Comprobamos si el archivo .sql fue creado correctamente
    if (!file_exists($fullPath)) {
        echo "Error creando backup de la base de datos $dbname. Salida de mysqldump: $output<br>";
        continue;
    }

    echo "Backup creado: $backupFile<br>";

    // Comprimir el archivo SQL en un ZIP
    $zipFile = $fullPath . '.zip';
    $cmdZip = sprintf('zip %s %s', escapeshellarg($zipFile), escapeshellarg($fullPath));
    echo "Ejecutando compresión: $cmdZip<br>";
    system($cmdZip, $retvalZip);

    if ($retvalZip !== 0) {
        echo "Error comprimiendo archivo: $zipFile<br>";
        continue;
    }

    echo "Archivo comprimido: $zipFile<br>";

    // Agregar archivo comprimido a la lista
    if ($retvalZip === 0) {
        $backupFiles[] = $zipFile;
    }
}

// Subir los archivos comprimidos a Google Drive
if (!empty($backupFiles)) {
    $client = new Google_Client();
    $client->setAuthConfig('/var/www/html/secret_client.json');
    $client->addScope(Google_Service_Drive::DRIVE_FILE);
    $client->setAccessType('offline');

    $tokenPath = '/var/www/html/token.json';
    if (file_exists($tokenPath)) {
        $accessToken = json_decode(file_get_contents($tokenPath), true);
        $client->setAccessToken($accessToken);
    } else {
        die('Token no encontrado. Ejecuta auth.php primero.');
    }

    if ($client->isAccessTokenExpired()) {
        if ($client->getRefreshToken()) {
            $client->fetchAccessTokenWithRefreshToken($client->getRefreshToken());
            file_put_contents($tokenPath, json_encode($client->getAccessToken()));
        } else {
            die('No se puede refrescar el token. Ejecuta auth.php nuevamente.');
        }
    }

    $service = new Google_Service_Drive($client);
    $folderId = obtenerIdCarpetaBackup($service);

    foreach ($backupFiles as $filePath) {
        $fileMetadata = new Google_Service_Drive_DriveFile([
            'name' => basename($filePath),
            'parents' => [$folderId]
        ]);

        $content = file_get_contents($filePath);

        $file = $service->files->create($fileMetadata, [
            'data' => $content, 
            'mimeType' => 'application/zip',
            'uploadType' => 'multipart',
            'fields' => 'id'
        ]);

        echo "Archivo subido a Google Drive (backup), ID: " . $file->id . "<br>";
    }
}

?>
 