
const { lookupProductByBarcode } = require('../app/actions/analyze-product');

async function test() {
    console.log("Testing Barcode Lookup...");
    try {
        const result = await lookupProductByBarcode('058449401018');
        console.log("Result:", JSON.stringify(result, null, 2));
    } catch (e) {
        console.error("Test Failed:", e);
    }
}

test();
