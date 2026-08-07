# Guía Técnica Legal para E-Commerce en Argentina

**Versión**: 1.0  
**Fecha**: Abril 2025  
**Propósito**: Documentación técnica para cumplimiento normativo de comercio electrónico en Argentina

---

## 1. CHECKLIST DE REQUISITOS LEGALES (ARGENTINA)

### 1.1 Resolución 424/2020 - Botón de Arrepentimiento

**Normativa**: Establece que todo consumidor tiene derecho a desistir de una compra dentro de los 10 días corridos desde la recepción del producto/servicio, sin costo y sin expresión de causa.

**Obligaciones Técnicas**:
- El botón debe estar visible en todo momento (incluso sin login)
- Debe ser accesible desde cualquier página del sitio
- El formato debe ser claro y preciso (no puede confundirse con otros elementos)
- El tiempo de procesamiento no puede superar los 3 días hábiles
- El reembolso debe realizarse por el mismo medio de pago utilizado

### 1.2 Formulario 960/D - Data Fiscal (ARCA/AFIP)

**Normativa**: Toda página web de comercio electrónico debe mostrar la información del vendedor según lo establecido por ARCA (antes AFIP), incluyendo razón social, CUIT, domicilio comercial, etc.

**Obligaciones Técnicas**:
- El código Data Fiscal debe estar visible en un lugar destacado
- Puede ser un banner, un link o un Script incrustado provisto por ARCA
- Debe incluirse en_home, _carrito y_checkout

### 1.3 Ley 24.240 - Defensa del Consumidor

**Normativa**: Protege los derechos de los consumidores estableciendo garantías sobre productos, políticas de arrepentimiento, y responsabilidades del vendedor.

**Obligaciones Técnicas**:
- Garantía legal de 6 meses mínimo sobre productos
- Información clara de políticas de cambio y devolución
- Datos de organismo de defensa del consumidor (INDER/DEFENSORÍA)

### 1.4 Ley 25.326 - Protección de Datos Personales

**Normativa**: Regula el tratamiento de datos personales, estableciendo requisitos para su recolección, almacenamiento y uso.

**Obligaciones Técnicas**:
- Política de privacidad visible y accesible
- Checkbox de aceptación de términos al registrarse
- Mecanismo para solicitud de eliminación de datos (derecho de "olvido")
- Registro en la DNPDP (Dirección Nacional de Protección de Datos)

---

## 2. ARQUITECTURA DEL FRONTEND (FOOTER Y HOME)

### 2.1 Estructura Obligatoria del Footer

El Footer de un e-commerce argentino debe contener:

| Elemento | Descripción | Link/Referencia |
|----------|-------------|-----------------|
| Data Fiscal | Información fiscal согласно ARCA | Script o banner de ARCA |
| Botón Arrepentimiento | Link a política de desistimiento | `#arrepentimiento` |
| Términos y Condiciones | Términos legales del servicio | `/terminos` |
| Políticas de Privacidad | Protección de datos personales | `/privacidad` |
| Defensa Consumidor | Datos del organismo | Link externo INDER |
| Copyright | Año actual y razón social | © 2025 [RAZON_SOCIAL] |

### 2.2 Esquema HTML del Footer

```html
<!-- ===== FOOTER LEGAL ===== -->
<footer class="footer">
  <div class="footer-legal">
    
    <!-- Data Fiscal (ARCA) -->
    <div class="data-fiscal">
      <span>Data Fiscal:</span>
      <a href="[URL_DATA_FISCAL_ARCA]" target="_blank" rel="noopener">
        <img src="[IMAGEN_DATA_FISCAL]" alt="Data Fiscal" width="120" height="40">
      </a>
    </div>

    <!-- Botón de Arrepentimiento -->
    <div class="arrepentimiento">
      <a href="#arrepentimiento-modal" onclick="openArrepentimiento()">
        <button class="btn-arrepentimiento">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 12a9 9 0 109 9 9 9 0 00-9-9z"/>
            <path d="M12 8v4"/>
          </svg>
          Botón de Arrepentimiento
        </button>
      </a>
    </div>

    <!-- Links Legales -->
    <div class="legal-links">
      <a href="/terminos">Términos y Condiciones</a>
      <span>|</span>
      <a href="/privacidad">Políticas de Privacidad</a>
      <span>|</span>
      <a href="https://www.argentina.gob.ar/defensaconsumidor" target="_blank">
        Defensa del Consumidor
      </a>
      <span>|</span>
      <a href="/cancelacion">Política de Cancelación</a>
    </div>

    <!-- Copyright -->
    <div class="copyright">
      © [AÑO_ACTUAL] [RAZON_SOCIAL]. Todos los derechos reservados.
      <br>
      CUIT: [CUIT] | Domicilio: [DOMICILIO_COMERCIAL]
    </div>

    <!-- info@ [EMAIL_ATENCION_AL_CLIENTE]</div> -->
  </div>
</footer>
```

