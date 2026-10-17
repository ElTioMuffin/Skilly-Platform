# Preparación de pruebas de Skilly

## Datos de prueba y administrador

El comando `seed_test_data` crea usuarios ficticios, perfiles y servicios para los casos CN-01 a CN-05. Es idempotente y se niega a modificar una base cuyo nombre no incluya `test`.

La base SQLite aislada `reports/qa/skilly_test.sqlite3` ya quedó migrada y poblada con las cuentas descritas aquí. Para iniciar el API con ella, selecciona SQLite en PowerShell desde la raíz del proyecto:

   ```powershell
   $env:SKILLY_DB_ENGINE = "sqlite"
   $env:SKILLY_DB_NAME = Join-Path (Get-Location) "reports\qa\skilly_test.sqlite3"
   .\.venv\Scripts\python.exe backend\manage.py runserver
   ```

Para regenerar los datos en esta base, primero configura `SKILLY_TEST_ADMIN_PASSWORD`, ejecuta `migrate` y luego `seed_test_data`. El comando rechaza cualquier base cuyo nombre no incluya `test`. Para PostgreSQL, puedes crear una base aparte llamada `Skilly_test` y seleccionarla con `SKILLY_DB_NAME` (sin establecer `SKILLY_DB_ENGINE`).

El administrador de pruebas se crea como `admin.pruebas@prueba.skilly.test` con `is_staff=True` y `is_superuser=False`. Inicia sesión desde el portal Skilly y revisa servicios en `/admin/servicios`; la clave se toma de `SKILLY_TEST_ADMIN_PASSWORD` y el comando no la guarda en el repositorio. Si la cuenta ya existía, vuelve a ejecutar `seed_test_data` para actualizarla a staff sin superusuario.

Las otras cuentas ficticias usan `Skilly#2026`:

| Caso | Usuario | Estado |
| --- | --- | --- |
| Correo duplicado CN-01 | `ana.perez@prueba.skilly.test` | Organización activa |
| Inicio de sesión CN-02 | `luis.rojas@prueba.skilly.test` | Organización activa |
| Cuenta suspendida CN-02 | `paula.diaz@prueba.skilly.test` | Inactiva |
| Perfil pendiente CN-03 | `carla.soto@prueba.skilly.test` | Profesional sin validar |
| Organizaciones A y B CN-05 | `organizacion.a@prueba.skilly.test`, `organizacion.b@prueba.skilly.test` | Activas |
| Profesional P1 CN-05 | `p1@prueba.skilly.test` | Aprobado; disponibilidad martes 10:00–12:00 |

También se crean profesionales aprobados de Diseño, Desarrollo y Marketing en Santiago y Valparaíso, con modalidades Remoto, Híbrido y Presencial, más un profesional con usuario inactivo para el subcaso de pausado. El catálogo incluye además un servicio de prueba pendiente de aprobación para verificar la bandeja administrativa.

Para generar la base de PR-03 (aprox. 100.000 usuarios, 100.000 perfiles profesionales y 500.000 bloques de disponibilidad), ejecuta esto solo después de validar espacio y capacidad en la BD de pruebas. La base SQLite incluida aún contiene el volumen funcional pequeño; el generador de PR-03 todavía no se ejecutó:

```powershell
.\.venv\Scripts\python.exe backend\manage.py seed_volume_data --professionals 100000 --availability-blocks 500000 --confirm-volume
```

El comando exige a la vez el nombre de base con `test` y la confirmación explícita `--confirm-volume`. Los usuarios de volumen quedan sin contraseña utilizable. La transacción puede tardar y requiere espacio libre suficiente en PostgreSQL.

Para ejecutar CN-01 como está escrito, elimina `luis.rojas` de la base de pruebas antes de V1 (el comando lo crea porque CN-02 necesita que ya exista). Después de V1, el usuario creado sirve para CN-02. Reinicia el estado de intentos de inicio de sesión entre subcasos; la aplicación actual no implementa bloqueo por intentos ni expiración de sesión. El modelo actual tampoco tiene un estado explícito «pausado» para profesionales.

## SonarQube y Sonar Scanner

La configuración de fuentes y exclusiones está en `sonar-project.properties`. Requiere un servidor SonarQube accesible, un token y el ejecutable Sonar Scanner instalado. Desde PowerShell:

```powershell
$env:SONAR_TOKEN = "token-del-ambiente-de-pruebas"
sonar-scanner -Dsonar.host.url="http://localhost:9000" -Dsonar.token="$env:SONAR_TOKEN"
```

Reemplaza la URL por la instancia de pruebas. No uses credenciales reales en comandos guardados o en archivos versionados.

## Carga con Apache JMeter

`skilly-load-test.jmx` recorre las rutas de consulta (`GET`) registradas en el router: profesionales, servicios, reservas, solicitudes, reseñas, perfiles, citas, incidencias, disponibilidad y notificaciones. También consulta los perfiles pendientes y las métricas del panel. Incluye los alias en español e inglés para detectar diferencias entre ambas rutas. Cada petición tiene una aserción HTTP 200 y aparece como una muestra independiente en JMeter.

El plan no ejecuta `POST`, `PATCH`, `PUT` ni `DELETE`: esas operaciones crean o alteran datos (por ejemplo, reservas, pagos, cancelaciones y validaciones). Para medirlas hace falta un escenario separado con datos de prueba controlados. La ruta de notificaciones usa `-Juser` (por defecto `1`) y puede devolver una lista vacía si ese usuario no tiene notificaciones; la respuesta sigue siendo HTTP 200.

Ejecuta el API en ambiente de pruebas y JMeter con Java instalado. Cada ejecución debe tener un directorio de reporte nuevo:

```powershell
jmeter -n -t docs/qa/skilly-load-test.jmx -Jhost=127.0.0.1 -Jport=8000 -Juser=1 -Jthreads=20 -Jramp=20 -Jduration=60 -l reports/qa/pr01-20.jtl -e -o reports/qa/pr01-20
jmeter -n -t docs/qa/skilly-load-test.jmx -Jhost=127.0.0.1 -Jport=8000 -Juser=1 -Jthreads=50 -Jramp=60 -Jduration=180 -l reports/qa/pr01-50.jtl -e -o reports/qa/pr01-50
```

Para PR-02, ejecuta cada escalón por separado con `-Jthreads=50`, `100`, `200` y `400`, `-Jduration=120`, usando un archivo `.jtl` y un directorio HTML distintos por escalón. Registra el primer escalón con errores y ejecuta una medición posterior de recuperación. PR-01 requiere además una bajada de un minuto; controla y registra esa fase separadamente.

El plan actual consulta el listado API, no reproduce los filtros de categoría/modalidad/ubicación del navegador. Antes de PR-03, cargar 100.000 perfiles y 500.000 bloques requiere una base de pruebas con recursos suficientes. La aplicación no pagina actualmente ese listado y los filtros se aplican en el frontend; por ello, PR-03 no equivale a una búsqueda SQL filtrada y puede transferir un volumen grande de JSON.

## Comprobaciones que no son Sonar

La configuración de ESLint excluye el entorno virtual y el código Python de terceros. `npm run lint` encuentra errores preexistentes en el frontend; `python backend/manage.py check` termina con advertencias de claves primarias automáticas. Estas salidas no reemplazan el análisis SonarQube ni las pruebas del plan.
