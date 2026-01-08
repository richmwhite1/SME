import Link from "next/link";
import NewsletterSignup from "@/components/newsletter/NewsletterSignup";
import SocialLinks from "@/components/social/SocialLinks";
import IntelligenceLegend from "@/components/intelligence/IntelligenceLegend";

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const version = "v1.0.4-beta";

  return (
    <footer className="border-t border-slate-200 bg-slate-900 text-white">
      <div className="container mx-auto px-6 py-12">
        {/* 4-Column Grid + Newsletter */}
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-5">
          {/* Column 1: SME Logo and Mission */}
          <div className="space-y-4">
            <Link
              href="/"
              className="inline-block font-serif text-2xl font-semibold text-white hover:text-earth-green transition-colors"
            >
              The Health SME
            </Link>
            <p className="text-sm leading-relaxed text-slate-300">
              Crowd-sourcing the future of holistic integrity
            </p>
          </div>

          {/* Column 2: Discovery */}
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-400">
              Discovery
            </h3>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/discussions"
                  className="text-sm text-slate-300 hover:text-white transition-colors"
                >
                  Top Topics
                </Link>
              </li>
              <li>
                <Link
                  href="/discussions"
                  className="text-sm leading-6 text-gray-400 hover:text-white"
                >
                  Discussions
                </Link>
              </li>
              <li>
                <Link
                  href="/leaderboard"
                  className="text-sm leading-6 text-gray-400 hover:text-white"
                >
                  Leaderboard
                </Link>
              </li>
              <li>
                <Link
                  href="/products/submit"
                  className="text-sm leading-6 text-emerald-500 hover:text-emerald-400 font-semibold"
                >
                  List Your Product
                </Link>
              </li>
              <li>
                <Link
                  href="/resources"
                  className="text-sm text-slate-300 hover:text-white transition-colors"
                >
                  SME Citations
                </Link>
              </li>
              <li>
                <Link
                  href="/standards"
                  className="text-sm text-slate-300 hover:text-white transition-colors"
                >
                  SME Standards
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: For Brands */}
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-400">
              For Brands
            </h3>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/contact"
                  className="text-sm text-slate-300 hover:text-white transition-colors"
                >
                  Get Certified
                </Link>
              </li>
              <li>
                <Link
                  href="/brand-standards"
                  className="text-sm text-slate-300 hover:text-white transition-colors"
                >
                  Brand Partner Standards
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Legal */}
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-400">
              Legal
            </h3>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/terms"
                  className="text-sm text-slate-300 hover:text-white transition-colors"
                >
                  Terms
                </Link>
              </li>
              <li>
                <Link
                  href="/disclaimer"
                  className="text-sm text-slate-300 hover:text-white transition-colors"
                >
                  Disclaimer
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="text-sm text-slate-300 hover:text-white transition-colors"
                >
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 5: Newsletter Signup */}
          <div>
            <NewsletterSignup variant="footer" />
          </div>
        </div>

        {/* Intelligence Legend */}
        <div className="mt-12 border-t border-slate-800 pt-8">
          <IntelligenceLegend />
        </div>

        {/* Bottom Bar with Copyright, Version, and Social Links */}
        <div className="mt-12 border-t border-slate-800 pt-8">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <p className="font-mono text-xs text-slate-500">
              © {currentYear} The Health SME. All rights reserved.
            </p>
            <div className="flex items-center gap-4">
              <SocialLinks variant="footer" />
              <p className="font-mono text-xs text-slate-500">
                {version}
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}