### 2.3 Banner Obligatorio en Home

```html
<!-- ===== BANNER LEGAL HOME ===== -->
<div class="legal-banner" style="background: var(--cream2); padding: 1rem; text-align: center; font-size: 12px;">
  <p>
    <strong>Garantía legal de 6 meses</strong> |
    <strong>Botón de Arrepentimiento</strong> (10 días) |
    <strong>Data Fiscal</strong>: [RAZON_SOCIAL] - CUIT: [CUIT]
    <a href="/terminos">Ver Términos yCondiciones</a>
  </p>
</div>
```

### 2.4 CSS Legal Styles

```css
/* Estilos legales obligatorios */
.footer-legal {
  border-top: 1px solid var(--border);
  padding: 2rem 1rem;
}

.data-fiscal {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin-bottom: 1rem;
}

.btn-arrepentimiento {
  background: var(--orange);
  color: white;
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.btn-arrepentimiento:hover {
  background: var(--orange2);
}

.legal-links {
  display: flex;
  justify-content: center;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 1rem;
}

.legal-links a {
  color: var(--gray);
  text-decoration: none;
  font-size: 13px;
}

.legal-links a:hover {
  color: var(--orange);
}

.copyright {
  text-align: center;
  font-size: 12px;
  color: var(--gray);
}

.legal-banner {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 100;
}
```

---

## 3. ESPECIFICACIÓN DEL BOTÓN DE ARREPENTIMIENTO

### 3.1 Flujo Técnico

1. El usuario hace clic en "Botón de Arrepentimiento" (ubicación: Footer o modal)
2. Se abre un formulario/modal sin necesidad de login
3. El usuario completa: número de orden, email, motivo (opcional)
4. Al enviar, se valida que la orden exista y esté dentro de los 10 días
5. Se crea un registro en la base de datos (tabla: arrepentimientos)
6. Se envía email automático a `[EMAIL_NOTIFICACIONES]`
7. Se muestra confirmación al usuario

### 3.2 Ubicaciones Obligatorias

| Página | Ubicación | Visibilidad |
|--------|------------|-------------|
| Footer | Link en footer-legal | Siempre visible |
| Carrito | Banner superior | Antes de pagar |
| Checkout | Antes de confirmación | Obligatorio |
| Mi Cuenta | Sección de pedidos | Solo logueado |

### 3.3 Estructura del Formulario

```html
<!-- ===== MODAL ARREPENTIMIENTO ===== -->
<div id="arrepentimiento-modal" class="modal" style="display:none;">
  <div class="modal-backdrop" onclick="closeArrepentimiento()"></div>
  <div class="modal-content">
    <button class="modal-close" onclick="closeArrepentimiento()">×</button>
    
    <h2>Botón de Arrepentimiento</h2>
    <p class="text-muted">
      Según Resolución 424/2020, podés desistir de tu compra dentro de los 10 d��as corridos desde la recepción del producto.
    </p>
    
    <form id="form-arrepentimiento" onsubmit="submitArrepentimiento(event)">
      
      <div class="form-group">
        <label>Número de Orden *</label>
        <input type="text" id="arrep-orden" required placeholder="Ej: GP-2025-XXXXX">
      </div>

      <div class="form-group">
        <label>Email de compra *</label>
        <input type="email" id="arrep-email" required placeholder="tu@email.com">
      </div>

      <div class="form-group">
        <label>Teléfono de contacto</label>
        <input type="tel" id="arrep-telefono" placeholder="+54 9 11 XXXX XXXX">
      </div>

      <div class="form-group">
        <label>Motivo (opcional)</label>
        <textarea id="arrep-motivo" rows="3" placeholder="Contanos por qué desistís de la compra..."></textarea>
      </div>

      <div class="form-group checkbox">
        <input type="checkbox" id="arrep-confirm" required>
        <label for="arrep-confirm">
          Confirmo que quiero desistir de mi compra según el art. 34 de la Ley 24.240
        </label>
      </div>

      <button type="submit" class="btn-primary">
        Enviar Solicitud
      </button>
    </form>
  </div>
</div>
```

