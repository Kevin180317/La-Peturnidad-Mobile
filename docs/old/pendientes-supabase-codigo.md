# La Peturnidad — Pendientes: Supabase + Código

> Proyecto Expo + Supabase.
> Estado actual: Supabase Auth + DB + Storage + Edge Functions. Express/MySQL es legacy, no usar.

---

## 1. Supabase — Base de datos (tablas faltantes)

Las tablas referenciadas en el código **no existen** en `public`. Hay que crearlas:

### 1.1 `user_profiles`

```sql
create table user_profiles (
  id        bigint generated always as identity primary key,
  user_id   uuid references auth.users(id) on delete cascade not null unique,
  first_name text not null,
  last_name  text not null,
  phone      text,
  birth_date date,
  address    text,
  city       text default 'Tijuana',
  postal_code text,
  profile_picture_url text,
  push_token text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```

**RLS necesaria:**
```sql
alter table user_profiles enable row level security;
create policy "Usuarios ven su propio perfil"
  on user_profiles for select using (auth.uid() = user_id);
create policy "Usuarios editan su propio perfil"
  on user_profiles for update using (auth.uid() = user_id);
create policy "Insert durante registro"
  on user_profiles for insert with check (auth.uid() = user_id);
```

### 1.2 `pets`

```sql
create table pets (
  id        bigint generated always as identity primary key,
  user_id   uuid references auth.users(id) on delete cascade not null,
  name      text not null,
  type      text not null check (type in ('perro', 'gato')),
  color     text not null,
  size      text not null check (size in ('pequeño', 'mediano', 'grande')),
  features  text,
  image_url text,
  created_at timestamptz default now()
);
```

**RLS:**
```sql
alter table pets enable row level security;
create policy "Usuarios ven sus mascotas"
  on pets for select using (auth.uid() = user_id);
create policy "Usuarios crean mascotas"
  on pets for insert with check (auth.uid() = user_id);
create policy "Usuarios eliminan sus mascotas"
  on pets for delete using (auth.uid() = user_id);
```

### 1.3 `emergency_alerts`

```sql
create table emergency_alerts (
  id             bigint generated always as identity primary key,
  user_id        uuid references auth.users(id) on delete cascade not null,
  pet_name       text not null,
  type           text,
  description    text,
  last_seen_location text,
  disappearance_date date,
  image_url      text,
  created_at     timestamptz default now()
);
```

**RLS:**
```sql
alter table emergency_alerts enable row level security;
create policy "Todos leen alertas"
  on emergency_alerts for select using (true);
create policy "Usuarios crean sus alertas"
  on emergency_alerts for insert with check (auth.uid() = user_id);
create policy "Dueño elimina su alerta"
  on emergency_alerts for delete using (auth.uid() = user_id);
```

### 1.4 `found_pets`

```sql
create table found_pets (
  id        bigint generated always as identity primary key,
  pet_id    bigint references emergency_alerts(id) on delete cascade not null,
  user_id   uuid references auth.users(id) on delete cascade not null,
  created_at timestamptz default now()
);
```

**RLS:**
```sql
alter table found_pets enable row level security;
create policy "Usuarios ven found_pets"
  on found_pets for select using (true);
create policy "Usuarios reportan encontradas"
  on found_pets for insert with check (auth.uid() = user_id);
```

### 1.5 Storage buckets

| Bucket | Uso | Visibilidad |
|---|---|---|
| `pet-images` | Fotos de mascotas | Público |
| `profile-pictures` | Fotos de perfil | Público |
| `public` | Fallback (código legacy) | Público |
| `alternate` | Fallback (código legacy) | Público |

**RLS para storage:**
```sql
create policy "Lectura pública"
  on storage.objects for select using (bucket_id in ('pet-images','profile-pictures','public','alternate'));
create policy "Usuarios autenticados suben"
  on storage.objects for insert with check (auth.role() = 'authenticated');
```

---

## 2. Supabase — Edge Function faltante

El código en `services/alerts.service.ts` llama a:
```
${SUPABASE_URL}/functions/v1/send-emergency-notification
```

Esta función **no existe**. Debe crearse para notificar a vecinos cuando se reporta una mascota perdida:

```ts
// supabase/functions/send-emergency-notification/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

serve(async (req) => {
  const { pet_name, type, last_seen_location } = await req.json();

  // 1. Buscar vecinos en la misma colonia (same last_seen_location)
  // 2. Obtener sus push tokens desde user_profiles
  // 3. Enviar Expo Push Notifications
  // 4. Return ok

  return new Response(JSON.stringify({ ok: true }), {
    headers: { "Content-Type": "application/json" },
  });
});
```

---

## 3. Código — Services que referencian Supabase y están listos

Estos servicios ya apuntan a Supabase correctamente. Solo falta que las tablas existan:

