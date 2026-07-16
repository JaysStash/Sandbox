"use client";

import type { OutlookResult } from "@/lib/outlookEngine";

export default function OutlookBox({ outlook }: { outlook: OutlookResult }) {
  return (
    <div
      className="sticky bottom-0 rounded-t-2xl border-t-4 bg-storm-900/95 p-5 shadow-[0_-10px_30px_rgba(0,0,0,0.5)] backdrop-blur"
      style={{ borderTopColor: outlook.categoryColor }}
    >
      <div className="flex items-center gap-2">
        <span
          className="inline-block h-3 w-3 rounded-full"
          style={{ backgroundColor: outlook.categoryColor }}
        />
        <span className="text-xs uppercase tracking-wide text-gray-400">
          Simplified Outlook
        </span>
      </div>

      <p className="mt-1 font-semibold text-[#e8ecf5]">{outlook.headline}</p>
      <p className="mt-2 text-sm text-gray-300">{outlook.explanation}</p>

      <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs text-gray-400 sm:grid-cols-5">
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
          EHI (0-1km)
        </div>
        <div>
          <div className="font-mono text-bolt-500">
            {outlook.diagnostics.ehi3.toFixed(2)}
          </div>
          EHI (0-3km)
        </div>
        <div>
          <div className="font-mono text-bolt-500">
            {outlook.diagnostics.brn.toFixed(1)}
          </div>
          BRN
        </div>
      </div>
    </div>
  );
}
