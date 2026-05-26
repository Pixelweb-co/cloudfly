@echo off
setlocal
echo 🚀 Building frontend image locally...
docker build -t cloudfly-frontend-react:latest --build-arg NEXT_PUBLIC_API_URL=https://api.cloudfly.com.co --build-arg NEXT_PUBLIC_BASE_URL=https://dashboard.cloudfly.com.co -f frontend_new/Dockerfile frontend_new
if %errorlevel% neq 0 exit /b %errorlevel%

echo 📦 Saving docker image to tar...
docker save cloudfly-frontend-react:latest -o frontend-react.tar
if %errorlevel% neq 0 exit /b %errorlevel%

echo 📤 Uploading tar to VPS...
scp -i C:\Users\Edwin\.ssh\id_rsa_cloudfly frontend-react.tar root@api.cloudfly.com.co:/root/frontend-react.tar
if %errorlevel% neq 0 exit /b %errorlevel%

echo 📥 Loading image on VPS...
ssh -i C:\Users\Edwin\.ssh\id_rsa_cloudfly root@api.cloudfly.com.co "docker load -i /root/frontend-react.tar"
if %errorlevel% neq 0 exit /b %errorlevel%

echo 🔄 Restarting container on VPS...
ssh -i C:\Users\Edwin\.ssh\id_rsa_cloudfly root@api.cloudfly.com.co "docker tag cloudfly-frontend-react:latest cloudfly-frontend-react:latest && cd /apps/cloudfly && docker compose -f docker-compose-full-vps.yml up -d --no-deps frontend-react"
if %errorlevel% neq 0 exit /b %errorlevel%

echo ✅ Deployment of frontend_new finished successfully!
