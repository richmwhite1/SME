
const { lookupProductByBarcode } = require('../app/actions/analyze-product');

const BARCODES = [
    '3017620422003', // Nutella
    '5449000000996', // Coca-Cola
    '058449401018'   // Previous one (Nature's Path)
];

async function test() {
    console.log("Testing Barcode Lookup...");
    for (const code of BARCODES) {
        console.log(`\nLookup: ${code}`);
        try {
            const result = await lookupProductByBarcode(code);
            if (result.success) {
                console.log("✅ Success:", result.data.name);
            } else {
                console.log("❌ Failed:", result.error);
            }
        } catch (e) {
            console.error("Test Error:", e);
        }
    }
}

test();
