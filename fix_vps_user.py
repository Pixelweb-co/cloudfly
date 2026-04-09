import subprocess
import bcrypt
import sys

def run_ssh(cmd):
    ssh_cmd = [
        'ssh', '-o', 'StrictHostKeyChecking=no', 
        '-i', 'C:\\Users\\Edwin\\.ssh\\id_rsa_cloudfly', 
        'root@109.205.182.94', 
        cmd
    ]
    return subprocess.run(ssh_cmd, capture_output=True, text=True)

# 1. Generate hash
password = 'widowmaker'
hashed = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()
print(f'Using hash: {hashed}')

# 2. Upload SQL
sql = f"UPDATE users SET password = '{hashed}', is_enabled = 1 WHERE username = 'pipe_1775608262000';"
with open('temp_fix.sql', 'w') as f:
    f.write(sql)

print('Uploading SQL...')
subprocess.run(['scp', '-i', 'C:\\Users\\Edwin\\.ssh\\id_rsa_cloudfly', 'temp_fix.sql', 'root@109.205.182.94:/tmp/fix_user.sql'])

# 3. Execute SQL
print('Executing SQL on VPS...')
res = run_ssh("docker exec -i mysql mysql -u root -pwidowmaker cloud_master < /tmp/fix_user.sql")

if res.returncode == 0:
    print('✅ SUCCESS!')
else:
    print('❌ FAILED')
    print(res.stderr)
