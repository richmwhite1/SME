"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Edit, Shield, ShieldOff, BarChart3, Calendar, Mail, CheckCircle, AlertCircle, Settings } from "lucide-react";
import Button from "@/components/ui/Button";
import CertificationModal from "./CertificationModal";
import OutreachModal from "./OutreachModal";
import ProductReviewModal from "./ProductReviewModal";
import ProductEditModal from "./ProductEditModal";
import ProductAnalyticsModal from "./ProductAnalyticsModal";
import { formatDistanceToNow } from "date-fns";

interface Product {
  id: string;
  title: string;
  slug: string;
  created_at: string;
  is_sme_certified: boolean;
  invite_sent?: boolean;
  certification_notes?: string | null;
  third_party_lab_verified?: boolean;
  purity_tested?: boolean;
  source_transparency?: boolean;
  potency_verified?: boolean;
  excipient_audit?: boolean;
  operational_legitimacy?: boolean;
  coa_url?: string | null;
  review_count: number;
  admin_status?: 'approved' | 'rejected' | 'pending_review';
  certification_tier?: 'None' | 'Bronze' | 'Silver' | 'Gold';
  admin_notes?: string;
  sme_signals?: any;
  technical_specs?: any;
  tech_docs?: any;
  target_audience?: string;
  core_value_proposition?: string;
  sme_access_note?: string;
  video_url?: string;
  citation_url?: string;
  view_count?: number;
  click_count?: number;
}

interface FlaggedContent {
  discussions: any[];
  reviews: any[];
  discussionComments: any[];
  productComments: any[];
  errors: any;
}

interface AdminDashboardClientProps {
  products: Product[];
  flaggedContent: FlaggedContent;
}

