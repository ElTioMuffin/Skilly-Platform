# Guía de pruebas de Skilly

Esta guía prepara las pruebas funcionales, de carga y de calidad del plan integrado. Ejecuta las pruebas de escritura y carga únicamente contra una base y un servidor de pruebas. La aplicación de desarrollo del usuario usa PostgreSQL; no ejecutes semillas ni volumen en esa base.

## 1. Preparar datos de prueba

La opción más aislada es la base SQLite incluida. Desde PowerShell, en `D:\Code\Skilly-Platform`:

```powershell
$env:SKILLY_DB_ENGINE = "sqlite"
$env:SKILLY_DB_NAME = Join-Path (Get-Location) "reports\qa\skilly_test.sqlite3"
.\.venv\Scripts\python.exe backend\manage.py runserver 127.0.0.1:8000
```

Si la base no existe, créala y poblarla antes de iniciar el servidor (en otra consola):

```powershell
New-Item -ItemType Directory -Force reports\qa | Out-Null
$env:SKILLY_DB_ENGINE = "sqlite"
$env:SKILLY_DB_NAME = Join-Path (Get-Location) "reports\qa\skilly_test.sqlite3"
$env:SKILLY_TEST_ADMIN_PASSWORD = "<clave-de-prueba-de-12-caracteres-o-mas>"
.\.venv\Scripts\python.exe backend\manage.py migrate
.\.venv\Scripts\python.exe backend\manage.py seed_test_data
```

`seed_test_data` protege las bases cuyo nombre no contiene `test`. La cuenta de administración es `admin.pruebas@prueba.skilly.test`; usa la clave que asignaste en `SKILLY_TEST_ADMIN_PASSWORD`. Es staff, no superusuario. Las demás cuentas ficticias usan `Skilly#2026`; sus nombres y estados están en el plan de pruebas.

Para probar sobre PostgreSQL, crea primero una base separada llamada, por ejemplo, `Skilly_test`, configura las variables PostgreSQL habituales del proyecto y selecciona esa base con `$env:SKILLY_DB_NAME = "Skilly_test"`. Migra y siembra únicamente después de comprobar `$env:SKILLY_DB_NAME`. Nunca apuntes las semillas o el generador de volumen a la base de desarrollo `Skilly`.

### Cobertura funcional del plan

- Ejecuta CP-NAV-01 y CN-01 a CN-05 manualmente en el navegador, usando cuentas y datos sembrados. CN-01 requiere borrar `luis.rojas` antes de probar alta; después esa cuenta sirve para CN-02.
- El sistema actual no implementa bloqueo tras cinco intentos ni expiración por inactividad de 30 minutos. El modelo tampoco tiene estado profesional «pausado». Anota estos puntos como brechas, no como pruebas aprobadas.
- Los filtros de marketplace se aplican en el navegador. No hay consulta SQL de búsqueda filtrada equivalente, por lo que el caso PR-03 original necesita interpretarse como medición del endpoint del catálogo de servicios.
- `npm run lint` no es una suite de pruebas; informa errores de lint existentes. `npm run build` verifica que el frontend compile.

## 2. SonarQube y SonarScanner en Windows

Rutas de la instalación indicada:

```powershell
$sonarHome = "D:\Testing\sonarqube-26.10.0.133078"
$scanner = "D:\Testing\sonar-scanner-8.1.0.6389-windows-x64\bin\sonar-scanner.bat"
```

### Iniciar SonarQube

