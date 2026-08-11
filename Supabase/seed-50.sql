-- 50-member sample data. Clears existing members/attendance first.
-- Run AFTER schema.sql. Safe to re-run.

truncate table public.attendance, public.members;

insert into public.members (id, name, phone, email, course, created_at) values
  ('f47ac10b-58cc-4372-a567-0e02b2c3d401', 'Adaeze Okonkwo',   '+2348031110001', 'adaeze.okonkwo@example.com',   'Computer Science',   now() - interval '92 days'),
  ('f47ac10b-58cc-4372-a567-0e02b2c3d402', 'Bolanle Adebayo',  '+2348031110002', 'bolanle.adebayo@example.com',  'Law',                now() - interval '90 days'),
  ('f47ac10b-58cc-4372-a567-0e02b2c3d403', 'Chukwuemeka Eze',  '+2348031110003', 'chukwuemeka.eze@example.com',  'Engineering',        now() - interval '88 days'),
  ('f47ac10b-58cc-4372-a567-0e02b2c3d404', 'Damilare Ogunleye','+2348031110004', 'damilare.ogunleye@example.com', null,                 now() - interval '85 days'),
  ('f47ac10b-58cc-4372-a567-0e02b2c3d405', 'Eseoghene Efe',    '+2348031110005', 'eseoghene.efe@example.com',    'Medicine',           now() - interval '83 days'),
  ('f47ac10b-58cc-4372-a567-0e02b2c3d406', 'Fatima Abdullahi', '+2348031110006', 'fatima.abdullahi@example.com', 'Accounting',         now() - interval '80 days'),
  ('f47ac10b-58cc-4372-a567-0e02b2c3d407', 'Gabriel Oladele',  '+2348031110007', 'gabriel.oladele@example.com',  'Computer Science',   now() - interval '78 days'),
  ('f47ac10b-58cc-4372-a567-0e02b2c3d408', 'Hadiza Mohammed',  '+2348031110008', 'hadiza.mohammed@example.com',  'Law',                now() - interval '76 days'),
  ('f47ac10b-58cc-4372-a567-0e02b2c3d409', 'Ikenna Nwachukwu', '+2348031110009', 'ikenna.nwachukwu@example.com', 'Engineering',        now() - interval '74 days'),
  ('f47ac10b-58cc-4372-a567-0e02b2c3d410', 'Jumoke Balogun',   '+2348031110010', 'jumoke.balogun@example.com',   'Mass Communication', now() - interval '71 days'),
  ('f47ac10b-58cc-4372-a567-0e02b2c3d411', 'Kelechi Okeke',    '+2348031110011', 'kelechi.okeke@example.com',    'Computer Science',   now() - interval '69 days'),
  ('f47ac10b-58cc-4372-a567-0e02b2c3d412', 'Lolade Ajayi',     '+2348031110012', 'lolade.ajayi@example.com',     null,                 now() - interval '67 days'),
  ('f47ac10b-58cc-4372-a567-0e02b2c3d413', 'Miriam Danjuma',   '+2348031110013', 'miriam.danjuma@example.com',   'Biochemistry',       now() - interval '65 days'),
  ('f47ac10b-58cc-4372-a567-0e02b2c3d414', 'Nnamdi Uzoma',     '+2348031110014', 'nnamdi.uzoma@example.com',     'Engineering',        now() - interval '62 days'),
  ('f47ac10b-58cc-4372-a567-0e02b2c3d415', 'Omolara Adeyemi',  '+2348031110015', 'omolara.adeyemi@example.com',  'Law',                now() - interval '60 days'),
  ('f47ac10b-58cc-4372-a567-0e02b2c3d416', 'Peter Anyanwu',    '+2348031110016', 'peter.anyanwu@example.com',    'Computer Science',   now() - interval '58 days'),
  ('f47ac10b-58cc-4372-a567-0e02b2c3d417', 'Queensley Egbuna', '+2348031110017', 'queensley.egbuna@example.com', 'Medicine',           now() - interval '55 days'),
  ('f47ac10b-58cc-4372-a567-0e02b2c3d418', 'Rasheedat Lawal',  '+2348031110018', 'rasheedat.lawal@example.com',  'Accounting',         now() - interval '53 days'),
  ('f47ac10b-58cc-4372-a567-0e02b2c3d419', 'Samuel Adekunle',  '+2348031110019', 'samuel.adekunle@example.com',  'Engineering',        now() - interval '51 days'),
  ('f47ac10b-58cc-4372-a567-0e02b2c3d420', 'Titiola Bakare',   '+2348031110020', 'titiola.bakare@example.com',   'Mass Communication', now() - interval '49 days'),
  ('f47ac10b-58cc-4372-a567-0e02b2c3d421', 'Uche Nwankwo',     '+2348031110021', 'uche.nwankwo@example.com',     'Computer Science',   now() - interval '46 days'),
  ('f47ac10b-58cc-4372-a567-0e02b2c3d422', 'Vanessa Igwe',     '+2348031110022', 'vanessa.igwe@example.com',     'Law',                now() - interval '44 days'),
  ('f47ac10b-58cc-4372-a567-0e02b2c3d423', 'Wale Fashola',     '+2348031110023', 'wale.fashola@example.com',     null,                 now() - interval '42 days'),
  ('f47ac10b-58cc-4372-a567-0e02b2c3d424', 'Xaveria Okoro',    '+2348031110024', 'xaveria.okoro@example.com',    'Medicine',           now() - interval '40 days'),
  ('f47ac10b-58cc-4372-a567-0e02b2c3d425', 'Yusuf Garba',      '+2348031110025', 'yusuf.garba@example.com',      'Engineering',        now() - interval '38 days'),
  ('f47ac10b-58cc-4372-a567-0e02b2c3d426', 'Zainab Suleiman',  '+2348031110026', 'zainab.suleiman@example.com',  'Accounting',         now() - interval '36 days'),
  ('f47ac10b-58cc-4372-a567-0e02b2c3d427', 'Abiodun Olatunji', '+2348031110027', 'abiodun.olatunji@example.com', 'Computer Science',   now() - interval '33 days'),
  ('f47ac10b-58cc-4372-a567-0e02b2c3d428', 'Chioma Agu',       '+2348031110028', 'chioma.agu@example.com',       'Law',                now() - interval '31 days'),
  ('f47ac10b-58cc-4372-a567-0e02b2c3d429', 'David Okon',       '+2348031110029', 'david.okon@example.com',       'Engineering',        now() - interval '29 days'),
  ('f47ac10b-58cc-4372-a567-0e02b2c3d430', 'Efe Esiri',        '+2348031110030', 'efe.esiri@example.com',        'Biochemistry',       now() - interval '27 days'),
  ('f47ac10b-58cc-4372-a567-0e02b2c3d431', 'Funmilayo Ransome','+2348031110031', 'funmilayo.ransome@example.com','Medicine',           now() - interval '25 days'),
  ('f47ac10b-58cc-4372-a567-0e02b2c3d432', 'Godwin Obi',       '+2348031110032', 'godwin.obi@example.com',       'Computer Science',   now() - interval '23 days'),
  ('f47ac10b-58cc-4372-a567-0e02b2c3d433', 'Hauwa Bello',      '+2348031110033', 'hauwa.bello@example.com',      'Law',                now() - interval '21 days'),
  ('f47ac10b-58cc-4372-a567-0e02b2c3d434', 'Ibrahim Danladi',  '+2348031110034', 'ibrahim.danladi@example.com',  'Engineering',        now() - interval '19 days'),
  ('f47ac10b-58cc-4372-a567-0e02b2c3d435', 'Joy Ekpo',         '+2348031110035', 'joy.ekpo@example.com',         'Accounting',         now() - interval '17 days'),
  ('f47ac10b-58cc-4372-a567-0e02b2c3d436', 'Kunle Awosika',    '+2348031110036', 'kunle.awosika@example.com',    'Computer Science',   now() - interval '15 days'),
  ('f47ac10b-58cc-4372-a567-0e02b2c3d437', 'Love Okafor',      '+2348031110037', 'love.okafor@example.com',      'Mass Communication', now() - interval '13 days'),
  ('f47ac10b-58cc-4372-a567-0e02b2c3d438', 'Maryam Yusuf',     '+2348031110038', 'maryam.yusuf@example.com',     'Medicine',           now() - interval '11 days'),
  ('f47ac10b-58cc-4372-a567-0e02b2c3d439', 'Ndubisi Kanu',     '+2348031110039', 'ndubisi.kanu@example.com',     null,                 now() - interval '9 days'),
  ('f47ac10b-58cc-4372-a567-0e02b2c3d440', 'Oluwaseun Ade',    '+2348031110040', 'oluwaseun.ade@example.com',    'Engineering',        now() - interval '8 days'),
  ('f47ac10b-58cc-4372-a567-0e02b2c3d441', 'Patience Effiong', '+2348031110041', 'patience.effiong@example.com', 'Law',                now() - interval '7 days'),
  ('f47ac10b-58cc-4372-a567-0e02b2c3d442', 'Quadri Ayinde',    '+2348031110042', 'quadri.ayinde@example.com',    'Computer Science',   now() - interval '6 days'),
  ('f47ac10b-58cc-4372-a567-0e02b2c3d443', 'Rebecca Mba',      '+2348031110043', 'rebecca.mba@example.com',      'Accounting',         now() - interval '5 days'),
  ('f47ac10b-58cc-4372-a567-0e02b2c3d444', 'Solomon Tar',      '+2348031110044', 'solomon.tar@example.com',      'Engineering',        now() - interval '4 days'),
  ('f47ac10b-58cc-4372-a567-0e02b2c3d445', 'Tara Nwosu',       '+2348031110045', 'tara.nwosu@example.com',       'Biochemistry',       now() - interval '3 days'),
  ('f47ac10b-58cc-4372-a567-0e02b2c3d446', 'Udo Bassey',       '+2348031110046', 'udo.bassey@example.com',       'Law',                now() - interval '2 days'),
  ('f47ac10b-58cc-4372-a567-0e02b2c3d447', 'Vivian Chukwu',    '+2348031110047', 'vivian.chukwu@example.com',    'Medicine',           now() - interval '1 day'),
  ('f47ac10b-58cc-4372-a567-0e02b2c3d448', 'Yakubu Musa',      '+2348031110048', 'yakubu.musa@example.com',      'Computer Science',   now() - interval '1 day'),
  ('f47ac10b-58cc-4372-a567-0e02b2c3d449', 'Yetunde Alao',     '+2348031110049', 'yetunde.alao@example.com',     'Mass Communication', now() - interval '3 hours'),
  ('f47ac10b-58cc-4372-a567-0e02b2c3d450', 'Zion Eze',         '+2348031110050', 'zion.eze@example.com',         'Engineering',        now() - interval '2 hours');

