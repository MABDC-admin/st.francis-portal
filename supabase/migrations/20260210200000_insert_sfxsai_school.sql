-- Insert SFXSAI school if not exists
INSERT INTO public.schools (id, code, name, is_active, address)
VALUES (
  '11111111-1111-1111-1111-111111111111',
  'SFXSAI',
  'St. Francis Xavier Smart Academy Inc',
  true,
  'Capas, Tarlac'
)
ON CONFLICT (code) DO NOTHING;
