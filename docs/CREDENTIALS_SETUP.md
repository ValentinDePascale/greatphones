# Guia de Configuración de Cuentas y Credenciales - Great Phones


## 1. Gmail + Contraseña de Aplicación

### Para qué
Enviar emails de confirmación de compra, notificaciones de arrepentimiento, emails del sistema.

### Qué necesita el cliente
- Crear una cuenta de Gmail dedicada al negocio (ej: `contacto@greatphones.com.ar` o `greatphones.notifications@gmail.com`)

### Pasos
1. Ir a https://myaccount.google.com/ → Iniciar sesión con la cuenta del negocio
2. Ir a **Seguridad** → **Verificación en dos pasos** → Activarla si no está activa
3. Ir a **Contraseñas de aplicaciones** (https://myaccount.google.com/apppasswords)
4. En "Seleccionar app" elegir **Otro (nombre personalizado)** → escribir `Great Phones`
5. Click en **Generar**
6. Copiar la contraseña de 16 caracteres que aparece (ej: `abcd efgh ijkl mnop`)
7. **Importante:** Esta contraseña solo se muestra UNA vez. Guardarla bien.

### Credenciales a entregar
| Variable | Ejemplo |
|----------|---------|
| `EMAIL_USER` | `contacto@greatphones.com.ar` |
| `EMAIL_PASS` | `abcdefghijklmnop` (16 caracteres, sin espacios) |

### Notas
- NO usar la contraseña normal de Gmail, debe ser la Contraseña de Aplicación
- Si el cliente usa Google Workspace con dominio propio, el proceso es similar desde la consola de admin
- Esta cuenta también recibirá notificaciones internas del sistema

---

## 2. Google Cloud Console - Google Sign-In

### Para qué
Login con Google para que los usuarios se registren e inicien sesión en la página.

### Qué necesita el cliente
- Crear un proyecto en Google Cloud Console
- Configurar la Pantalla de consentimiento OAuth
- Crear un ID de cliente OAuth 2.0

### Pasos
1. Ir a https://console.cloud.google.com/ → Iniciar sesión con la cuenta del negocio
2. Click en el selector de proyectos (arriba a la izquierda) → **Nuevo proyecto**
   - Nombre: `Great Phones`
   - Click en **Crear**
3. **Habilitar Google People API:**
   - Ir a **APIs y servicios** → **Biblioteca**
   - Buscar `Google People API`
   - Click en **Habilitar**
4. **Configurar pantalla de consentimiento OAuth:**
   - Ir a **APIs y servicios** → **Pantalla de consentimiento OAuth**
   - Tipo de usuario: **Externo** → Click en **Crear**
   - Nombre de la app: `Great Phones`
   - Email de soporte: email del negocio
   - Click en **Guardar y continuar**
   - En **Alcances**, agregar:
     - `.../auth/userinfo.email`
     - `.../auth/userinfo.profile`
   - Click en **Guardar y continuar**
   - En **Usuarios de prueba**, agregar el email del cliente como tester
   - Click en **Guardar y continuar**
5. **Crear credenciales OAuth:**
   - Ir a **APIs y servicios** → **Credenciales**
   - Click en **+ Crear credenciales** → **ID de cliente OAuth**
   - Tipo de aplicación: **Aplicación web**
   - Nombre: `Great Phones Web`
   - **URI de redireccionamiento autorizados:**
     - Agregar: `http://localhost:3000/api/auth/callback/google` (desarrollo)
     - Agregar: `https://greatphones.onrender.com/api/auth/callback/google` (producción)
   - Click en **Crear**
6. Copiar el **ID de cliente** y el **Secreto de cliente**

### Credenciales a entregar
| Variable | Ejemplo |
|----------|---------|
| `GOOGLE_CLIENT_ID` | `123456789-abc123.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | `GOCSPX-abc123def456` |

### Notas
- La pantalla de consentimiento estará en modo **Testing** hasta que Google la apruebe
- Mientras está en Testing, solo los emails agregados como "Usuarios de prueba" pueden usar Google Sign-In
- Para producción, hay que enviar la app a verificación de Google

---

## 3. Mercado Pago - Pagos

### Para qué
Cobros con tarjeta de crédito/débito (Visa, Mastercard, AMEX), transferencias bancarias, Rapipago, Pago Fácil, cuotas y financiamiento.

### Qué necesita el cliente
- Cuenta de Mercado Pago activa (si no tiene, crearla en mercadopago.com.ar)
- Crear una aplicación en Mercado Pago Developers

### Pasos
1. Ir a https://www.mercadopago.com.ar/developers/panel → Iniciar sesión con la cuenta de MP del negocio
2. Ir a **Tu aplicación** o **Create application** → Click en **Crear aplicación**
   - Nombre: `Great Phones`
   - Descripción: `Tienda online de productos electrónicos`
3. Una vez creada, ir a la sección **Credenciales de producción** (o **Credenciales de prueba** para testing)
4. Copiar las credenciales:
   - **Access Token** (token de acceso)
   - **Public Key** (clave pública)
5. **Configurar Webhook:**
   - Ir a **Notificaciones** o **Webhooks** en el panel de MP
   - URL de notificación: `https://greatphones.onrender.com/api/webhooks/mercadopago`
   - Eventos: Marcar `payment` (pagos)

### Credenciales a entregar
| Variable | Ejemplo |
|----------|---------|
| `MP_ACCESS_TOKEN` | `APP_USR-123456789-abcdef` |
| `MP_PUBLIC_KEY` | `APP_USR-abc123-def456` |

### Notas
- Para **testing**, usar las credenciales de **prueba** (empiezan con `TEST-`)
- Para **producción**, usar las credenciales de **producción** (empiezan con `APP_USR-`)
- Las credenciales de prueba NO procesan pagos reales
- El webhook es CRÍTICO: sin él, no se confirman los pagos automáticamente
- Mercado Pago cobra una comisión por transacción (ver tarifas actuales en su web)

---

## 4. Facebook Pixel - Tracking y Publicidad

### Para qué
- Trackear visitas al sitio web
- Medir conversiones (cuántos usuarios que hicieron click en un anuncio de Facebook/Instagram terminaron comprando)
- Crear audiencias personalizadas para publicidad en Facebook e Instagram
- Optimizar campañas publicitarias

### Qué necesita el cliente
- Una cuenta de **Facebook Business** (gratis)
- Si ya tiene una página de Facebook para Great Phones, puede usar esa

### Pasos
1. Ir a https://business.facebook.com/ → Iniciar sesión con la cuenta de Facebook del negocio
2. Si no tiene cuenta Business, crear una:
   - Click en **Crear cuenta**
   - Nombre: `Great Phones`
   - Email del negocio
3. Ir a **Eventos** o **Pixels** en el menú de Business Manager
   - URL directa: https://business.facebook.com/events_manager
4. Click en **Conjuntos de datos** → **Agregar conjunto de datos** → **Pixel de Facebook**
5. Configurar el Pixel:
   - Nombre: `Great Phones Pixel`
   - URL del sitio web: `https://greatphones.onrender.com`
   - Click en **Crear**
6. Una vez creado, copiar el **ID del Pixel** (es un número, ej: `123456789012345`)
7. **Configurar eventos (opcional pero recomendado):**
   - En el Events Manager, configurar eventos como:
     - `ViewContent` (ver producto)
     - `AddToCart` (agregar al carrito)
     - `Purchase` (compra realizada)
   - Esto se puede hacer con el código que ya está en la página

### Credenciales a entregar
| Variable | Ejemplo |
|----------|---------|
| `FACEBOOK_PIXEL_ID` | `123456789012345` (número) |

### Notas
- Es gratis crear y usar el Pixel
- Solo se necesita si el cliente planea hacer publicidad en Facebook/Instagram
- Sin el Pixel, no se pueden medir conversiones de anuncios
- El cliente también puede usar el Pixel para crear "públicos similares" (personas parecidas a sus compradores)

---

## 5. Google Analytics - Estadísticas de Visitas

### Para qué
- Ver cuántas personas visitan el sitio
- Saber de dónde vienen los visitantes (Google, redes sociales, links directos)
- Ver qué productos son los más vistos
- Medir tiempo de permanencia, páginas más visitadas, etc.

### Qué necesita el cliente
- Una cuenta de **Google Analytics** (gratis)

### Pasos
1. Ir a https://analytics.google.com/ → Iniciar sesión con la cuenta de Gmail del negocio
2. Click en **Comenzar** o **Crear cuenta**
3. Configurar la cuenta:
   - Nombre de la cuenta: `Great Phones`
   - Nombre de la propiedad: `Great Phones Web`
   - Zona horaria: `Argentina`
   - Moneda: `Peso argentino (ARS)`
4. Configurar el flujo de datos:
   - Plataforma: **Web**
   - URL del sitio: `https://greatphones.onrender.com`
   - Nombre del flujo: `Great Phones`
5. Una vez creado, ir a **Administrador** (engranaje abajo a la izquierda) → **Flujos de datos** → Seleccionar el flujo web
6. Copiar el **ID de medición** (empieza con `G-`, ej: `G-ABC123DEF4`)

### Credenciales a entregar
| Variable | Ejemplo |
|----------|---------|
| `GA_MEASUREMENT_ID` | `G-ABC123DEF4` |

### Notas
- Es gratis
- Google Analytics 4 (GA4) es la versión actual
- Se puede vincular con Google Ads si el cliente hace publicidad en Google

---

## 6. TusFacturitas + AFIP - Facturación Electrónica (Fase 2)

### Para qué
Emitir facturas electrónicas A, B, C según normativa argentina (ARCA/AFIP). Generación automática de CAE. Envío de facturas por email.

### Qué necesita el cliente
- **Clave Fiscal AFIP** nivel 3 o superior
- **Punto de venta** habilitado en AFIP
- **Cuenta en TusFacturitas** (tusfacturitas.com.ar)

### Pasos
1. **Obtener Clave Fiscal AFIP:**
   - Ir a una oficina de AFIP con DNI y solicitar Clave Fiscal nivel 3
   - O usar la app "Mi AFIP" con reconocimiento facial
2. **Habilitar punto de venta:**
   - Ingresar a AFIP con Clave Fiscal
   - Ir a **Administrador de Relaciones de Clave Fiscal**
   - Dar de alta el servicio **Comprobantes en línea**
   - Crear un punto de venta (si no tiene uno)
3. **Crear cuenta en TusFacturitas:**
   - Ir a https://tusfacturitas.com.ar
   - Registrarse con email y datos del negocio
   - Vincular la cuenta de AFIP desde el panel de TusFacturitas
4. **Obtener API Key:**
   - Ir al panel de TusFacturitas → **Configuración** → **API**
   - Generar una nueva API Key
   - Copiar la key y el endpoint

### Credenciales a entregar
| Variable | Ejemplo |
|----------|---------|
| `TUSFACTURITAS_API_KEY` | `tf_abc123def456` |
| `TUSFACTURITAS_ENDPOINT` | `https://api.tusfacturitas.com.ar/v1` |

### Notas
- Este servicio tiene costo mensual (~$15.000-25.000 ARS/mes)
- Se implementa en la Fase 2 (después de tener pagos funcionando)
- Sin Clave Fiscal AFIP no se puede facturar electrónicamente

---

## 8. Cloudinary - Fotos de Productos

### Para qué
Almacenamiento de fotos de productos y accesorios.

### Estado
✅ **Ya configurado**
- `CLOUDINARY_CLOUD_NAME`: `dck24mtpw`
- `CLOUDINARY_API_KEY`: `287452999227336`
- `CLOUDINARY_API_SECRET`: configurado

### ¿Necesita acción del cliente?
No, ya está configurado. Si el cliente quiere usar su propia cuenta:
1. Ir a https://cloudinary.com/ → Crear cuenta gratuita
2. Ir al Dashboard → copiar Cloud Name, API Key, API Secret

---


## Checklist para el Cliente

### Paso 1: Cuenta de Gmail
- [ ] Crear cuenta de Gmail para el negocio
- [ ] Activar verificación en dos pasos
- [ ] Generar Contraseña de Aplicación
- [ ] Entregar: email + contraseña de aplicación

### Paso 2: Google Cloud Console
- [ ] Crear proyecto en Google Cloud Console
- [ ] Habilitar Google People API
- [ ] Configurar pantalla de consentimiento OAuth
- [ ] Crear OAuth Client ID
- [ ] Agregar redirect URIs (local + producción)
- [ ] Entregar: Client ID + Client Secret

### Paso 3: Mercado Pago
- [ ] Tener cuenta de Mercado Pago activa
- [ ] Crear aplicación en MP Developers
- [ ] Obtener Access Token y Public Key
- [ ] Configurar webhook URL en MP
- [ ] Entregar: Access Token + Public Key

### Paso 4: Facebook Pixel (opcional)
- [ ] Crear cuenta en Facebook Business
- [ ] Crear Pixel en Events Manager
- [ ] Entregar: Pixel ID

### Paso 5: Google Analytics (opcional)
- [ ] Crear cuenta en Google Analytics
- [ ] Crear propiedad y flujo web
- [ ] Entregar: Measurement ID (G-XXXX)

### Paso 6: TusFacturitas (Fase 2 - más adelante)
- [ ] Obtener Clave Fiscal AFIP nivel 3
- [ ] Habilitar punto de venta en AFIP
- [ ] Crear cuenta en TusFacturitas
- [ ] Obtener API Key
- [ ] Entregar: API Key + Endpoint

---

## Formato de Entrega

El cliente debe entregar las credenciales en este formato:

```
EMAIL_USER=contacto@greatphones.com.ar
EMAIL_PASS=abcdefghijklmnop
GOOGLE_CLIENT_ID=123456789-abc.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-abc123
MP_ACCESS_TOKEN=APP_USR-123456789-abcdef
MP_PUBLIC_KEY=APP_USR-abc123-def456
FACEBOOK_PIXEL_ID=123456789012345
GA_MEASUREMENT_ID=G-ABC123DEF4
```

### Seguridad
- NUNCA compartir credenciales por WhatsApp o email sin cifrar
- Usar un gestor de contraseñas o un documento protegido
- Las credenciales de producción son diferentes a las de prueba
