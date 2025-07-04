# API Pública para Registro de Tickets

Este documento describe la implementación de una API pública para registrar tickets que requieren aprobación de un administrador.

## 📋 Resumen

Se ha implementado una API pública que permite a usuarios externos enviar tickets incluso si:
- El nombre de la empresa no existe en el sistema
- Los service tags no existen 
- Los datos son erróneos o incompletos

Todos los tickets enviados por esta API tendrán estado `pending_approval` y requerirán aprobación de un administrador.

## 🚀 Componentes Implementados

### 1. Schema de Validación (`lib/schemas.ts`)

```typescript
export const CreatePublicTicketInputSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Title is too long'),
  description: z.string().min(1, 'Description is required').max(2000, 'Description is too long'),
  priority: TicketPrioritySchema.default('medium'),
  company_name: z.string().min(1, 'Company name is required').max(255, 'Company name is too long'),
  service_tag_names: z.array(z.string().min(1).max(50)).min(1, 'At least one service tag is required'),
  contact_name: z.string().min(1, 'Contact name is required').max(100, 'Contact name is too long'),
  contact_email: z.string().email('Please enter a valid email address'),
  contact_phone: z.string().min(1, 'Phone number is required').max(20, 'Phone number is too long'),
  source: TicketSourceSchema.default('web'),
  photo_url: z.string().url('Please enter a valid URL').optional(),
});
```

### 2. Función de Base de Datos (`supabase/migrations/008_public_ticket_submission.sql`)

Funciones creadas:
- `create_public_ticket()` - Crea tickets públicos con validación flexible
- `get_pending_approval_tickets()` - Obtiene tickets pendientes de aprobación
- `approve_public_ticket()` - Aprueba o rechaza tickets públicos

### 3. Tipos de Base de Datos (`lib/database.types.ts`)

Se agregaron tipos TypeScript para las nuevas funciones:
```typescript
create_public_ticket: {
  Args: {
    p_title: string;
    p_description: string;
    p_company_name: string;
    p_service_tag_names: string[];
    p_contact_name: string;
    p_contact_email: string;
    p_contact_phone: string;
    p_priority?: string;
    p_source?: string;
    p_photo_url?: string;
  };
  Returns: Json;
};
```

### 4. Endpoints tRPC (`lib/server.ts`)

#### Endpoint Público
```typescript
// POST /api/trpc/publicTickets.create
publicTickets: {
  create: publicProcedure.input(CreatePublicTicketInputSchema).mutation(...)
}
```

#### Endpoints Protegidos (Solo Admins/Técnicos)
```typescript
// GET /api/trpc/publicTickets.getPendingApproval
getPendingApproval: protectedProcedure.query(...)

// POST /api/trpc/publicTickets.approve
approve: protectedProcedure.input(...).mutation(...)
```

## 🔧 Configuración Requerida

### 1. Aplicar Migración

**⚠️ IMPORTANTE:** Debes aplicar la migración `008_public_ticket_submission.sql` en tu base de datos Supabase.

**🔧 NOTA:** Si encuentras el error de foreign key constraint mencionado en los issues, la migración ya ha sido corregida para usar `NULL` en `reported_by` en lugar de un usuario del sistema inexistente.

**Opción A: Dashboard de Supabase**
1. Ve a tu dashboard de Supabase
2. Navega a SQL Editor
3. Copia y pega el contenido de `supabase/migrations/008_public_ticket_submission.sql`
4. Ejecuta el SQL

**Opción B: Supabase CLI** (si está configurado)
```bash
supabase db push
```

### 2. Variables de Entorno

Asegúrate de tener configuradas:
```env
NEXT_PUBLIC_SUPABASE_URL=tu_url_de_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key
```

## 📡 Uso de la API

### Crear Ticket Público

**Endpoint:** `POST /api/trpc/publicTickets.create`

**Ejemplo de uso con fetch:**
```javascript
const response = await fetch('http://localhost:3000/api/trpc/publicTickets.create?batch=1', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    "0": {
      json: {
        title: "Sistema de punto de venta no responde",
        description: "El sistema POS se cuelga cuando intentamos procesar pagos...",
        priority: "high",
        company_name: "Restaurante El Buen Sabor",
        service_tag_names: ["POS-001", "TERMINAL-PAGO", "CAJA-PRINCIPAL"],
        contact_name: "María González",
        contact_email: "maria.gonzalez@elbuensabor.com",
        contact_phone: "+1-234-567-8900",
        source: "web"
      }
    }
  })
});
```

