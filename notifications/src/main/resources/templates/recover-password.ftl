<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <title>🔐 Recuperación de Contraseña - CloudFly</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background-color: #f7f8fa;
            padding: 0;
            margin: 0;
            width: 100% !important;
        }
        .email-wrapper {
            width: 100%;
            background-color: #f7f8fa;
            padding: 40px 0;
        }
        .email-container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 8px 24px rgba(0,0,0,0.08);
        }
        .email-header {
            background: linear-gradient(135deg, #EF4444 0%, #DC2626 100%);
            padding: 48px 32px;
            text-align: center;
        }
        .lock-icon {
            width: 80px;
            height: 80px;
            background: rgba(255,255,255,0.2);
            border-radius: 20px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 20px;
            font-size: 40px;
        }
        .header-title {
            color: white;
            font-size: 32px;
            font-weight: 800;
            margin-bottom: 12px;
        }
        .header-subtitle {
            color: rgba(255,255,255,0.95);
            font-size: 16px;
        }
        .email-body {
            padding: 48px 40px;
        }
        .greeting {
            font-size: 18px;
            color: #1f2937;
            margin-bottom: 24px;
            font-weight: 500;
        }
        .greeting strong {
            color: #EF4444;
            font-weight: 700;
        }
        .alert-box {
            background: #FEF2F2;
            border-left: 4px solid #EF4444;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 28px;
        }
        .alert-title {
            font-size: 16px;
            font-weight: 700;
            color: #991B1B;
            margin-bottom: 8px;
        }
        .alert-text {
            font-size: 14px;
            color: #7F1D1D;
            line-height: 1.6;
        }
        .cta-container {
            background: linear-gradient(135deg, rgba(239, 68, 68, 0.05) 0%, rgba(220, 38, 38, 0.05) 100%);
            border: 2px solid #FEE2E2;
            border-radius: 16px;
            padding: 32px;
            margin-bottom: 28px;
            text-align: center;
        }
        .cta-title {
            font-size: 20px;
            font-weight: 700;
            color: #1f2937;
            margin-bottom: 16px;
        }
        .btn-primary {
            display: inline-block;
            background: linear-gradient(135deg, #EF4444 0%, #DC2626 100%);
            color: white !important;
            text-decoration: none;
            padding: 18px 48px;
            border-radius: 12px;
            font-weight: 700;
            font-size: 17px;
            box-shadow: 0 8px 20px rgba(239, 68, 68, 0.35);
            transition: all 0.3s ease;
        }
        .btn-primary:hover {
            transform: translateY(-3px);
            box-shadow: 0 12px 28px rgba(239, 68, 68, 0.45);
        }
        .info-box {
            background-color: #f9fafb;
            border-left: 4px solid #8B5CF6;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 28px;
        }
        .info-text {
            font-size: 14px;
            color: #4b5563;
            line-height: 1.6;
            margin: 0;
        }
        .signature {
            font-size: 16px;
            color: #1f2937;
            font-weight: 700;
        }
        .email-footer {
            background: linear-gradient(to bottom, #f9fafb, #f3f4f6);
            padding: 40px 32px;
            border-top: 1px solid #e5e7eb;
            text-align: center;
        }
        .footer-text {
            font-size: 12px;
            color: #9ca3af;
            line-height: 1.8;
        }
        @media only screen and (max-width: 600px) {
            .email-wrapper {
                padding: 20px 0;
            }
            .email-body {
                padding: 32px 24px;
            }
            .email-header {
                padding: 36px 24px;
            }
            .header-title {
                font-size: 26px;
            }
            .btn-primary {
                padding: 16px 32px;
                font-size: 16px;
                display: block;
                width: 100%;
            }
        }
    </style>
</head>
<body>
    <div class="email-wrapper">
        <div class="email-container">
            <!-- Header -->
            <div class="email-header">
                <div class="lock-icon">🔐</div>
                <h1 class="header-title">Recuperación de Contraseña</h1>
                <p class="header-subtitle">Restablecer acceso a tu cuenta</p>
            </div>
            
            <!-- Body -->
            <div class="email-body">
                <p class="greeting">Hola <strong>${username}</strong>,</p>
                
                <!-- Alert Box -->
                <div class="alert-box">
                    <div class="alert-title">⚠️ Solicitud de Recuperación Recibida</div>
                    <div class="alert-text">
                        Hemos recibido una solicitud para restablecer la contraseña de tu cuenta en CloudFly Marketing AI Pro.
                    </div>
                </div>
                
                <!-- CTA Container -->
                <div class="cta-container">
                    <div class="cta-title">Haz clic para restablecer tu contraseña</div>
                    <a href="${recoverLink}" class="btn-primary">🔑 Restablecer Contraseña</a>
                </div>
                
                <!-- Info Box -->
                <div class="info-box">
                    <p class="info-text">
                        <strong>Importante:</strong><br>
                        • Este enlace es válido solo por <strong>24 horas</strong><br>
                        • Si no solicitaste este cambio, puedes ignorar este correo<br>
                        • Tu contraseña actual permanecerá sin cambios hasta que completes el proceso<br>
                        • Por seguridad, nunca compartas este enlace con nadie
                    </p>
                </div>
                
                <p class="signature">El equipo de CloudFly</p>
            </div>
            
            <!-- Footer -->
            <div class="email-footer">
                <p class="footer-text">
                    © 2024-2025 CloudFly Marketing AI Pro. Todos los derechos reservados.<br>
                    Hecho con ❤️ en Colombia 🇨🇴<br>
                    <br>
                    Este es un correo automático, por favor no respondas directamente.<br>
                    Si no solicitaste este cambio, contacta inmediatamente a <a href="mailto:soporte@cloudfly.com.co" style="color: #8B5CF6;">soporte@cloudfly.com.co</a>
                </p>
            </div>
        </div>
    </div>
</body>
</html>
