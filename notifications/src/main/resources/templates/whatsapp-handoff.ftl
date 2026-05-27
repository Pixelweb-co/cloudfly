<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <title>👤 Nueva Transferencia de Chat</title>
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
            background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
            padding: 48px 32px;
            text-align: center;
            position: relative;
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
            background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
            border-radius: 8px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            font-size: 18px;
        }
        .logo-text {
            font-size: 20px;
            font-weight: 800;
            background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }
        .header-title {
            color: white;
            font-size: 32px;
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
            color: #2563eb;
            font-weight: 700;
        }
        .description {
            font-size: 16px;
            color: #4b5563;
            line-height: 1.8;
            margin-bottom: 24px;
        }
        .alert-box {
            background-color: #eff6ff;
            border: 2px solid #bfdbfe;
            border-radius: 16px;
            padding: 24px;
            margin-bottom: 36px;
        }
        .info-row {
            display: flex;
            margin-bottom: 12px;
            font-size: 15px;
        }
        .info-label {
            font-weight: 700;
            color: #4b5563;
            width: 140px;
            flex-shrink: 0;
        }
        .info-value {
            color: #1f2937;
            font-weight: 500;
        }
        .message-box {
            background-color: #f3f4f6;
            border-left: 4px solid #3b82f6;
            padding: 16px;
            border-radius: 0 8px 8px 0;
            font-style: italic;
            color: #4b5563;
            margin-top: 8px;
            white-space: pre-wrap;
        }
        .cta-container {
            text-align: center;
            margin-bottom: 36px;
        }
        .btn-primary {
            display: inline-block;
            background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
            color: white !important;
            text-decoration: none;
            padding: 18px 48px;
            border-radius: 12px;
            font-weight: 700;
            font-size: 17px;
            box-shadow: 0 8px 20px rgba(59, 130, 246, 0.3);
            transition: all 0.3s ease;
        }
        .btn-primary:hover {
            transform: translateY(-3px);
            box-shadow: 0 12px 28px rgba(59, 130, 246, 0.4);
        }
        .email-footer {
            background: linear-gradient(to bottom, #f9fafb, #f3f4f6);
            padding: 40px 32px;
            border-top: 1px solid #e5e7eb;
            text-align: center;
        }
        .footer-logo-text {
            font-size: 16px;
            font-weight: 800;
            background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }
        .footer-bottom {
            font-size: 12px;
            color: #9ca3af;
            margin-top: 24px;
        }
    </style>
</head>
<body>
    <div class="email-wrapper">
        <div class="email-container">
            <div class="email-header">
                <div class="logo-container">
                    <div class="logo-icon">👤</div>
                    <span class="logo-text">CloudFly Alerta AI</span>
                </div>
                <h1 class="header-title">Nueva Transferencia</h1>
                <p class="header-subtitle">Un cliente requiere atención de un asesor</p>
            </div>
            
            <div class="email-body">
                <p class="greeting">Hola <strong>${name}</strong>,</p>
                
                <p class="description">
                    El agente virtual ha transferido una conversación porque el cliente ha solicitado asistencia humana o requiere ayuda especializada.
                </p>
                
                <div class="alert-box">
                    <div class="info-row">
                        <div class="info-label">Cliente:</div>
                        <div class="info-value">${clientName}</div>
                    </div>
                    <div class="info-row">
                        <div class="info-label">Teléfono:</div>
                        <div class="info-value">${clientPhone}</div>
                    </div>
                    <div class="info-row">
                        <div class="info-label">Compañía:</div>
                        <div class="info-value">${companyName!"Tu Empresa"}</div>
                    </div>
                    
                    <div style="margin-top: 16px;">
                        <div class="info-label">Último mensaje de IA:</div>
                        <div class="message-box">${transferMessage!"El agente ha iniciado la transferencia."}</div>
                    </div>
                </div>

                <div class="cta-container">
                    <a href="${dashboardUrl!"https://dashboard.cloudfly.com.co/"}" class="btn-primary">Atender Cliente</a>
                </div>
                
                <p style="font-size: 14px; color: #6b7280;">
                    Atentamente,<br>
                    <strong>Sistema de Asignación CloudFly</strong>
                </p>
            </div>
            
            <div class="email-footer">
                <span class="footer-logo-text">CloudFly Marketing AI Pro</span>
                <div class="footer-bottom">
                    © 2024-2025 CloudFly. Notificación automática de sistema.<br>
                    Por favor no respondas a este correo.
                </div>
            </div>
        </div>
    </div>
</body>
</html>
