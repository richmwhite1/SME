"use client";

import { useState } from "react";
import { updateBadgeManually } from "@/app/actions/badge-actions";
import Button from "@/components/ui/Button";
import { RefreshCw, CheckCircle2, AlertCircle } from "lucide-react";

export default function BadgeDebugButton() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleUpdate = async () => {
    setLoading(true);
    setMessage(null);

    try {
      await updateBadgeManually();
      setMessage({
        type: "success",
        text: "Badge updated successfully! Refresh the page to see changes.",
      });
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Failed to update badge",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <div>
        <h3 className="mb-2 text-sm font-medium text-deep-stone">Manual Badge Update</h3>
        <p className="mb-3 text-xs text-deep-stone/60">
          Manually trigger the update_user_badge RPC function for your account. This is useful for
          testing badge logic.
        </p>
        <Button
          variant="secondary"
          onClick={handleUpdate}
          disabled={loading}
          className="flex items-center gap-2"
        >
          {loading ? (
            <>
              <RefreshCw size={16} className="animate-spin" />
              Updating...
            </>
          ) : (
            <>
              <RefreshCw size={16} />
              Update Badge
            </>
          )}
        </Button>
      </div>

      {message && (
        <div
          className={`flex items-start gap-2 rounded-lg p-3 ${
            message.type === "success"
              ? "bg-earth-green/10 text-earth-green"
              : "bg-red-50 text-red-700"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle2 size={16} className="mt-0.5 flex-shrink-0" />
          ) : (
            <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
          )}
          <p className="text-sm">{message.text}</p>
        </div>
      )}
    </div>
  );
}






