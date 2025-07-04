# Public Ticket Submission REST API

Este documento describe la API REST pública para el envío de tickets desde sitios web externos.

## 🌐 Endpoint Principal

```
POST /api/public-tickets
```

Esta API permite a sitios web externos enviar tickets sin autenticación previa, con nombres de empresas y service tags que pueden no existir en el sistema.

## 📋 Características

- ✅ **Sin autenticación requerida** - Acceso público total
- ✅ **CORS habilitado** - Puede ser llamado desde cualquier dominio
- ✅ **Validación automática** - Usa Zod para validar datos
- ✅ **Empresas flexibles** - Acepta nombres de empresa que no existen
- ✅ **Service tags flexibles** - Crea tags automáticamente si no existen
- ✅ **Aprobación admin** - Todos los tickets requieren aprobación
- ✅ **Respuestas estándar** - JSON con estructura consistente

## 🔧 Uso desde Sitios Web Externos

### JavaScript/Fetch

```javascript
const response = await fetch('https://tu-dominio.com/api/public-tickets', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    title: 'Sistema de punto de venta no responde',
    description: 'El sistema POS se cuelga cuando intentamos procesar pagos con tarjeta. Necesitamos solución urgente.',
    company_name: 'Restaurante El Buen Sabor',
    service_tag_names: ['POS-001', 'TERMINAL-PRINCIPAL'],
    contact_name: 'María González',
    contact_email: 'maria.gonzalez@elbuensabor.com',
    contact_phone: '+1-234-567-8901',
    priority: 'high', // opcional: low, medium, high
    source: 'web'     // opcional
  })
});

const result = await response.json();

if (result.success) {
  console.log('Ticket creado:', result.data.ticket_id);
  console.log('Empresa:', result.data.company_name);
  console.log('¿Empresa nueva?:', result.data.client_was_new);
  console.log('Service tags:', result.data.service_tags.length);
  console.log(result.data.message);
} else {
  console.error('Error:', result.error);
  console.error('Mensaje:', result.message);
  if (result.details) {
    console.error('Detalles:', result.details);
  }
}
```

### jQuery

```javascript
$.ajax({
  url: 'https://tu-dominio.com/api/public-tickets',
  method: 'POST',
  contentType: 'application/json',
  data: JSON.stringify({
    title: 'Problema con impresora',
    description: 'La impresora principal no está funcionando desde esta mañana',
    company_name: 'Oficina Central',
    service_tag_names: ['PRINTER-001'],
    contact_name: 'Juan Pérez',
    contact_email: 'juan.perez@empresa.com',
    contact_phone: '+1-555-0123'
  }),
  success: function(result) {
    if (result.success) {
      alert('Ticket enviado exitosamente. ID: ' + result.data.ticket_id);
    } else {
      alert('Error: ' + result.message);
    }
  },
  error: function(xhr, status, error) {
    alert('Error de conexión: ' + error);
  }
});
```

### Axios

```javascript
import axios from 'axios';

try {
  const response = await axios.post('https://tu-dominio.com/api/public-tickets', {
    title: 'Red lenta en sucursal',
    description: 'La conexión a internet está muy lenta, afectando las operaciones',
    company_name: 'Sucursal Norte',
    service_tag_names: ['NETWORK-001', 'ROUTER-PRINCIPAL'],
    contact_name: 'Ana López',
    contact_email: 'ana.lopez@sucursal.com',
    contact_phone: '+1-555-9876'
  });

  if (response.data.success) {
    console.log('Ticket enviado:', response.data.data);
  }
} catch (error) {
  console.error('Error:', error.response?.data || error.message);
}
```

## 📊 Estructura de Datos

### Request Body (Obligatorio)

```typescript
{
  title: string;           // Título del ticket
  description: string;     // Descripción detallada
  company_name: string;    // Nombre de la empresa (se crea si no existe)
  service_tag_names: string[]; // Array de service tags (se crean si no existen)
  contact_name: string;    // Nombre del contacto
  contact_email: string;   // Email del contacto
  contact_phone: string;   // Teléfono del contacto
  priority?: 'low' | 'medium' | 'high'; // Opcional, default: 'medium'
  source?: string;         // Opcional, default: 'web'
  photo_url?: string;      // Opcional, URL de foto adjunta
}
```

### Response - Éxito (201)

```json
{
  "success": true,
  "data": {
    "ticket_id": "12345",
    "company_name": "Restaurante El Buen Sabor",
    "client_was_new": true,
    "service_tags": [
      {
        "tag": "POS-001",
        "status": "created"
      },
      {
        "tag": "TERMINAL-PRINCIPAL", 
        "status": "existing"
      }
    ],
    "message": "Ticket created successfully and is pending admin approval"
  }
}
```

### Response - Error de Validación (400)

```json
{
  "success": false,
  "error": "Validation failed",
  "message": "Please check the submitted data and try again.",
  "details": [
    {
      "code": "invalid_type",
      "expected": "string",
      "received": "undefined",
      "path": ["title"],
      "message": "Required"
    }
  ]
}
```

### Response - Error del Servidor (500)

