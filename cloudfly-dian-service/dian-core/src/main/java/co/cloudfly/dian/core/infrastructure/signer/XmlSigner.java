package co.cloudfly.dian.core.infrastructure.signer;

import lombok.extern.slf4j.Slf4j;
import org.apache.xml.security.Init;
import org.apache.xml.security.signature.XMLSignature;
import org.apache.xml.security.transforms.Transforms;
import org.apache.xml.security.utils.XMLUtils;
import org.bouncycastle.jce.provider.BouncyCastleProvider;
import org.springframework.stereotype.Component;
import org.w3c.dom.Document;
import org.w3c.dom.Element;

import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.security.KeyStore;
import java.security.PrivateKey;
import java.security.Security;
import java.security.cert.X509Certificate;
import java.util.Enumeration;

/**
 * Firmador de XML usando firma digital XAdES-BES
 * Utiliza BouncyCastle y Apache Santuario
 */
@Component
@Slf4j
public class XmlSigner {

    static {
        // Inicializar Apache XML Security
        Init.init();

        // Agregar BouncyCastle como provider
        if (Security.getProvider("BC") == null) {
            Security.addProvider(new BouncyCastleProvider());
        }
    }

    /**
     * Firma un XML con certificado digital .p12
     * 
     * @param xmlBytes        XML sin firmar
     * @param certificatePath Ruta al archivo .p12 o .pfx
     * @param password        Contraseña del certificado
     * @return XML firmado
     */
    public byte[] signXml(byte[] xmlBytes, String certificatePath, String password) {
        log.info("🔐 Signing XML with certificate: {}", certificatePath);

        try {
            // 1. Cargar certificado
            KeyStoreInfo keyStoreInfo = loadKeyStore(certificatePath, password);

            // 2. Parsear XML
            DocumentBuilderFactory dbf = DocumentBuilderFactory.newInstance();
            dbf.setNamespaceAware(true);
            DocumentBuilder db = dbf.newDocumentBuilder();
            Document doc = db.parse(new ByteArrayInputStream(xmlBytes));

            // 3. Crear firma XML
            Element root = doc.getDocumentElement();

            XMLSignature signature = new XMLSignature(
                    doc,
                    "", // BaseURI
                    XMLSignature.ALGO_ID_SIGNATURE_RSA_SHA256);

            // Agregar la firma como elemento hijo del root
            root.appendChild(signature.getElement());

            // 4. Crear transformaciones
            Transforms transforms = new Transforms(doc);
            transforms.addTransform(Transforms.TRANSFORM_ENVELOPED_SIGNATURE);
            transforms.addTransform(Transforms.TRANSFORM_C14N_EXCL_OMIT_COMMENTS);

            // 5. Agregar referencia al documento (todo el documento)
            signature.addDocument(
                    "", // URI vacía significa todo el documento
                    transforms,
                    "http://www.w3.org/2001/04/xmlenc#sha256" // MessageDigest SHA256
            );

            // 6. Agregar información de la clave (X509Certificate)
            signature.addKeyInfo(keyStoreInfo.certificate);

            // 7. Firmar
            signature.sign(keyStoreInfo.privateKey);

            // 8. Serializar documento firmado
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            XMLUtils.outputDOM(doc, baos);
            byte[] signedXml = baos.toByteArray();

            log.info("✅ XML signed successfully - Size: {} bytes", signedXml.length);
            return signedXml;

        } catch (Exception e) {
            log.error("❌ Error signing XML", e);
            throw new RuntimeException("Failed to sign XML", e);
        }
    }

    /**
     * Carga el KeyStore (.p12 o .pfx)
     */
    private KeyStoreInfo loadKeyStore(String path, String password) throws Exception {
        log.info("Loading keystore from: {}", path);

        File file = new File(path);
        if (!file.exists()) {
            throw new IllegalArgumentException("Certificate file not found: " + path);
        }

        // Cargar KeyStore
        KeyStore keyStore = KeyStore.getInstance("PKCS12", "BC");

        try (FileInputStream fis = new FileInputStream(file)) {
            keyStore.load(fis, password.toCharArray());
        }

        // Obtener alias (normalmente hay solo uno)
        Enumeration<String> aliases = keyStore.aliases();
        if (!aliases.hasMoreElements()) {
            throw new IllegalStateException("No aliases found in keystore");
        }

        String alias = aliases.nextElement();
        log.info("Using alias: {}", alias);

        // Obtener clave privada
        PrivateKey privateKey = (PrivateKey) keyStore.getKey(alias, password.toCharArray());
        if (privateKey == null) {
            throw new IllegalStateException("Private key not found for alias: " + alias);
        }

        // Obtener certificado
        X509Certificate certificate = (X509Certificate) keyStore.getCertificate(alias);
        if (certificate == null) {
            throw new IllegalStateException("Certificate not found for alias: " + alias);
        }

        log.info("Certificate loaded - Subject: {}", certificate.getSubjectX500Principal().getName());
        log.info("Certificate valid from {} to {}",
                certificate.getNotBefore(), certificate.getNotAfter());

        return new KeyStoreInfo(privateKey, certificate);
    }

    /**
     * Clase auxiliar para almacenar info del KeyStore
     */
    private static class KeyStoreInfo {
        final PrivateKey privateKey;
        final X509Certificate certificate;

        KeyStoreInfo(PrivateKey privateKey, X509Certificate certificate) {
            this.privateKey = privateKey;
            this.certificate = certificate;
        }
    }
}