export default function AdminDashboardClient({
  products,
  flaggedContent,
}: AdminDashboardClientProps) {
  const router = useRouter();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedOutreachProduct, setSelectedOutreachProduct] = useState<Product | null>(null);
  const [isOutreachModalOpen, setIsOutreachModalOpen] = useState(false);
  const [selectedReviewProduct, setSelectedReviewProduct] = useState<Product | null>(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);

  const handleToggleCertification = (product: Product) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedProduct(null);
  };

  const handleOpenOutreach = (product: Product) => {
    setSelectedOutreachProduct(product);
    setIsOutreachModalOpen(true);
  };

  const handleCloseOutreachModal = () => {
    setIsOutreachModalOpen(false);
    setSelectedOutreachProduct(null);
  };

  const handleOpenReview = (product: Product) => {
    setSelectedReviewProduct(product);
    setIsReviewModalOpen(true);
  };

  const handleCloseReviewModal = () => {
    setIsReviewModalOpen(false);
    setSelectedReviewProduct(null);
    router.refresh();
  };

  const [selectedEditProduct, setSelectedEditProduct] = useState<Product | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedAnalyticsProduct, setSelectedAnalyticsProduct] = useState<Product | null>(null);
  const [isAnalyticsModalOpen, setIsAnalyticsModalOpen] = useState(false);

  const handleOpenEdit = (product: Product) => {
    setSelectedEditProduct(product);
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setSelectedEditProduct(null);
    router.refresh();
  };

  const handleOpenAnalytics = (product: Product) => {
    setSelectedAnalyticsProduct(product);
    setIsAnalyticsModalOpen(true);
  };

  const handleCloseAnalyticsModal = () => {
    setIsAnalyticsModalOpen(false);
    setSelectedAnalyticsProduct(null);
  };

  const handleInviteSent = () => {
    router.refresh();
  };

  const getStatusBadge = (product: Product) => {
    const status = product.admin_status || (product.is_sme_certified ? 'approved' : 'pending_review');

    switch (status) {
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-medium text-emerald-400 border border-emerald-500/30">
            <CheckCircle size={12} />
            Approved
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-red-500/20 px-3 py-1 text-xs font-medium text-red-400 border border-red-500/30">
            <AlertCircle size={12} />
            Rejected
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-yellow-500/20 px-3 py-1 text-xs font-medium text-yellow-400 border border-yellow-500/30">
            <ShieldOff size={12} />
            Pending
          </span>
        );
    }
  };

  return (
    <>
      <div className="rounded-xl bg-white/50 p-6 backdrop-blur-sm">
        <h2 className="mb-6 text-2xl font-semibold text-deep-stone">Product Inventory</h2>

        {products.length === 0 ? (
          <div className="rounded-lg border border-soft-clay/30 bg-white/50 p-12 text-center">
            <p className="text-deep-stone/70">No products found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-soft-clay/20">
                  <th className="px-4 py-3 text-left text-sm font-semibold text-deep-stone">
                    Product Name
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-deep-stone">
                    Created
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-deep-stone">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-deep-stone">
                    Reviews
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-deep-stone">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr
                    key={product.id}
                    className="border-b border-soft-clay/10 transition-colors hover:bg-white/50"
                  >
                    <td className="px-4 py-4">
                      <Link
                        href={`/products/${product.slug}`}
                        className="font-medium text-deep-stone hover:text-earth-green hover:underline"
                      >
                        {product.title}
                      </Link>
                    </td>
                    <td className="px-4 py-4 text-sm text-deep-stone/60">
                      <div className="flex items-center gap-2">
                        <Calendar size={14} />
                        {formatDistanceToNow(new Date(product.created_at), {
                          addSuffix: true,
                        })}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      {getStatusBadge(product)}
                    </td>
                    <td className="px-4 py-4 text-sm text-deep-stone/60">
                      {product.review_count}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant={product.invite_sent ? "outline" : "primary"}
                          onClick={() => handleOpenOutreach(product)}
                          className={`flex items-center gap-1 px-3 py-1.5 text-sm ${product.invite_sent ? "opacity-75" : ""
                            }`}
                        >
                          {product.invite_sent ? (
                            <>
                              <CheckCircle size={14} />
                              Invited
                            </>
                          ) : (
                            <>
                              <Mail size={14} />
                              Invite
                            </>
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => handleOpenEdit(product)}
                          className="flex items-center gap-1 px-3 py-1.5 text-sm"
                        >
                          <Edit size={14} />
                          Edit
                        </Button>
                        <Button
                          variant="secondary"
                          onClick={() => handleOpenReview(product)}
                          className="flex items-center gap-1 px-3 py-1.5 text-sm"
                        >
                          <Settings size={14} />
                          Manage
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => handleOpenAnalytics(product)}
                          className="flex items-center gap-1 px-3 py-1.5 text-sm"
                        >
                          <BarChart3 size={14} />
                          Analytics
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedReviewProduct && (
        <ProductReviewModal
          isOpen={isReviewModalOpen}
          onClose={handleCloseReviewModal}
          product={selectedReviewProduct}
        />
      )}

      {selectedEditProduct && (
        <ProductEditModal
          isOpen={isEditModalOpen}
          onClose={handleCloseEditModal}
          product={selectedEditProduct}
        />
      )}

      {selectedAnalyticsProduct && (
        <ProductAnalyticsModal
          isOpen={isAnalyticsModalOpen}
          onClose={handleCloseAnalyticsModal}
          product={selectedAnalyticsProduct}
        />
      )}

      {selectedProduct && (
        <CertificationModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          protocolId={selectedProduct.id}
          currentStatus={selectedProduct.is_sme_certified}
          currentData={{
            certification_notes: selectedProduct.certification_notes,
            third_party_lab_verified: selectedProduct.third_party_lab_verified,
            purity_tested: selectedProduct.purity_tested,
            source_transparency: selectedProduct.source_transparency,
            potency_verified: selectedProduct.potency_verified,
            excipient_audit: selectedProduct.excipient_audit,
            operational_legitimacy: selectedProduct.operational_legitimacy,
            coa_url: selectedProduct.coa_url,
          }}
        />
      )}

      {selectedOutreachProduct && (
        <OutreachModal
          isOpen={isOutreachModalOpen}
          onClose={handleCloseOutreachModal}
          product={{
            id: selectedOutreachProduct.id,
            title: selectedOutreachProduct.title,
            slug: selectedOutreachProduct.slug,
          }}
          onInviteSent={handleInviteSent}
        />
      )}
    </>
  );
}





