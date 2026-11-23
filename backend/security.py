
from pwdlib import PasswordHash

# Initialize Argon2 password hasher
password_hash = PasswordHash.recommended()


def hash_password(password: str) -> str:
    """Convert plaintext password into a secure hash."""
    return password_hash.hash(password)


def verify_password(
    plain_password: str,
    hashed_password: str
) -> bool:
    """Verify a password against its stored hash."""
    return password_hash.verify(
        plain_password,
        hashed_password
    )
