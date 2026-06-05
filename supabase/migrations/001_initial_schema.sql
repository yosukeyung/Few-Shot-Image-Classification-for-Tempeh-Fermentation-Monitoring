-- Profiles table (extends Supabase auth.users)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  institution TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, institution)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'fullName', 'Researcher'),
    COALESCE(NEW.raw_user_meta_data->>'institution', 'Computational Biology Institute')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Classification history
CREATE TABLE classifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  specimen_id TEXT NOT NULL,
  prediction TEXT NOT NULL,
  confidence FLOAT NOT NULL,
  confidences JSONB NOT NULL,
  image_url TEXT,
  processing_time FLOAT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE classifications ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Classifications Policies
CREATE POLICY "Users can view own classifications"
  ON classifications FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own classifications"
  ON classifications FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own classifications"
  ON classifications FOR DELETE USING (auth.uid() = user_id);

-- Storage bucket is created through Supabase UI, but policies are here:
-- Note: Replace 'specimens' with actual bucket name
CREATE POLICY "Users can upload specimens"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'specimens' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Public can view specimens"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'specimens');
