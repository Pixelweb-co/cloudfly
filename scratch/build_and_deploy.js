const { execSync } = require('child_process');

function runCmd(command) {
    console.log(`\n> ${command}`);
    execSync(command, { stdio: 'inherit' });
}

try {
    console.log('Building frontend image locally...');
    runCmd('docker build -t cloudfly-frontend-react:latest --build-arg NEXT_PUBLIC_API_URL=https://api.cloudfly.com.co --build-arg NEXT_PUBLIC_BASE_URL=https://dashboard.cloudfly.com.co -f frontend_new/Dockerfile frontend_new');

    console.log('Saving docker image to tar...');
    runCmd('docker save cloudfly-frontend-react:latest -o frontend-react.tar');

    console.log('Uploading tar to VPS...');
    runCmd('scp -i C:/Users/Edwin/.ssh/id_rsa_cloudfly frontend-react.tar root@api.cloudfly.com.co:/root/frontend-react.tar');

    console.log('Loading image on VPS...');
    runCmd('ssh -i C:/Users/Edwin/.ssh/id_rsa_cloudfly root@api.cloudfly.com.co "docker load -i /root/frontend-react.tar"');

    console.log('Restarting container on VPS...');
    runCmd('ssh -i C:/Users/Edwin/.ssh/id_rsa_cloudfly root@api.cloudfly.com.co "cd /apps/cloudfly && docker compose -f docker-compose-full-vps.yml up -d --no-deps frontend-react"');

    console.log('Deployment of frontend_new finished successfully!');
} catch (err) {
    console.error('Deployment failed!', err);
    process.exit(1);
}
