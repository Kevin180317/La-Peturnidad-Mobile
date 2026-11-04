-- Teléfono en formato internacional E.164 (+52XXXXXXXXXX). Debe coincidir con utils/phone.ts.
-- Solo valida perfiles nuevos o cuando cambia el teléfono; vacío o nulo se permite (editar perfil lo deja opcional).
-- Los teléfonos existentes (10 dígitos sin lada) no se tocan hasta que su dueño los edite.
create or replace function public.enforce_phone_format()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if (tg_op = 'INSERT' or new.phone is distinct from old.phone)
     and coalesce(new.phone, '') <> ''
     and new.phone !~ '^\+[1-9][0-9]{7,14}$' then
    raise exception 'El teléfono debe estar en formato internacional, por ejemplo +526641234567';
  end if;
  return new;
end;
$$;

create trigger trg_enforce_phone_format
  before insert or update of phone on public.user_profiles
  for each row execute function public.enforce_phone_format();
