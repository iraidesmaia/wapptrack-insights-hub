
-- Criar bucket para logos da empresa
insert into storage.buckets (id, name, public)
values ('company-logos', 'company-logos', true);

-- Política para permitir upload de logos
create policy "Users can upload company logos"
on storage.objects for insert
with check (bucket_id = 'company-logos');

-- Política para permitir visualização pública de logos
create policy "Company logos are publicly accessible"
on storage.objects for select
using (bucket_id = 'company-logos');

-- Política para permitir atualização de logos
create policy "Users can update company logos"
on storage.objects for update
using (bucket_id = 'company-logos');

-- Política para permitir exclusão de logos
create policy "Users can delete company logos"
on storage.objects for delete
using (bucket_id = 'company-logos');