### 3.4 JavaScript - Funciones del Frontend

```javascript
// ===== ARREPENTIMIENTO =====

function openArrepentimiento() {
  var modal = document.getElementById('arrepentimiento-modal');
  if (modal) {
    modal.style.display = 'flex';
  }
}

function closeArrepentimiento() {
  var modal = document.getElementById('arrepentimiento-modal');
  if (modal) {
    modal.style.display = 'none';
  }
}

async function submitArrepentimiento(event) {
  event.preventDefault();
  
  var orden = document.getElementById('arrep-orden').value.trim();
  var email = document.getElementById('arrep-email').value.trim();
  var telefono = document.getElementById('arrep-telefono').value.trim();
  var motivo = document.getElementById('arrep-motivo').value.trim();
  varconfirm = document.getElementById('arrep-confirm').checked;
  
  if (!orden || !email || !confirm) {
    alert('Por favor completá los campos obligatorios');
    return;
  }
  
  try {
    var API_URL = '[URL_API]';
    var res = await fetch(API_URL + '/api/arrepentimiento', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orden: orden,
        email: email,
        telefono: telefono,
        motivo: motivo,
        fecha: new Date().toISOString()
      })
    });
    
    var data = await res.json();
    
    if (data.success) {
      alert('Tu solicitud ha sido registrada. Te enviaremos un email con el número de trámite.');
      closeArrepentimiento();
    } else {
      alert(data.message || 'Error al procesar la solicitud');
    }
  } catch (e) {
    alert('Error de conexión. Intentalo más tarde.');
  }
}
```

### 3.5 Backend - API Endpoint (Next.js)

```typescript
// src/app/api/arrepentimiento/route.ts

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { orden, email, telefono, motivo } = body;
    
    // Validar campos obligatorios
    if (!orden || !email) {
      return NextResponse.json(
        { success: false, message: 'Campos obligatorios faltantes' },
        { status: 400 }
      );
    }
    
    // Buscar la orden
    const ordenData = await prisma.order.findUnique({
      where: { id: orden }
    });
    
    if (!ordenData) {
      return NextResponse.json(
        { success: false, message: 'Orden no encontrada' },
        { status: 404 }
      );
    }
    
    // Validar que sea dentro de los 10 días
    const fechaOrden = new Date(ordenData.createdAt);
    const fechaActual = new Date();
    const diasDiff = Math.floor((fechaActual - fechaOrden) / (1000 * 60 * 60 * 24));
    
    if (diasDiff > 10) {
      return NextResponse.json(
        { success: false, message: 'El plazo de 10 días ha vencido' },
        { status: 400 }
      );
    }
    
    // Validar email de la orden
    if (ordenData.email !== email) {
      return NextResponse.json(
        { success: false, message: 'El email no coincide con el de la orden' },
        { status: 400 }
      );
    }
    
    // Registrar arrepentimiento
    const registro = await prisma.arrepentimiento.create({
      data: {
        ordenId: orden,
        email: email,
        telefono: telefono || null,
        motivo: motivo || null,
        estado: 'PENDIENTE'
      }
    });
    
    // TODO: Enviar email de notificación a [EMAIL_NOTIFICACIONES]
    // await sendEmail({
    //   to: '[EMAIL_NOTIFICACIONES]',
    //   subject: 'Nueva solicitud de arrepentimiento',
    //   body: `Se recibió solicitud de arrepentimiento para orden ${orden}`
    // });
    
    return NextResponse.json({
      success: true,
      message: 'Solicitud registrada correctamente',
      tramite: registro.id
    });
    
  } catch (error) {
    console.error('Arrepentimiento error:', error);
    return NextResponse.json(
      { success: false, message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
```

