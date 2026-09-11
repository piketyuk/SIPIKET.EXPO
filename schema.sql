-- SIPIKET.EXPO — Schema v1 (Postgres/Supabase compatible)
-- Semua data sensitif terenkripsi AES-256-GCM di aplikasi (secure.js) sebelum simpan.
-- Kolom *_enc menyimpan ciphertext base64 (iv+ct). Plaintext tidak pernah di-log.

create extension if not exists pgcrypto;

create table if not exists classes (
  code text primary key, -- 6 digit siswa / 10 guru (guru062026, rajagantng)
  name text not null,
  created_by text, -- email guru pembuat
  created_at timestamptz default now()
);

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  email_enc text, -- AES-GCM(email) untuk pencarian terenkripsi
  google_sub text unique,
  role text not null check (role in ('siswa','guru')),
  display_name_enc text, -- terenkripsi
  avatar_url_enc text,    -- terenkripsi / storage path
  picture_url_enc text,
  class_code text references classes(code),
  registered_at timestamptz default now(),
  profile_updated_at timestamptz,
  last_login_at timestamptz
);
create index if not exists idx_users_email on users(email);
create index if not exists idx_users_class on users(class_code);

create table if not exists enrollments (
  user_id uuid references users(id) on delete cascade,
  class_code text references classes(code) on delete cascade,
  role text not null check (role in ('siswa','guru')),
  joined_at timestamptz default now(),
  primary key (user_id, class_code)
);

create table if not exists regu (
  id uuid primary key default gen_random_uuid(),
  class_code text references classes(code) on delete cascade,
  name text not null, -- A/B/C
  unique(class_code, name)
);

create table if not exists tasks (
  id uuid primary key default gen_random_uuid(),
  class_code text references classes(code) on delete cascade,
  regu_id uuid references regu(id) on delete set null,
  title_enc text not null, -- terenkripsi
  created_by text not null, -- email guru
  created_at timestamptz default now()
);
create index if not exists idx_tasks_class on tasks(class_code);

-- Video bukti piket: rekam beberapa detik + keliling kelas, di dalam regu
create table if not exists videos (
  id uuid primary key default gen_random_uuid(),
  class_code text references classes(code) on delete cascade,
  regu_id uuid references regu(id) on delete set null,
  task_id uuid references tasks(id) on delete set null,
  uploader_email text not null,
  uploader_email_enc text,
  storage_path_enc text not null, -- path terenkripsi (supabase storage / r2)
  duration_seconds int check (duration_seconds between 3 and 300),
  recorded_at timestamptz default now(),
  verified_by text,
  verified_at timestamptz,
  verified boolean default false
);
create index if not exists idx_videos_class_regu on videos(class_code, regu_id);

create table if not exists feedbacks (
  id uuid primary key default gen_random_uuid(),
  email_enc text,
  nama_enc text,
  kategori text,
  rating smallint check (rating between 1 and 5),
  pesan_enc text not null, -- terenkripsi
  created_at timestamptz default now()
);

-- Notifikasi 17:00 Senin-Jumat (server cron + browser Notification)
create table if not exists notifications_log (
  id uuid primary key default gen_random_uuid(),
  class_code text references classes(code),
  sent_at timestamptz default now(),
  channel text default 'browser' -- browser/email
);

-- RLS (aktifkan jika Supabase)
-- alter table users enable row level security;
-- alter table videos enable row level security;
-- ponytail: tambah RLS policy per role saat backend siap; sekarang enkripsi client-side + HSTS/no-referrer.

-- Seed contoh
insert into classes(code, name) values ('123456','IX-F'),('guru062026','Guru 062026'),('rajagantng','Guru Rajaganteng') on conflict do nothing;
