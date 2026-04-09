import subprocess

sql = "SELECT username FROM users WHERE username LIKE 'pipe%' OR username = 'admin' LIMIT 5;"
cmd = f'ssh -o StrictHostKeyChecking=no -i C:\\Users\\Edwin\\.ssh\\id_rsa_cloudfly root@109.205.182.94 "docker exec mysql mysql -u root -pwidowmaker cloud_master -e \\"{sql}\\""'

result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
print(result.stdout)
print(result.stderr)
