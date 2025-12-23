<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Colilla de Pago</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 0;
            padding: 0;
            background-color: #f5f5f5;
        }
        .container {
            max-width: 600px;
            margin: 20px auto;
            background-color: #ffffff;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }
        .header {
            background: linear-gradient(135deg, #00897B 0%, #00695C 100%);
            color: white;
            padding: 30px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 24px;
            font-weight: 600;
        }
        .header p {
            margin: 10px 0 0;
            opacity: 0.9;
            font-size: 14px;
        }
        .content {
            padding: 30px;
        }
        .greeting {
            font-size: 18px;
            color: #333;
            margin-bottom: 20px;
        }
        .info-box {
            background-color: #E8F5E9;
            border-left: 4px solid #4CAF50;
            padding: 15px 20px;
            border-radius: 0 8px 8px 0;
            margin-bottom: 25px;
        }
        .info-box p {
            margin: 0;
            color: #2E7D32;
            font-size: 14px;
        }
        .summary-table {
            width: 100%;
            border-collapse: collapse;
            margin: 25px 0;
        }
        .summary-table th {
            background-color: #00897B;
            color: white;
            padding: 12px 15px;
            text-align: left;
            font-weight: 500;
        }
        .summary-table td {
            padding: 12px 15px;
            border-bottom: 1px solid #eee;
        }
        .summary-table tr:last-child td {
            border-bottom: none;
        }
        .total-row {
            background-color: #E8F5E9;
            font-weight: bold;
        }
        .total-row td {
            color: #00897B;
            font-size: 18px;
        }
        .amount {
            text-align: right;
            font-family: 'Courier New', Courier, monospace;
        }
        .perception {
            color: #4CAF50;
        }
        .deduction {
            color: #f44336;
        }
        .divider {
            height: 1px;
            background: linear-gradient(to right, transparent, #ddd, transparent);
            margin: 25px 0;
        }
        .cta-section {
            text-align: center;
            padding: 20px;
            background-color: #f9f9f9;
            border-radius: 8px;
            margin-top: 20px;
        }
        .cta-section p {
            margin: 0 0 10px;
            color: #666;
            font-size: 14px;
        }
        .footer {
            background-color: #f5f5f5;
            padding: 20px 30px;
            text-align: center;
            color: #888;
            font-size: 12px;
        }
        .footer a {
            color: #00897B;
            text-decoration: none;
        }
        @media only screen and (max-width: 600px) {
            .container {
                margin: 0;
                border-radius: 0;
            }
            .content {
                padding: 20px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>💰 Colilla de Pago</h1>
            <p>${periodName}</p>
        </div>
        
        <div class="content">
            <p class="greeting">Hola <strong>${employeeName}</strong>,</p>
            
            <div class="info-box">
                <p>📄 Tu colilla de pago del período <strong>${periodName}</strong> está lista.</p>
            </div>
            
            <table class="summary-table">
                <thead>
                    <tr>
                        <th colspan="2">Resumen de tu Nómina</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>Período</td>
                        <td class="amount">${periodStart} - ${periodEnd}</td>
                    </tr>
                    <tr>
                        <td>Recibo #</td>
                        <td class="amount">${receiptNumber}</td>
                    </tr>
                    <tr>
                        <td>Total Percepciones</td>
                        <td class="amount perception">${totalPerceptions}</td>
                    </tr>
                    <tr>
                        <td>Total Deducciones</td>
                        <td class="amount deduction">${totalDeductions}</td>
                    </tr>
                    <tr class="total-row">
                        <td><strong>NETO A PAGAR</strong></td>
                        <td class="amount"><strong>${netPay}</strong></td>
                    </tr>
                </tbody>
            </table>
            
            <div class="divider"></div>
            
            <div class="cta-section">
                <p>📎 Adjunto encontrarás el PDF detallado de tu colilla de pago.</p>
                <p style="font-size: 12px; color: #999;">Guárdalo para tus registros personales.</p>
            </div>
        </div>
        
        <div class="footer">
            <p>Este es un correo automático generado por <a href="#">CloudFly</a></p>
            <p>Si tienes dudas sobre tu nómina, contacta a Recursos Humanos.</p>
            <p>&copy; ${.now?string('yyyy')} CloudFly. Todos los derechos reservados.</p>
        </div>
    </div>
</body>
</html>
