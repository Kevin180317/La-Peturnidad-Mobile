# Recomendador de usuarios (2026-11-07)

## Investigación
- **Instagram / LinkedIn (PYMK):** el mejor predictor de "a quién seguir" es el *cierre triádico*: contactos en común. Después, cercanía (ubicación) e intereses compartidos.
- **ML (filtrado colaborativo, embeddings de grafo tipo node2vec / LightGCN):** exige miles de usuarios con seguimientos reales y una infraestructura de entrenamiento. Hoy hay pocos usuarios reales, así que un modelo aprendería ruido. Decisión: **heurística de puntaje en SQL**, con las señales ordenadas igual que las usaría un modelo.
- Cuando haya datos reales (>10 000 seguimientos), se puede entrenar un modelo con las mismas señales como features (regresión logística o LightGBM, etiqueta = "lo siguió tras la sugerencia") y reemplazar solo el cálculo de `score`.

## Heurística implementada (`suggested_users(limit_n)`)
| Señal | Puntos |
|---|---|
| Contactos en común (a quienes sigo y lo siguen), tope 5 | 3 c/u |
| Te sigue | 2 |
| Mismo código postal | 2 |
| Misma ciudad | 1 |
| Grupos compartidos, tope 2 | 2 c/u |
| Tipo de mascota en común | 1 |
| Popularidad `ln(1 + seguidores)` | 0.5 × |

Excluye: yo, a quienes ya sigo y bloqueos en cualquier sentido. Desempate: más seguidores. Devuelve también un `reason` legible ("2 contactos en común", "Vive en tu colonia"...). Máximo 50 por llamada.

## Privacidad
`user_profiles.is_private`: sus publicaciones y mascotas solo las ven el dueño, sus seguidores y moderación (RLS vía `can_view_user`). Nombre, foto y ciudad siguen visibles (buscador y sugerencias). Seguir NO requiere aprobación.

## Datos de prueba
1000 usuarios `seedN@seed.invalid` (20 % privados, 0-3 mascotas, 5-25 seguimientos: 70 % dentro de su colonia, 30 % a perfiles populares). Para borrarlos (cascada en la base; fotos no hay):

```sql
delete from auth.users where email like '%@seed.invalid';
```
Revisar que las tablas con FK a `auth.users` tengan `on delete cascade`; si alguna no, borrar antes sus filas.
