"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/ToastContainer";
import {
  updateContactStatus,
  updateBrandApplicationStatus,
  updateProductIntakeStatus,
} from "@/app/actions/intake-actions";
import { Inbox, Mail, Building2, Package, Check, X, Eye } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import Button from "@/components/ui/Button";

interface ContactSubmission {
  id: string;
  name: string;
  email: string;
  subject: string | null;
  message: string;
  status: string;
  admin_notes: string | null;
  created_at: string;
}

interface BrandApplication {
  id: string;
  business_name: string;
  email: string;
  product_interest: string | null;
  status: string;
  notes: string | null;
  created_at: string;
}

interface ProductIntake {
  id: string;
  product_name: string;
  description: string;
  tier: "standard" | "featured";
  wants_certification: boolean;
  purity_doc_url: string | null;
  purity_doc_filename: string | null;
  status: string;
  admin_notes: string | null;
  submitted_by: string | null;
  submitted_email: string;
  created_at: string;
}

interface IntakeTabProps {
  contactSubmissions: ContactSubmission[];
  brandApplications: BrandApplication[];
  productIntake: ProductIntake[];
}

type SubTab = "inquiries" | "partners" | "products";

export default function IntakeTab({
  contactSubmissions,
  brandApplications,
  productIntake,
}: IntakeTabProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const [activeSubTab, setActiveSubTab] = useState<SubTab>("inquiries");
  const [updating, setUpdating] = useState<Record<string, boolean>>({});
  const [selectedItem, setSelectedItem] = useState<string | null>(null);

  const handleUpdateStatus = async (
    type: "contact" | "brand" | "product",
    id: string,
    status: string
  ) => {
    setUpdating((prev) => ({ ...prev, [id]: true }));
    try {
      if (type === "contact") {
        await updateContactStatus(id, status);
      } else if (type === "brand") {
        await updateBrandApplicationStatus(id, status);
      } else {
        await updateProductIntakeStatus(id, status);
      }
      showToast("Status updated successfully", "success");
      router.refresh();
    } catch (error: any) {
      showToast(error.message || "Failed to update status", "error");
    } finally {
      setUpdating((prev) => ({ ...prev, [id]: false }));
    }
  };

  return (
    <div className="space-y-6">
      {/* Sub-tab Navigation */}
      <div className="border-b border-bone-white/20">
        <nav className="flex space-x-1" aria-label="Sub-tabs">
          <button
            onClick={() => setActiveSubTab("inquiries")}
            className={`
              flex items-center gap-2 px-4 py-2 text-sm font-mono uppercase tracking-wider
              border-b-2 transition-colors
              ${
                activeSubTab === "inquiries"
                  ? "border-emerald-400 text-emerald-400"
                  : "border-transparent text-bone-white/70 hover:text-bone-white hover:border-bone-white/30"
              }
            `}
          >
            <Mail className="h-4 w-4" />
            Inquiries ({contactSubmissions.length})
          </button>
          <button
            onClick={() => setActiveSubTab("partners")}
            className={`
              flex items-center gap-2 px-4 py-2 text-sm font-mono uppercase tracking-wider
              border-b-2 transition-colors
              ${
                activeSubTab === "partners"
                  ? "border-emerald-400 text-emerald-400"
                  : "border-transparent text-bone-white/70 hover:text-bone-white hover:border-bone-white/30"
              }
            `}
          >
            <Building2 className="h-4 w-4" />
            Partners ({brandApplications.length})
          </button>
          <button
            onClick={() => setActiveSubTab("products")}
            className={`
              flex items-center gap-2 px-4 py-2 text-sm font-mono uppercase tracking-wider
              border-b-2 transition-colors
              ${
                activeSubTab === "products"
                  ? "border-emerald-400 text-emerald-400"
                  : "border-transparent text-bone-white/70 hover:text-bone-white hover:border-bone-white/30"
              }
            `}
          >
            <Package className="h-4 w-4" />
            Product Intake ({productIntake.length})
          </button>
        </nav>
      </div>

      {/* Inquiries Sub-tab */}
      {activeSubTab === "inquiries" && (
        <div className="space-y-4">
          {contactSubmissions.length === 0 ? (
            <div className="border border-bone-white/20 bg-bone-white/5 p-12 text-center">
              <Mail className="h-12 w-12 text-bone-white/30 mx-auto mb-4" />
              <p className="font-mono text-lg text-bone-white/70 mb-2">NO INQUIRIES</p>
              <p className="font-mono text-sm text-bone-white/50">No contact submissions yet</p>
            </div>
          ) : (
            contactSubmissions.map((submission) => (
              <div
                key={submission.id}
                className="border border-bone-white/20 bg-bone-white/5 p-4 sm:p-6 font-mono"
              >
                <div className="mb-4 flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="mb-2 flex items-center gap-2">
                      <span className="font-semibold text-bone-white">{submission.name}</span>
                      <span className="text-xs text-bone-white/50">{submission.email}</span>
                      <span
                        className={`border px-2 py-0.5 text-[10px] uppercase tracking-wider ${
                          submission.status === "new"
                            ? "border-emerald-400/50 bg-emerald-400/10 text-emerald-400"
                            : submission.status === "replied"
                              ? "border-sme-gold/50 bg-sme-gold/10 text-sme-gold"
                              : "border-bone-white/30 bg-bone-white/10 text-bone-white/70"
                        }`}
                      >
                        {submission.status}
                      </span>
                    </div>
                    {submission.subject && (
                      <p className="mb-2 text-sm font-semibold text-bone-white">
                        {submission.subject}
                      </p>
                    )}
                    <p className="mb-2 text-sm text-bone-white/80 line-clamp-2">
                      {submission.message}
                    </p>
                    <p className="text-xs text-bone-white/50">
                      {formatDistanceToNow(new Date(submission.created_at), { addSuffix: true })}
                    </p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Button
                      onClick={() =>
                        setSelectedItem(
                          selectedItem === submission.id ? null : submission.id
                        )
                      }
                      className="flex items-center gap-2 border-bone-white/20 bg-bone-white/5 text-bone-white/70 hover:bg-bone-white/10 text-xs font-mono px-3 py-1.5 transition-colors"
                    >
                      <Eye className="h-3 w-3" />
                      {selectedItem === submission.id ? "Hide" : "View"}
                    </Button>
                    {submission.status === "new" && (
                      <Button
                        onClick={() => handleUpdateStatus("contact", submission.id, "read")}
                        disabled={updating[submission.id]}
                        className="flex items-center gap-2 border-emerald-400/50 bg-emerald-400/10 text-emerald-400 hover:bg-emerald-400/20 text-xs font-mono px-3 py-1.5 transition-colors disabled:opacity-50"
                      >
                        <Check className="h-3 w-3" />
                        Mark Read
                      </Button>
                    )}
                  </div>
                </div>
                {selectedItem === submission.id && (
                  <div className="border-t border-bone-white/10 pt-4 mt-4">
                    <div className="mb-2 text-xs text-bone-white/70 uppercase tracking-wider">
                      Full Message:
                    </div>
                    <div className="rounded border border-bone-white/10 bg-forest-obsidian p-4">
                      <p className="text-sm text-bone-white/90 leading-relaxed whitespace-pre-wrap font-mono">
                        {submission.message}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Partners Sub-tab */}
      {activeSubTab === "partners" && (
        <div className="space-y-4">
          {brandApplications.length === 0 ? (
            <div className="border border-bone-white/20 bg-bone-white/5 p-12 text-center">
              <Building2 className="h-12 w-12 text-bone-white/30 mx-auto mb-4" />
              <p className="font-mono text-lg text-bone-white/70 mb-2">NO APPLICATIONS</p>
              <p className="font-mono text-sm text-bone-white/50">No brand applications yet</p>
            </div>
          ) : (
            brandApplications.map((application) => (
              <div
                key={application.id}
                className="border border-bone-white/20 bg-bone-white/5 p-4 sm:p-6 font-mono"
              >
                <div className="mb-4 flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="mb-2 flex items-center gap-2">
                      <span className="font-semibold text-bone-white">
                        {application.business_name}
                      </span>
                      <span className="text-xs text-bone-white/50">{application.email}</span>
                      <span
                        className={`border px-2 py-0.5 text-[10px] uppercase tracking-wider ${
                          application.status === "pending"
                            ? "border-yellow-500/50 bg-yellow-500/10 text-yellow-400"
                            : application.status === "certified"
                              ? "border-emerald-400/50 bg-emerald-400/10 text-emerald-400"
                              : "border-red-500/50 bg-red-500/10 text-red-400"
                        }`}
                      >
                        {application.status}
                      </span>
                    </div>
                    {application.product_interest && (
                      <p className="mb-2 text-sm text-bone-white/80">
                        {application.product_interest}
                      </p>
                    )}
                    <p className="text-xs text-bone-white/50">
                      {formatDistanceToNow(new Date(application.created_at), { addSuffix: true })}
                    </p>
                  </div>
                  <div className="flex flex-col gap-2">
                    {application.status !== "certified" && (
                      <Button
                        onClick={() =>
                          handleUpdateStatus("brand", application.id, "certified")
                        }
                        disabled={updating[application.id]}
                        className="flex items-center gap-2 border-emerald-400/50 bg-emerald-400/10 text-emerald-400 hover:bg-emerald-400/20 text-xs font-mono px-3 py-1.5 transition-colors disabled:opacity-50"
                      >
                        <Check className="h-3 w-3" />
                        Certify
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Product Intake Sub-tab */}
      {activeSubTab === "products" && (
        <div className="space-y-4">
          {productIntake.length === 0 ? (
            <div className="border border-bone-white/20 bg-bone-white/5 p-12 text-center">
              <Package className="h-12 w-12 text-bone-white/30 mx-auto mb-4" />
              <p className="font-mono text-lg text-bone-white/70 mb-2">NO SUBMISSIONS</p>
              <p className="font-mono text-sm text-bone-white/50">No product intake submissions yet</p>
            </div>
          ) : (
            productIntake.map((submission) => (
              <div
                key={submission.id}
                className="border border-bone-white/20 bg-bone-white/5 p-4 sm:p-6 font-mono"
              >
                <div className="mb-4 flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="mb-2 flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-bone-white">{submission.product_name}</span>
                      <span
                        className={`border px-2 py-0.5 text-[10px] uppercase tracking-wider ${
                          submission.tier === "featured"
                            ? "border-sme-gold/50 bg-sme-gold/10 text-sme-gold"
                            : "border-bone-white/30 bg-bone-white/10 text-bone-white/70"
                        }`}
                      >
                        {submission.tier}
                      </span>
                      {submission.wants_certification && (
                        <span className="border border-emerald-400/50 bg-emerald-400/10 px-2 py-0.5 text-[10px] uppercase tracking-wider text-emerald-400">
                          Wants Certification
                        </span>
                      )}
                      <span
                        className={`border px-2 py-0.5 text-[10px] uppercase tracking-wider ${
                          submission.status === "pending"
                            ? "border-yellow-500/50 bg-yellow-500/10 text-yellow-400"
                            : submission.status === "approved"
                              ? "border-emerald-400/50 bg-emerald-400/10 text-emerald-400"
                              : "border-red-500/50 bg-red-500/10 text-red-400"
                        }`}
                      >
                        {submission.status}
                      </span>
                    </div>
                    <p className="mb-2 text-sm text-bone-white/80 line-clamp-2">
                      {submission.description}
                    </p>
                    <div className="mb-2 flex items-center gap-4 text-xs text-bone-white/50">
                      <span>{submission.submitted_email}</span>
                      <span>
                        {formatDistanceToNow(new Date(submission.created_at), { addSuffix: true })}
                      </span>
                    </div>
                    {submission.purity_doc_url && (
                      <a
                        href={submission.purity_doc_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-emerald-400 hover:text-emerald-300 underline"
                      >
                        View Purity Documentation
                      </a>
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    <Button
                      onClick={() =>
                        setSelectedItem(
                          selectedItem === submission.id ? null : submission.id
                        )
                      }
                      className="flex items-center gap-2 border-bone-white/20 bg-bone-white/5 text-bone-white/70 hover:bg-bone-white/10 text-xs font-mono px-3 py-1.5 transition-colors"
                    >
                      <Eye className="h-3 w-3" />
                      {selectedItem === submission.id ? "Hide" : "View"}
                    </Button>
                    {submission.status === "pending" && (
                      <Button
                        onClick={() =>
                          handleUpdateStatus("product", submission.id, "approved")
                        }
                        disabled={updating[submission.id]}
                        className="flex items-center gap-2 border-emerald-400/50 bg-emerald-400/10 text-emerald-400 hover:bg-emerald-400/20 text-xs font-mono px-3 py-1.5 transition-colors disabled:opacity-50"
                      >
                        <Check className="h-3 w-3" />
                        Approve
                      </Button>
                    )}
                  </div>
                </div>
                {selectedItem === submission.id && (
                  <div className="border-t border-bone-white/10 pt-4 mt-4 space-y-4">
                    <div>
                      <div className="mb-2 text-xs text-bone-white/70 uppercase tracking-wider">
                        Full Description:
                      </div>
                      <div className="rounded border border-bone-white/10 bg-forest-obsidian p-4">
                        <p className="text-sm text-bone-white/90 leading-relaxed whitespace-pre-wrap font-mono">
                          {submission.description}
                        </p>
                      </div>
                    </div>
                    {submission.purity_doc_url && (
                      <div>
                        <div className="mb-2 text-xs text-bone-white/70 uppercase tracking-wider">
                          Purity Documentation:
                        </div>
                        <a
                          href={submission.purity_doc_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 border border-emerald-400/50 bg-emerald-400/10 text-emerald-400 hover:bg-emerald-400/20 px-4 py-2 text-xs font-mono transition-colors"
                        >
                          <Package className="h-3 w-3" />
                          {submission.purity_doc_filename || "View Document"}
                        </a>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

