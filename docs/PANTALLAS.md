# PANTALLAS.md — Documentación de pantallas y eventos

> Lucky Tracker (antes "La Peturnidad") · App comunitaria para encontrar mascotas perdidas

Documentación de **todas las pantallas** de la app: qué hace cada una y **qué evento dispara cada interacción del usuario**.

---

## Índice de pantallas

| Pantalla | Ruta | Propósito |
|---|---|---|
| Onboarding | `/` | Bienvenida (3 pasos) + entrada automática según sesión |
| Iniciar Sesión | `/login` | Acceso con email y contraseña |
| Registro | `/register` | Crear cuenta nueva |
| Completar Perfil | `/register-extended` | Datos personales + colonia |
| Verificar Código | `/verify-otp` | Verificar el código OTP de 8 dígitos |
| Recuperar Contraseña | `/forgot-password` | Solicitar el envío del código |
| Nueva Contraseña | `/reset-password` | Definir la contraseña nueva |
| Confirmar Email | `/email-confirmacion` | Confirmar el email de la cuenta |
| Dashboard | `/dashboard` | Pantalla principal con 5 secciones |
| Buscar | `/buscar` | Buscador de mascotas, grupos y usuarios |
| Comunidad | `/comunidad` | Muro de avisos comunitarios |
| Reuniones Exitosas | `/historias` | Historias de reencuentro de mascotas |
| Grupos | `/grupos` | Listado de grupos de colonia |
| Detalle de Grupo | `/grupos/[id]` | Detalle del grupo + chat grupal |
| Mensajes | `/mensajes` | Lista de conversaciones |
| Chat | `/mensajes/[id]` | Hilo de mensajes (individual o grupal) |
| Seguidores | `/seguidores` | Listas de seguidores y siguiendo |
| Perfil | `/perfil/[id]` | Perfil público de un usuario |
| Panel de Moderación | `/panel-moderacion` | Gestión de reportes (solo admin/moderador) |
| Notificaciones | `/notificaciones` | Preferencias de notificaciones |
| Editar Perfil | `/editar-perfil` | Editar datos personales |
| No Encontrada | — | Pantalla 404 |

---

## Flujo global de navegación y sesión

- **Entrada automática**: al abrir la app (Onboarding o Iniciar Sesión) se revisa si hay una sesión activa:
  - Sin sesión → se muestra la bienvenida o el formulario de acceso.
  - Sesión con email sin confirmar → Confirmar Email.
  - Sesión confirmada con perfil → Dashboard.
  - Sesión confirmada sin perfil → Completar Perfil.
- **Protección de pantallas**: las demás pantallas comprueban la sesión al abrirse; si no hay usuario, devuelven al inicio.
- **Avisos**: las acciones muestran un aviso temporal (éxito/error). Las acciones destructivas (borrar, eliminar, cerrar sesión) piden confirmación primero.

---

## Pantallas de registro e inicio de sesión

### 1. Onboarding — Ruta `/`

**Qué hace**: Carrusel de bienvenida de 3 pasos ("Reporta", "Conecta", "Actúa") que además decide a dónde entra el usuario según su sesión.

**Al abrirse**:
- Revisa la sesión activa y redirige según el estado (Confirmar Email / Dashboard / Completar Perfil).
- Sin sesión, lee el registro "bienvenida ya vista": si existe, va a Iniciar Sesión; si no, muestra el carrusel.

**Eventos del usuario**:
| Evento | Qué se dispara |
|---|---|
| Botón "Saltar" / "Comenzar" (último paso) | Guarda "bienvenida vista" y va a Iniciar Sesión |
| Botón "Siguiente" | Avanza al siguiente paso; en el último, finaliza la bienvenida |
| Deslizar el carrusel | Cambia el indicador de paso |

---

### 2. Iniciar Sesión — Ruta `/login`

**Qué hace**: Formulario de acceso con email y contraseña. Si ya existe sesión, entra automáticamente.

**Eventos del usuario**:
| Evento | Qué se dispara |
|---|---|
| Botón "Iniciar sesión" | Valida los campos → intenta iniciar sesión. Éxito: sin email confirmado va a Confirmar Email; con perfil avisa "¡Bienvenido!" y entra al Dashboard; sin perfil solicita Completar Perfil. Error: aviso |
| "¿Olvidaste tu contraseña?" | Va a Recuperar Contraseña |
| "Regístrate" | Va a Registro |

---

### 3. Registro — Ruta `/register`

**Qué hace**: Crea la cuenta con email, contraseña y confirmación de contraseña.

**Eventos del usuario**:
| Evento | Qué se dispara |
|---|---|
| Botón "Registrarse" | Valida los campos, la coincidencia de contraseñas y un mínimo de 6 caracteres → crea la cuenta. Éxito: avisa "Confirmá tu email" y va a Confirmar Email |

