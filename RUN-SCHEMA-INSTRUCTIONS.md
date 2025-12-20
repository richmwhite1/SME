# Running schema.sql on Railway Database

## The Issue
The internal URL `postgres.railway.internal` only works **inside** the Railway environment (in your deployed app). From your local machine, you need the **public** database URL.

---

## ✅ Step-by-Step: Get Public Database URL

### 1. Open Railway Dashboard
Go to: https://railway.app/dashboard

### 2. Navigate to Your Project
Click on your project (Organic Intelligence)

### 3. Select PostgreSQL Service
Click on the **PostgreSQL** service/plugin

### 4. Go to "Connect" Tab
Click the **"Connect"** tab (not Data)

### 5. Copy the Connection String
Look for the connection string that looks like:
```
postgresql://postgres:PASSWORD@HOSTNAME.railway.app:PORT/railway
```

**NOT** the one with `.internal` in it!

It should have:
- `railway.app` (public domain)
- A port number (usually 5432 or different)
- Your password embedded

### 6. Copy the Full URL
Example format:
```
postgresql://postgres:mKOlGmNUfRzXdEuSOlxIIlVxmanJgivL@db-something.railway.app:5432/railway
```

---

## 🚀 Run the Schema Command

Once you have the **public** connection string, run:

```bash
psql "postgresql://postgres:mKOlGmNUfRzXdEuSOlxIIlVxmanJgivL@db-something.railway.app:5432/railway" -f schema.sql
```

Replace the entire URL with the one you copied from Railway Dashboard.

---

## Alternative: Use Railway Dashboard SQL Editor

1. In Railway Dashboard
2. Click PostgreSQL service
3. Click **"Data"** tab
4. Look for **"Query"** button or SQL Editor
5. Copy-paste the entire contents of `schema.sql`
6. Click **Run**

---

## Verify Tables Were Created

After running the schema, you can verify:

```bash
psql "postgresql://postgres:PASSWORD@hostname.railway.app:PORT/railway"

# Then in psql prompt:
\dt
```

This should show all your tables (profiles, protocols, discussions, etc.)

---

## 📝 Next Steps

1. ✅ Get the **public** PostgreSQL connection string from Railway Dashboard
2. ✅ Run `psql "URL" -f schema.sql`
3. ✅ Verify tables exist with `\dt`
4. ✅ Your database is live!

