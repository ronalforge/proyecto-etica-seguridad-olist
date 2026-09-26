"""Copia y restaura la base SQLite con cifrado autenticado AES-GCM."""
import argparse
import os
import sqlite3
import tempfile
from contextlib import closing
from pathlib import Path

from cryptography.hazmat.primitives.ciphers.aead import AESGCM

ROOT = Path(__file__).resolve().parent
INSTANCE = ROOT / "instance"
DB = INSTANCE / "olist.db"
KEY = INSTANCE / "backup.key"
MAGIC = b"OLIST-BACKUP-v1\n"


def get_key():
    if not KEY.exists():
        KEY.parent.mkdir(exist_ok=True)
        KEY.write_bytes(AESGCM.generate_key(bit_length=256))
    key = KEY.read_bytes()
    if len(key) != 32:
        raise ValueError("Clave de respaldo inválida")
    return key


def backup(destination):
    if not DB.exists():
        raise FileNotFoundError(DB)
    destination = Path(destination)
    destination.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory() as temp:
        snapshot = Path(temp) / "snapshot.db"
        with closing(sqlite3.connect(DB)) as source, closing(sqlite3.connect(snapshot)) as target:
            source.backup(target)
        nonce = os.urandom(12)
        ciphertext = AESGCM(get_key()).encrypt(nonce, snapshot.read_bytes(), MAGIC)
        destination.write_bytes(MAGIC + nonce + ciphertext)
    print(f"Respaldo cifrado: {destination}")


def restore(source, destination):
    content = Path(source).read_bytes()
    if not content.startswith(MAGIC) or len(content) < len(MAGIC) + 28:
        raise ValueError("Formato de respaldo inválido")
    offset = len(MAGIC)
    data = AESGCM(get_key()).decrypt(content[offset:offset+12], content[offset+12:], MAGIC)
    destination = Path(destination)
    destination.parent.mkdir(parents=True, exist_ok=True)
    destination.write_bytes(data)
    with closing(sqlite3.connect(destination)) as db:
        result = db.execute("PRAGMA integrity_check").fetchone()[0]
    if result != "ok":
        destination.unlink(missing_ok=True)
        raise ValueError("La base restaurada no pasó integrity_check")
    print(f"Restauración comprobada: {destination}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("command", choices=["backup", "restore"])
    parser.add_argument("path", help="Archivo .enc")
    parser.add_argument("--destination", help="Ruta de restauración; obligatoria para restore")
    args = parser.parse_args()
    if args.command == "backup":
        backup(args.path)
    elif not args.destination:
        parser.error("restore requiere --destination")
    else:
        restore(args.path, args.destination)
