# Meta Ads Troubleshooting Guide

## Quick Diagnostics

### Check Configuration
```bash
# Verify environment variables are set
echo $META_ACCESS_TOKEN
echo $META_AD_ACCOUNT_ID
echo $META_PAGE_ID
```

### Test API Connection
```bash
# Test token validity
curl -X GET "https://graph.facebook.com/v18.0/me?access_token=$META_ACCESS_TOKEN"

# Test ad account access
curl -X GET "https://graph.facebook.com/v18.0/$META_AD_ACCOUNT_ID?access_token=$META_ACCESS_TOKEN"
```

### Check Service Logs
```bash
# View marketing agent logs
docker logs marketing-agent

# Filter for Meta-related logs
docker logs marketing-agent | grep -i meta

# Add Kafka connectivity check
curl -X GET "http://kafka:9092" -H "Content-Type: application/json"

# Add database connection test
curl -X GET "http://db:3306" -H "Authorization: Basic $(echo -n 'widowmaker:$(openssl rand -hex 16)' | base64)"
```

## Common Issues & Solutions

... (existing content remains unchanged) ...

## Error Code Reference

... (existing content remains unchanged) ...

## Debugging Checklist

... (existing content remains unchanged) ...

## Getting Help

... (existing content remains unchanged) ...