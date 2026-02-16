"use client";

import { useState, useEffect } from "react";
import Navbar from "@/app/components/Navbar";
import type { TemplateData } from "@/lib/types";

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<TemplateData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/templates")
      .then((r) => r.json())
      .then((data) => {
        setTemplates(data);
        setLoading(false);
      });
  }, []);

  async function deleteTemplate(id: string) {
    await fetch(`/api/templates/${id}`, { method: "DELETE" });
    setTemplates(templates.filter((t) => t.id !== id));
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B0F1A]">
        <Navbar />
        <div className="flex items-center justify-center py-20">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/10 border-t-indigo-500" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0F1A]">
      <Navbar />

      <div className="mx-auto max-w-2xl px-4 py-6">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          Job Templates
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Save line items as templates to reuse across estimates.
        </p>

        {templates.length === 0 ? (
          <div className="mt-4 rounded-2xl bg-white/[0.05] backdrop-blur-xl border border-white/[0.08] p-6 text-center text-sm text-slate-500">
            No templates yet. Create one from the estimate page using &quot;Save as
            Template&quot;.
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            {templates.map((t) => (
              <div
                key={t.id}
                className="rounded-2xl bg-white/[0.05] backdrop-blur-xl border border-white/[0.08] p-4 transition-all duration-200 hover:bg-white/[0.03]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white">
                      {t.name}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {t.items.length} item{t.items.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <button
                    onClick={() => deleteTemplate(t.id)}
                    className="rounded-xl bg-rose-500/10 border border-rose-500/20 px-3 py-1.5 text-xs font-medium text-rose-400 transition-all duration-200 hover:bg-rose-500/20"
                  >
                    Delete
                  </button>
                </div>

                <div className="mt-3 space-y-1">
                  {t.items.map((item, i) => {
                    const qty = parseFloat(item.quantity) || 0;
                    const price = parseFloat(item.price) || 0;
                    return (
                      <div
                        key={i}
                        className="flex items-center justify-between text-sm"
                      >
                        <span className="text-slate-400">
                          {item.description || "—"}
                        </span>
                        <span className="text-slate-500">
                          {qty} x ${price.toFixed(2)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
