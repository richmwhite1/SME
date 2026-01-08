
import { getDb } from "../lib/db";

async function setupTestUser() {
    const sql = getDb();

    console.log("Finding users...");
    const users = await sql`
        SELECT id, email, full_name, role 
        FROM profiles 
        LIMIT 10
    `;

    // Find Richard or fallback
    const user = users.find(u =>
        (u.full_name && u.full_name.includes('Richard')) ||
        (u.email && u.email.includes('richard'))
    ) || users[0];

    if (!user) {
        console.error("No users found in database!");
        process.exit(1);
    }

    console.log(`Found user: ${user.full_name || user.email} (${user.id}) - Current Role: ${user.role}`);

    // 1. Update Role
    console.log("Updating role to BRAND_REP...");
    await sql`
        UPDATE profiles 
        SET role = 'BRAND_REP' 
        WHERE id = ${user.id}
    `;

    // 2. Find Product
    console.log("Finding Smoke Test Omega...");
    const products = await sql`
        SELECT id, title, slug FROM products WHERE slug = 'smoke-test-omega' LIMIT 1
    `;

    if (products.length === 0) {
        console.error("Product 'smoke-test-omega' not found!");
        process.exit(1);
    }

    const product = products[0];
    console.log(`Found product: ${product.title} (${product.id})`);

    // 3. Create/Update Brand Verification
    console.log("Creating/Updating Brand Verification...");
    // Check if exists
    const existingVerifications = await sql`
        SELECT id FROM brand_verifications WHERE user_id = ${user.id}
    `;

    if (existingVerifications.length > 0) {
        await sql`
            UPDATE brand_verifications
            SET 
                product_id = ${product.id},
                status = 'approved',
                subscription_status = 'active',
                stripe_customer_id = 'cus_test123',
                stripe_subscription_id = 'sub_test123',
                updated_at = NOW()
            WHERE user_id = ${user.id}
        `;
    } else {
        await sql`
            INSERT INTO brand_verifications (
                user_id, product_id, work_email, linkedin_profile, 
                company_website, status, subscription_status,
                stripe_customer_id, stripe_subscription_id
            ) VALUES (
                ${user.id}, ${product.id}, 'richard@example.com',
                'https://linkedin.com/in/richardwhite', 'https://example.com',
                'approved', 'active', 'cus_test123', 'sub_test123'
            )
        `;
    }

    // 4. Assign Product Ownership
    console.log("Assigning Product Ownership...");
    await sql`
        UPDATE products 
        SET brand_owner_id = ${user.id} 
        WHERE id = ${product.id}
    `;

    // 5. Seed some usage data for today
    console.log("Seeding usage data...");
    const today = new Date().toISOString().split('T')[0];
    await sql`
        INSERT INTO product_view_metrics (
            product_id, brand_owner_id, view_date, view_count
        ) VALUES (
            ${product.id}, ${user.id}, ${today}, 5
        )
        ON CONFLICT (product_id, view_date) 
        DO UPDATE SET view_count = 5
    `;

    console.log("✅ Setup complete! User is now a BRAND_REP with an active subscription and product ownership.");
    process.exit(0);
}

setupTestUser().catch(console.error);
