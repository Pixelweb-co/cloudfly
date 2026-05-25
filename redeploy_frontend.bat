@echo off
echo Building Docker Image...
docker build -t cloudfly-frontend-react:latest -f frontend_new\Dockerfile frontend_new
if %errorlevel% neq 0 exit /b %errorlevel%

echo Saving Docker Image...
docker save cloudfly-frontend-react:latest -o cloudfly-frontend.tar
if %errorlevel% neq 0 exit /b %errorlevel%

echo Uploading to VPS...
scp -o StrictHostKeyChecking=no -i C:\Users\Edwin\.ssh\id_rsa_cloudfly cloudfly-frontend.tar root@109.205.182.94:/apps/cloudfly/
if %errorlevel% neq 0 exit /b %errorlevel%

echo Loading and Starting on VPS...
ssh -o StrictHostKeyChecking=no -i C:\Users\Edwin\.ssh\id_rsa_cloudfly root@109.205.182.94 "docker load -i /apps/cloudfly/cloudfly-frontend.tar && cd /apps/cloudfly && docker compose -f docker-compose-full-vps.yml up -d --no-build frontend-react"
if %errorlevel% neq 0 exit /b %errorlevel%

echo Done!
