# Use the official FreeSWITCH image
FROM safarov/freeswitch:latest

# Create necessary directories for sounds and logs
RUN mkdir -p /usr/share/freeswitch/sounds/music/8000 \
    /usr/share/freeswitch/sounds/music/16000 \
    /usr/share/freeswitch/sounds/music/32000 \
    /usr/share/freeswitch/sounds/music/48000 \
    /var/log/freeswitch \
    /var/lib/freeswitch/recordings

# Copy custom configuration files
COPY conf/ /etc/freeswitch/

# Expose necessary ports
# SIP signaling
EXPOSE 5060/udp
EXPOSE 5060/tcp
EXPOSE 5061/tcp
EXPOSE 5080/udp
EXPOSE 5080/tcp

# Event Socket
EXPOSE 8021/tcp

# RTP Media Streams
EXPOSE 16384-16484/udp

# Set environment variables
ENV FREESWITCH_LOG_LEVEL=info
ENV FREESWITCH_SIP_PORT=5060
ENV FREESWITCH_RTP_START_PORT=16384
ENV FREESWITCH_RTP_END_PORT=16484

# Health check
HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
    CMD fs_cli -x "status" || exit 1

# Start FreeSWITCH
CMD ["freeswitch", "-nonat", "-nf"]