### 3.6 Base de Datos - Modelo Prisma

```prisma
// En prisma/schema.prisma

model Arrepentimiento {
  id          String   @id @default(cuid())
  ordenId     String
  email       String
  telefono    String?
  motivo      String?
  estado      String   @default("PENDIENTE") // PENDIENTE, APROBADO, RECHAZADO
  tramite     String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  // Relaciones
  order       Order    @relation(fields: [ordenId], references: [id])
}
```

---

## 4. DATA FISCAL (FORMULARIO 960/D)

### 4.1 Pasos Administrativos en ARCA

1. **Ingresar al portal de ARCA**: https://www.arca.gob.ar
2. **Ir a**: "Comercio Electrónico" > "Data Fiscal"
3. **Completar formulario 960/D** con:
   - RUT (identificador única del comercio)
   - Razón social (ya registrada en AFIP)
   - Domicilio fiscal
   - Actividad económica
4. **Obtener Script**: ARCA provee un código JavaScript para incorporar
5. **Vincular sitio**: Insertar el Script en_home, _carrito y_checkout

### 4.2 Insertar el Script de ARCA

```html
<!-- ===== DATA FISCAL ARCA ===== -->
<!-- Script provisto por ARCA - Reemplazar con el código real -->
<script type="text/javascript" src="[SCRIPT_ARCA_URL]"></script>

<!-- Versión alternativa: Banner HTML -->
<div id="data-fiscal">
  <a href="https://www.arca.gob.ar/9505/cuit/pagina.html?tipo=RG%206249&reason=clindividual&id=11111111" 
     target="_blank" 
     rel="noopener noreferrer">
    <img src="[IMAGEN_DATA_FISCAL]" 
         alt="Data Fiscal" 
         width="120" 
         height="60">
  </a>
</div>
```

### 4.3 Modelo Prisma para Data Fiscal

```prisma
// En prisma/schema.prisma

model DataFiscal {
  id              String   @id @default(cuid())
  rut             String   // RUT de ARCA
  razonSocial     String
  domicilio      String
  cuit            String
  iconoUrl        String?  // URL de imagen de Data Fiscal
  scriptUrl       String?  // URL del script de ARCA
  activo         Boolean  @default(true)
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
}
```

---

## 5. ESTRUCTURA DE TÉRMINOS, CONDICIONES Y PRIVACIDAD

### 5.1 Índice: Términos y Condiciones

```
TÉRMINOS Y CONDICIONES - [RAZON_SOCIAL]

1. INFORMACIÓN GENERAL
   1.1. Identificación del vendedor
   1.2. Datos de contacto
   1.3. Objetivos del servicio

2. CONDICIONES DE USO
   2.1. Aceptación de términos
   2.2. Capacidad para contratar
   2.3. Cuenta de usuario

3. PRODUCTOS Y SERVICIOS
   3.1. Catálogo de productos
   3.2. Disponibilidad
   3.3. Precios

4. PROCESO DE COMPRA
   4.1. Registro
   4.2. Carrito
   4.3. Pago
   4.4. Confirmación

5. POLÍTICAS DE ENVÍO
   5.1. Zonas de entrega
   5.2. Tiempos estimados
   5.3. Costos de envío
   5.4. Retiros en tienda

6. POLÍTICAS DE DEVOLUCIÓN Y GARANTÍA
   6.1. Garantía legal de 6 meses
   6.2. Proceso de cambio
   6.3. Excepciones

7. POLÍTICA DE ARREPENTIMIENTO
   7.1. Plazo (10 días)
   7.2. Condiciones
   7.3. Proceso

8. RESPONSABILIDADES
   8.1. Del vendedor
   8.2. Del comprador

9. PROPIEDAD INTELECTUAL

10. LIMITACIÓN DE RESPONSABILIDAD

11. INDEMNIZACIÓN

12. MODIFICACIONES DE TÉRMINOS

13. LEY APLICABLE Y JURISDICCIÓN
    - Jurisdicción: [JURISDICCION]
    - Domicilio judicial: [DOMICILIO_JUDICIAL]

14. INFORMACIÓN DE CONTACTO
    - Email: [EMAIL_ATENCION_AL_CLIENTE]
    - Teléfono: [TELEFONO_CONTACTO]
```

