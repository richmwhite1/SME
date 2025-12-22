import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const sql = getDb();

    // Create products table
    await sql`
      CREATE TABLE IF NOT EXISTS products (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        category TEXT,
        description TEXT,
        price DECIMAL(10, 2)
      )
    `;

    // Create profiles table for ReputationListener
    // Note: If profiles table already exists with 'id' column, this will create a separate table
    // For ReputationListener, we ensure the table has user_id and score columns
    await sql`
      CREATE TABLE IF NOT EXISTS profiles (
        user_id TEXT PRIMARY KEY,
        score INTEGER DEFAULT 0
      )
    `;

    // If profiles table already exists with different structure, add missing columns
    await sql`
      DO $$
      BEGIN
        -- Add user_id column if it doesn't exist (in case table uses 'id' instead)
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'profiles' AND column_name = 'user_id'
        ) THEN
          -- Check if 'id' column exists - if so, we can use it as user_id
          IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'profiles' AND column_name = 'id'
          ) THEN
            -- Add user_id as a copy of id, or create a view/function to map them
            ALTER TABLE profiles ADD COLUMN IF NOT EXISTS user_id TEXT;
            -- Copy id to user_id if user_id is null
            UPDATE profiles SET user_id = id WHERE user_id IS NULL AND id IS NOT NULL;
          ELSE
            -- No id column, add user_id
            ALTER TABLE profiles ADD COLUMN user_id TEXT;
          END IF;
        END IF;

        -- Add score column if it doesn't exist
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'profiles' AND column_name = 'score'
        ) THEN
          ALTER TABLE profiles ADD COLUMN score INTEGER DEFAULT 0;
          -- If contributor_score exists, copy its value to score
          IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'profiles' AND column_name = 'contributor_score'
          ) THEN
            UPDATE profiles SET score = COALESCE(contributor_score, 0);
          END IF;
        END IF;
      END $$;
    `;

    // Create notifications table
    await sql`
      CREATE TABLE IF NOT EXISTS notifications (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id TEXT NOT NULL,
        message TEXT NOT NULL,
        target_type TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `;

    // Create indexes for better performance
    await sql`
      CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id)
    `;

    await sql`
      CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC)
    `;

    return NextResponse.json({
      success: true,
      message: 'Database tables created successfully',
      tables: {
        products: 'Created with id (uuid), name (text), category (text), description (text), price (decimal)',
        profiles: 'Created/updated with user_id (text, primary key) and score (integer)',
        notifications: 'Created with id (uuid), user_id (text), message (text), target_type (text)'
      }
    });
  } catch (error) {
    console.error('Database setup error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        message: 'Failed to create database tables'
      },
      { status: 500 }
    );
  }
}

