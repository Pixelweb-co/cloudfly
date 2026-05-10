const { execSync } = require('child_process');
const sql = "SELECT id, event_id, execute_at, status FROM scheduled_jobs ORDER BY id DESC LIMIT 10;";
const cmd = `ssh -i C:/Users/Edwin/.ssh/id_rsa_cloudfly root@109.205.182.94 "docker exec -i mysql mysql -uroot -pwidowmaker cloud_master -e '${sql}'"`;
try {
    const output = execSync(cmd).toString();
    console.log(output);
} catch (e) {
    console.error(e.message);
}
