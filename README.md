# Receipt-Scanner-AI

[![Next.js](https://img.shields.io/badge/Next.js-15-000000?style=flat&logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=flat&logo=prisma&logoColor=white)](https://www.prisma.io/)
[![MariaDB](https://img.shields.io/badge/MariaDB-003545?style=flat&logo=mariadb&logoColor=white)](https://mariadb.org/)
[![Clerk](https://img.shields.io/badge/Clerk-6C47FF?style=flat&logo=clerk&logoColor=white)](https://clerk.com/)
[![k6](https://img.shields.io/badge/k6-7D64FF?style=flat&logo=k6&logoColor=white)](https://k6.io/)
[![Pruebas](https://img.shields.io/badge/pruebas-carga%20%2B%20IDOR-e535ab?style=flat&logo=k6&logoColor=white)](#pruebas-de-carga)

Gestor de gastos que **lee tus recibos por ti**: subes una foto, extrae el texto con OCR,
lo convierte en gastos estructurados con IA, y luego te avisa cuando un producto empezó a
subir de precio.

No es un formulario con *autocomplete*. La idea es que el usuario no tenga que digitar
nada, y que la app le diga cosas que él mismo no se habría fijado.

---

## Índice

- [Cómo funciona](#cómo-funciona)
- [Hallazgos de precio](#hallazgos-de-precio)
- [Sistema de tokens](#sistema-de-tokens)
- [Seguridad](#seguridad)
- [Pruebas de carga](#pruebas-de-carga)
- [Arquitectura](#arquitectura)
- [Stack](#stack)
- [Instalación](#instalación)
- [Endpoints](#endpoints)

---

## Cómo funciona

El procesamiento de un recibo es una secuencia con pasos que se pueden fallar, por lo que
cada uno tiene su manejo de error:

```
1. Subida de imagen            → se guarda y se bufetea en memoria (base64)
2. Consumo de token            → 1 token se descuenta ANTES de cualquier llamada externa
3. OCR                         → Google Vision API extrae el texto (timeout de 30 s)
4. Estructuración              → DeepSeek convierte texto crudo en JSON tipado
5. Cálculo de confianza        → se puntúa qué tan fiables son los datos extraídos
6. Persistencia                → se guarda el gasto y se invalida la caché de la UI
7. Si algo falla               → se reintenta y se REEMBOLSA el token
```

**Salida estructurada** (`StructuredData`):

```ts
{
  amount: number
  merchant: string
  date: string            // YYYY-MM-DD
  category: string        // estrictamente una de las categorías del usuario
  description: string
  items: Array<{ name: string; price: number; quantity?: number; unit?: string }>
}
```

Las unidades son `"kg" | "g" | "l" | "ml" | "ud"`, de modo que un recibo de 27 productos
queda normalizado y no solo suma totales.

**Puntuación de confianza:**

| Señal | Rango | Lógica |
|---|---|---|
| `amountConfidence` | 0.7 – 1.0 | sube cuando la suma de los productos cuadra con el total |
| `itemsConfidence` | 0.5 – 1.0 | sube cuando la estructura del recibo es legible |

Se persiste junto al gasto, así que la interfaz puede distinguir "seguro" de "revisar".

---

## Hallazgos de precio

Cada producto guardado alimenta el historial de precios del usuario. Esa comparación es
**lógica pura de base de datos, sin IA y sin costo de token**: es el único apartaje del
sistema que le devuelve valor al usuario todos los días sin que pague por ello.

El principio de producto es estricto: *los hallazgos no muestran datos, descubren cosas que
el usuario probablemente no se habría visto por sí solo*.

- **Máximo 3 hallazgos**, siempre, ordenados por impacto económico. Un recibo de 27
  productos no puede generar 27 tarjetas.
- **Conclusiones, nunca estadística cruda.** No se muestra `avg`/`min`/`max`, se convierte
  en frase: *"Hoy pagaste $5.800 más que tu precio habitual"*.

| Tipo | Condición |
|---|---|
| `unusual` | más de 15 % por encima de tu promedio |
| `best` | igual o por debajo de tu mínimo histórico |
| `trend` | 3 aumentos consecutivos |
| `drop` | primera baja después de un alza |
| `provider` | producto con historial en ≥ 2 comercios (memoria de proveedor) |

Se complementa con un **histórico por producto**: un *sparkline* SVG, chips
(Habitual / Mínimo / Máximo / Veces) y un desglose por proveedor con el más barato
resaltado.

---

## Sistema de tokens

El OCR y la IA cuestan dinero, así que la aplicación los **limita y los audita** en lugar
de confiar en una suscripción opaca.

```
ai_token_wallet          plan_tokens (suscripción) + extra_tokens (comprados)
ai_token_transactions    log inmutable: consume | refund | elite_scan | purchase
```

- `consumeToken()` descuenta **exactamente 1 token por escaneo**, prefiriendo `plan_tokens`
  y cayendo a `extra_tokens`.
- El plan **Elite** escanea sin límite: la transacción se registra como `elite_scan` con
  costo `0` y no se descuenta nada. Nunca debe aparecer "tokens insuficientes" para un
  usuario Elite.
- Si el procesamiento falla, `refundToken()` devuelve el token a `plan_tokens` sin
  superar el límite del plan, o a `extra_tokens`.
- La compra de packs (25 / 50 / 100) se delega al backend de Orderfox mediante
  **comunicación servidor a servidor** con `SERVICE_API_KEY`.

---

## Seguridad

- **Autorización con Clerk.** El *middleware* protege `/dashboard/*` y `/api/*`; toda
  *server action* obtiene el `userId` de sesión y nunca lo acepta del cliente.
- **Rate limiting** por clave de usuario con Upstash (`src/lib/rateLimiter.ts`), devolviendo
  cabeceras `Retry-After` y `X-RateLimit-*`.
- **Pruebas IDOR explícitas** (`tests/k6/idor.js`): se envían `userId` falsos y omitidos a
  `/api/stats/summary` y al *checkout* y se verifica que la respuesta sea `401`, `422` o
  datos vacíos — nunca datos de otro usuario.
- **`eslint-plugin-security`** en el linter y **`.gitleaks.toml`** para *secret scanning*.
- `.env` está ignorado; solo se versiona `.env.example` con valores de marcador.

---

## Pruebas de carga

Ejecutables con [k6](https://k6.io/). Los umbrales están en los propios scripts.

| Script | Qué mide |
|---|---|
| `tests/k6/health.js` | disponibilidad general |
| `tests/k6/stats.js` | `/api/stats/summary` |
| `tests/k6/tokens.js` | `/api/tokens/status` |
| `tests/k6/idor.js` | intentos de acceso cruzado entre usuarios |
| `tests/k6/full_scenario.js` | escenario completo mixto |

```bash
pnpm stress              # escenario completo con la configuración por defecto
pnpm stress:health
pnpm stress:idor
pnpm stress:phase1       # 5 VU 30 s → 10 VU 60 s → 20 VU 60 s
pnpm stress:phase2       # 30 VU 2 min
pnpm stress:phase3       # 50 VU 2 min → 100 VU 2 min
```

La configuración se sobreescribe por variables de entorno:
`SCANNER_URL`, `SCANNER_API_KEY`, `SCANNER_USER_ID`.

---

## Arquitectura

El patrón dominante son las **server actions** de Next.js: la lógica vive en
`src/actions/*.ts` con `'use server'`, sin capa de rutas intermedia salvo para integraciones
externas. Después de cada mutación se llama a `revalidatePath()` para refrescar la UI.

```
src/
  actions/          lógica de negocio (server actions)
    services/       ocrService · aiStructuring · tokenService
  app/              App Router: rutas de API y páginas del dashboard
  components/       interfaz (gráficos, modales, scanner review)
  lib/              prisma · rateLimiter · cloudinary · fetchWithRetry
prisma/             esquema y migraciones
tests/k6/           pruebas de carga y de seguridad
```

**Modelos principales:**

| Modelo | Contenido |
|---|---|
| `category` | categorías por usuario, únicas por nombre + usuario |
| `expense` | monto, fecha, categoría, comprobante, datos OCR y confianzas |
| `budget` | presupuesto por usuario |
| `ai_token_wallet` / `ai_token_transactions` | saldo y auditoría de tokens |
| `price_history` | historial de precios de cada producto comprado |

> El esquema conserva tablas heredadas de un sistema previo de restaurantes. Para lo nuevo
> se usan únicamente las tablas del sistema de gastos (`category`, `expense`, `budget`).

---

## Stack

| Capa | Tecnología |
|---|---|
| Framework | Next.js 15 (App Router) · React 19 · TypeScript |
| Backend | Server Actions · Prisma 7 · MariaDB |
| Autenticación | Clerk (`clerkMiddleware` + `auth.protect()`) |
| OCR | Google Vision API (con Tesseract.js disponible) |
| IA | DeepSeek — estructuración y categorización |
| Imágenes | Cloudinary |
| Infraestructura | pnpm · Docker · Dockerfile.dev |
| Calidad | ESLint + `eslint-plugin-security` · k6 · gitleaks |

---

## Instalación

**Requisitos:** Node **≥ 20 y < 24**, [pnpm](https://pnpm.io/), una base MariaDB y las
claves de Clerk, Google Vision, DeepSeek y Cloudinary.

```bash
pnpm install                  # ejecuta `prisma generate` en postinstall
cp .env.example .env          # y rellena las credenciales
pnpm prisma migrate deploy    # aplica las migraciones
pnpm dev                      # http://localhost:3000
```

Variables de entorno principales (ver `.env.example` para la lista completa):

```bash
# Base de datos
DATABASE_URL=mysql+pymysql://usuario:contraseña@host:puerto/nombre_db
DIRECT_URL=mysql://usuario:contraseña@host:puerto/nombre_db

# IA y OCR
DEEPSEEK_API_KEY=...
GOOGLE_VISION_API_KEY=...

# Integración con Orderfox (Flask)
ORDERFOX_URL=https://velzia.shop
SERVICE_API_KEY=...
FLASK_SECRET_KEY=...
```

---

## Endpoints

| Método y ruta | Descripción |
|---|---|
| `GET /api/stats/summary` | resumen de gastos del usuario autenticado |
| `GET /api/export` | exportación CSV (`Fecha, Comercio/Descripción, Monto, Categoría`) |
| `GET /api/tokens/status` | saldo de la billetera y estado de tokens |
| `POST /api/checkout` | compra de packs de tokens vía Orderfox (con rate limit) |
| `GET /api/auth/flask-token` | token servidor-a-servidor para el backend Flask |
| `POST /api/webhook` | *webhooks* externos (ruta pública) |

---

## Nota

Proyecto desarrollado para uso propio y como material de portafolio. La base de datos y el
backend de pagos son compartidos con [Orderfox](https://github.com/danielririver01/Orderfox),
por lo que este repositorio **no incluye credenciales ni datos reales**: usa únicamente
`.env.example`.

---

Por [Jhoan Daniel Rivera Ortiz](https://github.com/danielririver01).