| Service | Archivo | Tabla/Endpoint |
|---|---|---|
| Auth | `services/auth.service.ts` | Supabase Auth (`signIn`, `signUp`, `resetPassword`) |
| Profile | `services/profile.service.ts` | `user_profiles` |
| Pets | `services/pets.service.ts` | `pets` |
| Alerts | `services/alerts.service.ts` | `emergency_alerts` + Edge Function |
| Dashboard | `services/dashboard.service.ts` | Varias tablas + Storage |
| Storage | `services/storage.service.ts` | Supabase Storage |
| Supabase client | `utils/supabase.ts` | Cliente configurado con anon key |

**Problema detectado:** El archivo `.env.local` tiene dos keys. `supabase.ts` usa `EXPO_PUBLIC_SUPABASE_KEY` (publishable), `dashboard.service.ts` usa `EXPO_PUBLIC_SUPABASE_ANON_KEY` (anon JWT). **Unificar:** usar solo la anon key en todos lados y eliminar la publishable si no se necesita.

---

## 4. Código — Features faltantes

> Prioridades marcadas según impacto en la visión de "red social de mascotas perdidas".

### 🔴 Alta prioridad

| Feature | Archivos afectados | Lo que implica |
|---|---|---|
| **Feed social / timeline** | Nuevo: `app/feed.tsx`, `services/feed.service.ts` | Timeline cronológico de actividad (alertas, avistamientos, reuniones) |
| **Comentarios en publicaciones** | Nuevo: `services/comments.service.ts` + tabla `comments` | Comentarios anidados en alertas y publicaciones |
| **Perfiles públicos de usuario** | Modificar: `components/dashboard/ProfileTab.tsx` | Hacer que los perfiles sean visitables desde alertas, con datos públicos |
| **Editar mascota** | Modificar: `app/dashboard.tsx` (handleEditPet) | Endpoint PATCH en Supabase + formulario precargado |
| **Mapa interactivo** | Nuevo: pantalla + componente mapa | React Native Maps o Webview con Leaflet |

### 🟡 Media prioridad

| Feature | Lo que implica |
|---|---|
| **Seguimiento (follow)** | Nueva tabla `follows`, servicio, botón en perfiles |
| **Mensajería directa** | Chat integrado, tabla `messages`, notificaciones |
| **Grupos por colonia** | Tabla `groups`, `group_members`, feed filtrado |
| **Notificaciones sociales** | Centro de notificaciones con tipología variada |
| **Login Google/Apple** | Configurar proveedores en Supabase Auth |
| **Configuración de notificaciones** | Pantalla de preferencias (radio, tipo) |
| **Avisos / Comunidad (Flujo E)** | Tabla `posts` o `announcements` |

### 🟢 Baja prioridad

| Feature | Lo que implica |
|---|---|
| **Matching automático** | Algoritmo de comparación de atributos |
| **Muro de reuniones exitosas** | Sección pública con historias |
| **Roles de usuario** | Sistema de autorización por niveles |
| **Datos enriquecidos de mascota** | Raza, microchip, vacunas, etc. |
| **Moderación y seguridad** | Reportes, bloqueos, verificación |

---

## 5. Problemas de Arquitectura a resolver

| # | Problema | Solución recomendada |
|---|---|---|
| 1 | **Config keys inconsistentes** — `EXPO_PUBLIC_SUPABASE_KEY` vs `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Usar solo la anon key JWT en todos los servicios, eliminar la publishable |
| 2 | **Sin migraciones** — No hay migraciones de Supabase versionadas | Crear migración inicial con `supabase migration new init` |
| 3 | **Fallback buckets** (`public`, `alternate`) en storage service | Limpiar los fallbacks cuando se estabilicen los buckets principales |
| 4 | **Sin RLS en alertas de lectura** — `select usando true` es correcto por ahora pero monitorear | Agregar rate limiting o geofencing a futuro |

---

## 6. Checklist de Implementación

### Fase 1 — Base sólida (hacer ahora)
- [ ] Crear tabla `user_profiles` en Supabase + RLS
- [ ] Crear tabla `pets` en Supabase + RLS
- [ ] Crear tabla `emergency_alerts` en Supabase + RLS
- [ ] Crear tabla `found_pets` en Supabase + RLS
- [ ] Crear storage buckets (`pet-images`, `profile-pictures`) + RLS
- [ ] Desplegar Edge Function `send-emergency-notification`
- [ ] Unificar keys de entorno (usar solo anon key)

### Fase 2 — Lo que ya existía en el flowchart original
- [ ] Mapa interactivo (Flujo B)
- [ ] Editar mascota (Flujo C.2)
- [ ] Login social Google/Apple
- [ ] Configuración de notificaciones
- [ ] Avisos / Comunidad (Flujo E)

### Fase 3 — Red social
- [ ] Feed social / timeline
- [ ] Comentarios y reacciones
- [ ] Perfiles públicos
- [ ] Sistema de follow
- [ ] Mensajería directa

### Fase 4 — Diferenciación
- [ ] Matching automático lost & found
- [ ] Grupos por colonia
- [ ] Roles de usuario
- [ ] Muro de reuniones exitosas
- [ ] Moderación y reportes

---

*Documento generado desde el análisis del código fuente de La Peturnidad (Expo) y el estado actual del proyecto Supabase `owtcrciujfdlcuopimof`.*
