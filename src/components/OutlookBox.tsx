"use client";

import { useState } from "react";
import type { OutlookResult } from "@/lib/outlookEngine";

type SaveMessage = { success: boolean; message: string } | null;

type Props = {
  outlook: OutlookResult;
  onSave: () => void;
  saving: boolean;
  saveMessage?: SaveMessage;
};

export default function OutlookBox({
  outlook,
  onSave,
  saving,
  saveMessage,
}: Props) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className="rounded-t-2xl border-t-4 bg-storm-900/95 shadow-[0_-10px_30px_rgba(0,0,0,0.5)] backdrop-blur"
      style={{ borderTopColor: outlook.categoryColor }}
    >
      {/* Collapsed summary row - always visible, tap to expand */}
      <button
        onClick={() => setExpanded((e) => !e)}
        className="flex w-full items-center gap-2 px-4 py-3 text-left"
      >
        <span
          className="h-2.5 w-2.5 shrink-0 rounded-full"
          style={{ backgroundColor: outlook.categoryColor }}
        />
        <span className="min-w-0 flex-1 truncate text-sm font-medium text-[#e8ecf5]">
          {outlook.categoryLabel}
        </span>
        <span
          className={`shrink-0 text-xs text-gray-400 transition-transform ${
            expanded ? "rotate-180" : ""
          }`}
        >
          ▲
        </span>
      </button>

      {/* Expanded detail - only takes space when the user opens it */}
      {expanded && (
        <div className="px-4 pb-3">
          <p className="text-sm font-semibold text-[#e8ecf5]">
            {outlook.headline}
          </p>
          <p className="mt-1 text-xs leading-relaxed text-gray-300">
            {outlook.explanation}
          </p>
          <div className="mt-3 grid grid-cols-5 gap-1 text-center text-[10px] text-gray-400">
            <div>
              <div className="font-mono text-bolt-500">
                {outlook.diagnostics.stp.toFixed(2)}
              </div>
              STP
            </div>
            <div>
              <div className="font-mono text-bolt-500">
                {outlook.diagnostics.scp.toFixed(2)}
              </div>
              SCP
            </div>
            <div>
              <div className="font-mono text-bolt-500">
                {outlook.diagnostics.ehi1.toFixed(2)}
              </div>
              EHI-1
            </div>
            <div>
              <div className="font-mono text-bolt-500">
                {outlook.diagnostics.ehi3.toFixed(2)}
              </div>
              EHI-3
            </div>
            <div>
              <div className="font-mono text-bolt-500">
                {outlook.diagnostics.brn.toFixed(1)}
              </div>
              BRN
            </div>
          </div>
        </div>
      )}

      {/* Save action - always visible, never hidden behind expanded content */}
      <div className="border-t border-storm-700 px-4 py-3">
        {saveMessage && !saveMessage.success && (
          <p className="mb-2 text-xs text-radar-red">{saveMessage.message}</p>
        )}
        <button
          onClick={onSave}
          disabled={saving}
          className="w-full rounded-lg bg-bolt-500 py-2.5 font-semibold text-storm-950 hover:bg-bolt-400 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Storm"}
        </button>
      </div>
    </div>
  );
}
