<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Bienvenido a CloudFly</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            background-color: #f4f4f4;
            margin: 0;
            padding: 20px;
        }
        .email-container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 8px;
            padding: 20px;
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
        }
        .email-header {
            text-align: center;
            background-color: #50a4ffff;
            color: white;
            padding: 10px 0;
            border-radius: 5px 5px 0 0;
        }
        .email-body {
            margin-top: 20px;
        }
        .email-footer {
            text-align: center;
            margin-top: 20px;
            font-size: 12px;
            color: #888;
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="email-header">
            <h2>Bienvenido a CloudFly</h2>
        </div>
        <div class="email-body">
            <p>Hola <strong>${name}</strong>,</p>
            <p>Gracias por registrarte en CloudFly. Ahora puedes disfrutar de todos nuestros servicios.</p>
            <p>Debes validar tu cuenta en el siguiente enlace</p>
            <p><a href="${activateLink}">Activa tu cuenta aqui!</a></p>
            <p>Si tienes alguna duda, no dudes en contactarnos.</p>
        </div>
        <div class="email-footer">
            <p>&copy; 2025 CloudFly. Todos los derechos reservados.</p>
        </div>
    </div>
</body>
</html>
