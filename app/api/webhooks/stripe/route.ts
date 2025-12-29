import { NextRequest, NextResponse } from "next/server";
import { verifyWebhookSignature } from "@/lib/stripe-config";
import { handleBrandVerificationWebhook } from "@/app/actions/brand-verification-actions";
import { handleSMECertificationWebhook } from "@/app/actions/sme-certification-actions";
import { revokeBrandVerification, restoreBrandVerification } from "@/app/actions/revoke-brand-verification";

export async function POST(req: NextRequest) {
    try {
        const body = await req.text();
        const signature = req.headers.get("stripe-signature");

        if (!signature) {
            console.error("⚠️ Missing stripe-signature header");
            return NextResponse.json(
                { error: "Missing stripe-signature header" },
                { status: 400 }
            );
        }

        // Verify webhook signature - CRITICAL for security
        let event;
        try {
            event = verifyWebhookSignature(body, signature);
        } catch (err) {
            console.error("❌ Webhook signature verification failed:", err);
            return NextResponse.json(
                { error: "Invalid signature" },
                { status: 400 }
            );
        }

        console.log(`📨 Webhook received: ${event.type}`);

        // Handle different event types
        switch (event.type) {
            // ========================================
            // BILLING NERVE CENTER - Payment Events
            // ========================================

            case "invoice.paid": {
                const invoice = event.data.object;
                console.log(`✅ Invoice paid: ${invoice.id}`);

                // Restore brand verification if it was revoked
                if (invoice.customer) {
                    const result = await restoreBrandVerification({
                        stripeCustomerId: invoice.customer as string,
                    });

                    if (result.success) {
                        console.log(`✅ Brand verification restored for customer ${invoice.customer}`);
                    }
                }
                break;
            }

            case "invoice.payment_failed": {
                const invoice = event.data.object;
                console.log(`❌ Invoice payment failed: ${invoice.id}`);

                // DEMOTION SEQUENCE - Revoke brand verification immediately
                if (invoice.customer) {
                    const result = await revokeBrandVerification({
                        stripeCustomerId: invoice.customer as string,
                        reason: "payment_failed",
                    });

                    if (result.success) {
                        console.log(`🚨 Brand verification revoked for customer ${invoice.customer}`);
                        console.log(`   Products affected: ${result.productsAffected}`);
                    }
                }
                break;
            }

            case "customer.subscription.deleted": {
                const subscription = event.data.object;
                console.log(`🗑️ Subscription deleted: ${subscription.id}`);

                // DEMOTION SEQUENCE - Revoke brand verification
                if (subscription.customer) {
                    const result = await revokeBrandVerification({
                        stripeCustomerId: subscription.customer as string,
                        reason: "subscription_canceled",
                    });

                    if (result.success) {
                        console.log(`🚨 Brand verification revoked for customer ${subscription.customer}`);
                        console.log(`   Products affected: ${result.productsAffected}`);
                    }
                }
                break;
            }

            // ========================================
            // Checkout & Subscription Events
            // ========================================

            case "checkout.session.completed": {
                const session = event.data.object;

                if (session.metadata?.type === "brand_verification") {
                    await handleBrandVerificationWebhook(event);
                } else if (session.metadata?.type === "sme_certification") {
                    await handleSMECertificationWebhook(event);
                }
                break;
            }

            case "customer.subscription.updated": {
                await handleBrandVerificationWebhook(event);
                break;
            }

            // ========================================
            // SME Certification Payment Events
            // ========================================

            case "payment_intent.payment_failed": {
                // Handle SME certification payment failures
                await handleSMECertificationWebhook(event);
                break;
            }

            default:
                console.log(`ℹ️ Unhandled event type: ${event.type}`);
        }

        return NextResponse.json({ received: true });
    } catch (error) {
        console.error("❌ Webhook handler error:", error);
        return NextResponse.json(
            { error: "Webhook handler failed" },
            { status: 500 }
        );
    }
}
