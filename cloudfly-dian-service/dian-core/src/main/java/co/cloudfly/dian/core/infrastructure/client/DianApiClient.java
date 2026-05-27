package co.cloudfly.dian.core.infrastructure.client;

import co.cloudfly.dian.core.application.dto.DianApiResponse;
import co.cloudfly.dian.core.application.dto.DianOperationModeResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.w3c.dom.Document;
import org.w3c.dom.NodeList;

import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;
import java.io.ByteArrayInputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.UUID;

/**
 * Cliente para enviar documentos electrónicos a la DIAN
 * Implementa comunicación SOAP con los servicios DIAN
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class DianApiClient {

    @Value("${dian.api.test-url}")
    private String dianTestUrl;

    @Value("${dian.api.production-url}")
    private String dianProductionUrl;

    @Value("${dian.api.timeout:60000}")
    private int timeout;

    /**
     * Envía una factura/nota electrónica a la DIAN
     */
    public DianApiResponse sendInvoice(String signedXml, DianOperationModeResponse operationMode) {
        log.info("Sending invoice to DIAN - Environment: {}", operationMode.getEnvironment());

        try {
            String endpoint = "TEST".equals(operationMode.getEnvironment())
                    ? dianTestUrl
                    : dianProductionUrl;

            // Construir SOAP envelope
            String soapRequest = buildInvoiceSoapRequest(signedXml, operationMode);

            // Enviar petición
            String soapResponse = sendSoapRequest(endpoint + "/wcf/ReceiveInvoice.svc", soapRequest);

            // Parsear respuesta
            return parseDianResponse(soapResponse);

        } catch (Exception e) {
            log.error("Error sending invoice to DIAN", e);
            return DianApiResponse.builder()
                    .accepted(false)
                    .errorCode("CONNECTION_ERROR")
                    .errorMessage(e.getMessage())
                    .build();
        }
    }

    /**
     * Envía una nómina electrónica a la DIAN
     */
    public DianApiResponse sendPayroll(String signedXml, DianOperationModeResponse operationMode) {
        log.info("Sending payroll to DIAN - Environment: {}", operationMode.getEnvironment());

        try {
            String endpoint = "TEST".equals(operationMode.getEnvironment())
                    ? dianTestUrl
                    : dianProductionUrl;

            // Construir SOAP envelope para nómina
            String soapRequest = buildPayrollSoapRequest(signedXml, operationMode);

            // Enviar petición
            String soapResponse = sendSoapRequest(endpoint + "/wcf/ReceivePayroll.svc", soapRequest);

            // Parsear respuesta
            return parseDianResponse(soapResponse);

        } catch (Exception e) {
            log.error("Error sending payroll to DIAN", e);
            return DianApiResponse.builder()
                    .accepted(false)
                    .errorCode("CONNECTION_ERROR")
                    .errorMessage(e.getMessage())
                    .build();
        }
    }

    /**
     * Construye el SOAP request para factura
     */
    private String buildInvoiceSoapRequest(String signedXml, DianOperationModeResponse mode) {
        String encodedXml = java.util.Base64.getEncoder().encodeToString(
                signedXml.getBytes(StandardCharsets.UTF_8));

        return String.format("""
                <?xml version="1.0" encoding="UTF-8"?>
                <soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"
                               xmlns:wcf="http://wcf.dian.colombia">
                    <soap:Header/>
                    <soap:Body>
                        <wcf:SendBillSync>
                            <wcf:fileName>%s.xml</wcf:fileName>
                            <wcf:contentFile>%s</wcf:contentFile>
                        </wcf:SendBillSync>
                    </soap:Body>
                </soap:Envelope>
                """,
                UUID.randomUUID().toString(),
                encodedXml);
    }

    /**
     * Construye el SOAP request para nómina
     */
    private String buildPayrollSoapRequest(String signedXml, DianOperationModeResponse mode) {
        String encodedXml = java.util.Base64.getEncoder().encodeToString(
                signedXml.getBytes(StandardCharsets.UTF_8));

        return String.format("""
                <?xml version="1.0" encoding="UTF-8"?>
                <soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"
                               xmlns:wcf="http://wcf.dian.colombia">
                    <soap:Header/>
                    <soap:Body>
                        <wcf:SendNominaSync>
                            <wcf:fileName>%s.xml</wcf:fileName>
                            <wcf:contentFile>%s</wcf:contentFile>
                        </wcf:SendNominaSync>
                    </soap:Body>
                </soap:Envelope>
                """,
                UUID.randomUUID().toString(),
                encodedXml);
    }

    /**
     * Envía petición SOAP HTTP
     */
    private String sendSoapRequest(String endpoint, String soapRequest) throws Exception {
        URL url = new URL(endpoint);
        HttpURLConnection connection = (HttpURLConnection) url.openConnection();

        connection.setRequestMethod("POST");
        connection.setRequestProperty("Content-Type", "text/xml; charset=utf-8");
        connection.setRequestProperty("SOAPAction", "");
        connection.setDoOutput(true);
        connection.setConnectTimeout(timeout);
        connection.setReadTimeout(timeout);

        // Enviar request
        try (OutputStream os = connection.getOutputStream()) {
            byte[] input = soapRequest.getBytes(StandardCharsets.UTF_8);
            os.write(input, 0, input.length);
        }

        // Leer respuesta
        int responseCode = connection.getResponseCode();
        log.info("DIAN Response Code: {}", responseCode);

        try (java.io.InputStream is = connection.getInputStream()) {
            return new String(is.readAllBytes(), StandardCharsets.UTF_8);
        }
    }

    /**
     * Parsea la respuesta SOAP de la DIAN
     */
    private DianApiResponse parseDianResponse(String soapResponse) {
        try {
            DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
            factory.setNamespaceAware(true);
            DocumentBuilder builder = factory.newDocumentBuilder();
            Document doc = builder.parse(new ByteArrayInputStream(
                    soapResponse.getBytes(StandardCharsets.UTF_8)));

            // Buscar elementos de respuesta DIAN
            NodeList statusNodes = doc.getElementsByTagNameNS("*", "StatusCode");
            NodeList cufeNodes = doc.getElementsByTagNameNS("*", "UUID");
            NodeList messageNodes = doc.getElementsByTagNameNS("*", "StatusMessage");

            String statusCode = statusNodes.getLength() > 0
                    ? statusNodes.item(0).getTextContent()
                    : "";
            String cufe = cufeNodes.getLength() > 0
                    ? cufeNodes.item(0).getTextContent()
                    : "";
            String message = messageNodes.getLength() > 0
                    ? messageNodes.item(0).getTextContent()
                    : "";

            boolean accepted = "00".equals(statusCode) || "Procesado Correctamente".equals(message);

            return DianApiResponse.builder()
                    .accepted(accepted)
                    .cufe(cufe)
                    .xmlResponse(soapResponse)
                    .errorCode(accepted ? null : statusCode)
                    .errorMessage(accepted ? null : message)
                    .statusDescription(message)
                    .build();

        } catch (Exception e) {
            log.error("Error parsing DIAN response", e);
            return DianApiResponse.builder()
                    .accepted(false)
                    .xmlResponse(soapResponse)
                    .errorCode("PARSE_ERROR")
                    .errorMessage("Error parsing DIAN response: " + e.getMessage())
                    .build();
        }
    }
}
