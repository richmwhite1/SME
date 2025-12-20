/**
 * Supabase Compatibility Layer
 * 
 * This module provides a compatibility layer between old Supabase calls
 * and the new PostgreSQL backend using postgres.js.
 * 
 * This is a temporary solution to allow gradual migration from Supabase to raw SQL.
 * Over time, individual files should be migrated to use getDb() and raw SQL directly.
 */

import { getDb } from './db';

type PostgresReturn = any;

/**
 * Fake Supabase client that mimics the Supabase API
 * while using postgres.js under the hood
 */
class SupabaseCompatClient {
  private sql = getDb();

  from(table: string) {
    return new TableQuery(this.sql, table);
  }

  storage = {
    from: (bucket: string) => ({
      upload: async () => ({ data: null, error: new Error("Storage not implemented") }),
      getPublicUrl: () => ({ data: { publicUrl: "" } }),
    }),
  };
}

class TableQuery {
  private sql: ReturnType<typeof getDb>;
  private table: string;
  private selectColumns: string = "*";
  private filters: { [key: string]: any } = {};
  private orders: Array<[string, boolean]> = [];
  private limitVal: number | null = null;
  private singleFlag: boolean = false;

  constructor(sql: ReturnType<typeof getDb>, table: string) {
    this.sql = sql;
    this.table = table;
  }

  select(columns: string) {
    if (columns === "*") {
      this.selectColumns = "*";
    } else {
      // Handle nested selects like "*, profiles(...)"
      this.selectColumns = columns;
    }
    return this;
  }

  eq(column: string, value: any) {
    this.filters[`${column}__eq`] = value;
    return this;
  }

  neq(column: string, value: any) {
    this.filters[`${column}__neq`] = value;
    return this;
  }

  gt(column: string, value: any) {
    this.filters[`${column}__gt`] = value;
    return this;
  }

  gte(column: string, value: any) {
    this.filters[`${column}__gte`] = value;
    return this;
  }

  lt(column: string, value: any) {
    this.filters[`${column}__lt`] = value;
    return this;
  }

  lte(column: string, value: any) {
    this.filters[`${column}__lte`] = value;
    return this;
  }

  not(column: string, operator: string, value: any) {
    this.filters[`${column}__not_${operator}`] = value;
    return this;
  }

  or(condition: string) {
    // Parse OR conditions like "is_flagged.eq.false,is_flagged.is.null"
    this.filters["__or"] = condition;
    return this;
  }

  order(column: string, options?: { ascending?: boolean; nullsFirst?: boolean }) {
    this.orders.push([column, options?.ascending !== false]);
    return this;
  }

  limit(count: number) {
    this.limitVal = count;
    return this;
  }

  single() {
    this.singleFlag = true;
    return this as any;
  }

  async then(resolve: any, reject: any) {
    try {
      const result = await this.execute();
      resolve(result);
    } catch (error) {
      reject(error);
    }
  }

  private async execute(): Promise<{ data: any; error: any }> {
    try {
      // Build WHERE clause from filters
      let whereConditions: string[] = [];
      let values: any[] = [];
      let paramIndex = 1;

      for (const [key, value] of Object.entries(this.filters)) {
        if (key === "__or") {
          // Handle OR conditions
          const orParts = (value as string).split(",").map((part: string) => {
            const [col, op, val] = part.split(".");
            if (op === "eq") {
              return `${col} = ${val === "null" ? "NULL" : `$${paramIndex++}`}`;
            } else if (op === "is") {
              return `${col} IS ${val === "null" ? "NULL" : "NOT NULL"}`;
            }
            return "";
          });
          whereConditions.push(`(${orParts.filter((p: string) => p).join(" OR ")})`);
        } else if (key.endsWith("__eq")) {
          const column = key.replace("__eq", "");
          whereConditions.push(`${column} = $${paramIndex++}`);
          values.push(value);
        } else if (key.endsWith("__neq")) {
          const column = key.replace("__neq", "");
          whereConditions.push(`${column} != $${paramIndex++}`);
          values.push(value);
        } else if (key.endsWith("__gt")) {
          const column = key.replace("__gt", "");
          whereConditions.push(`${column} > $${paramIndex++}`);
          values.push(value);
        } else if (key.endsWith("__gte")) {
          const column = key.replace("__gte", "");
          whereConditions.push(`${column} >= $${paramIndex++}`);
          values.push(value);
        } else if (key.endsWith("__lt")) {
          const column = key.replace("__lt", "");
          whereConditions.push(`${column} < $${paramIndex++}`);
          values.push(value);
        } else if (key.endsWith("__lte")) {
          const column = key.replace("__lte", "");
          whereConditions.push(`${column} <= $${paramIndex++}`);
          values.push(value);
        } else if (key.endsWith("__not_is")) {
          const column = key.replace("__not_is", "");
          whereConditions.push(`${column} IS NOT NULL`);
        }
      }

      // Build ORDER BY
      let orderBy = "";
      if (this.orders.length > 0) {
        orderBy =
          " ORDER BY " +
          this.orders
            .map(
              ([col, asc]) =>
                `${col} ${asc ? "ASC" : "DESC"} NULLS ${asc ? "LAST" : "FIRST"}`
            )
            .join(", ");
      }

      // Build LIMIT
      let limitClause = "";
      if (this.limitVal) {
        limitClause = ` LIMIT ${this.limitVal}`;
      }

      // Build full query
      let query = `SELECT ${this.selectColumns} FROM ${this.table}`;
      if (whereConditions.length > 0) {
        query += ` WHERE ${whereConditions.join(" AND ")}`;
      }
      query += orderBy + limitClause;

      // Execute query
      const result = await (this.sql as any)(query, ...values);

      if (this.singleFlag) {
        return {
          data: result.length > 0 ? result[0] : null,
          error: null,
        };
      }

      return {
        data: result,
        error: null,
      };
    } catch (error) {
      console.error("Query error:", error);
      return {
        data: null,
        error,
      };
    }
  }
}

let compatClient: SupabaseCompatClient | null = null;

export function createClient() {
  if (!compatClient) {
    compatClient = new SupabaseCompatClient();
  }
  return compatClient;
}