---

### 4. Completar Perfil — Ruta `/register-extended`

**Qué hace**: Registrar nombre, apellido, teléfono, fecha de nacimiento, código postal y seleccionar la colonia (Tijuana).

**Eventos del usuario**:
| Evento | Qué se dispara |
|---|---|
| Escribir el código postal | Solo números (máximo 5); al completar los 5, busca las colonias con ese código; si no hay, avisa "Código no encontrado" |
| Escribir la fecha | Se formatea en vivo como día/mes/año |
| Botón "Completar perfil" | Valida los campos → guarda el perfil. Éxito: aviso de bienvenida y entrada al Dashboard |
| "Omitir por ahora" | Vuelve al inicio |

---

### 5. Verificar Código — Ruta `/verify-otp`

**Qué hace**: Pide el código de 8 dígitos enviado por email para recuperar la contraseña. Se verifica automáticamente al completar los 8 dígitos.

**Eventos del usuario**:
| Evento | Qué se dispara |
|---|---|
| Escribir el código (8 dígitos) | Verificación automática |
| Botón "Verificar código" | Comprueba el código. Éxito: avisa y va a Nueva Contraseña. Error: "Código incorrecto" |
| "Reenviar código" | Envía de nuevo el código por email |

---

### 6. Recuperar Contraseña — Ruta `/forgot-password`

**Qué hace**: Solicitar el envío del código OTP al email.

**Eventos del usuario**:
| Evento | Qué se dispara |
|---|---|
| Botón "Enviar código" | Valida el email → envía el código. Éxito: avisa "Revisa tu bandeja" y va a Verificar Código |

---

### 7. Nueva Contraseña — Ruta `/reset-password`

**Qué hace**: Definir la contraseña nueva tras verificar el código.

**Eventos del usuario**:
| Evento | Qué se dispara |
|---|---|
| Botón "Actualizar contraseña" | Valida campos y coincidencia → guarda la contraseña. Éxito: avisa "Ya puedes iniciar sesión" y vuelve al inicio |

---

### 8. Confirmar Email — Ruta `/email-confirmacion`

**Qué hace**: Pide confirmar el email desde el enlace del correo y permite reenviarlo. Muestra el email de la cuenta.

**Eventos del usuario**:
| Evento | Qué se dispara |
|---|---|
| Botón "Reenviar email" | Vuelve a enviar el correo de confirmación |
| "Volver al inicio" | Regresa al inicio |

---

## Dashboard (pantalla principal)

### 9. Dashboard — Ruta `/dashboard`

**Qué hace**: Pantalla principal con barra inferior de 5 secciones: Feed, Inicio, Comunidad, Emergencia y Perfil. Centraliza mascotas, alertas, avisos, publicaciones, comentarios y perfil.

**Qué sucede internamente**:
- Carga perfil, mascotas, contadores de seguidores/siguiendo y mensajes no leídos.
- Registra el dispositivo para recibir notificaciones.
- Al abrir las secciones Comunidad o Feed, carga sus contenidos.
- Tirar hacia abajo recarga todo (pull-to-refresh).

**Eventos del usuario**:
| Evento | Qué se dispara |
|---|---|
| Botón lupa | Abre el Buscador |
| Registrar mascota | Crea la mascota (valida datos). Éxito: aviso y recarga |
| Editar mascota | Actualiza la mascota |
| Eliminar mascota | Confirmación → borra y recarga |
| Crear alerta de emergencia | Comprueba la dirección y confirma → publica la alerta **y notifica a los vecinos** |
| Eliminar alerta | Confirmación → elimina y recarga |
| "Lo encontré" | Reporta la mascota como encontrada y elimina su alerta |
| Publicar post | Crea la publicación y recarga |
| Borrar post | Elimina la publicación |
| Comentar | Guarda el comentario |
| Publicar aviso | Crea el aviso de comunidad con su categoría |
| Borrar aviso | Elimina el aviso |
| Cerrar sesión | Modal de confirmación → cierra sesión y vuelve al inicio |

---

### 10. Barra de secciones

**Qué hace**: Barra fija inferior con las 5 secciones (Feed, Inicio, Comunidad, Emergencia, Perfil).

**Eventos**: tocar una sección → la muestra en el Dashboard.

---

### 11. Sección Inicio

**Qué hace**: Saludo y fecha, tarjetas de resumen (Mascotas / Alertas / Encontradas), acceso al Buscador y las herramientas de mascotas.

**Eventos del usuario**:
| Evento | Qué se dispara |
|---|---|
| Botón lupa | Abre el Buscador |
| "Registrar mascota" | Abre el formulario de mascota |
| Ver / Ocultar mascotas | Muestra u oculta la lista (y recarga) |
| Tocar una mascota | Abre su ficha en una ventana |
| Guardar el formulario | Registra o actualiza la mascota según el modo |
| "Editar" en la ficha | Abre el formulario con los datos de la mascota |
| "Eliminar" en la ficha | Pide confirmación para eliminar |