```json
{
  "success": false,
  "error": "Database error",
  "message": "Failed to create ticket. Please try again later.",
  "details": "Error details (only in development)"
}
```

## 🔒 Seguridad y CORS

### Headers CORS Incluidos

```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: POST, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
Access-Control-Max-Age: 86400
```

### Recomendaciones de Producción

1. **Restringir dominios**: Cambiar `Access-Control-Allow-Origin: *` por dominios específicos
2. **Rate limiting**: Implementar límites de velocidad por IP
3. **Validación adicional**: Agregar validación de honeypot para spam
4. **Logging**: Monitorear intentos de envío

## ⚡ Códigos de Estado HTTP

| Código | Descripción |
|--------|-------------|
| 200    | Preflight OPTIONS exitoso |
| 201    | Ticket creado exitosamente |
| 400    | Error de validación |
| 405    | Método no permitido (solo POST) |
| 500    | Error interno del servidor |

## 🧪 Testing

### Comando cURL

```bash
curl -X POST http://localhost:3000/api/public-tickets \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test ticket via REST API",
    "description": "Testing the REST API endpoint",
    "company_name": "Test Company",
    "service_tag_names": ["TEST-001", "API-TEST"],
    "contact_name": "Test User",
    "contact_email": "test@test.com",
    "contact_phone": "+1-555-0123"
  }'
```

### Respuesta de Prueba

```bash
# Success Response
{"success":true,"data":{"ticket_id":"12345","company_name":"Test Company","client_was_new":true,"service_tags":[{"tag":"TEST-001","status":"created"}],"message":"Ticket created successfully and is pending admin approval"}}

# Error Response (if migrations not applied)
{"success":false,"error":"relation \"ticket_id_seq\" does not exist","message":"Failed to create ticket: relation \"ticket_id_seq\" does not exist"}
```

## 📋 Estados del Proceso

### 1. ✅ Implementación Completada
- [x] Endpoint REST `/api/public-tickets`
- [x] Validación con Zod
- [x] CORS configurado
- [x] Manejo de errores
- [x] Respuestas estandarizadas
- [x] Soporte para métodos OPTIONS
- [x] Documentación completa

### 2. ⏳ Requiere Configuración
- [ ] Aplicar migración `008_public_ticket_submission.sql` en Supabase
- [ ] Configurar variables de entorno de producción
- [ ] Establecer dominios CORS específicos

### 3. 🚀 Próximos Pasos
- [ ] Interfaz de administración para aprobar tickets
- [ ] Rate limiting por IP
- [ ] Notificaciones por email
- [ ] Dashboard de métricas

## 🔧 Configuración Requerida

### Variables de Entorno

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

### Migración de Base de Datos

Aplicar el archivo de migración:
```sql
-- File: supabase/migrations/008_public_ticket_submission.sql
-- Contiene las funciones create_public_ticket, get_pending_approval_tickets, approve_public_ticket
```

## 📞 Soporte

Para cualquier pregunta sobre la integración de esta API:

1. Revisar los códigos de error en la respuesta
2. Verificar que todos los campos obligatorios estén presentes
3. Confirmar que la migración de base de datos esté aplicada
4. Revisar los logs del servidor para errores específicos

## 🎯 Ejemplo de Integración Completa

```html
<!DOCTYPE html>
<html>
<head>
    <title>Formulario de Soporte</title>
</head>
<body>
    <form id="support-form">
        <input type="text" id="title" placeholder="Título del problema" required>
        <textarea id="description" placeholder="Describe el problema" required></textarea>
        <input type="text" id="company" placeholder="Nombre de la empresa" required>
        <input type="text" id="tags" placeholder="Service tags (separados por coma)" required>
        <input type="text" id="contact_name" placeholder="Tu nombre" required>
        <input type="email" id="contact_email" placeholder="Tu email" required>
        <input type="tel" id="contact_phone" placeholder="Tu teléfono" required>
        <select id="priority">
            <option value="low">Baja</option>
            <option value="medium" selected>Media</option>
            <option value="high">Alta</option>
        </select>
        <button type="submit">Enviar Ticket</button>
    </form>

    <script>
        document.getElementById('support-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = {
                title: document.getElementById('title').value,
                description: document.getElementById('description').value,
                company_name: document.getElementById('company').value,
                service_tag_names: document.getElementById('tags').value.split(',').map(s => s.trim()),
                contact_name: document.getElementById('contact_name').value,
                contact_email: document.getElementById('contact_email').value,
                contact_phone: document.getElementById('contact_phone').value,
                priority: document.getElementById('priority').value,
                source: 'web'
            };

            try {
                const response = await fetch('https://tu-dominio.com/api/public-tickets', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData)
                });

                const result = await response.json();

                if (result.success) {
                    alert(`Ticket enviado exitosamente!\nID: ${result.data.ticket_id}\nEl ticket está pendiente de aprobación por un administrador.`);
                    document.getElementById('support-form').reset();
                } else {
                    alert(`Error: ${result.message}`);
                }
            } catch (error) {
                alert(`Error de conexión: ${error.message}`);
            }
        });
    </script>
</body>
</html>
```

---

**Nota**: Esta API está lista para uso en producción una vez aplicada la migración de base de datos correspondiente. 