-- FightFit Database Setup
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor > New Query)

-- Workouts table
CREATE TABLE workouts (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL,
    exercises JSONB NOT NULL DEFAULT '[]',
    notes TEXT DEFAULT '',
    date TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Combat sessions table
CREATE TABLE combat_sessions (
    id TEXT PRIMARY KEY,
    discipline TEXT NOT NULL,
    session_type TEXT NOT NULL,
    duration INTEGER DEFAULT 0,
    intensity INTEGER DEFAULT 3,
    notes TEXT DEFAULT '',
    date TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Goals table
CREATE TABLE goals (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    target NUMERIC DEFAULT 0,
    unit TEXT DEFAULT '',
    current NUMERIC DEFAULT 0,
    deadline DATE,
    completed BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security (allow all for now since no auth)
ALTER TABLE workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE combat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;

-- Allow public read/write access (no auth setup yet)
CREATE POLICY "Allow all access to workouts" ON workouts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to combat_sessions" ON combat_sessions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to goals" ON goals FOR ALL USING (true) WITH CHECK (true);