---

### 12. Sección Emergencia

**Qué hace**: Cuadrícula 2×2 de acciones: Reportar mascota perdida, Ver perdidas, Mis alertas y Mascotas encontradas; además el selector de mascota y los listados.

**Eventos del usuario**:
| Evento | Qué se dispara |
|---|---|
| "Reportar perdida" | Muestra las mascotas para elegir |
| "Ver perdidas" | Carga y muestra las alertas de la colonia |
| "Mis alertas" | Carga las alertas propias |
| "Mascotas encontradas" | Muestra las reportadas como encontradas por mí |
| Elegir una mascota | Confirmación → publica la alerta con notificación a los demás |
| "Lo encontré" | Reporta como encontrada y elimina la alerta |
| "Eliminar alerta" | Confirma y elimina |
| "Registrar mascota" (si no hay) | Va a la sección Inicio |

---

### 13. Sección Feed

**Qué hace**: Publicaciones de la comunidad con sub-secciones "Feed" y "Mis posts", formulario de publicación y comentarios.

**Eventos del usuario**:
| Evento | Qué se dispara |
|---|---|
| "Publicar" (encabezado) | Abre el formulario |
| Sub-secciones Feed / Mis posts | Alterna la lista mostrada |
| "Publicar" del formulario | Publica y limpia el texto |
| Tocar una publicación | Abre el apartado de comentarios |
| Tocar el autor | Abre su Perfil |
| Papelera (post propio) | Elimina el post |
| Enviar un comentario | Lo publica |

---

### 14. Sección Comunidad

**Qué hace**: Avisos comunitarios con sub-secciones "Comunidad" y "Mis avisos", categorías (general, aviso, evento, pregunta) y comentarios.

**Eventos del usuario**:
| Evento | Qué se dispara |
|---|---|
| "Nuevo" | Abre el formulario en una ventana |
| Sub-secciones | Alterna la lista |
| Tocar el autor | Abre su Perfil |
| Papelera (aviso propio) | Elimina el aviso |
| "Comentar" / "Ocultar" | Muestra u oculta los comentarios |
| Elegir categoría | Selecciona la categoría del aviso |
| "Publicar" | Valida título y contenido → publica y cierra la ventana |

---

### 15. Formulario de Mascota

**Qué hace**: Registrar o editar una mascota: tipo (perro/gato), nombre, tamaño, características y foto.

**Eventos del usuario**:
| Evento | Qué se dispara |
|---|---|
| Elegir perro / gato | Define el tipo |
| "Seleccionar" (foto) | Abre el selector de imagen |
| "Subir" (foto) | Guarda la imagen |
| "Registrar" / "Actualizar" | Guarda la mascota según el modo |
| "Cancelar" | Cierra sin guardar |

---

### 16. Ficha de Mascota (ventana)

**Qué muestra**: Foto, tipo, color, tamaño, características y fecha de registro de la mascota.

**Eventos del usuario**:
| Evento | Qué se dispara |
|---|---|
| "Editar" | Abre el formulario con los datos |
| "Eliminar" | Pide confirmación para borrar |
| "Cerrar" | Cierra la ventana |

---

### 17. Carga del Dashboard

**Qué muestra**: esqueleto animado mientras carga el Dashboard. Sin interacciones.

---

## Pantallas sociales y de gestión

### 18. Buscar — Ruta `/buscar`

**Qué hace**: Buscador global con 3 pestañas (Mascotas, Grupos, Usuarios). Busca tras una pausa en la escritura (0.3 s).

**Eventos del usuario**:
| Evento | Qué se dispara |
|---|---|
| Escribir en la barra | Busca tras la pausa, según la pestaña activa |
| "x" | Limpia la búsqueda |
| Pestañas | Cambia el tipo de búsqueda |
| Tocar una mascota o usuario | Abre el Perfil del dueño |
| Tocar un grupo | Abre el Detalle del grupo |

---

### 19. Comunidad — Ruta `/comunidad`

**Qué hace**: Muro de avisos comunitarios con categorías; creación y borrado. Recarga al volver a la pantalla.

**Eventos del usuario**:
| Evento | Qué se dispara |
|---|---|
| "Nuevo" | Abre el formulario |
| Papelera (aviso propio) | Confirma y elimina |
| "Publicar" | Publica el aviso |
| Tirar para refrescar | Recarga el muro |

---

### 20. Reuniones Exitosas — Ruta `/historias`

**Qué hace**: Historias de reencuentro de mascotas; el autor puede crearlas y borrarlas.

**Eventos del usuario**:
| Evento | Qué se dispara |
|---|---|
| "Nueva" | Abre el formulario |
| Papelera (historia propia) | Confirma y elimina |
| "Publicar" | Guarda la historia |
| Tirar para refrescar | Recarga |

