-- ============================================================
-- PROPUESTA DE SEGURIDAD (RLS) PARA SISTEMA-HOTEL  —  NO SE APLICA SOLA
-- Probar primero en una rama/proyecto de prueba de Supabase.
-- Ejecutar por bloques en SQL Editor y verificar la app tras cada uno.
-- ============================================================

-- PASO 0 · AUDITORÍA (solo lectura): ¿qué tablas tienen RLS y qué políticas existen?
select c.relname as tabla, c.relrowsecurity as rls_activo
from pg_class c join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relkind = 'r' order by 1;

select tablename, policyname, cmd, roles, qual, with_check
from pg_policies where schemaname = 'public' order by tablename, policyname;

-- PASO 1 · Función que devuelve el rol del usuario autenticado
-- (misma lógica que AuthContext: email completo o sin '@mihotel.com').
create or replace function public.rol_actual() returns text
language sql stable security definer set search_path = public as $$
  select lower(trim(rol)) from public.usuarios
  where email = (auth.jwt() ->> 'email')
     or email = replace(auth.jwt() ->> 'email', '@mihotel.com', '')
  limit 1
$$;

-- PASO 2 · Base: solo usuarios autenticados Y registrados en la tabla usuarios
-- (repetir por cada tabla; si ya tienes políticas, revísalas antes de duplicar).
do $$
declare t text;
begin
  foreach t in array array['hospedajes','habitaciones','turnos','reservas','cochera','productos',
    'pagos','limpieza','clientes','tipos_limpieza','movimientos_stock','categorias_producto',
    'movimientos_caja','consumos','huesped_hospedaje'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists acceso_personal on public.%I', t);
    execute format($p$create policy acceso_personal on public.%I for all to authenticated
      using (public.rol_actual() is not null) with check (public.rol_actual() is not null)$p$, t);
  end loop;
end $$;

-- PASO 3 · Tablas solo-admin (coinciden con las rutas del frontend)
alter table public.usuarios enable row level security;
drop policy if exists usuarios_leer on public.usuarios;
drop policy if exists usuarios_admin on public.usuarios;
create policy usuarios_leer on public.usuarios for select to authenticated using (true); -- el login lee su perfil
create policy usuarios_admin on public.usuarios for all to authenticated
  using (public.rol_actual() = 'administrador') with check (public.rol_actual() = 'administrador');

alter table public.auditoria enable row level security;
drop policy if exists auditoria_insertar on public.auditoria;
drop policy if exists auditoria_leer on public.auditoria;
create policy auditoria_insertar on public.auditoria for insert to authenticated
  with check (public.rol_actual() is not null);
create policy auditoria_leer on public.auditoria for select to authenticated
  using (public.rol_actual() = 'administrador');

-- PASO 4 · Verificación: entra con cada rol (limpieza, recepcionista, administrador)
-- y recorre su flujo diario. Si algo falla, desactiva la política del paso con
--   drop policy <nombre> on public.<tabla>;
-- NOTA: 'usuarios_leer' deja leer la tabla a cualquier autenticado (necesario para el login
-- actual por email); endurecerlo requiere cambiar AuthContext.
