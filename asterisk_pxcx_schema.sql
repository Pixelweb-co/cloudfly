CREATE DATABASE IF NOT EXISTS PXCX;
USE PXCX;

-- Table for Endpoints (Extensions)
CREATE TABLE IF NOT EXISTS ps_endpoints (
    id VARCHAR(40) NOT NULL,
    transport VARCHAR(40),
    aors VARCHAR(200),
    auth VARCHAR(40),
    context VARCHAR(40),
    disallow VARCHAR(200),
    allow VARCHAR(200),
    direct_media VARCHAR(3) DEFAULT 'no',
    rewrite_contact VARCHAR(3) DEFAULT 'yes',
    rtp_symmetric VARCHAR(3) DEFAULT 'yes',
    force_rport VARCHAR(3) DEFAULT 'yes',
    ice_support VARCHAR(3) DEFAULT 'yes',
    dtls_auto_generate_cert VARCHAR(3) DEFAULT 'yes',
    webrtc VARCHAR(3) DEFAULT 'yes',
    use_avpf VARCHAR(3) DEFAULT 'yes',
    media_encryption VARCHAR(10) DEFAULT 'dtls',
    dtls_verify VARCHAR(40) DEFAULT 'no',
    dtls_setup VARCHAR(40) DEFAULT 'actpass',
    PRIMARY KEY (id)
);

-- Table for Auths (Credentials)
CREATE TABLE IF NOT EXISTS ps_auths (
    id VARCHAR(40) NOT NULL,
    auth_type ENUM('md5','password') DEFAULT 'password',
    password VARCHAR(80),
    username VARCHAR(80),
    PRIMARY KEY (id)
);

-- Table for AORs (Address of Record / Registrations)
CREATE TABLE IF NOT EXISTS ps_aors (
    id VARCHAR(40) NOT NULL,
    max_contacts INT DEFAULT 1,
    remove_existing VARCHAR(3) DEFAULT 'yes',
    PRIMARY KEY (id)
);

-- Table for CDR (Call Detail Records)
CREATE TABLE IF NOT EXISTS cdr (
    id INT(11) NOT NULL AUTO_INCREMENT,
    accountcode VARCHAR(20) DEFAULT NULL,
    src VARCHAR(80) DEFAULT NULL,
    dst VARCHAR(80) DEFAULT NULL,
    dcontext VARCHAR(80) DEFAULT NULL,
    clid VARCHAR(80) DEFAULT NULL,
    channel VARCHAR(80) DEFAULT NULL,
    dstchannel VARCHAR(80) DEFAULT NULL,
    lastapp VARCHAR(80) DEFAULT NULL,
    lastdata VARCHAR(80) DEFAULT NULL,
    start datetime DEFAULT NULL,
    answer datetime DEFAULT NULL,
    end datetime DEFAULT NULL,
    duration INT(11) DEFAULT NULL,
    billsec INT(11) DEFAULT NULL,
    disposition VARCHAR(45) DEFAULT NULL,
    amaflags INT(11) DEFAULT NULL,
    uniqueid VARCHAR(150) DEFAULT NULL,
    userfield VARCHAR(255) DEFAULT NULL,
    sequence INT(11) DEFAULT NULL,
    peeraccount VARCHAR(20) DEFAULT NULL,
    linkedid VARCHAR(150) DEFAULT NULL,
    PRIMARY KEY (id)
);
