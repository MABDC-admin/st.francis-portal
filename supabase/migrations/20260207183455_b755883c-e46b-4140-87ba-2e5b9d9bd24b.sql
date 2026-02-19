INSERT INTO public.schools (id, code, name, is_active)
VALUES (
  '33333333-3333-3333-3333-333333333333',
  'MABDC',
  'M.A Brain Development Center',
  true
)
ON CONFLICT DO NOTHING;