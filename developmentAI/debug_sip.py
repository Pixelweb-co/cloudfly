import socket
import time
import hashlib
import random
import string

# Configuration
SERVER_IP = "10.10.0.2"
SERVER_PORT = 5060
EXTENSION = "1001"
PASSWORD = "1234"  # Default password from vars.xml, but we will try the one from directory config if this fails
DOMAIN = "10.10.0.2"

def generate_nonce():
    return ''.join(random.choices(string.ascii_letters + string.digits, k=16))

def send_sip_message(sock, message):
    print(f"Sending:\n{message}")
    sock.sendto(message.encode(), (SERVER_IP, SERVER_PORT))
    time.sleep(1)  # Wait for response

def main():
    sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    sock.settimeout(5)
    
    # Bind to a local port
    sock.bind(("0.0.0.0", 5060)) # Try to bind to 5060, if fails use random
    
    call_id = ''.join(random.choices(string.digits, k=10))
    tag = ''.join(random.choices(string.digits, k=10))
    branch = "z9hG4bK" + ''.join(random.choices(string.digits, k=10))
    
    # 1. Send REGISTER without auth
    register_msg = f"REGISTER sip:{DOMAIN} SIP/2.0\r\n" \
                 f"Via: SIP/2.0/UDP 10.10.0.1:5060;branch={branch}\r\n" \
                 f"Max-Forwards: 70\r\n" \
                 f"From: <sip:{EXTENSION}@{DOMAIN}>;tag={tag}\r\n" \
                 f"To: <sip:{EXTENSION}@{DOMAIN}>\r\n" \
                 f"Call-ID: {call_id}@{DOMAIN}\r\n" \
                 f"CSeq: 1 REGISTER\r\n" \
                 f"Contact: <sip:{EXTENSION}@10.10.0.1:5060>\r\n" \
                 f"Expires: 3600\r\n" \
                 f"User-Agent: PythonSIP\r\n" \
                 f"Content-Length: 0\r\n\r\n"
                 
    send_sip_message(sock, register_msg)
    
    try:
        data, addr = sock.recvfrom(4096)
        print(f"Received:\n{data.decode()}")
        
        # Check for 401 Unauthorized
        if "401 Unauthorized" in data.decode():
            # Extract nonce (simplified parsing)
            response = data.decode()
            nonce_start = response.find('nonce="') + 7
            nonce_end = response.find('"', nonce_start)
            nonce = response[nonce_start:nonce_end]
            
            # Calculate response (MD5)
            # HA1 = MD5(username:realm:password)
            # HA2 = MD5(method:uri)
            # response = MD5(HA1:nonce:HA2)
            # Note: We don't have realm from config, assuming domain for now or extracting from 401
            # Let's try to extract realm as well if present, otherwise use DOMAIN
            realm = DOMAIN
            if 'realm="' in response:
                realm_start = response.find('realm="') + 7
                realm_end = response.find('"', realm_start)
                realm = response[realm_start:realm_end]
            
            ha1 = hashlib.md5(f"{EXTENSION}:{realm}:{PASSWORD}".encode()).hexdigest()
            ha2 = hashlib.md5(f"REGISTER:sip:{DOMAIN}".encode()).hexdigest()
            response_hash = hashlib.md5(f"{ha1}:{nonce}:{ha2}".encode()).hexdigest()
            
            # 2. Send REGISTER with auth
            auth_register_msg = f"REGISTER sip:{DOMAIN} SIP/2.0\r\n" \
                              f"Via: SIP/2.0/UDP 10.10.0.1:5060;branch={branch}\r\n" \
                              f"Max-Forwards: 70\r\n" \
                              f"From: <sip:{EXTENSION}@{DOMAIN}>;tag={tag}\r\n" \
                              f"To: <sip:{EXTENSION}@{DOMAIN}>\r\n" \
                              f"Call-ID: {call_id}@{DOMAIN}\r\n" \
                              f"CSeq: 2 REGISTER\r\n" \
                              f"Contact: <sip:{EXTENSION}@10.10.0.1:5060>\r\n" \
                              f"Authorization: Digest username=\"{EXTENSION}\", realm=\"{realm}\", nonce=\"{nonce}\", uri=\"sip:{DOMAIN}\", response=\"{response_hash}\"\r\n" \
                              f"Expires: 3600\r\n" \
                              f"User-Agent: PythonSIP\r\n" \
                              f"Content-Length: 0\r\n\r\n"
                              
            send_sip_message(sock, auth_register_msg)
            
            data, addr = sock.recvfrom(4096)
            print(f"Received:\n{data.decode()}")
            
    except socket.timeout:
        print("Timeout waiting for response")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        sock.close()

if __name__ == "__main__":
    main()
