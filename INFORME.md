# Notas iniciales: panel seguro de entregas Olist

El informe de entrega para Ronal Jesus Condor Blas y Marco Soto Maceda está en [informe/Informe_Olist.pdf](informe/Informe_Olist.pdf), con su código en [informe/Informe_Olist.tex](informe/Informe_Olist.tex). Este archivo conserva notas de la primera versión.

**Curso:** Ética y Seguridad de Datos (DS3031)  
**Integrantes:** Ronal Jesus Condor Blas y Marco Soto Maceda
**Estado:** prototipo local funcional; el estudiante confirmó que el profesor aprobó el dataset Olist.

## 1. Motivación y caso de negocio

Una tienda en línea necesita detectar dónde ocurren más entregas después de la fecha prometida y cómo se relacionan con la satisfacción expresada en las reseñas. El sistema propuesto ayuda a un analista a priorizar investigaciones logísticas mediante indicadores agregados por estado y mes. No atribuye la causa de un retraso a un vendedor, una zona o un feriado sin un análisis adicional.

## 2. Fuentes y alcance

- **Dataset base:** [Brazilian E-Commerce Public Dataset by Olist](https://www.kaggle.com/datasets/olistbr/brazilian-ecommerce), consultado el 25 de septiembre de 2026. Pedidos de 2016 a 2018. Se descargó el ZIP original de Kaggle y se conserva solo en `data/`, fuera de Git. SHA-256 de la copia usada: `967E41E04FC306FE604E2A693F488995A8B41E5047418F8A5C8E4ABD6DECA784`.
- **Fuente complementaria:** [Portaria n.º 468, de 22 de diciembre de 2017](https://www.gov.br/agricultura/pt-br/mailing/documentos/portaria-mpog-feriados-2018.pdf), que enumera feriados nacionales de 2018. Se transcribieron únicamente los feriados nacionales en `holidays_2018.csv`; se excluyeron los puntos facultativos.

El prototipo usa pedidos con estado `delivered`, fecha de compra, fecha estimada, fecha real de entrega y estado del cliente disponibles. De 99 441 pedidos, entraron **96 470** y se excluyeron **2 971**. El período de compras analizado va del 15 de septiembre de 2016 al 29 de agosto de 2018. La comparación con feriados se limita a 2018.

## 3. Objetivo, métricas y línea de base

**Objetivo funcional:** mostrar en un panel la proporción de entregas tardías y su variación por región y mes, con acceso restringido.

| KPI | Definición | Línea de base del dataset |
|---|---|---:|
| Porcentaje de entregas tardías | Pedidos entregados después de la fecha estimada / pedidos entregados incluidos | 6,8 % (6 534 / 96 470) |
| Retraso promedio | Días entre la fecha real y estimada, solo en pedidos tardíos | 10,6 días |
| Calificación media de pedidos puntuales | Promedio de reseñas disponibles en pedidos puntuales | 4,29 / 5 |
| Calificación media de pedidos tardíos | Promedio de reseñas disponibles en pedidos tardíos | 2,27 / 5 |

Los promedios de reseñas se calculan solo donde existe calificación. Los pedidos sin reseña permanecen en el denominador de la tasa de tardanza, pero no en el de calificación. Una meta futura, como reducir la tasa de tardanza, requeriría datos operativos actuales y aprobación del negocio; no se fija una mejora ficticia con estos datos históricos.

La fuente complementaria permite un corte exploratorio: en 2018, el 5,8 % de 641 pedidos comprados en feriado nacional se entregó tarde, frente al 7,8 % de 52 136 comprados en otros días. Los tamaños son muy diferentes y la comparación no controla por mes, región ni vendedor. Por ello, **no se interpreta como efecto causal** de los feriados.

## 4. Requerimientos y arquitectura

**Funciones implementadas:** autenticación, panel con KPIs globales, filtro por estado, tendencia mensual, comparación regional, contraste entre compras en feriado y día común y vista de auditoría solo para administradores. El sistema evita mostrar registros individuales.

**Arquitectura:** un importador Python lee el ZIP de Olist y el CSV de feriados, selecciona columnas y guarda una tabla de entregas en SQLite. Flask consulta los agregados y los expone en `/api/dashboard`; el panel React utiliza componentes de shadcn/ui y consume esa API. Flask entrega el frontend compilado, además de las páginas de inicio de sesión y auditoría. El servidor de desarrollo escucha únicamente en `127.0.0.1` y utiliza HTTPS con certificado autofirmado temporal generado por Flask.

Para la demostración en navegadores que no aceptan ese certificado, hay un modo HTTP restringido a `127.0.0.1` en el puerto 5001. Este modo **no protege el transporte** y no debe exponerse en red ni usarse como evidencia de HTTPS.

**Campos almacenados por entrega:** identificador interno, fechas de compra/entrega, estado del cliente, identificador de vendedor, calificación y medidas derivadas de retraso. No se guardan el identificador de cliente, código postal, ciudad ni coordenadas del CSV original. El identificador de vendedor es seudónimo en el dataset y se conserva para una posible extensión, pero no se expone en el panel actual.

## 5. Seguridad y ética

| Riesgo | Control implementado | Límite pendiente |
|---|---|---|
| Acceso no autorizado | Inicio de sesión, contraseñas con hash, cookie segura y HttpOnly, token CSRF en formularios, límite de cinco intentos fallidos por usuario en quince minutos | Añadir recuperación de cuentas, MFA y límite adicional por dirección IP en un despliegue real |
| Exposición de datos individuales | Minimización en la importación; solo agregados en el frontend; no se versionan datos originales ni base SQLite | Revisar permisos de archivos y política de retención en un servidor real |
| Intercepción en tránsito | HTTPS local con certificado autofirmado | Usar certificado de CA confiable en producción |
| Pérdida o alteración de respaldo | Copia SQLite consistente, cifrada y autenticada con AES-256-GCM; restauración e `integrity_check` | Proteger y custodiar la clave separadamente del respaldo; programar copias y probar recuperación periódica |
| Uso indebido o incidentes | Registro de accesos, entradas y salidas sin contraseñas; plan básico abajo | Definir responsables, plazos y canal formal de comunicación |

**Protección en reposo:** el respaldo y la base SQLite operativa están cifrados; esta última usa SQLCipher. La clave `instance/db.key` permanece en el mismo equipo, así que se requieren permisos de sistema y una gestión de claves separada para un despliegue real. El ZIP original sigue sin cifrar. Los roles `admin`, `analyst` y `reader` existen para cuentas. Los tres ven el panel agregado; solo `admin` puede abrir la vista de auditoría. Las funciones de análisis adicionales por rol quedan para una siguiente iteración.

**Política de uso:** limitar el acceso al equipo del proyecto, usar los datos únicamente para el fin académico y evitar capturas con información individual. No convertir asociaciones estadísticas en afirmaciones causales. No subir el ZIP original, la base, las claves ni los respaldos al repositorio público. El equipo debe revisar los logs, renovar credenciales de prueba si se comparten y eliminar los datos locales al finalizar el curso según el plazo acordado con el profesor.

**Plan básico de respuesta a incidentes:** (1) registrar el momento y alcance del incidente; (2) aislar el equipo o servicio y revocar sesiones/credenciales afectadas; (3) preservar logs y una copia para investigación; (4) determinar si hubo exposición o pérdida de datos; (5) restaurar desde un respaldo verificado si corresponde; (6) informar al profesor y a los responsables definidos por el equipo; (7) corregir la causa y documentar lecciones aprendidas. En un uso real se consultaría la normativa de protección de datos aplicable antes de fijar obligaciones y plazos de notificación.

## 6. Implementación y pruebas

- Importación reproducible desde ZIP: 96 470 pedidos válidos.
- Prueba de acceso: la ruta principal redirige a inicio de sesión sin autenticación; credenciales correctas permiten entrar.
- Prueba de filtro: un estado válido muestra resultados; uno inválido devuelve error 400.
- Prueba de roles: `reader` recibe 403 en auditoría y `admin` puede entrar.
- Prueba de límite de acceso: después de cinco contraseñas incorrectas para un usuario, el siguiente intento devuelve 429.
- Prueba de respaldo: se cifró una copia, se restauró en otra ruta y SQLite devolvió `integrity_check = ok` con 96 470 registros.
- Prueba del frontend: compilación de TypeScript y Vite; panel y filtro por estado comprobados en el navegador local.

En el panel, las tasas de feriados con menos de 30 pedidos se ocultan para evitar interpretar porcentajes basados en muestras demasiado pequeñas.

La aplicación corre localmente; el certificado temporal genera una advertencia del navegador porque no procede de una CA confiable. No se ha realizado una auditoría de seguridad ni pruebas de carga. El dataset es histórico, por lo que los resultados no describen el comercio electrónico actual.

## 7. Retrospectiva inicial

**Aprendido:** el dato público también puede contener identificadores y ubicación que no conviene republicar. Definir primero los KPIs permitió reducir las columnas importadas. La restauración probada da más evidencia que simplemente generar un archivo de respaldo.

**Para la siguiente iteración:** documentar licencias y condiciones de redistribución; revisar calidad de las fechas y reseñas faltantes; separar la custodia de claves y cifrar el ZIP original; definir responsabilidades del equipo y realizar una revisión cruzada de seguridad.

## 8. Pendientes antes de la entrega final

1. Confirmar si la primera entrega requiere propuesta o implementación terminada.
2. Completar nombres y roles de todos los integrantes del equipo.
3. Definir y documentar metas realistas con el profesor; usar la línea de base anterior.
4. Capturas del panel y evidencias de ejecución en el entorno donde se presentará.
5. Revisión final de redacción, fuentes, seguridad y correspondencia con la rúbrica.
