"""Conexiones SQLCipher y clave local de la base operativa."""
import os
from pathlib import Path

import sqlcipher3

ROOT = Path(__file__).resolve().parent
INSTANCE = ROOT / "instance"
DB = INSTANCE / "olist.db"
KEY = INSTANCE / "db.key"
SQLITE_HEADER = b"SQLite format 3\x00"


def database_key(create=False):
    INSTANCE.mkdir(exist_ok=True)
    if not KEY.exists() and create:
        try:
            with KEY.open("xb") as stream:
                stream.write(os.urandom(32))
            os.chmod(KEY, 0o600)
        except FileExistsError:
            pass
    if not KEY.exists():
        raise RuntimeError("Falta instance/db.key; no se puede abrir la base cifrada")
    key = KEY.read_bytes()
    if len(key) != 32:
        raise RuntimeError("La clave de la base debe tener 32 bytes")
    return key


def connect(path=DB, create=False):
    path = Path(path)
    if path == DB and path.exists():
        with path.open("rb") as stream:
            if stream.read(16) == SQLITE_HEADER:
                raise RuntimeError("La base todavía está en texto claro: ejecuta py migrate_db.py")
    key = database_key(create=create)
    path.parent.mkdir(parents=True, exist_ok=True)
    db = sqlcipher3.connect(path)
    db.execute(f"PRAGMA key = \"x'{key.hex()}'\"")
    db.execute("PRAGMA temp_store = MEMORY")
    try:
        db.execute("SELECT count(*) FROM sqlite_master").fetchone()
    except sqlcipher3.DatabaseError as exc:
        db.close()
        raise RuntimeError("No se pudo abrir la base cifrada: clave incorrecta o archivo dañado") from exc
    db.row_factory = sqlcipher3.Row
    return db
