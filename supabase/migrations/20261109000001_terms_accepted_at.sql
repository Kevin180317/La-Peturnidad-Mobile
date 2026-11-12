-- Fecha en que la persona aceptó los Términos y la Política de Privacidad (checkbox de registro).
-- La app la manda en user_metadata al crear la cuenta y register-extended la copia al perfil.
-- Los usuarios que ya existen quedan en NULL: esa fecha no se puede reconstruir.
alter table public.user_profiles
  add column if not exists terms_accepted_at timestamptz;

-- Una vez guardada no se puede cambiar ni borrar, y no puede estar en el futuro.
create or replace function public.protect_terms_accepted_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if tg_op = 'UPDATE' and old.terms_accepted_at is not null then
    new.terms_accepted_at := old.terms_accepted_at;
  elsif new.terms_accepted_at is not null and new.terms_accepted_at > now() then
    new.terms_accepted_at := now();
  end if;
  return new;
end;
$$;

create trigger trg_protect_terms_accepted_at
  before insert or update of terms_accepted_at on public.user_profiles
  for each row execute function public.protect_terms_accepted_at();
