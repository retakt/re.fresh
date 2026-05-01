-- Drop existing policies
drop policy if exists "Anyone can submit a request" on public.access_requests;
drop policy if exists "Authenticated users can view requests" on public.access_requests;

-- Anon users can ONLY insert (submit a request)
create policy "Anon can submit requests"
  on public.access_requests
  for insert
  to anon
  with check (true);

-- Authenticated users (admins) can read all requests
create policy "Authenticated can view requests"
  on public.access_requests
  for select
  to authenticated
  using (true)

-- Authenticated users (admins) can update status (reject) and delete
create policy "Authenticated can update requests"
  on public.access_requests
  for update
  to authenticated
  using (true);

create policy "Authenticated can delete requests"
  on public.access_requests
  for delete
  to authenticated
  using (true);
