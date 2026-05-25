# FreeSWITCH PBX Docker Deployment

## Overview
This project deploys a FreeSWITCH PBX system in a Docker container on Windows with 2 extensions (1001 and 1002).

## Architecture
- **Container**: safarov/freeswitch (official FreeSWITCH Docker image)
- **Network**: Bridge network with SIP and RTP port mappings
- **Storage**: Persistent volumes for configuration, logs, and recordings
- **Healthcheck**: Automatic health monitoring via fs_cli

## Prerequisites
- Windows 10/11 or Windows Server 2019/2022
- Docker Desktop for Windows (with WSL 2 backend recommended)
- Minimum 2GB RAM, 2 CPU cores

## Quick Start

### 1. Clone/Download this project
```bash
cd developmentAI
```

### 2. Create required directories
```bash
mkdir -p conf/directory/default
mkdir -p log
mkdir -p recordings
```

### 3. Start the PBX
```bash
docker-compose up -d
```

### 4. Verify services are running
```bash
docker ps
docker logs freeswitch-pbx
```

### 5. Test the PBX
```bash
./test-pbx.sh
```

## Configuration Details

### Extensions
- **Extension 1001**: Password `1234`, Caller ID "Extension 1001"
- **Extension 1002**: Password `1234`, Caller ID "Extension 1002"

### Ports
- **5060/UDP/TCP**: SIP signaling
- **5080/UDP/TCP**: Alternate SIP port
- **8021/TCP**: Event Socket (for external applications)
- **16384-16484/UDP**: RTP media streams

### Volumes
- `./conf`: FreeSWITCH configuration files
- `./log`: Log files
- `./recordings`: Call recordings

## SIP Client Configuration
Use any SIP client (Zoiper, Linphone, MicroSIP, etc.):

| Setting | Value |
|---------|-------|
| Server | Docker host IP (e.g., 192.168.1.100) |
| Port | 5060 |
| Username | 1001 or 1002 |
| Password | 1234 |
| Transport | UDP or TCP |

## Testing

### Basic Tests
1. Register both extensions from SIP clients
2. Call from 1001 to 1002 (and vice versa)
3. Test voicemail (if configured)
4. Check call quality and audio

### Advanced Tests
- Conference calls
- Call recording
- IVR menus
- Call forwarding

## Troubleshooting

### Container won't start
```bash
docker logs freeswitch-pbx
```

### Check FreeSWITCH status
```bash
docker exec freeswitch-pbx fs_cli -x "status"
```

### Check SIP stack
```bash
docker exec freeswitch-pbx fs_cli -x "sofia status"
```

### Check registrations
```bash
docker exec freeswitch-pbx fs_cli -x "show registrations"
```

### Restart services
```bash
docker-compose restart
```

## Security Considerations
- Change default passwords in production
- Use TLS for SIP signaling (port 5061)
- Implement fail2ban or similar for brute force protection
- Restrict SIP access by IP if possible
- Use strong passwords for extensions

## Production Recommendations
- Use Docker Swarm or Kubernetes for high availability
- Implement proper backup strategy for configuration
- Monitor with Prometheus/Grafana
- Use external database (PostgreSQL/MySQL) for configuration
- Implement proper logging and log rotation

## References
- [FreeSWITCH Official Documentation](https://freeswitch.org/confluence/display/FREESWITCH/FreeSWITCH+Explained)
- [FreeSWITCH Docker Hub](https://hub.docker.com/r/safarov/freeswitch)
- [SIP Protocol RFC 3261](https://tools.ietf.org/html/rfc3261)
