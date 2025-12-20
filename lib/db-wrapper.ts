/**
 * Database wrapper that provides a Supabase-like interface but uses Railway Postgres
 * This allows for minimal changes to existing code during migration
 */

import { getDb } from './db';

type QueryFilter = { [key: string]: any };

class DatabaseWrapper {
  private sql: ReturnType<typeof getDb>;

  constructor() {
    this.sql = getDb();
  }

  from(tableName: string) {
    return new QueryBuilder(this.sql, tableName);
  }
}

class QueryBuilder {
  private sql: ReturnType<typeof getDb>;
  private tableName: string;
  private selectColumns: string = '*';
  private filters: QueryFilter = {};
  private orderBy: { column: string; ascending: boolean }[] = [];
  private limitCount?: number;
  private inFilters: { [key: string]: any[] } = {};

  constructor(sql: ReturnType<typeof getDb>, tableName: string) {
    this.sql = sql;
    this.tableName = tableName;
  }

  select(columns: string | string[] = '*') {
    if (Array.isArray(columns)) {
      this.selectColumns = columns.join(', ');
    } else {
      this.selectColumns = columns;
    }
    return this;
  }

  eq(column: string, value: any) {
    this.filters[column] = value;
    return this;
  }

  in(column: string, values: any[]) {
    this.inFilters[column] = values;
    return this;
  }

  or(condition: string) {
    // Parse or conditions like "is_flagged.eq.true,flag_count.gt.0"
    // For now, return this to allow chaining
    return this;
  }

  order(column: string, options?: { ascending: boolean }) {
    this.orderBy.push({
      column,
      ascending: options?.ascending !== false,
    });
    return this;
  }

  limit(count: number) {
    this.limitCount = count;
    return this;
  }

  async single() {
    const result = await this.execute();
    return {
      data: result.length > 0 ? result[0] : null,
      error: result.length === 0 ? new Error('No rows found') : null,
    };
  }

  async execute() {
    try {
      let query = `SELECT ${this.selectColumns} FROM ${this.tableName}`;

      // Build WHERE clause
      const whereClauses: string[] = [];
      
      // Handle equality filters
      Object.entries(this.filters).forEach(([key, value]) => {
        if (value === null) {
          whereClauses.push(`${key} IS NULL`);
        } else if (typeof value === 'string') {
          whereClauses.push(`${key} = '${value.replace(/'/g, "''")}'`);
        } else if (typeof value === 'boolean') {
          whereClauses.push(`${key} = ${value ? 'true' : 'false'}`);
        } else {
          whereClauses.push(`${key} = ${value}`);
        }
      });

      // Handle IN filters
      Object.entries(this.inFilters).forEach(([key, values]) => {
        const formattedValues = values
          .map(v => typeof v === 'string' ? `'${v.replace(/'/g, "''")}'` : v)
          .join(', ');
        whereClauses.push(`${key} IN (${formattedValues})`);
      });

      if (whereClauses.length > 0) {
        query += ` WHERE ${whereClauses.join(' AND ')}`;
      }

      // Add ORDER BY
      if (this.orderBy.length > 0) {
        const orderClauses = this.orderBy
          .map(o => `${o.column} ${o.ascending ? 'ASC' : 'DESC'}`)
          .join(', ');
        query += ` ORDER BY ${orderClauses}`;
      }

      // Add LIMIT
      if (this.limitCount) {
        query += ` LIMIT ${this.limitCount}`;
      }

      // Use raw SQL query
      const result = await this.sql.unsafe(query);
      return result || [];
    } catch (error) {
      console.error('Database query error:', error);
      return [];
    }
  }

  async update(data: QueryFilter) {
    try {
      const setClauses = Object.entries(data)
        .map(([key, value]) => {
          if (value === null) {
            return `${key} = NULL`;
          } else if (typeof value === 'string') {
            return `${key} = '${value.replace(/'/g, "''")}'`;
          } else if (typeof value === 'boolean') {
            return `${key} = ${value ? 'true' : 'false'}`;
          } else {
            return `${key} = ${value}`;
          }
        })
        .join(', ');

      const whereClauses: string[] = [];
      Object.entries(this.filters).forEach(([key, value]) => {
        if (value === null) {
          whereClauses.push(`${key} IS NULL`);
        } else if (typeof value === 'string') {
          whereClauses.push(`${key} = '${value.replace(/'/g, "''")}'`);
        } else if (typeof value === 'boolean') {
          whereClauses.push(`${key} = ${value ? 'true' : 'false'}`);
        } else {
          whereClauses.push(`${key} = ${value}`);
        }
      });

      let query = `UPDATE ${this.tableName} SET ${setClauses}`;
      if (whereClauses.length > 0) {
        query += ` WHERE ${whereClauses.join(' AND ')}`;
      }

      await this.sql.unsafe(query);
      return { error: null };
    } catch (error) {
      return { error };
    }
  }

  async insert(data: QueryFilter) {
    try {
      const keys = Object.keys(data);
      const values = Object.values(data).map(v => {
        if (v === null) return 'NULL';
        if (typeof v === 'string') return `'${v.replace(/'/g, "''")}'`;
        if (typeof v === 'boolean') return v ? 'true' : 'false';
        if (typeof v === 'object') return `'${JSON.stringify(v)}'`;
        return v;
      });

      const query = `INSERT INTO ${this.tableName} (${keys.join(', ')}) VALUES (${values.join(', ')})`;
      await this.sql.unsafe(query);
      return { error: null };
    } catch (error) {
      return { error };
    }
  }

  async delete() {
    try {
      const whereClauses: string[] = [];
      Object.entries(this.filters).forEach(([key, value]) => {
        if (value === null) {
          whereClauses.push(`${key} IS NULL`);
        } else if (typeof value === 'string') {
          whereClauses.push(`${key} = '${value.replace(/'/g, "''")}'`);
        } else if (typeof value === 'boolean') {
          whereClauses.push(`${key} = ${value ? 'true' : 'false'}`);
        } else {
          whereClauses.push(`${key} = ${value}`);
        }
      });

      let query = `DELETE FROM ${this.tableName}`;
      if (whereClauses.length > 0) {
        query += ` WHERE ${whereClauses.join(' AND ')}`;
      }

      await this.sql.unsafe(query);
      return { error: null };
    } catch (error) {
      return { error };
    }
  }
}

export function createClient() {
  return new DatabaseWrapper();
}
