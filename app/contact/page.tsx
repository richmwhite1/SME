"use client";

import { useState } from "react";
import { Mail, MessageSquare, Send } from "lucide-react";
import Link from "next/link"; // Added Link
import { submitContactForm } from "@/app/actions/intake-actions";
import { useToast } from "@/components/ui/ToastContainer";
import Button from "@/components/ui/Button";
import GetCertifiedModal from "@/components/intake/GetCertifiedModal";

export default function ContactPage() {
  const { showToast } = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showGetCertified, setShowGetCertified] = useState(false);
  // Removed showListProduct state

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await submitContactForm(name, email, subject, message);
      showToast("Message sent successfully", "success");
      setName("");
      setEmail("");
      setSubject("");
      setMessage("");
    } catch (error: any) {
      showToast(error.message || "Failed to send message", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-forest-obsidian px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="mb-4 font-mono text-4xl font-bold text-bone-white sm:text-5xl">
            CONTACT US
          </h1>
          <p className="text-lg text-bone-white/70 font-mono sm:text-xl">
            Get in touch with the Laboratory
          </p>
        </div>

        {/* Quick Actions */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2">
          <button
            onClick={() => setShowGetCertified(true)}
            className="border border-sme-gold bg-sme-gold/10 p-6 text-left transition-all hover:border-sme-gold/70 hover:bg-sme-gold/20 font-mono"
          >
            <h3 className="mb-2 text-lg font-semibold text-sme-gold uppercase tracking-wider">
              Get Certified
            </h3>
            <p className="text-sm text-bone-white/70">
              Apply for SME Certification for your brand
            </p>
          </button>

          <Link
            href="/products/submit"
            className="block border border-emerald-400/50 bg-emerald-400/10 p-6 text-left transition-all hover:border-emerald-400/70 hover:bg-emerald-400/20 font-mono"
          >
            <h3 className="mb-2 text-lg font-semibold text-emerald-400 uppercase tracking-wider">
              List Your Product
            </h3>
            <p className="text-sm text-bone-white/70">
              Submit your product for listing on the platform
            </p>
          </Link>
        </div>

        {/* Contact Form */}
        <div className="border border-bone-white/20 bg-bone-white/5 p-6 sm:p-8 font-mono">
          <div className="mb-6 flex items-center gap-3">
            <MessageSquare className="h-6 w-6 text-emerald-400" />
            <h2 className="text-xl font-semibold text-bone-white uppercase tracking-wider">
              Send a Message
            </h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-xs text-bone-white/70 uppercase tracking-wider">
                Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full bg-forest-obsidian border border-translucent-emerald px-3 py-2 text-sm text-bone-white placeholder-bone-white/50 focus:border-heart-green focus:outline-none transition-all font-mono"
                placeholder="Your name"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs text-bone-white/70 uppercase tracking-wider">
                Email *
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-forest-obsidian border border-translucent-emerald px-3 py-2 text-sm text-bone-white placeholder-bone-white/50 focus:border-heart-green focus:outline-none transition-all font-mono"
                placeholder="your@email.com"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs text-bone-white/70 uppercase tracking-wider">
                Subject
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full bg-forest-obsidian border border-translucent-emerald px-3 py-2 text-sm text-bone-white placeholder-bone-white/50 focus:border-heart-green focus:outline-none transition-all font-mono"
                placeholder="What is this regarding?"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs text-bone-white/70 uppercase tracking-wider">
                Message *
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
                rows={6}
                className="w-full bg-forest-obsidian border border-translucent-emerald px-3 py-2 text-sm text-bone-white placeholder-bone-white/50 focus:border-heart-green focus:outline-none transition-all font-mono resize-none"
                placeholder="Your message..."
              />
            </div>

            <Button
              type="submit"
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 border-emerald-400/50 bg-emerald-400/10 text-emerald-400 hover:bg-emerald-400/20 text-xs font-mono px-4 py-2 transition-colors disabled:opacity-50"
            >
              {submitting ? (
                "Sending..."
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Send Message
                </>
              )}
            </Button>
          </form>
        </div>
      </div>

      {/* Modals */}
      <GetCertifiedModal
        isOpen={showGetCertified}
        onClose={() => setShowGetCertified(false)}
      />
    </main>
  );
}