-- Today: 30 attended, 20 missed
insert into public.attendance (member_id, attendance_date, check_in_time)
select m.id, current_date, current_date + interval '9 hours' + (m.rn * 3 || ' minutes')::interval
from (
  select id, row_number() over (order by phone) as rn
  from public.members
  where right(phone, 2)::int in (1,2,3,5,6,8,9,11,12,14,15,17,19,20,22,23,25,26,28,30,31,33,35,36,38,40,42,44,47,50)
) m
on conflict on constraint attendance_one_per_member_per_day do nothing;

-- 3 days ago: 26 attended
insert into public.attendance (member_id, attendance_date, check_in_time)
select m.id, current_date - 3, current_date - 3 + interval '9 hours' + (m.rn * 4 || ' minutes')::interval
from (
  select id, row_number() over (order by phone) as rn
  from public.members
  where right(phone, 2)::int in (1,3,4,6,7,9,10,12,14,16,18,19,21,23,24,26,28,29,31,33,34,37,39,42,45,48)
) m
on conflict on constraint attendance_one_per_member_per_day do nothing;

-- 7 days ago: 35 attended
insert into public.attendance (member_id, attendance_date, check_in_time)
select m.id, current_date - 7, current_date - 7 + interval '9 hours' + (m.rn * 2 || ' minutes')::interval
from (
  select id, row_number() over (order by phone) as rn
  from public.members
  where right(phone, 2)::int in (1,2,3,4,5,7,8,10,11,12,13,15,16,18,20,21,22,24,25,26,27,29,30,32,34,35,37,38,40,41,43,44,46,48,49)
) m
on conflict on constraint attendance_one_per_member_per_day do nothing;

-- 10 days ago: 24 attended
insert into public.attendance (member_id, attendance_date, check_in_time)
select m.id, current_date - 10, current_date - 10 + interval '9 hours' + (m.rn * 4 || ' minutes')::interval
from (
  select id, row_number() over (order by phone) as rn
  from public.members
  where right(phone, 2)::int in (2,4,5,7,9,11,13,15,17,19,22,24,26,27,30,32,33,36,38,41,43,45,47,50)
) m
on conflict on constraint attendance_one_per_member_per_day do nothing;

-- 14 days ago: 33 attended
insert into public.attendance (member_id, attendance_date, check_in_time)
select m.id, current_date - 14, current_date - 14 + interval '9 hours' + (m.rn * 3 || ' minutes')::interval
from (
  select id, row_number() over (order by phone) as rn
  from public.members
  where right(phone, 2)::int in (1,2,4,5,6,8,9,10,12,13,14,16,17,19,21,23,24,25,27,28,30,31,33,35,36,38,39,41,43,45,46,48,50)
) m
on conflict on constraint attendance_one_per_member_per_day do nothing;
