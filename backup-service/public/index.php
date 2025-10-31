<!DOCTYPE html>
<html>
<body>

<form action="" method="post" enctype="multipart/form-data">
  Selecciona un archivo para subir:
  <input type="file" name="archivo" id="archivo">
  <input type="submit" value="Subir archivo" name="submit_upload">
</form>

<form method="post">
    <input type="submit" name="backup" value="Realizar Backup de MySQL">
</form>

<?php
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Subir archivo
    if (isset($_POST['submit_upload']) && isset($_FILES['archivo'])) {
        $dir = "uploads/";

        // Verificar si el directorio existe, si no, lo creamos
        if (!file_exists($dir)) {
            mkdir($dir, 0777, true); // Crea el directorio con permisos adecuados
        }

        $archivo = $dir . basename($_FILES["archivo"]["name"]);

        if (move_uploaded_file($_FILES["archivo"]["tmp_name"], $archivo)) {
            echo "El archivo " . htmlspecialchars(basename($_FILES["archivo"]["name"])) . " fue subido exitosamente.";
        } else {
            echo "Error al subir el archivo.";
        }
    }

       // Backup de MySQL
       if (isset($_POST['backup'])) {
        $backupFile = "uploads/backup_dbname" . date("Ymd_His") . ".sql";
        $cmd = sprintf(
            'mysqldump -h%s -u%s -p%s %s > %s',
            escapeshellarg('db'),                 // Host del contenedor de MySQL
            escapeshellarg('root'),              // Usuario
            escapeshellarg('Elian2020#'),        // Contraseña
            escapeshellarg('dbname'),            // Nombre de la base de datos
            escapeshellarg("/var/www/html/$backupFile") // Archivo destino
        );

        system($cmd, $retval);
       
        echo $retval === 0 ? "Backup creado: $backupFile" : "Error creando backup";
        echo "<br>";
        // Backup de ingenieriadb

        $backupFile = "uploads/backup_ingenieriadb" . date("Ymd_His") . ".sql";
        $cmd = sprintf(
            'mysqldump -h%s -u%s -p%s %s > %s',
            escapeshellarg('db'),                 // Host del contenedor de MySQL
            escapeshellarg('root'),              // Usuario
            escapeshellarg('Elian2020#'),        // Contraseña
            escapeshellarg('ingenieriadb'),            // Nombre de la base de datos
            escapeshellarg("/var/www/html/$backupFile") // Archivo destino
        );

        system($cmd, $retval);

        echo $retval === 0 ? "Backup creado: $backupFile" : "Error creando backup";
    }
}
?>

</body>
</html>
