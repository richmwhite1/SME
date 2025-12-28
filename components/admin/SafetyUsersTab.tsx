"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/ToastContainer";
import {
  addBlacklistKeyword,
  removeBlacklistKeyword,
  toggleUserBan,
  toggleSME,
  resetReputation,
} from "@/app/actions/admin-actions";
import { Shield, X, Plus, Ban, UserCheck, Search, Award, RefreshCcw } from "lucide-react";
import Button from "@/components/ui/Button";

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
}

interface SafetyUsersTabProps {
  keywords: Keyword[];
  users: User[];
}

type SubSection = "blacklist" | "users";

export default function SafetyUsersTab({ keywords, users }: SafetyUsersTabProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const [activeSection, setActiveSection] = useState<SubSection>("blacklist");
  const [newKeyword, setNewKeyword] = useState("");
  const [newKeywordReason, setNewKeywordReason] = useState("");
  const [addingKeyword, setAddingKeyword] = useState(false);
  const [removingKeyword, setRemovingKeyword] = useState<Record<string, boolean>>({});
  const [banningUser, setBanningUser] = useState<Record<string, boolean>>({});
  const [togglingSME, setTogglingSME] = useState<Record<string, boolean>>({});
  const [resettingRep, setResettingRep] = useState<Record<string, boolean>>({});
  const [searchTerm, setSearchTerm] = useState("");

  const handleAddKeyword = async () => {
    if (!newKeyword.trim()) {
      showToast("Please enter a keyword", "error");
      return;
    }

    setAddingKeyword(true);
    try {
      await addBlacklistKeyword(newKeyword.trim(), newKeywordReason.trim() || undefined);
      showToast("Keyword added to blacklist", "success");
      setNewKeyword("");
      setNewKeywordReason("");
      router.refresh();
    } catch (error: any) {
      showToast(error.message || "Failed to add keyword", "error");
    } finally {
      setAddingKeyword(false);
    }
  };

  const handleRemoveKeyword = async (keywordId: string) => {
    setRemovingKeyword((prev) => ({ ...prev, [keywordId]: true }));
    try {
      await removeBlacklistKeyword(keywordId);
      showToast("Keyword removed from blacklist", "success");
      router.refresh();
    } catch (error: any) {
      showToast(error.message || "Failed to remove keyword", "error");
    } finally {
      setRemovingKeyword((prev) => ({ ...prev, [keywordId]: false }));
    }
  };

  const handleToggleBan = async (userId: string, isBanned: boolean) => {
    setBanningUser((prev) => ({ ...prev, [userId]: true }));
    try {
      const reason = isBanned
        ? prompt("Enter ban reason (optional):") || undefined
        : undefined;
      await toggleUserBan(userId, !isBanned, reason);
      showToast(`User ${!isBanned ? "banned" : "unbanned"} successfully`, "success");
      router.refresh();
    } catch (error: any) {
      showToast(error.message || "Failed to update user ban status", "error");
    } finally {
      setBanningUser((prev) => ({ ...prev, [userId]: false }));
    }
  };

  const handleToggleSME = async (userId: string, isSme: boolean) => {
    setTogglingSME((prev) => ({ ...prev, [userId]: true }));
    try {
      await toggleSME(userId, !isSme);
      showToast(`User SME status ${!isSme ? "granted" : "revoked"}`, "success");
      router.refresh();
    } catch (error: any) {
      showToast(error.message || "Failed to update SME status", "error");
    } finally {
      setTogglingSME((prev) => ({ ...prev, [userId]: false }));
    }
  };

  const handleResetReputation = async (userId: string) => {
    if (!confirm("Are you sure you want to reset this user's reputation to 0?")) return;
    setResettingRep((prev) => ({ ...prev, [userId]: true }));
    try {
      const reason = prompt("Enter reason for reset (optional):");
      await resetReputation(userId, reason || undefined);
      showToast("User reputation reset to 0", "success");
      router.refresh();
    } catch (error: any) {
      showToast(error.message || "Failed to reset reputation", "error");
    } finally {
      setResettingRep((prev) => ({ ...prev, [userId]: false }));
    }
  };

  const filteredUsers = users.filter((user) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      user.full_name?.toLowerCase().includes(search) ||
      user.username?.toLowerCase().includes(search) ||
      user.id.toLowerCase().includes(search)
    );
  });

  return (
    <div className="space-y-6">
      {/* Sub-section Navigation */}
      <div className="border-b border-bone-white/20">
        <nav className="flex space-x-1" aria-label="Sub-sections">
          <button
            onClick={() => setActiveSection("blacklist")}
            className={`
              flex items-center gap-2 px-4 py-2 text-sm font-mono uppercase tracking-wider
              border-b-2 transition-colors
              ${activeSection === "blacklist"
                ? "border-emerald-400 text-emerald-400"
                : "border-transparent text-bone-white/70 hover:text-bone-white hover:border-bone-white/30"
              }
            `}
          >
            <Shield className="h-4 w-4" />
            Blacklist Management ({keywords.length})
          </button>
          <button
            onClick={() => setActiveSection("users")}
            className={`
              flex items-center gap-2 px-4 py-2 text-sm font-mono uppercase tracking-wider
              border-b-2 transition-colors
              ${activeSection === "users"
                ? "border-emerald-400 text-emerald-400"
                : "border-transparent text-bone-white/70 hover:text-bone-white hover:border-bone-white/30"
              }
            `}
          >
            <UserCheck className="h-4 w-4" />
            User Directory ({users.length})
          </button>
        </nav>
      </div>

      {/* Blacklist Management */}
      {activeSection === "blacklist" && (
        <div className="space-y-6">
          {/* Add Keyword Form */}
          <div className="border border-bone-white/20 bg-bone-white/5 p-6 font-mono">
            <h3 className="text-lg font-semibold text-bone-white mb-4 uppercase tracking-wider">
              Add Blacklist Keyword
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-bone-white/70 mb-1 uppercase tracking-wider">
                  Keyword
                </label>
                <input
                  type="text"
                  value={newKeyword}
                  onChange={(e) => setNewKeyword(e.target.value)}
                  placeholder="e.g., competitor.com or DISCOUNT20"
                  className="w-full bg-forest-obsidian border border-bone-white/20 text-bone-white p-2 rounded text-sm font-mono"
                />
              </div>
              <div>
                <label className="block text-xs text-bone-white/70 mb-1 uppercase tracking-wider">
                  Reason (Optional)
                </label>
                <input
                  type="text"
                  value={newKeywordReason}
                  onChange={(e) => setNewKeywordReason(e.target.value)}
                  placeholder="e.g., Competitor URL or Spam discount code"
                  className="w-full bg-forest-obsidian border border-bone-white/20 text-bone-white p-2 rounded text-sm font-mono"
                />
              </div>
              <Button
                onClick={handleAddKeyword}
                disabled={addingKeyword || !newKeyword.trim()}
                className="flex items-center gap-2 border-emerald-400/50 bg-emerald-400/10 text-emerald-400 hover:bg-emerald-400/20 text-xs font-mono px-4 py-2 transition-colors disabled:opacity-50"
              >
                {addingKeyword ? (
                  <>
                    <div className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Adding...
                  </>
                ) : (
                  <>
                    <Plus className="h-3 w-3" />
                    Add Keyword
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Keywords List */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-bone-white font-mono uppercase tracking-wider">
              Active Keywords ({keywords.length})
            </h3>
            {keywords.length === 0 ? (
              <div className="border border-bone-white/20 bg-bone-white/5 p-8 text-center">
                <Shield className="h-8 w-8 text-bone-white/30 mx-auto mb-2" />
                <p className="text-sm text-bone-white/70 font-mono">No blacklisted keywords</p>
              </div>
            ) : (
              keywords.map((keyword) => (
                <div
                  key={keyword.id}
                  className="border border-bone-white/20 bg-bone-white/5 p-4 font-mono flex items-center justify-between"
                >
                  <div>
                    <p className="text-sm font-semibold text-bone-white">{keyword.keyword}</p>
                    {keyword.reason && (
                      <p className="text-xs text-bone-white/50 mt-1">{keyword.reason}</p>
                    )}
                  </div>
                  <Button
                    onClick={() => handleRemoveKeyword(keyword.id)}
                    disabled={removingKeyword[keyword.id]}
                    className="flex items-center gap-2 border-red-500/50 bg-red-500/10 text-red-400 hover:bg-red-500/20 text-xs font-mono px-3 py-1.5 transition-colors disabled:opacity-50"
                  >
                    {removingKeyword[keyword.id] ? (
                      <>
                        <div className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        Removing...
                      </>
                    ) : (
                      <>
                        <X className="h-3 w-3" />
                        Remove
                      </>
                    )}
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* SME Management */}
      {activeSection === "users" && (
        <div className="space-y-6">
          {/* Search */}
          <div className="border border-bone-white/20 bg-bone-white/5 p-4 font-mono">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-bone-white/70" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name, username, or ID..."
                className="flex-1 bg-forest-obsidian border border-bone-white/20 text-bone-white p-2 rounded text-sm font-mono"
              />
            </div>
          </div>

          {/* Users List */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-bone-white font-mono uppercase tracking-wider">
              Users ({filteredUsers.length})
            </h3>
            {filteredUsers.length === 0 ? (
              <div className="border border-bone-white/20 bg-bone-white/5 p-8 text-center">
                <UserCheck className="h-8 w-8 text-bone-white/30 mx-auto mb-2" />
                <p className="text-sm text-bone-white/70 font-mono">No users found</p>
              </div>
            ) : (
              filteredUsers.map((user) => (
                <div
                  key={user.id}
                  className="border border-bone-white/20 bg-bone-white/5 p-4 font-mono"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        {user.username ? (
                          <a
                            href={`/u/${user.username}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm font-semibold text-emerald-400 hover:text-emerald-300 hover:underline flex items-center gap-1"
                          >
                            {user.full_name || "Anonymous"}
                            <span className="text-xs text-bone-white/50 no-underline">(@{user.username})</span>
                          </a>
                        ) : (
                          <p className="text-sm font-semibold text-bone-white">
                            {user.full_name || "Anonymous"}
                          </p>
                        )}

                        {user.is_sme && (
                          <span className="border border-emerald-400/50 bg-emerald-400/10 px-2 py-0.5 text-[10px] uppercase tracking-wider text-emerald-400 flex items-center gap-1">
                            <Award className="h-3 w-3" /> SME
                          </span>
                        )}
                        {user.is_banned ? (
                          <span className="border border-red-500/50 bg-red-500/10 px-2 py-0.5 text-[10px] uppercase tracking-wider text-red-400">
                            BANNED
                          </span>
                        ) : (
                          <span className="border border-emerald-500/30 bg-emerald-500/5 px-2 py-0.5 text-[10px] uppercase tracking-wider text-emerald-500/70">
                            ACTIVE
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-bone-white/40 font-mono mt-1">
                        ID: {user.id.slice(0, 8)}...
                      </p>
                      <p className="text-xs text-bone-white/50 mt-1">
                        Reputation: <span className="text-bone-white">{user.reputation_score || 0}</span>
                      </p>
                      {user.is_banned && user.ban_reason && (
                        <p className="text-xs text-red-400/70 mt-1">Reason: {user.ban_reason}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {user.username && (
                        <a
                          href={`/u/${user.username}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-xs font-mono px-3 py-1.5 transition-colors border border-bone-white/20 bg-bone-white/5 text-bone-white/70 hover:bg-bone-white/10 hover:text-bone-white"
                          title="View Profile"
                        >
                          View Profile
                        </a>
                      )}

                      <Button
                        onClick={() => handleToggleSME(user.id, user.is_sme)}
                        disabled={togglingSME[user.id] || user.is_banned}
                        className={`flex items-center gap-2 text-xs font-mono px-3 py-1.5 transition-colors disabled:opacity-50 border border-bone-white/20 bg-bone-white/5 text-bone-white/70 hover:bg-bone-white/10`}
                        title={user.is_sme ? "Revoke SME Status" : "Grant SME Status"}
                      >
                        {togglingSME[user.id] ? (
                          <div className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        ) : (
                          <Award className={`h-3 w-3 ${user.is_sme ? "text-emerald-400" : "text-bone-white/30"}`} />
                        )}
                      </Button>

                      <Button
                        onClick={() => handleResetReputation(user.id)}
                        disabled={resettingRep[user.id] || user.reputation_score === 0}
                        className="flex items-center gap-2 text-xs font-mono px-3 py-1.5 transition-colors disabled:opacity-50 border border-bone-white/20 bg-bone-white/5 text-bone-white/70 hover:bg-bone-white/10"
                        title="Reset Reputation"
                      >
                        {resettingRep[user.id] ? (
                          <div className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        ) : (
                          <RefreshCcw className="h-3 w-3" />
                        )}
                      </Button>

                      <Button
                        onClick={() => handleToggleBan(user.id, user.is_banned)}
                        disabled={banningUser[user.id]}
                        className={`flex items-center gap-2 text-xs font-mono px-3 py-1.5 transition-colors disabled:opacity-50 ${user.is_banned
                          ? "border-emerald-400/50 bg-emerald-400/10 text-emerald-400 hover:bg-emerald-400/20"
                          : "border-red-500/50 bg-red-500/10 text-red-400 hover:bg-red-500/20"
                          }`}
                      >
                        {banningUser[user.id] ? (
                          <>
                            <div className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                            {user.is_banned ? "Unbanning..." : "Banning..."}
                          </>
                        ) : (
                          <>
                            {user.is_banned ? (
                              <>
                                <UserCheck className="h-3 w-3" />
                                Activate
                              </>
                            ) : (
                              <>
                                <Ban className="h-3 w-3" />
                                Deactivate
                              </>
                            )}
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

