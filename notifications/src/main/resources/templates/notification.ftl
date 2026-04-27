<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${subject!""}</title>
    <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; background-color: #f4f7f6; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.1); }
        .header { background: #1a73e8; color: white; padding: 20px; text-align: center; }
        .header h1 { margin: 0; font-size: 24px; }
        .content { padding: 30px; line-height: 1.6; color: #333; }
        .footer { background: #f8f9fa; color: #666; padding: 20px; text-align: center; font-size: 12px; border-top: 1px solid #eee; }
        .company-name { font-weight: bold; color: #1a73e8; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>${companyName!"CloudFly"}</h1>
        </div>
        <div class="content">
            <p>Hola <strong>${name!""}</strong>,</p>
            <p>${body!""}</p>
        </div>
        <div class="footer">
            <p>Este mensaje fue enviado por <span class="company-name">${companyName!"CloudFly"}</span></p>
            <p>&copy; ${.now?string('yyyy')} ${companyName!"CloudFly"}. Todos los derechos reservados.</p>
        </div>
    </div>
</body>
</html>
