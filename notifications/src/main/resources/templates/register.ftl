<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <title>✨ Bienvenido a CloudFly Marketing AI Pro</title>
    <!--[if mso]>
    <style type="text/css">
        body, table, td {font-family: Arial, Helvetica, sans-serif !important;}
    </style>
    <![endif]-->
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
            background: linear-gradient(135deg, #8B5CF6 0%, #3B82F6 100%);
            padding: 48px 32px;
            text-align: center;
            position: relative;
        }
        .email-header::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: url('data:image/svg+xml,%3Csvg width="100" height="100" xmlns="http://www.w3.org/2000/svg"%3E%3Cpath d="M0 0h100v100H0z" fill="none"/%3E%3Cpath d="M10 10h30v30H10zm50 0h30v30H50zM10 50h30v30H10zm50 0h30v30H50z" fill="%23fff" fill-opacity="0.05"/%3E%3C/svg%3E');
            opacity: 0.3;
        }
        .logo-container {
            background-color: white;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 12px;
            padding: 16px 28px;
            border-radius: 12px;
            margin-bottom: 24px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
            position: relative;
            z-index: 1;
        }
        .logo-icon {
            width: 32px;
            height: 32px;
            background: linear-gradient(135deg, #8B5CF6 0%, #3B82F6 100%);
            border-radius: 8px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            font-size: 18px;
        }
        .logo-text {
            font-size: 20px;
            font-weight: 800;
            background: linear-gradient(135deg, #8B5CF6 0%, #3B82F6 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }
        .header-title {
            color: white;
            font-size: 36px;
            font-weight: 800;
            margin-bottom: 12px;
            position: relative;
            z-index: 1;
            letter-spacing: -0.5px;
        }
        .header-subtitle {
            color: rgba(255,255,255,0.95);
            font-size: 18px;
            position: relative;
            z-index: 1;
            font-weight: 500;
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
            color: #8B5CF6;
            font-weight: 700;
        }
        .description {
            font-size: 16px;
            color: #4b5563;
            line-height: 1.8;
            margin-bottom: 36px;
        }
        .cta-container {
            background: linear-gradient(135deg, rgba(139, 92, 246, 0.05) 0%, rgba(59, 130, 246, 0.05) 100%);
            border: 2px solid #e5e7eb;
            border-radius: 16px;
            padding: 32px;
            margin-bottom: 36px;
            text-align: center;
        }
        .cta-icon {
            width: 64px;
            height: 64px;
            background: linear-gradient(135deg, #8B5CF6 0%, #3B82F6 100%);
            border-radius: 16px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 20px;
            box-shadow: 0 8px 20px rgba(139, 92, 246, 0.3);
        }
        .cta-icon::before {
            content: "🚀";
            font-size: 32px;
        }
        .cta-title {
            font-size: 24px;
            font-weight: 800;
            color: #1f2937;
            margin-bottom: 12px;
            letter-spacing: -0.3px;
        }
        .cta-description {
            font-size: 15px;
            color: #6b7280;
            margin-bottom: 28px;
            line-height: 1.6;
        }
        .btn-primary {
            display: inline-block;
            background: linear-gradient(135deg, #8B5CF6 0%, #3B82F6 100%);
            color: white !important;
            text-decoration: none;
            padding: 18px 48px;
            border-radius: 12px;
            font-weight: 700;
            font-size: 17px;
            box-shadow: 0 8px 20px rgba(139, 92, 246, 0.35);
            transition: all 0.3s ease;
            text-align: center;
        }
        .btn-primary:hover {
            transform: translateY(-3px);
            box-shadow: 0 12px 28px rgba(139, 92, 246, 0.45);
        }
        .features-grid {
            display: table;
            width: 100%;
            margin-bottom: 36px;
            border-collapse: collapse;
        }
        .feature-item {
            display: table-row;
        }
        .feature-icon-cell {
            display: table-cell;
            width: 50px;
            vertical-align: top;
            padding: 0 16px 20px 0;
        }
        .feature-icon {
            width: 40px;
            height: 40px;
            background: linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(59, 130, 246, 0.1) 100%);
            border-radius: 10px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            font-size: 20px;
        }
        .feature-content-cell {
            display: table-cell;
            vertical-align: top;
            padding-bottom: 20px;
        }
        .feature-title {
            font-size: 16px;
            font-weight: 700;
            color: #1f2937;
            margin-bottom: 4px;
        }
        .feature-text {
            font-size: 14px;
            color: #6b7280;
            line-height: 1.6;
        }
        .support-box {
            background-color: #f9fafb;
            border-left: 4px solid #8B5CF6;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 28px;
        }
        .support-text {
            font-size: 14px;
            color: #4b5563;
            line-height: 1.6;
            margin: 0;
        }
        .signature {
            font-size: 16px;
            color: #1f2937;
            font-weight: 700;
            margin-bottom: 8px;
        }
        .signature-role {
            font-size: 14px;
            color: #8B5CF6;
            font-weight: 600;
        }
        .email-footer {
            background: linear-gradient(to bottom, #f9fafb, #f3f4f6);
            padding: 40px 32px;
            border-top: 1px solid #e5e7eb;
        }
        .footer-logo-section {
            text-align: center;
            margin-bottom: 28px;
        }
        .footer-logo {
            display: inline-flex;
            align-items: center;
            gap: 10px;
            margin-bottom: 16px;
        }
        .footer-logo-icon {
            width: 28px;
            height: 28px;
            background: linear-gradient(135deg, #8B5CF6 0%, #3B82F6 100%);
            border-radius: 7px;
        }
        .footer-logo-text {
            font-size: 16px;
            font-weight: 800;
            background: linear-gradient(135deg, #8B5CF6 0%, #3B82F6 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }
        .footer-links {
            text-align: center;
            margin-bottom: 20px;
        }
        .footer-link {
            font-size: 13px;
            color: #6b7280;
            text-decoration: none;
            margin: 0 12px;
        }
        .footer-link:hover {
            color: #8B5CF6;
        }
        .footer-bottom {
            text-align: center;
            font-size: 12px;
            color: #9ca3af;
            padding-top: 24px;
            border-top: 1px solid #e5e7eb;
        }
        .footer-emoji {
            display: inline-block;
            margin: 0 4px;
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
                font-size: 28px;
            }
            .header-subtitle {
                font-size: 16px;
            }
            .btn-primary {
                padding: 16px 32px;
                font-size: 16px;
                display: block;
                width: 100%;
                box-sizing: border-box;
            }
            .cta-container {
                padding: 24px 20px;
            }
            .email-footer {
                padding: 32px 24px;
            }
        }
    </style>
</head>
<body>
    <div class="email-wrapper">
        <div class="email-container">
            <!-- Header -->
            <div class="email-header">
                <div class="logo-container">
                    <div class="logo-icon">🤖</div>
                    <span class="logo-text">CloudFly Marketing AI Pro</span>
                </div>
                <h1 class="header-title">✨ ¡Bienvenido a CloudFly!</h1>
                <p class="header-subtitle">Tu plataforma de marketing con IA comienza ahora</p>
            </div>
            
            <!-- Body -->
            <div class="email-body">
                <p class="greeting">Hola <strong>${name}</strong>,</p>
                
                <p class="description">
                    ¡Estamos emocionados de tenerte con nosotros! Gracias por registrarte en CloudFly Marketing AI Pro, 
                    la plataforma todo-en-uno que transformará la forma en que gestionas tu negocio con el poder de la inteligencia artificial.
                </p>
                
                <!-- CTA Card -->
                <div class="cta-container">
                    <div class="cta-icon"></div>
                    <div class="cta-title">¡Solo un paso más!</div>
                    <div class="cta-description">
                        Para comenzar a disfrutar de todas las funcionalidades, primero necesitamos verificar tu cuenta. 
                        Solo toma un clic y estarás listo para despegar.
                    </div>
                    <a href="${activateLink}" class="btn-primary">🚀 Activar mi Cuenta</a>
                </div>
                
                <!-- Features -->
                <div class="features-grid">
                    <div class="feature-item">
                        <div class="feature-icon-cell">
                            <div class="feature-icon">📊</div>
                        </div>
                        <div class="feature-content-cell">
                            <div class="feature-title">Dashboard Inteligente</div>
                            <div class="feature-text">Visualiza métricas en tiempo real con insights impulsados por IA</div>
                        </div>
                    </div>
                    <div class="feature-item">
                        <div class="feature-icon-cell">
                            <div class="feature-icon">🤖</div>
                        </div>
                        <div class="feature-content-cell">
                            <div class="feature-title">Chatbot AI 24/7</div>
                            <div class="feature-text">Atención automática a tus clientes con WhatsApp integrado</div>
                        </div>
                    </div>
                    <div class="feature-item">
                        <div class="feature-icon-cell">
                            <div class="feature-icon">💼</div>
                        </div>
                        <div class="feature-content-cell">
                            <div class="feature-title">Gestión Completa</div>
                            <div class="feature-text">Ventas, inventario, contabilidad y nómina en una sola plataforma</div>
                        </div>
                    </div>
                </div>
                
                <!-- Support Box -->
                <div class="support-box">
                    <p class="support-text">
                        <strong>¿Necesitas ayuda?</strong><br>
                        Nuestro equipo está disponible para responder tus preguntas. 
                        Contáctanos en <a href="mailto:soporte@cloudfly.com.co" style="color: #8B5CF6; text-decoration: none; font-weight: 600;">soporte@cloudfly.com.co</a>
                    </p>
                </div>
                
                <p class="signature">El equipo de CloudFly</p>
                <p class="signature-role">CloudFly Marketing AI Pro</p>
            </div>
            
            <!-- Footer -->
            <div class="email-footer">
                <div class="footer-logo-section">
                    <div class="footer-logo">
                        <div class="footer-logo-icon"></div>
                        <span class="footer-logo-text">CloudFly Marketing AI Pro</span>
                    </div>
                </div>
                
                <div class="footer-links">
                    <a href="https://cloudfly.com.co" class="footer-link">Inicio</a>
                    <a href="https://dashboard.cloudfly.com.co" class="footer-link">Dashboard</a>
                    <a href="https://cloudfly.com.co/terminos" class="footer-link">Términos</a>
                    <a href="https://cloudfly.com.co/privacidad" class="footer-link">Privacidad</a>
                </div>
                
                <div class="footer-bottom">
                    © 2024-2025 CloudFly. Todos los derechos reservados.<br>
                    Hecho con <span class="footer-emoji">❤️</span> en Colombia <span class="footer-emoji">🇨🇴</span><br>
                    <br>
                    Este es un correo automático, por favor no respondas directamente.<br>
                    Si no solicitaste este registro, puedes ignorar este mensaje.
                </div>
            </div>
        </div>
    </div>
</body>
</html>
