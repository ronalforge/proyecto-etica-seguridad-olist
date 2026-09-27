# Olist Lab — Ética y Seguridad de Datos (DS3031)

Proyecto de **Ronal Jesus Condor Blas y Marco Soto Maceda**. Es una demostración local para analizar entregas tardías del conjunto histórico de Olist (2016–2018), comparar la satisfacción de pedidos puntuales y tardíos y explorar diferencias por estado, mes y feriados nacionales de Brasil. Las comparaciones son descriptivas: no prueban causalidad ni representan el desempeño actual de una empresa.

## Qué hace la aplicación

- Importa pedidos, clientes, ítems y reseñas de Olist junto con nueve feriados nacionales de Brasil de 2018. Conserva solo las columnas necesarias; no importa nombres, direcciones ni identificadores de clientes.
- Muestra indicadores agregados: 96 470 pedidos analizados, 6 534 tardíos (6,8 %), retraso medio de 10,6 días entre tardíos y calificaciones medias de 4,29/5 (puntuales) y 2,27/5 (tardíos) en la copia de datos utilizada.
- Permite filtrar por estado del cliente. El panel React usa componentes shadcn/ui; Flask ofrece la API, el inicio de sesión y la página de auditoría.
- Guarda la base operativa cifrada con SQLCipher. Las contraseñas se almacenan como hash. Hay roles `admin`, `analyst` y `reader`; solo `admin` ve `/audit`.
- Genera y restaura respaldos cifrados y autenticados con AES-256-GCM.

## Cómo probarlo en Windows (Marco)

Necesitas **Python 3.11**, **Node.js 22** y Git. Abre PowerShell en una carpeta de trabajo y clona el repositorio público:

```powershell
git clone https://github.com/ronalforge/proyecto-etica-seguridad-olist.git
cd proyecto-etica-seguridad-olist
py -m pip install -r requirements.txt
New-Item -ItemType Directory -Force data | Out-Null
Invoke-WebRequest 'https://www.kaggle.com/api/v1/datasets/download/olistbr/brazilian-ecommerce' -OutFile 'data\olist.zip'
py import_data.py
py app.py create-user --username marco --role admin
cd frontend
npm ci
npm run build
cd ..
py app.py run
```

El comando `create-user` solicita una contraseña de al menos 12 caracteres sin mostrarla. Abre **https://127.0.0.1:5000/login** e ingresa con el usuario que creaste. El certificado es autofirmado para esta demostración local, por lo que el navegador advertirá que no puede verificar su identidad. Si el navegador bloquea esa página sin opción de continuar, detén el servidor y ejecuta `py app.py run-local-http`; abre **http://127.0.0.1:5001/login**. Ese modo funciona solo en tu computadora y **no protege el tráfico**.

Si la descarga automática de Kaggle falla, descarga manualmente [Brazilian E-Commerce Public Dataset by Olist](https://www.kaggle.com/datasets/olistbr/brazilian-ecommerce) y guarda el ZIP como `data/olist.zip` antes de ejecutar `py import_data.py`. La copia usada para las cifras del informe tiene SHA-256 `967E41E04FC306FE604E2A693F488995A8B41E5047418F8A5C8E4ABD6DECA784`; si Kaggle cambia el archivo, los resultados pueden variar.

### Recorrido de prueba

1. Inicia sesión y comprueba los cuatro indicadores principales.
2. Aplica un estado, por ejemplo `MA`, y observa cómo cambian el resumen, la tabla mensual y la comparación con feriados. La lista de estados sigue mostrando la comparación general.
3. Abre **Auditoría** como administrador y verifica el registro de acceso y consultas. Los roles `analyst` y `reader` no pueden abrir esa página.
4. Prueba un respaldo y su restauración a una ruta distinta:

   ```powershell
   py backup.py backup instance\copia.enc
   py backup.py restore instance\copia.enc --destination instance\restaurada.db
   ```

   El programa comprueba la integridad. No reemplaces la base operativa con el archivo de prueba.

## Archivos y protección de claves

| Ruta | Función |
|---|---|
| `import_data.py`, `holidays_2018.csv` | Importación de las dos fuentes. |
| `db_crypto.py`, `migrate_db.py` | Conexión cifrada y migración de una base SQLite antigua. |
| `app.py`, `templates/` | Backend, autenticación y auditoría. |
| `frontend/src/` | Panel React actual. |
| `backup.py` | Respaldo y restauración. |
| `informe/Informe_Olist.tex`, `informe/utec-logo.png` | Fuente LaTeX y logotipo del informe. |
| `informe/Informe_Olist.pdf` | Informe compilado. |

`data/` guarda el ZIP original. `instance/` guarda la base cifrada, `db.key`, la clave de sesión, la clave de respaldo y las copias. **Ambas carpetas están excluidas de Git.** Cada integrante genera sus propios archivos al importar y crear su usuario: Marco **no necesita** la base ni las claves de Ronal. Guarda una copia protegida de tus propias claves fuera de la carpeta del proyecto; si se pierde `db.key`, la base operativa no podrá abrirse. No publiques ZIP, claves, respaldos ni capturas con registros individuales.

La clave de SQLCipher está en el mismo equipo que la base y el ZIP original no está cifrado. Esta implementación protege una copia aislada del archivo de base, pero no frente al compromiso del equipo completo. El servidor Flask es solo de desarrollo y escucha en `127.0.0.1`; no lo expongas en Internet.

Si ya tenías una base SQLite sin cifrar, detén el servidor y ejecuta `py migrate_db.py` una sola vez. Primero se crea `instance/pre-sqlcipher.enc`, un respaldo cifrado de la versión anterior. La migración conserva usuarios y auditoría.