**Respuesta exitosa:**
```json
[{
  "result": {
    "data": {
      "success": true,
      "ticket_id": "TK-000123",
      "client_id": "uuid-del-cliente",
      "company_name": "Restaurante El Buen Sabor",
      "client_was_new": true,
      "service_tags": [
        {
          "id": "ST-000001",
          "tag": "POS-001",
          "status": "created_pending_verification"
        }
      ],
      "message": "Ticket created successfully and is pending admin approval"
    }
  }
}]
```

## 🔍 Lógica de Funcionamiento

### 1. Procesamiento de Empresa
- **Si existe:** Usa la empresa existente
- **Si no existe:** Crea una empresa temporal con `address = "Pending verification - submitted via public form"`

### 2. Procesamiento de Service Tags
- **Si existe:** Asocia el service tag existente al ticket
- **Si no existe:** Crea un service tag temporal con:
  - `description = "Temporary service tag created from public submission - requires admin verification"`
  - `hardware_type = "Unknown - requires verification"`
  - `location = "Unknown - requires verification"`

### 3. Estado del Ticket
- Todos los tickets públicos se crean con estado `pending_approval`
- `reported_by` se deja como `NULL` para tickets públicos (se asignará al admin que los apruebe)

## 👨‍💼 Flujo de Aprobación de Administrador

### 1. Ver Tickets Pendientes
```javascript
// Solo para admins y técnicos
const pendingTickets = await trpc.publicTickets.getPendingApproval.query();
```

### 2. Aprobar/Rechazar Ticket
```javascript
// Solo para admins
await trpc.publicTickets.approve.mutate({
  ticket_id: "TK-000123",
  approved: true, // o false para rechazar
  rejection_reason: "Información insuficiente" // opcional, solo para rechazos
});
```

## 🧪 Testing

### Script de Prueba
Ejecuta el script de prueba incluido:
```bash
node test-public-api.js
```

### Casos de Prueba Manuales

1. **Empresa nueva + Service tags nuevos:** Todo se crea temporal
2. **Empresa existente + Service tags nuevos:** Se reutiliza empresa, se crean tags temporales
3. **Empresa existente + Service tags existentes:** Se reutiliza todo
4. **Datos inválidos:** Validación de schema rechaza la solicitud

## 🔒 Seguridad

### Permisos
- **Endpoint público:** Sin autenticación requerida
- **Endpoints de administración:** Requieren autenticación y roles específicos
- **Funciones de BD:** Tienen `SECURITY DEFINER` y validación de roles

### Validación
- Schema Zod valida todos los inputs
- Longitud máxima en campos de texto
- Formato de email válido
- Al menos un service tag requerido

## 🚨 Consideraciones

### 1. Datos Temporales
- Las empresas y service tags temporales necesitan revisión manual
- Se identifican por descriptores específicos en los campos `address` y `description`

### 2. Limpieza de Datos
- Considera implementar un proceso para limpiar datos temporales no aprovados
- Los tickets rechazados se marcan como `closed`

### 3. Notificaciones
- Considera agregar notificaciones email/SMS para:
  - Confirmación de envío al usuario
  - Alertas a administradores de tickets pendientes
  - Notificación de aprobación/rechazo

## 📈 Métricas Sugeridas

- Número de tickets públicos por día
- Tiempo promedio de aprobación
- Tasa de aprobación vs rechazo
- Empresas más frecuentes en envíos públicos
- Service tags más comunes en envíos públicos

## 🔄 Próximos Pasos

1. **Aplicar la migración** en la base de datos
2. **Probar la API** con el script incluido
3. **Crear interfaz de administración** para revisar tickets pendientes
4. **Implementar notificaciones** para el flujo de aprobación
5. **Agregar validaciones adicionales** según necesidades del negocio

---

## ✅ Estado de Implementación

- [x] Schema de validación creado
- [x] Función de base de datos implementada
- [x] Tipos TypeScript actualizados
- [x] Endpoints tRPC implementados
- [x] Script de prueba creado
- [x] Documentación completa
- [x] Migración corregida (foreign key constraint issue fixed)
- [ ] Migración aplicada en BD (pendiente manual)
- [ ] Interfaz de administración (futuro)
- [ ] Sistema de notificaciones (futuro)

## 🔧 Cambios de Schema

La migración modifica la base de datos de las siguientes maneras:

1. **`tickets.reported_by`**: Se permite `NULL` para tickets públicos
2. **Nuevas políticas RLS**: Permiten envíos anónimos con validaciones específicas
3. **Funciones nuevas**: 3 funciones PostgreSQL para manejar el flujo completo
4. **Identificación de tickets públicos**: `reported_by IS NULL` + `status = 'pending_approval'` 