### 5.2 Índice: Políticas de Privacidad

```
POLÍTICAS DE PRIVACIDAD - [RAZON_SOCIAL]

1. INTRODUCCIÓN
   1.1. Identificación del responsable
   1.2. Finalidad del tratamiento

2. DATOS QUE RECOLECTAMOS
   2.1. Datos de registro
   2.2. Datos de navegación
   2.3. Datos de pago

3. FINALIDAD DEL TRATAMIENTO
   3.1. Prestación del servicio
   3.2. Comunicación comercial
   3.3. Mejora del servicio

4. BASE LEGAL DEL TRATAMIENTO

5. CONSERVACIÓN DE DATOS

6. DERECHOS DEL TITULAR
   6.1. Acceso
   6.2. Rectificación
   6.3. Supresión (derecho al olvido)
   6.4. Portabilidad
   6.5. Oposición

7. TRANSFERENCIAS INTERNACIONALES

8. SEGURIDAD DE LOS DATOS

9. COOKIES Y TECNOLOGÍAS SIMILARES

10. USO POR MENORES

11. MODIFICACIONES DE LA POLÍTICA

12.RESPONSABLE DE DATOS
    - Denuncia DNPDP: https://www.argentina.gob.ar/jefatura/defensaconsumidor
    - Email de contacto: [EMAIL_DPO]

13. DATOS DEL RESPONSABLE
    - Razón Social: [RAZON_SOCIAL]
    - CUIT: [CUIT]
    - Domicilio: [DOMICILIO_LEGAL]
    - Email: [EMAIL_CONTACTO]
    - Teléfono: [TELEFONO_CONTACTO]
```

### 5.3 Cláusulas Legales Obligatorias

#### Garantía de 6 meses (Ley 24.240)

```text
GARANTÍA LEGAL

Todos los productos comercializados por [RAZON_SOCIAL] cuentan con garantía legal de 
seis (6) meses согласно lo établi por el Artículo 40 de la Ley 24.240 de Defensa 
del Consumidor.

La garantía cubre defectos de fabricación y funcionamiento del producto. 
No aplica para daños causados por uso inadecuado, manipulação no autorizada 
o condiciones climáticas extremas.

Para hacerla efectiva, el consumidor debe presentar:
1. Factura de compra
2. Producto en su empaque original
3. No presentar daños por mal uso

Plazo de resolución: hasta 30 días hábiles.
```

#### Política de Envío

```text
POLÍTICA DE ENVÍO

- Tiempo estimado: [DIAS_ENTREGA] días hábiles desde la confirmación de pago
- Costo: Según zona geográfica (ver en checkout)
- Seguimiento: Se envía número de tracking por email
- Zonas de entrega: Solo Argentina

Envíos gratis a partir de $[MONTO_ENVIO_GRATIS] (solo [ZONA_ENVIO]).
```

#### Uso de Datos Personales

```text
USO DE DATOS PERSONALES

Los datos proporcionados serán tratados conformente a la Ley 25.326 de Protección 
de Datos Personales.

Finalidad: Prestar el servicio solicitado, comunicación comercial, mejora de servicios.

El titular puede ejercer sus derechos de acceso, rectificación, supresión y oposición 
enviando un email a [EMAIL_CONTACTO] o dirigiéndose a nuestro domicilio en 
[DOMICILIO_LEGAL].

Al registrarse, usted acepta recibir comunicaciones comerciales. Puede desuscribirse 
en cualquier momento.
```

---

## 6. INTEGRACIÓN DE PAGOS Y FACTURACIÓN

### 6.1 Variables de Entorno (.env.example)

