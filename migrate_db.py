"""Migra una base SQLite existente a SQLCipher sin cambiar sus tablas."""
import os
from contextlib import closing

import sqlcipher3

from db_crypto import DB, SQLITE_HEADER, connect, database_key
from backup import backup


def main():
    if not DB.exists():
        raise SystemExit("No existe instance/olist.db")
    with DB.open("rb") as stream:
        if stream.read(16) != SQLITE_HEADER:
            raise SystemExit("La base ya está cifrada o su formato no es SQLite")
    key = database_key(create=True)
    target = DB.with_suffix(".encrypted.tmp")
    if target.exists():
        raise SystemExit(f"El archivo temporal ya existe: {target}")
    backup_file = DB.parent / "pre-sqlcipher.enc"
    if not backup_file.exists():
        backup(backup_file)
    source = sqlcipher3.connect(DB)
    try:
        # La ruta es interna y fija; se duplica la comilla para SQL.
        quoted = str(target).replace("'", "''")
        source.execute(f"ATTACH DATABASE '{quoted}' AS encrypted KEY \"x'{key.hex()}'\"")
        source.execute("SELECT sqlcipher_export('encrypted')")
        source.execute("DETACH DATABASE encrypted")
    finally:
        source.close()
    with closing(connect(target)) as encrypted:
        if encrypted.execute("PRAGMA integrity_check").fetchone()[0] != "ok":
            raise RuntimeError("Falló integrity_check de la base cifrada")
        count = encrypted.execute("SELECT count(*) FROM deliveries").fetchone()[0]
    os.replace(target, DB)
    print(f"Base operativa migrada a SQLCipher: {count:,} entregas")
    print("Conserva instance/db.key separada de la base; sin ella no podrás abrirla.")


if __name__ == "__main__":
    main()
