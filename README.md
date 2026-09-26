# Proyecto de Ética y Seguridad de Datos: entregas de comercio electrónico

## Estado

Prototipo local funcional con informe inicial. El profesor aprobó el uso del dataset base Olist, según confirmó el estudiante.

## Ejecutar en Windows

Desde esta carpeta:

```powershell
py -m pip install -r requirements.txt
New-Item -ItemType Directory -Force data | Out-Null
Invoke-WebRequest 'https://www.kaggle.com/api/v1/datasets/download/olistbr/brazilian-ecommerce' -OutFile 'data\olist.zip'
py import_data.py
py app.py create-user --username ronal --role admin
cd frontend
npm install
npm run build
cd ..
py app.py run
```

El comando `create-user` pide una contraseña de al menos 12 caracteres sin mostrarla. Abrir `https://127.0.0.1:5000` y aceptar la advertencia del certificado de desarrollo autofirmado. No usar este servidor de desarrollo para publicar el sitio.

La base operativa `instance/olist.db` se cifra con SQLCipher. La primera importación crea `instance/db.key`; guarda una copia de esa clave en un lugar protegido y separado de la base. Si ya existía una base SQLite sin cifrar, detén el servidor y ejecuta `py migrate_db.py` una sola vez. La migración crea primero un respaldo cifrado en `instance/pre-sqlcipher.enc` y conserva las cuentas y registros de auditoría. El archivo `db.key` no debe subirse a Git ni compartirse junto con la base. Esta demostración guarda la clave en el mismo equipo, por lo que no protege frente al robo de ambos archivos.

Si un navegador bloquea el certificado autofirmado sin opción de continuar, ejecutar `py app.py run-local-http` y abrir `http://127.0.0.1:5001/login`. Este modo funciona **solo en la misma computadora** y permite mostrar el prototipo. Para demostrar protección en tránsito, usar el modo HTTPS o desplegar con un certificado válido.

El panel principal usa React y componentes shadcn/ui. Flask sirve el frontend compilado desde `frontend/dist` y proporciona los indicadores en `/api/dashboard`. El inicio de sesión y la auditoría siguen siendo páginas Flask. Si se modifica `frontend/src`, repetir `npm run build` desde `frontend` y recargar el navegador. La versión anterior del panel está disponible en `/legacy`.

Para comprobar recuperación:

```powershell
py backup.py backup instance\copia.enc
py backup.py restore instance\copia.enc --destination instance\restaurada.db
```

`data/` contiene el ZIP original sin cifrar; `instance/` contiene la base cifrada, claves y respaldos. Ambos están ignorados por Git. El informe de entrega está en [informe/Informe_Olist.pdf](informe/Informe_Olist.pdf) y su código editable en [informe/Informe_Olist.tex](informe/Informe_Olist.tex). Para recompilarlo, ejecuta `pdflatex Informe_Olist.tex` dos veces desde `informe/`. [INFORME.md](INFORME.md) conserva las notas iniciales.

La copia del ZIP descargada para este prototipo tiene SHA-256 `967E41E04FC306FE604E2A693F488995A8B41E5047418F8A5C8E4ABD6DECA784`. Si Kaggle actualiza el archivo, el hash puede cambiar y conviene volver a validar las cifras.

## Propuesta para presentar al profesor

**Dataset base:** Brazilian E-Commerce Public Dataset by Olist: https://www.kaggle.com/datasets/olistbr/brazilian-ecommerce

**Problema:** identificar entregas tardías y analizar su relación con las calificaciones de los clientes para priorizar mejoras logísticas.

**Usuario de la aplicación:** analista u operador de una tienda en línea.

**Datos complementarios:** calendario oficial de feriados nacionales de Brasil de 2017 y 2018. Se integrará por fecha de compra o entrega, dejando documentado que una asociación no demuestra causalidad.

## Funciones mínimas

1. Cargar y consultar pedidos, entregas, pagos y reseñas en una base de datos.
2. Mostrar indicadores agrupados por mes, estado y vendedor.
3. Filtrar pedidos tardíos y consultar su detalle según el rol del usuario.
4. Registrar accesos y consultas sensibles.

## Indicadores

- Porcentaje de pedidos entregados después de la fecha estimada.
- Días promedio de retraso entre los pedidos tardíos.
- Calificación promedio de pedidos puntuales y tardíos.
- Porcentaje de pedidos tardíos por estado y vendedor, solo cuando haya un número suficiente de pedidos para evitar conclusiones engañosas.

Las metas numéricas se fijarán después de calcular una línea de base con los datos; no se inventarán porcentajes de mejora.

## Seguridad y ética que se deben demostrar

- Roles: administrador, analista y lector. El lector verá resultados agregados; el detalle de pedidos estará restringido.
- HTTPS con un certificado de desarrollo y documentación de cómo usar uno válido en producción.
- Contraseñas de cuentas de prueba almacenadas con un algoritmo de hash adecuado; nunca guardar contraseñas en texto claro.
- Control de acceso en el backend y registros de auditoría sin secretos ni datos innecesarios.
- Cifrado del almacenamiento o de los respaldos, según el entorno; copias de seguridad y prueba de restauración.
- Política de minimización, retención y eliminación de datos; plan de respuesta ante filtración o pérdida.
- Tratar los identificadores de cliente y datos geográficos como potencialmente sensibles, aunque el conjunto sea público. No publicar datos individuales en capturas o en el informe.
- Distinguir los controles implementados de las recomendaciones futuras y explicar las limitaciones de una demostración académica.

## Entrega prevista

1. Aplicación de demostración: base de datos, backend y frontend sencillo.
2. Informe escrito: contexto, fuentes, caso de negocio, objetivos, diseño funcional, arquitectura, amenazas, controles de seguridad, implementación, resultados, pruebas, lecciones aprendidas y retrospectiva del equipo.
3. Evidencias: capturas del frontend, indicadores calculados y prueba documentada de un respaldo y restauración.

## Siguientes pasos

1. Confirmar el alcance de la primera entrega y los integrantes del equipo.
2. Revisar la calidad de datos y las limitaciones del análisis con el profesor.
3. Mejorar los controles pendientes descritos en el informe.
4. Preparar capturas y revisión final del informe.
