insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'qa-attachments',
  'qa-attachments',
  true,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
on conflict (id) do nothing;
