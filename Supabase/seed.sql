-- Sample data: 10 members + attendance across 5 meetings (incl. today).

insert into public.members (id, name, phone, email, course, created_at) values
  ('f47ac10b-58cc-4372-a567-0e02b2c3d401', 'Chidi Okafor',  '+2348031110001', 'chidi.okafor@example.com',  'Computer Science',       now() - interval '62 days'),
  ('f47ac10b-58cc-4372-a567-0e02b2c3d402', 'Amina Bello',   '+2348031110002', 'amina.bello@example.com',   'Law',                    now() - interval '55 days'),
  ('f47ac10b-58cc-4372-a567-0e02b2c3d403', 'Tunde Adeyemi', '+2348031110003', null,                         null,                     now() - interval '48 days'),
  ('f47ac10b-58cc-4372-a567-0e02b2c3d404', 'Ngozi Eze',     '+2348031110004', 'ngozi.eze@example.com',     'Medicine',               now() - interval '41 days'),
  ('f47ac10b-58cc-4372-a567-0e02b2c3d405', 'Ibrahim Musa',  '+2348031110005', null,                         'Electrical Engineering', now() - interval '35 days'),
  ('f47ac10b-58cc-4372-a567-0e02b2c3d406', 'Funke Alade',   '+2348031110006', 'funke.alade@example.com',   'Accounting',             now() - interval '28 days'),
  ('f47ac10b-58cc-4372-a567-0e02b2c3d407', 'Emeka Nwosu',   '+2348031110007', 'emeka.nwosu@example.com',   null,                     now() - interval '24 days'),
  ('f47ac10b-58cc-4372-a567-0e02b2c3d408', 'Halima Sani',   '+2348031110008', 'halima.sani@example.com',   'Biochemistry',           now() - interval '18 days'),
  ('f47ac10b-58cc-4372-a567-0e02b2c3d409', 'Segun Adewale', '+2348031110009', null,                         null,                     now() - interval '12 days'),
  ('f47ac10b-58cc-4372-a567-0e02b2c3d410', 'Blessing Umoh', '+2348031110010', 'blessing.umoh@example.com', 'Mass Communication',     now() - interval '2 hours')
on conflict (id) do nothing;

insert into public.attendance (member_id, attendance_date, check_in_time) values
  ('f47ac10b-58cc-4372-a567-0e02b2c3d401', current_date,      now() - interval '72 minutes'),
  ('f47ac10b-58cc-4372-a567-0e02b2c3d403', current_date,      now() - interval '65 minutes'),
  ('f47ac10b-58cc-4372-a567-0e02b2c3d405', current_date,      now() - interval '51 minutes'),
  ('f47ac10b-58cc-4372-a567-0e02b2c3d407', current_date,      now() - interval '23 minutes'),
  ('f47ac10b-58cc-4372-a567-0e02b2c3d410', current_date,      now() - interval '4 minutes'),
  ('f47ac10b-58cc-4372-a567-0e02b2c3d401', current_date - 3,  current_date - 3 + interval '9 hours 5 minutes'),
  ('f47ac10b-58cc-4372-a567-0e02b2c3d402', current_date - 3,  current_date - 3 + interval '9 hours 11 minutes'),
  ('f47ac10b-58cc-4372-a567-0e02b2c3d403', current_date - 3,  current_date - 3 + interval '9 hours 14 minutes'),
  ('f47ac10b-58cc-4372-a567-0e02b2c3d405', current_date - 3,  current_date - 3 + interval '9 hours 26 minutes'),
  ('f47ac10b-58cc-4372-a567-0e02b2c3d408', current_date - 3,  current_date - 3 + interval '9 hours 38 minutes'),
  ('f47ac10b-58cc-4372-a567-0e02b2c3d409', current_date - 3,  current_date - 3 + interval '10 hours 2 minutes'),
  ('f47ac10b-58cc-4372-a567-0e02b2c3d401', current_date - 7,  current_date - 7 + interval '9 hours 2 minutes'),
  ('f47ac10b-58cc-4372-a567-0e02b2c3d402', current_date - 7,  current_date - 7 + interval '9 hours 9 minutes'),
  ('f47ac10b-58cc-4372-a567-0e02b2c3d404', current_date - 7,  current_date - 7 + interval '9 hours 17 minutes'),
  ('f47ac10b-58cc-4372-a567-0e02b2c3d405', current_date - 7,  current_date - 7 + interval '9 hours 21 minutes'),
  ('f47ac10b-58cc-4372-a567-0e02b2c3d406', current_date - 7,  current_date - 7 + interval '9 hours 33 minutes'),
  ('f47ac10b-58cc-4372-a567-0e02b2c3d407', current_date - 7,  current_date - 7 + interval '9 hours 47 minutes'),
  ('f47ac10b-58cc-4372-a567-0e02b2c3d409', current_date - 7,  current_date - 7 + interval '10 hours 5 minutes'),
  ('f47ac10b-58cc-4372-a567-0e02b2c3d401', current_date - 10, current_date - 10 + interval '9 hours 8 minutes'),
  ('f47ac10b-58cc-4372-a567-0e02b2c3d403', current_date - 10, current_date - 10 + interval '9 hours 15 minutes'),
  ('f47ac10b-58cc-4372-a567-0e02b2c3d404', current_date - 10, current_date - 10 + interval '9 hours 29 minutes'),
  ('f47ac10b-58cc-4372-a567-0e02b2c3d406', current_date - 10, current_date - 10 + interval '9 hours 41 minutes'),
  ('f47ac10b-58cc-4372-a567-0e02b2c3d408', current_date - 10, current_date - 10 + interval '9 hours 58 minutes'),
  ('f47ac10b-58cc-4372-a567-0e02b2c3d401', current_date - 14, current_date - 14 + interval '9 hours 3 minutes'),
  ('f47ac10b-58cc-4372-a567-0e02b2c3d402', current_date - 14, current_date - 14 + interval '9 hours 12 minutes'),
  ('f47ac10b-58cc-4372-a567-0e02b2c3d403', current_date - 14, current_date - 14 + interval '9 hours 19 minutes'),
  ('f47ac10b-58cc-4372-a567-0e02b2c3d404', current_date - 14, current_date - 14 + interval '9 hours 24 minutes'),
  ('f47ac10b-58cc-4372-a567-0e02b2c3d405', current_date - 14, current_date - 14 + interval '9 hours 36 minutes'),
  ('f47ac10b-58cc-4372-a567-0e02b2c3d406', current_date - 14, current_date - 14 + interval '9 hours 52 minutes')
on conflict on constraint attendance_one_per_member_per_day do nothing;
