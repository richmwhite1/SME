"use client";

import { useState } from "react";
import { Package, AlertTriangle, Users, Award, Shield, Inbox, Building2 } from "lucide-react";
import AdminDashboardClient from "./AdminDashboardClient";
import ModerationClient from "./ModerationClient";
import SafetyUsersTab from "./SafetyUsersTab";
import IntakeTab from "./IntakeTab";
import BrandIntakeTab from "./BrandIntakeTab";
import SMEAuditTab from "./SMEAuditTab";
import { restoreFromQueue, purgeFromQueue } from "@/app/actions/admin-actions";

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
}

interface FlaggedContent {
  discussions: any[];
  reviews: any[];
  discussionComments: any[];
  productComments: any[];
  errors: any;
}

interface QueueItem {
  id: string;
  original_comment_id: string;
  comment_type: "discussion" | "product";
  discussion_id: string | null;
  protocol_id: string | null;
  author_id: string | null;
  guest_name: string | null;
  content: string;
  flag_count: number;
  original_created_at: string;
  queued_at: string;
  parent_id: string | null;
  discussions?: {
    title: string;
    slug: string;
  } | null;
  protocols?: {
    title: string;
    slug: string;
  } | null;
  profiles?: {
    full_name: string | null;
    username: string | null;
  } | null;
}

interface Keyword {
  id: string;
  keyword: string;
  reason: string | null;
  created_at: string;
}

interface User {
  id: string;
  full_name: string | null;
  username: string | null;
  is_banned: boolean;
  banned_at: string | null;
  ban_reason: string | null;
  created_at: string;
  reputation_score: number;
  is_sme: boolean;
  user_role: 'standard' | 'sme' | 'sme_admin' | 'admin' | 'business_user';
}

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

interface BrandVerification {
  id: string;
  product_id: string;
  product_title: string;
  product_slug: string;
  user_id: string;
  user_name: string;
  user_email: string;
  work_email: string;
  linkedin_profile: string;
  company_website: string;
  subscription_status: string;
  created_at: string;
}

interface SMECertification {
  id: string;
  product_id: string;
  product_title: string;
  product_slug: string;
  brand_owner_id: string;
  brand_owner_name: string;
  lab_report_urls: string[];
  purity_data_urls: string[];
  payment_status: string;
  status: string;
  created_at: string;
}

interface UnifiedAdminClientProps {
  products: Product[];
  flaggedContent: FlaggedContent;
  queueItems: QueueItem[];
  keywords: Keyword[];
  users: User[];
  contactSubmissions: ContactSubmission[];
  brandApplications: BrandApplication[];
  productIntake: ProductIntake[];
  brandVerifications: BrandVerification[];
  smeCertifications: SMECertification[];
}

type Tab = "products" | "moderation" | "safety" | "intake" | "brand_intake" | "certifications";

export default function UnifiedAdminClient({
  products,
  flaggedContent,
  queueItems,
  keywords,
  users,
  contactSubmissions,
  brandApplications,
  productIntake,
  brandVerifications,
  smeCertifications,
}: UnifiedAdminClientProps) {
  const [activeTab, setActiveTab] = useState<Tab>("products");

  const tabs = [
    { id: "products" as Tab, label: "Products", icon: Package },
    { id: "moderation" as Tab, label: "Moderation", icon: AlertTriangle },
    { id: "safety" as Tab, label: "Safety & Users", icon: Shield },
    { id: "intake" as Tab, label: "Business Intake", icon: Inbox },
    { id: "brand_intake" as Tab, label: "Brand Intake", icon: Building2 },
    { id: "certifications" as Tab, label: "SME Audit Queue", icon: Award },
  ];

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="border-b border-bone-white/20">
        <nav className="flex space-x-1 overflow-x-auto" aria-label="Tabs">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center gap-2 px-4 py-3 text-sm font-mono uppercase tracking-wider
                  border-b-2 transition-colors whitespace-nowrap
                  ${isActive
                    ? "border-emerald-400 text-emerald-400"
                    : "border-transparent text-bone-white/70 hover:text-bone-white hover:border-bone-white/30"
                  }
                `}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {activeTab === "products" && (
          <div className="space-y-6">
            {/* Product Management */}
            <AdminDashboardClient products={products} flaggedContent={flaggedContent} />
          </div>
        )}

        {activeTab === "moderation" && (
          <div className="space-y-6">
            {/* Stats */}
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="border border-bone-white/20 bg-bone-white/5 p-4 font-mono">
                <div className="flex items-center gap-2 mb-1">
                  <AlertTriangle className="h-5 w-5 text-bone-white/70" />
                  <p className="text-xs text-bone-white/70 uppercase tracking-wider">
                    Total Queued
                  </p>
                </div>
                <p className="text-2xl font-bold text-bone-white">{queueItems.length}</p>
              </div>
              <div className="border border-bone-white/20 bg-bone-white/5 p-4 font-mono">
                <div className="flex items-center gap-2 mb-1">
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                  <p className="text-xs text-bone-white/70 uppercase tracking-wider">
                    High Priority
                  </p>
                </div>
                <p className="text-2xl font-bold text-red-500">
                  {queueItems.filter((item) => item.flag_count >= 3).length}
                </p>
              </div>
              <div className="border border-bone-white/20 bg-bone-white/5 p-4 font-mono">
                <div className="flex items-center gap-2 mb-1">
                  <AlertTriangle className="h-5 w-5 text-bone-white/70" />
                  <p className="text-xs text-bone-white/70 uppercase tracking-wider">
                    Pending Review
                  </p>
                </div>
                <p className="text-2xl font-bold text-bone-white">
                  {queueItems.filter((item) => item.flag_count < 3).length}
                </p>
              </div>
            </div>

            {/* Moderation Queue */}
            {queueItems.length === 0 ? (
              <div className="border border-bone-white/20 bg-bone-white/5 p-12 text-center">
                <AlertTriangle className="h-12 w-12 text-bone-white/30 mx-auto mb-4" />
                <p className="font-mono text-lg text-bone-white/70 mb-2">ARCHIVE EMPTY</p>
                <p className="font-mono text-sm text-bone-white/50">
                  No flagged comments in moderation queue
                </p>
              </div>
            ) : (
              <ModerationClient
                queueItems={queueItems}
                flaggedContent={flaggedContent}
                restoreAction={restoreFromQueue}
                purgeAction={purgeFromQueue}
              />
            )}
          </div>
        )}

        {activeTab === "safety" && (
          <SafetyUsersTab keywords={keywords} users={users} />
        )}

        {activeTab === "intake" && (
          <IntakeTab
            contactSubmissions={contactSubmissions}
            brandApplications={brandApplications}
            productIntake={productIntake}
          />
        )}

        {activeTab === "brand_intake" && (
          <BrandIntakeTab verifications={brandVerifications} />
        )}

        {activeTab === "certifications" && (
          <SMEAuditTab certifications={smeCertifications} />
        )}
      </div>
    </div>
  );
}

