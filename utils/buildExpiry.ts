// shortcut: compara con el reloj del dispositivo (cambiar la hora lo evade); si importa, validar contra el servidor.
// Sin EXPO_PUBLIC_BUILD_EXPIRES (development/production) o con fecha inválida, nunca vence.
export function isBuildExpired(
  expires: string | undefined = process.env.EXPO_PUBLIC_BUILD_EXPIRES,
  now: number = Date.now(),
): boolean {
  if (!expires) return false;
  const ms = Date.parse(expires);
  return !Number.isNaN(ms) && now > ms;
}
