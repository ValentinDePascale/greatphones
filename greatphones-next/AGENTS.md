<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Pendiente: Google OAuth Credentials
- El cliente debe crear las credenciales en Google Cloud Console
- Configurar OAuth consent screen + authorized redirect URIs
- Reemplazar GOOGLE_CLIENT_ID y GOOGLE_CLIENT_SECRET en .env.local
- Redirect URI local: http://localhost:3000/api/auth/callback/google
- Redirect URI prod: https://greatphones.onrender.com/api/auth/callback/google
- Instrucciones para el cliente:
  1. Ir a https://console.cloud.google.com/apis/credentials
  2. Crear proyecto (o usar existente)
  3. Habilitar Google People API
  4. Configurar OAuth consent screen (modo Testing, agregar email como test user)
  5. Crear OAuth 2.0 Client ID (tipo Web application)
  6. Agregar Authorized redirect URIs (local + prod)
  7. Copiar Client ID y Client Secret y reemplazar en .env.local
