-- Auto-update updated_at on maps
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger maps_updated_at
  before update on public.maps
  for each row execute function update_updated_at();
