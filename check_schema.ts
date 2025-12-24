
import { getDb } from "./lib/db";

async function checkSchema() {
    const sql = getDb();
    try {
        console.log("Checking products table...");
        const products = await sql`SELECT * FROM products LIMIT 1`;
        if (products.length > 0) {
            console.log("Products columns:", Object.keys(products[0]));
        } else {
            console.log("No products found.");
        }

        console.log("Checking product_truth_signals table...");
        try {
            const signals = await sql`SELECT * FROM product_truth_signals LIMIT 1`;
            if (signals.length > 0) {
                console.log("Product Truth Signals columns:", Object.keys(signals[0]));
            } else {
                console.log("No product truth signals found (table exists).");
            }
        } catch (e) {
            console.log("product_truth_signals table might not exist:", e.message);
        }

        console.log("Checking product_comments table...");
        const comments = await sql`SELECT * FROM product_comments LIMIT 1`;
        if (comments.length > 0) {
            console.log("Product Comments columns:", Object.keys(comments[0]));
        } else {
            console.log("No comments found.");
        }

    } catch (err) {
        console.error("Error:", err);
    }
}

checkSchema();
