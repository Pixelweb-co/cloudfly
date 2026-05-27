import bcrypt
password = b"Password123*"
hashed = bcrypt.hashpw(password, bcrypt.gensalt())
print(hashed.decode())
