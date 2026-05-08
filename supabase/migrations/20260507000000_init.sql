-- Enable UUID generation
create extension if not exists "pgcrypto";

-- Profiles (linked to auth.users)
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  webauthn_credentials jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

-- Auto-create profile on user signup
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into profiles (id) values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- Patients
create table patients (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  birth_date date,
  care_level text not null default 'standard',
  created_by uuid not null references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Rounds
create table rounds (
  id uuid primary key default gen_random_uuid(),
  date date not null default current_date,
  caregiver_id uuid not null references profiles(id),
  -- Denormalized array for offline sync simplicity; referential integrity enforced at application layer
  patient_ids uuid[] not null default '{}'
);

-- Observations
create table observations (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references patients(id) on delete cascade,
  caregiver_id uuid not null references profiles(id),
  recorded_at timestamptz not null default now(),
  sleep text check (sleep in ('rested', 'agitated', 'insomnia')),
  appetite text check (appetite in ('normal', 'low', 'refused')),
  pain smallint check (pain between 1 and 5),
  mood text check (mood in ('stable', 'confused', 'anxious')),
  note_text text,
  note_audio_url text,
  status_color text not null default 'green'
    check (status_color in ('green', 'orange', 'red')),
  updated_at timestamptz not null default now()
);

-- WebAuthn challenges (short-lived, 5min TTL enforced in Edge Functions)
create table webauthn_challenges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  challenge text not null,
  created_at timestamptz not null default now()
);

-- RLS
alter table profiles enable row level security;
alter table patients enable row level security;
alter table rounds enable row level security;
alter table observations enable row level security;
alter table webauthn_challenges enable row level security;

-- Profiles: users manage their own row
create policy "own profile" on profiles
  for all using (auth.uid() = id);

-- Patients: authenticated users can read; creator can write
create policy "authenticated read patients" on patients
  for select using (auth.role() = 'authenticated');
create policy "creator write patients" on patients
  for insert with check (auth.uid() = created_by);
create policy "creator update patients" on patients
  for update using (auth.uid() = created_by);

-- Rounds: user sees and manages own rounds
create policy "own rounds" on rounds
  for all using (auth.uid() = caregiver_id);

-- Observations: user manages own observations
create policy "own observations" on observations
  for all using (auth.uid() = caregiver_id);

-- WebAuthn challenges: service role only (Edge Functions use service role key)
create policy "service role challenges" on webauthn_challenges
  for all using (false);