```bash
# ============================================
# PASARELAS DE PAGO
# ============================================

# MercadoPago
MP_ACCESS_TOKEN=[COMPLETAR_LUEGO]
MP_PUBLIC_KEY=[COMPLETAR_LUEGO]
MP_CLIENT_ID=[COMPLETAR_LUEGO]
MP_CLIENT_SECRET=[COMPLETAR_LUEGO]

# Para producción
MP_ENVIRONMENT=production
MP_NOTIFICATION_URL=[URL_WEBHOOK_MP]

# ============================================
# FACTURACIÓN ELECTRÓNICA
# ============================================

# AFIP/ARCA - Facturación electrónica
AFIP_CUIT=[CUIT]
AFIP_CERT_PATH=./certs/certificado.p12
AFIP_CERT_PASSWORD=[COMPLETAR_LUEGO]
AFIP_ENVIRONMENT=production

# Para desarrollo/testing
# AFIP_ENVIRONMENT=testing

# ============================================
# EMAIL - SMTP
# ============================================

SMTP_HOST=[SMTP_HOST]
SMTP_PORT=[SMTP_PORT]
SMTP_USER=[COMPLETAR_LUEGO]
SMTP_PASS=[COMPLETAR_LUEGO]
SMTP_FROM=[EMAIL_NO_REPLY]
SMTP_FROM_NAME=[RAZON_SOCIAL]

# ============================================
# BASE DE DATOS
# ============================================

DATABASE_URL="[COMPLETAR_LUEGO]"

# ============================================
# API & APP
# ============================================

# URL de producción
NEXT_PUBLIC_API_URL=[URL_API_PRODUCCION]
API_URL=[URL_API_PRODUCCION]

# URLs permitidas para CORS
ALLOWED_ORIGINS=[URL_WEB_PRODUCCION],[URL_ADMIN]
```

### 6.2 Configuración de API - Pasarela de Pago

```javascript
// lib/payment.js

// Configuración de Mercadopago
export const mpConfig = {
  access_token: process.env.MP_ACCESS_TOKEN,
  public_key: process.env.MP_PUBLIC_KEY,
  environment: process.env.MP_ENVIRONMENT || 'sandbox',
  
  // URLs de webhook
  webhookUrl: process.env.MP_NOTIFICATION_URL,
  
  // Preferencias de pago
  preferenceConfig: {
    external_reference: 'PEDIDO-[ORDER_ID]',
    binary_mode: true, // El pago termina en el sitio de Mpago
    installments: 1,
    notification_url: process.env.MP_NOTIFICATION_URL
  }
};

// Función para crear preferencia de pago
export async function createPaymentPreference(orderId, amount, items, buyer) {
  const mercadopago = await import('mercadopago');
  
  const preference = {
    items: items.map(item => ({
      title: item.name,
      description: item.description,
      quantity: item.quantity,
      unit_price: item.price,
      currency_id: 'ARS'
    })),
    payer: {
      email: buyer.email,
      name: buyer.name,
      surname: buyer.lastname
    },
    external_reference: `GP-${orderId}`,
    notification_url: `${process.env.MP_NOTIFICATION_URL}?source_news=webhooks`,
    statement_descriptor: '[RAZON_SOCIAL]'
  };
  
  return preference;
}
```

### 6.3 Configuración de Facturación AFIP

```typescript
// lib/facturacion.ts

import { Afip } from '@Afip/afip-app';

const afipConfig = {
  CUIT: parseInt(process.env.AFIP_CUIT.replace('-', '')),
  cert: process.env.AFIP_CERT_PATH,
  key: process.env.AFIP_CERT_KEY,
  environment: process.env.AFIP_ENVIRONMENT || 'production'
};

export async function emitirFactura(data: {
  tipo: '001' | '011' | '201' | '211', // 001=Factura A, 011=Nota Débito A, etc.
  puntoVenta: number,
  documento: string,
  nombre: string,
 email?: string,
  items: Array<{
    codigo: string,
    descripcion: string,
    cantidad: number,
    bonif: number,
    precio: number,
    iva: number
  }>,
  importeTotal: number,
  medioPago?: string
}) {
  
  // Obtener último comprobante
  const ultimo = await afip.FECompUltimoGet({
    PtoVta: data.puntoVenta,
    CmpTipo: data.tipo
  });
  
  const numeroComprobante = ultimo.CbteNro + 1;
  
  // Crear comprobante
  const result = await afip.FECAESolicitar({
    FeCabReq: {
      CantReg: 1,
      PtoVta: data.puntoVenta,
      CbteTipo: data.tipo
    },
    FeDetReq: [{
      Concepto: 1, // 1=Productos, 2=Servicios, 3=Ambos
      DocTipo: data.documento === 'CUIT' ? '80' : '96', // 80=CUIT, 96=DNI
      DocNro: data.documento,
      CbteDesde: numeroComprobante,
      CbteHasta: numeroComprobante,
      CbteFch: new Date().toISOString().slice(0, 10).replace(/-/g, ''),
      ImpTotal: data.importeTotal,
      ImpIVA: data.items.reduce((sum, item) => sum + (item.cantidad * item.precio * item.iva / 100), 0),
     ImpNeto: data.items.reduce((sum, item) => sum + (item.cantidad * item.precio), 0),
      Iva: data.items.filter(i => i.iva > 0).map(i => ({
        Id: 5, // 5=21%, 4=10.5%, 3=27% (según tabla)
        BaseImp: i.cantidad * i.precio,
        Importe: i.cantidad * i.precio * i.iva / 100
      })),
      MonId: 'PES',
      MonCotiz: 1
    }]
  });
  
  return result;
}
```

