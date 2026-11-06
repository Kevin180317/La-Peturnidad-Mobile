-- Edad mínima 18 años (decidido 2026-11-03). Debe coincidir con MIN_AGE en utils/age.ts.
-- Al crear un perfil la fecha de nacimiento es obligatoria; al cambiarla debe ser de un adulto.
-- Los perfiles existentes no se tocan mientras no cambien su fecha.
create or replace function public.enforce_min_age()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if tg_op = 'INSERT' or new.birth_date is distinct from old.birth_date then
    if new.birth_date is null then
      raise exception 'La fecha de nacimiento es obligatoria';
    end if;
    if new.birth_date > (current_date - interval '18 years')::date then
      raise exception 'Debes ser mayor de 18 años para usar Lucky Tracker';
    end if;
  end if;
  return new;
end;
$$;

create trigger trg_enforce_min_age
  before insert or update of birth_date on public.user_profiles
  for each row execute function public.enforce_min_age();