---

### 21. Grupos — Ruta `/grupos`

**Qué hace**: Lista de grupos con número de miembros y botón de unirse/salir; creación y borrado.

**Eventos del usuario**:
| Evento | Qué se dispara |
|---|---|
| "Crear" | Abre el formulario (nombre y descripción) |
| "Crear" en la ventana | Crea el grupo |
| Presión larga en un grupo creado por mí | Confirma y elimina el grupo |
| "Unirse" / "Salir" | Entra o abandona y recarga |
| Tocar el grupo | Abre su Detalle |
| Tirar para refrescar | Recarga |

---

### 22. Detalle de Grupo — Ruta `/grupos/[id]`

**Qué hace**: Información del grupo, lista de miembros (foto, nombre, sello "Admin") y chat grupal. Solo el creador puede eliminarlo.

**Eventos del usuario**:
| Evento | Qué se dispara |
|---|---|
| "Chat grupal" | Abre la conversación del grupo (la crea si no existe) |
| "Eliminar grupo" (solo el creador) | Confirma → elimina y vuelve a Grupos |
| Tocar un miembro | Abre su Perfil |

---

### 23. Mensajes — Ruta `/mensajes`

**Qué hace**: Lista de conversaciones (individuales y de grupo) con el último mensaje, aviso de no leídos y borrado.

**Eventos del usuario**:
| Evento | Qué se dispara |
|---|---|
| Tocar una conversación | Abre el Chat |
| Presión larga en una conversación | Confirma y elimina la conversación |
| Tirar para refrescar | Recarga |

---

### 24. Chat — Ruta `/mensajes/[id]`

**Qué hace**: Hilo de mensajes (individual o grupal) con nombres visibles en grupos; marca los mensajes como leídos y se desplaza al final automáticamente.

**Eventos del usuario**:
| Evento | Qué se dispara |
|---|---|
| Escribir un mensaje | Se envía con el botón de enviar |
| Botón enviar | Valida y envía; el mensaje aparece sin recargar |

---

### 25. Seguidores — Ruta `/seguidores`

**Qué hace**: Listas de seguidores y de siguiendo de un usuario.

**Eventos del usuario**:
| Evento | Qué se dispara |
|---|---|
| Pestañas "Seguidores" / "Siguiendo" | Cambia la lista |
| Tocar un usuario | Abre su Perfil |

---

### 26. Perfil — Ruta `/perfil/[id]`

**Qué hace**: Perfil público de un usuario: foto, datos, sello de rol (admin/moderador), contadores (mascotas, seguidores, siguiendo), botones Seguir/Mensaje y sus mascotas.

**Eventos del usuario**:
| Evento | Qué se dispara |
|---|---|
| "Editar perfil" (perfil propio) | Abre Editar Perfil |
| "Seguir" / "Siguiendo" (perfil ajeno) | Empieza o deja de seguir y actualiza el botón |
| "Mensaje" | Abre la conversación con el usuario (la crea si no existe) |
| Contadores de seguidores/siguiendo | Abre Seguidores en esa lista |

---

### 27. Panel de Moderación — Ruta `/panel-moderacion`

**Qué hace**: Lista de reportes; solo para moderadores y administradores (el resto no puede entrar).

**Eventos del usuario**:
| Evento | Qué se dispara |
|---|---|
| "Revisado" | Marca el reporte como revisado y recarga |
| "Descartar" | Marca el reporte como descartado y recarga |

---

### 28. Notificaciones — Ruta `/notificaciones`

**Qué hace**: Preferencias de avisos: interruptor principal y 3 tipos (mascota perdida, mascotas encontradas, avisos comunitarios). Los secundarios se desactivan si el principal está apagado.

**Eventos del usuario**:
| Evento | Qué se dispara |
|---|---|
| Cambiar los interruptores | Actualiza la selección |
| "Guardar preferencias" | Guarda y avisa |
| "Volver" | Regresa atrás |

---

### 29. Editar Perfil — Ruta `/editar-perfil`

**Qué hace**: Formulario con los datos ya cargados (nombre, apellido, teléfono, dirección, ciudad, código postal).

**Eventos del usuario**:
| Evento | Qué se dispara |
|---|---|
| "Guardar cambios" | Valida, guarda, avisa y regresa atrás |
| "Cancelar" | Regresa sin guardar |

---

### 30. No encontrada

**Qué muestra**: "esta pantalla no existe" y un enlace al inicio.

---

## Observaciones generales

- Los datos se refrescan al volver a una pantalla (foco) o con tirar hacia abajo; no se mantiene un canal en vivo con el servidor.
- La única conexión "en vivo" son las notificaciones: tocarlas abre la pantalla correspondiente (por ejemplo, una alerta de emergencia).