---

## 7. ANEXO: Modelo de Datos Completos

### 7.1 Schema Prisma Completo

```prisma
// schema.prisma

model User {
  id            String    @id @default(cuid())
  email         String    @unique
  password     String
  name         String?
  lastname     String?
  phone        String?
  documento    String?
  tipoDoc      String?   // CUIT, CUIL, DNI
  role         String    @default("USER")
  emailVerified DateTime?
  aceptarTyC   Boolean   @default(false)
  aceptarPrivacidad Boolean @default(false)
  
  orders       Order[]
  favoritos   Favorite[]
  direcciones Address[]
  
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt
}

model Order {
  id            String       @id @default(cuid())
  userId        String?
  user          User?        @relation(fields: [userId], references: [id])
  numero        String       @unique // GP-2025-XXXXX
  status        String       @default("PENDIENTE") // PENDIENTE, PAGANDO, PAGADO, ENVIADO, ENTREGADO, CANCELADO
  
  items         Json         // Array de items
  
  subtotal      Float
  descuento     Float        @default(0)
  envio         Float        @default(0)
  total         Float
  
  medioPago     String?
  transactionId String?
  
  // Datos de envío
  nombreEnvio   String
  apellidoEnvio String
  dniEnvio      String
  telefonoEnvio String
  direccionEnvio String
  ciudadEnvio   String
  provinciaEnvio String
  cpEnvio       String
  referencias  String?
  
  // Facturación
  facturado     Boolean      @default(false)
  tipoDoc       String?      // FACTURA A/B/C, etc.
  cae           String?
  vtoCae        DateTime?
  
  createdAt     DateTime     @default(now())
  updatedAt     DateTime     @updatedAt
}

model Arrepentimiento {
  id          String    @id @default(cuid())
  ordenId     String
  orden       Order     @relation(fields: [ordenId], references: [id])
  email       String
  telefono    String?
  motivo      String?
  estado      String    @default("PENDIENTE") // PENDIENTE, APROBADO, RECHAZADO, COMPLETADO
  tramite     String?
  evidenciaUrl String?
  
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
}

model DataFiscal {
  id          String    @id @default(cuid())
  rut         String    @unique
  razonSocial String
  domicilio   String
  cuit        String
  iconoUrl    String?
  activo      Boolean   @default(true)
  
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
}
```

---

## 8. CHECKLIST DE IMPLEMENTACIÓN

| Tarea | Estado | Prioridad |
|-------|--------|-----------|
| Crear tabla Arrepentimiento en BD | ❌ | Alta |
| Crear endpoint `/api/arrepentimiento` | ❌ | Alta |
| Agregar modal de arrepentimiento al Frontend | ❌ | Alta |
| Insertar Data Fiscal Script de ARCA | ❌ | Alta |
| Crear/política de privacidad página | ❌ | Media |
| Crear/política de términos y condiciones página | ❌ | Media |
| Agregar links legales al Footer | ❌ | Alta |
| Configurar emails SMTP | ❌ | Media |
| Configurar Pasarela de Pago (MercadoPago) | ❌ | Alta |
| Configurar Facturación Electrónica (AFIP) | ❌ | Media |
| Configurar webhook de notificaciones de pago | ❌ | Alta |

---

**Documento creado**: docs/legal-argentina.md  
**Última actualización**: Abril 2025