El error `Module jdk.jlink not found` significa que el Java elegido es un JRE recortado, no un JDK completo. SonarQube 2026.1 y posteriores requieren un JDK completo; Java 21 es el mínimo documentado. Instala un JDK compatible y apunta `SONAR_JAVA_PATH` a su `java.exe`; no apuntes al JRE incluido dentro de SonarScanner. Consulta los [requisitos oficiales de SonarQube](https://docs.sonarsource.com/sonarqube-server/server-update-and-maintenance/release-notes):

```powershell
$env:SONAR_JAVA_PATH = "C:\Program Files\Eclipse Adoptium\jdk-21\bin\java.exe"
& "$sonarHome\bin\windows-x86-64\StartSonar.bat"
```

Deja esa consola abierta. Espera a que SonarQube termine de iniciar y abre `http://localhost:9000`.

### Crear y autorizar el proyecto

La configuración del repositorio usa la clave `skilly-latam`. En la interfaz de SonarQube, crea un proyecto local con esa clave y genera un token de análisis para ese proyecto. Si ya existe, confirma que el token tiene permiso para analizarlo. Esto resuelve el error `not authorized to analyze this project or the project doesn't exist`.

En otra consola PowerShell, desde la raíz del repositorio:

```powershell
$env:SONAR_TOKEN = Read-Host "Pega el token de análisis de SonarQube"
& $scanner -Dsonar.host.url="http://localhost:9000" -Dsonar.token="$env:SONAR_TOKEN"
```

El resultado debe terminar en `EXECUTION SUCCESS`. Consulta el panel `http://localhost:9000/dashboard?id=skilly-latam`. No pongas el token en `sonar-project.properties`, el historial de comandos ni Git. El Scanner descarga su propio runtime Java, independiente del Java del servidor.

## 3. Apache JMeter

El plan `docs/qa/skilly-load-test.jmx` realiza solicitudes GET al catálogo y a las APIs de consulta registradas, con una aserción HTTP 200 por petición. Incluye endpoints en español e inglés para detectar diferencias entre aliases. No ejecuta operaciones de escritura ni prueba validación de usuarios. Las acciones administrativas de aprobación se revisan desde `/admin/servicios` con la cuenta admin de pruebas.

Define la ruta completa y crea la carpeta de reportes antes de cada ejecución. El HTML de salida debe ser una carpeta nueva o vacía:

```powershell
$jmeter = "D:\Testing\apache-jmeter-5.6.3\bin\jmeter.bat"
New-Item -ItemType Directory -Force reports\qa | Out-Null
$stamp = Get-Date -Format "yyyyMMdd-HHmmss"
```

### PR-01: carga, 20 y 50 usuarios

Para 20 usuarios durante 60 segundos:

```powershell
& $jmeter -n -t docs\qa\skilly-load-test.jmx -Jhost=127.0.0.1 -Jport=8000 -Jthreads=20 -Jramp=20 -Jduration=60 -l "reports\qa\pr01-20-$stamp.jtl" -e -o "reports\qa\pr01-20-$stamp"
```

Para 50 usuarios durante 180 segundos:

```powershell
& $jmeter -n -t docs\qa\skilly-load-test.jmx -Jhost=127.0.0.1 -Jport=8000 -Jthreads=50 -Jramp=60 -Jduration=180 -l "reports\qa\pr01-50-$stamp.jtl" -e -o "reports\qa\pr01-50-$stamp"
```

Abre los directorios `reports\qa\pr01-20-<fecha>\index.html` y `reports\qa\pr01-50-<fecha>\index.html` correspondientes al valor de `$stamp`. Registra total de muestras, errores, throughput y percentil 95. El criterio del plan es p95 menor a 1,5 s y errores menores a 1%. Mantén el servidor y la base de pruebas estables durante cada ejecución; no abras JMeter GUI para estas cargas.

### PR-02: estrés escalonado y recuperación

Corre cada nivel por separado durante 120 segundos; crea un `.jtl` y un directorio HTML únicos por nivel:

```powershell
& $jmeter -n -t docs\qa\skilly-load-test.jmx -Jhost=127.0.0.1 -Jport=8000 -Jthreads=50 -Jramp=30 -Jduration=120 -l "reports\qa\pr02-50-$stamp.jtl" -e -o "reports\qa\pr02-50-$stamp"
& $jmeter -n -t docs\qa\skilly-load-test.jmx -Jhost=127.0.0.1 -Jport=8000 -Jthreads=100 -Jramp=30 -Jduration=120 -l "reports\qa\pr02-100-$stamp.jtl" -e -o "reports\qa\pr02-100-$stamp"
& $jmeter -n -t docs\qa\skilly-load-test.jmx -Jhost=127.0.0.1 -Jport=8000 -Jthreads=200 -Jramp=30 -Jduration=120 -l "reports\qa\pr02-200-$stamp.jtl" -e -o "reports\qa\pr02-200-$stamp"
& $jmeter -n -t docs\qa\skilly-load-test.jmx -Jhost=127.0.0.1 -Jport=8000 -Jthreads=400 -Jramp=30 -Jduration=120 -l "reports\qa\pr02-400-$stamp.jtl" -e -o "reports\qa\pr02-400-$stamp"
```

Después del mayor nivel, espera a que el API se recupere y repite 20 usuarios durante 60 segundos con `-Jthreads=20 -Jramp=20 -Jduration=60 -l "reports\qa\pr02-recuperacion-$stamp.jtl" -e -o "reports\qa\pr02-recuperacion-$stamp"`. Anota el primer nivel con errores, latencias y si el servicio recuperó su comportamiento. No ejecutes el siguiente nivel mientras el servidor aún esté saturado.

### PR-03: volumen de datos

El generador requiere una base de pruebas PostgreSQL con espacio suficiente. Confirma la base configurada antes de correrlo:

```powershell
$env:SKILLY_DB_NAME
```

Solo si imprime el nombre de la base aislada `Skilly_test` (o equivalente con `test`), ejecuta:

```powershell
.\.venv\Scripts\python.exe backend\manage.py seed_volume_data --professionals 100000 --availability-blocks 500000 --confirm-volume
```

El generador es idempotente, crea perfiles, disponibilidad y servicios aprobados para medir el endpoint del catálogo; puede tardar y consumir bastante almacenamiento. En una consola con el servidor conectado a esa misma base de pruebas, mide exclusivamente el catálogo usando el plan de volumen:

```powershell
$stamp = Get-Date -Format "yyyyMMdd-HHmmss"
& $jmeter -n -t docs\qa\skilly-marketplace-volume.jmx -Jhost=127.0.0.1 -Jport=8000 -Jthreads=20 -Jramp=20 -Jduration=60 -l "reports\qa\pr03-marketplace-$stamp.jtl" -e -o "reports\qa\pr03-marketplace-$stamp"
```

Consulta `reports\qa\pr03-marketplace-<fecha>\index.html` con el valor de `$stamp`. La implementación actual no pagina ni realiza filtros de categoría, modalidad y ubicación en SQL; registra esta limitación al interpretar los resultados. No ejecutes PR-03 en SQLite ni en la base de desarrollo.

## 4. Lectura de resultados

JMeter muestra fallos de transporte como `SocketTimeoutException` cuando el servidor tarda más que el timeout del plan. Primero revisa consola/log del backend y disponibilidad de la base. No eleves los timeouts para ocultar un incumplimiento del p95. Guarda `.jtl` y el reporte HTML por ejecución para comparar las corridas; no reutilices una carpeta HTML que ya contiene resultados.

SonarQube y JMeter verifican aspectos distintos: Sonar analiza el código fuente; JMeter mide respuesta del API bajo carga. Ninguno sustituye la ejecución manual de los casos funcionales del plan.
