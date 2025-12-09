<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Bienvenido a CloudFly</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background-color: #f5f5f5;
            padding: 20px;
        }
        .email-container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }
        .email-header {
            background: linear-gradient(135deg, #4A90E2 0%, #357ABD 100%);
            padding: 40px 30px;
            text-align: center;
        }
        .logo-container {
            background-color: white;
            display: inline-flex;
            align-items: center;
            gap: 10px;
            padding: 12px 24px;
            border-radius: 8px;
            margin-bottom: 20px;
        }
        .logo-icon {
            width: 28px;
            height: 28px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 6px;
            display: inline-block;
        }
        .logo-text {
            font-size: 18px;
            font-weight: 700;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }
        .header-title {
            color: white;
            font-size: 32px;
            font-weight: bold;
            margin-bottom: 8px;
        }
        .header-subtitle {
            color: rgba(255,255,255,0.9);
            font-size: 16px;
        }
        .email-body {
            padding: 40px 30px;
        }
        .greeting {
            font-size: 16px;
            color: #333;
            margin-bottom: 20px;
        }
        .greeting strong {
            color: #4A90E2;
        }
        .description {
            font-size: 15px;
            color: #666;
            line-height: 1.6;
            margin-bottom: 30px;
        }
        .action-card {
            background-color: #f8f9fa;
            border-radius: 12px;
            padding: 24px;
            margin-bottom: 30px;
            display: flex;
            gap: 16px;
            align-items: flex-start;
        }
        .action-icon {
            width: 48px;
            height: 48px;
            background: linear-gradient(135deg, #4A90E2 0%, #357ABD 100%);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
        }
        .action-icon::before {
            content: "✓";
            color: white;
            font-size: 24px;
            font-weight: bold;
        }
        .action-content {
            flex: 1;
        }
        .action-title {
            font-size: 18px;
            font-weight: 700;
            color: #333;
            margin-bottom: 8px;
        }
        .action-description {
            font-size: 14px;
            color: #666;
            margin-bottom: 16px;
            line-height: 1.5;
        }
        .btn-primary {
            display: inline-block;
            background: linear-gradient(135deg, #4A90E2 0%, #357ABD 100%);
            color: white;
            text-decoration: none;
            padding: 14px 32px;
            border-radius: 8px;
            font-weight: 600;
            font-size: 15px;
            transition: transform 0.2s, box-shadow 0.2s;
        }
        .btn-primary:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(74, 144, 226, 0.4);
        }
        .support-text {
            font-size: 14px;
            color: #666;
            line-height: 1.6;
            margin-bottom: 20px;
        }
        .signature {
            font-size: 16px;
            color: #333;
            font-weight: 600;
        }
        .email-footer {
            background-color: #f8f9fa;
            padding: 30px;
            border-top: 1px solid #e9ecef;
        }
        .footer-top {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 20px;
            flex-wrap: wrap;
            gap: 15px;
        }
        .footer-logo {
            display: flex;
            align-items: center;
            gap: 8px;
        }
        .footer-logo-icon {
            width: 24px;
            height: 24px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 5px;
        }
        .footer-logo-text {
            font-size: 14px;
            font-weight: 700;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }
        .footer-links {
            display: flex;
            gap: 20px;
            flex-wrap: wrap;
        }
        .footer-link {
            font-size: 13px;
            color: #666;
            text-decoration: none;
        }
        .footer-link:hover {
            color: #4A90E2;
        }
        .footer-bottom {
            text-align: center;
            font-size: 12px;
            color: #999;
            padding-top: 20px;
            border-top: 1px solid #e9ecef;
        }
        @media only screen and (max-width: 600px) {
            .email-body {
                padding: 30px 20px;
            }
            .header-title {
                font-size: 26px;
            }
            .action-card {
                flex-direction: column;
                text-align: center;
            }
            .footer-top {
                flex-direction: column;
                text-align: center;
            }
        }
    </style>
</head>
<body>
    <div class="email-container">
        <!-- Header -->
        <div class="email-header">
            <div class="logo-container">
                <img src="https://dashboard.cloudfly.com.co/images/logo-cloudfly.png" alt="CloudFly" style="height: 32px; width: auto;">
                <span class="logo-text">CloudFly Marketing AI Pro</span>
            </div>
            <h1 class="header-title">¡Bienvenido a CloudFly!</h1>
            <p class="header-subtitle">Tu viaje en la nube comienza ahora</p>
        </div>
        
        <!-- Body -->
        <div class="email-body">
            <p class="greeting">Hola <strong>${name}</strong>,</p>
            
            <p class="description">
                Gracias por registrarte en CloudFly. Ahora puedes disfrutar de todos nuestros 
                servicios en la nube diseñados para impulsar tu productividad.
            </p>
            
            <!-- Action Card -->
            <div class="action-card">
                <div class="action-icon"></div>
                <div class="action-content">
                    <div class="action-title">Activa tu cuenta</div>
                    <div class="action-description">
                        Para completar tu registro, necesitas validar tu dirección de correo electrónico.
                    </div>
                    <a href="${activateLink}" class="btn-primary">Activar mi cuenta →</a>
                </div>
            </div>
            
            <p class="support-text">
                Si tienes alguna duda, no dudes en contactarnos. Estamos aquí para ayudarte.
            </p>
            
            <p class="signature">El equipo de CloudFly</p>
        </div>
        
        <!-- Footer -->
        <div class="email-footer">
            <div class="footer-top">
                <div class="footer-logo">
                    <img src="https://dashboard.cloudfly.com.co/images/logo-cloudfly.png" alt="CloudFly" style="height: 24px; width: auto;">
                    <span class="footer-logo-text">CloudFly Marketing AI Pro</span>
                </div>
                <div class="footer-links">
                    <a href="#" class="footer-link">Políticas de privacidad</a>
                    <a href="#" class="footer-link">Términos de uso</a>
                </div>
            </div>
            <div class="footer-bottom">
                © 2025 CloudFly. Todos los derechos reservados.<br>
                Este es un correo automático, por favor no respondas directamente.
            </div>
        </div>
    </div>
</body>
</html>
