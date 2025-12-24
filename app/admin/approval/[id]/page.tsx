import { redirect } from 'next/navigation';
import { getProductForAudit } from '@/app/actions/admin-approval-actions';
import ProductAuditView from '@/components/admin/ProductAuditView';
import { isAdmin } from '@/lib/admin';

export const dynamic = 'force-dynamic';

interface PageProps {
    params: Promise<{
        id: string;
    }>;
}

export default async function ProductAuditPage(props: PageProps) {
    const params = await props.params;
    const adminStatus = await isAdmin();

    if (!adminStatus) {
        redirect('/');
    }

    let product = null;
    try {
        product = await getProductForAudit(params.id);
    } catch (error) {
        console.error('Error loading product for audit:', error);
        // You handle not found or error states here
    }

    if (!product) {
        return (
            <div className="flex h-screen items-center justify-center bg-forest-obsidian text-bone-white">
                Product not found
            </div>
        );
    }

    return <ProductAuditView product={product} />;
}
