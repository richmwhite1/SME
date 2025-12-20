/**
 * Database query helpers for Railway Postgres
 * Replaces Supabase client methods with raw SQL queries
 */

import { getDb } from './db';

// Helper to build WHERE clause from filters
interface QueryFilter {
  [key: string]: any;
}

export async function select(table: string, filters?: QueryFilter, columns: string = '*') {
  const sql = getDb();
  
  if (!filters || Object.keys(filters).length === 0) {
    return sql`SELECT ${sql(columns)} FROM ${sql(table)}`;
  }

  const whereConditions = Object.entries(filters)
    .map(([key, value]) => `${key} = ${sql(value)}`)
    .join(' AND ');

  return sql`SELECT ${sql(columns)} FROM ${sql(table)} WHERE ${whereConditions}`;
}

export async function selectOne(table: string, filters: QueryFilter, columns: string = '*') {
  const sql = getDb();
  const results = await select(table, filters, columns);
  return results.length > 0 ? results[0] : null;
}

export async function insert(table: string, data: { [key: string]: any }) {
  const sql = getDb();
  const keys = Object.keys(data);
  const values = Object.values(data);
  
  const result = await sql`
    INSERT INTO ${sql(table)} (${sql(keys)})
    VALUES (${values})
    RETURNING *
  `;
  
  return result[0];
}

export async function update(table: string, data: { [key: string]: any }, filters: QueryFilter) {
  const sql = getDb();
  
  const sets = Object.entries(data)
    .map(([key, value]) => `${key} = ${sql(value)}`)
    .join(', ');

  const wheres = Object.entries(filters)
    .map(([key, value]) => `${key} = ${sql(value)}`)
    .join(' AND ');

  const result = await sql`
    UPDATE ${sql(table)}
    SET ${sets}
    WHERE ${wheres}
    RETURNING *
  `;

  return result.length > 0 ? result[0] : null;
}

export async function deleteRecord(table: string, filters: QueryFilter) {
  const sql = getDb();
  
  const wheres = Object.entries(filters)
    .map(([key, value]) => `${key} = ${sql(value)}`)
    .join(' AND ');

  await sql`DELETE FROM ${sql(table)} WHERE ${wheres}`;
}

// Discussion-specific queries
export async function getDiscussionWithProfile(id: string) {
  const sql = getDb();
  return sql`
    SELECT 
      d.*,
      json_build_object(
        'id', p.id,
        'full_name', p.full_name,
        'username', p.username,
        'avatar_url', p.avatar_url,
        'contributor_score', p.contributor_score,
        'badge_type', p.badge_type
      ) as profiles
    FROM discussions d
    LEFT JOIN profiles p ON d.author_id = p.id
    WHERE d.id = ${id}
  `;
}

export async function getDiscussionComments(discussionId: string) {
  const sql = getDb();
  return sql`
    SELECT 
      dc.*,
      CASE 
        WHEN dc.author_id IS NOT NULL THEN json_build_object(
          'id', p.id,
          'full_name', p.full_name,
          'username', p.username,
          'avatar_url', p.avatar_url,
          'badge_type', p.badge_type,
          'contributor_score', p.contributor_score
        )
        ELSE NULL
      END as profiles
    FROM discussion_comments dc
    LEFT JOIN profiles p ON dc.author_id = p.id
    WHERE dc.discussion_id = ${discussionId}
    ORDER BY dc.created_at ASC
  `;
}

export async function getCommentReferences(commentId: string) {
  const sql = getDb();
  return sql`
    SELECT 
      resource_id,
      resource_title,
      resource_url
    FROM comment_references
    WHERE comment_id = ${commentId}
  `;
}

// Profile queries
export async function getProfile(userId: string) {
  const sql = getDb();
  return sql`
    SELECT * FROM profiles WHERE id = ${userId}
  `;
}

export async function getProfileByUsername(username: string) {
  const sql = getDb();
  return sql`
    SELECT * FROM profiles WHERE username = ${username}
  `;
}

// Generic query executor for complex queries
export async function executeQuery(query: string, params: any[] = []) {
  const sql = getDb();
  // This would need custom implementation based on your SQL library
  return sql`${query}`;
}
