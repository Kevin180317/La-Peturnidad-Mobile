> Borrador 2026-11-03 para `https://luckytracker.com.mx/policy`. Reemplaza el texto genérico.
> Describe lo que hace la app hoy. **No es asesoría legal: que lo revise un abogado antes de publicar.**
> Ancla requerida por Play Console: `id="eliminar-cuenta"` → `https://luckytracker.com.mx/policy#eliminar-cuenta`.
> Correo en texto plano (desactivar la ofuscación de Cloudflare). Quitar la frase de marketing y el encabezado en inglés.

## Marcadores a reemplazar

| Marcador | Qué poner |
|---|---|
| `[RESPONSABLE]` | Nombre completo o razón social del responsable |
| `[DOMICILIO]` | Domicilio físico (exigido por la LFPDPPP para derechos ARCO) |
| `[CORREO]` | Correo de contacto en texto plano |
| `[REGIÓN]` | País/región del proyecto Supabase (Dashboard → Settings → General) |
| `[FECHA]` | Fecha de publicación, ej. `3 de noviembre de 2026` |

Confirmar: respaldos (hoy no hay, plan free), qué recibe Expo, y añadir proveedores nuevos (Sentry, analítica) en la sección 5.

---

# POLÍTICA DE PRIVACIDAD — Lucky Tracker

Última actualización: `[FECHA]`

## 1. Responsable
`[RESPONSABLE]`, con domicilio en `[DOMICILIO]`, es responsable del tratamiento de tus datos personales conforme a la Ley Federal de Protección de Datos Personales en Posesión de los Particulares (LFPDPPP). Contacto: `[CORREO]`.

## 2. Datos que recopilamos
Al usar la aplicación Lucky Tracker recopilamos:

- **Cuenta:** correo electrónico y contraseña (la contraseña se guarda cifrada; no podemos verla).
- **Perfil:** nombre, apellido, teléfono, fecha de nacimiento, dirección (calle, colonia, ciudad y código postal) y foto de perfil.
- **Mascotas:** nombre, especie, raza, tamaño, descripción y fotos.
- **Contenido que publicas:** publicaciones, comentarios, anuncios, historias de éxito, grupos y sus fotos.
- **Mensajes:** conversaciones privadas y de grupo.
- **Alertas:** alertas de mascota perdida (mascota, última ubicación vista, fotos) y reportes de mascota encontrada (fotos, ubicación, nota y datos de contacto que elijas compartir).
- **Seguridad y moderación:** usuarios que bloqueas y reportes que envías o recibes.
- **Notificaciones:** token del dispositivo para enviarte avisos y tus preferencias de notificación.
- **Técnicos:** datos básicos de la sesión necesarios para que la app funcione.

No recopilamos tu ubicación GPS: la app no solicita permiso de ubicación. Tu zona se basa en la colonia que escribes en tu perfil.

## 3. Para qué usamos tus datos
- Crear y administrar tu cuenta y tu perfil.
- Mostrar tu nombre, foto y ciudad a otros usuarios.
- **Alertas a vecinos:** cuando alguien publica una alerta de mascota perdida, enviamos una notificación a los usuarios cuya colonia coincide exactamente con la de la alerta. Para eso comparamos las colonias; **tu dirección completa no se muestra a otros usuarios**.
- Permitir que quien encontró una mascota y su dueño se pongan en contacto.
- Mensajería, comentarios, grupos y publicaciones.
- Moderación: atender reportes, retirar contenido y suspender cuentas que incumplan los Términos.
- Enviar notificaciones push, avisos en la bandeja de la app y correos de acceso (confirmación, recuperación de contraseña).

No usamos tus datos para publicidad ni los vendemos.

## 4. Qué ven otros usuarios
- **Siempre (cualquier usuario con sesión):** tu nombre, foto de perfil y ciudad, junto con el contenido que publiques.
- **Teléfono:** solo se comparte en dos casos: (a) si publicas una alerta de mascota perdida, los usuarios de tu misma colonia pueden ver tu nombre y llamarte; (b) si reportas una mascota encontrada, el dueño de la alerta recibe el contacto que compartiste.
- **Dirección y fecha de nacimiento:** no son visibles para otros usuarios. Solo el personal de moderación puede consultarlos cuando es necesario para atender un reporte.
- **Mensajes:** solo los ven las personas de la conversación.

## 5. Proveedores que procesan datos por nuestra cuenta
Usamos estos servicios para operar la aplicación. Reciben únicamente los datos necesarios para su función:

| Proveedor | Para qué | Datos |
|---|---|---|
| Supabase | Base de datos, autenticación y almacenamiento de archivos (servidores en `[REGIÓN]`) | Todos los datos de la sección 2 |
| Google Firebase Cloud Messaging | Notificaciones push | Token del dispositivo y el texto de la notificación |
| Resend | Envío de correos de acceso | Correo electrónico y contenido del mensaje |
| Expo | Compilación de la app | Sin datos personales de usuarios, salvo diagnósticos técnicos de la app |

Estos proveedores pueden almacenar o procesar datos fuera de México. No vendemos tus datos. Solo los transferimos a autoridades cuando una ley o una orden judicial lo exija.

## 6. Conservación
- Conservamos tus datos mientras tu cuenta esté activa.
- Al eliminar tu cuenta se borran tus datos (ver sección 7). Los archivos y datos se eliminan de forma inmediata en nuestros sistemas.
- No mantenemos copias de respaldo de los datos de usuarios. `[Confirmar si se activa plan con respaldos y ajustar este punto]`
- Los reportes de moderación en los que aparezcas como persona reportada se eliminan junto con tu cuenta.

## 7. Cómo eliminar tu cuenta <a id="eliminar-cuenta"></a>
Desde la app: **Perfil → Eliminar cuenta** y confirma. También puedes escribir a `[CORREO]` desde el correo de tu cuenta.

Al eliminar tu cuenta se borra de forma permanente:
- Tu perfil, foto de perfil, preferencias y tokens de notificación.
- Tus mascotas, publicaciones, anuncios, historias, comentarios, alertas y reportes de mascota encontrada.
- Tus mensajes, tus conversaciones privadas, tus seguidores/seguidos y tus bloqueos.
- Los grupos que creaste y los comentarios de otras personas en tus publicaciones.
- Todos tus archivos (fotos) almacenados.

No se puede deshacer.

## 8. Derechos ARCO
Tienes derecho a **Acceder** a tus datos, **Rectificarlos**, **Cancelarlos** u **Oponerte** a su tratamiento. Puedes editar la mayoría de tus datos desde Perfil → Editar perfil, eliminar tu cuenta desde la app o enviar tu solicitud a `[CORREO]` indicando tu nombre, correo de la cuenta y qué derecho ejerces. Responderemos en un máximo de 20 días hábiles. Domicilio para solicitudes: `[DOMICILIO]`.

## 9. Menores de edad
La aplicación está dirigida a personas de 18 años o más. Si detectamos una cuenta de una persona menor, la eliminaremos.

## 10. Seguridad
Usamos conexiones cifradas (HTTPS), contraseñas cifradas y control de acceso por usuario en la base de datos para que cada persona solo consulte la información que le corresponde. Ningún sistema es 100 % seguro: si ocurre una vulneración que te afecte, te lo notificaremos.

## 11. Cambios a esta política
Si cambiamos esta política, publicaremos la nueva versión aquí con su fecha y, si el cambio es importante, te avisaremos dentro de la app.

## 12. Contacto
`[CORREO]` — `[DOMICILIO]`
