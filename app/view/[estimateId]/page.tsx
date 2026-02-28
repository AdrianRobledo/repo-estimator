"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { jsPDF } from "jspdf";
import type { EstimateData, LineItem } from "@/lib/types";

export default function ViewEstimatePage() {
  const params = useParams();
  const [estimate, setEstimate] = useState<EstimateData | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [responded, setResponded] = useState<"approved" | "declined" | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch(`/api/estimates/${params.estimateId}/public`)
      .then((r) => {
        if (!r.ok) throw new Error("Not found");
        return r.json();
      })
      .then((data) => {
        setEstimate(data);
        if (data.status === "approved" || data.status === "declined") {
          setResponded(data.status as "approved" | "declined");
        }
      })
      .catch(() => setNotFound(true));
  }, [params.estimateId]);

  async function handleResponse(status: "approved" | "declined") {
    if (!estimate || submitting) return;
    setSubmitting(true);
    await fetch(`/api/estimates/${estimate.id}/respond`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setResponded(status);
    setSubmitting(false);
  }

  function generatePDF() {
    if (!estimate) return;
    const est = estimate;
    const prof = est.profile;
    const doc = new jsPDF({ unit: "pt", format: "letter" });
    const pw = doc.internal.pageSize.getWidth();
    const ph = doc.internal.pageSize.getHeight();
    const margin = 48;
    const cw = pw - margin * 2;
    let y = 0;

    const green = { r: 5, g: 150, b: 105 };
    const darkGreen = { r: 4, g: 120, b: 87 };
    const navy = { r: 15, g: 23, b: 42 };
    const dark = { r: 30, g: 41, b: 59 };
    const slate = { r: 100, g: 116, b: 139 };
    const lightSlate = { r: 148, g: 163, b: 184 };
    const grayBg = { r: 248, g: 250, b: 252 };
    const grayLine = { r: 226, g: 232, b: 240 };

    y = margin;
    let logoEndX = margin;
    if (prof?.logo) {
      try { doc.addImage(prof.logo, "JPEG", margin, y - 8, 52, 52); logoEndX = margin + 62; } catch { /* skip */ }
    }
    if (prof) {
      doc.setFont("helvetica", "bold"); doc.setFontSize(20); doc.setTextColor(navy.r, navy.g, navy.b);
      doc.text(prof.businessName || "", logoEndX, y + 12);
      doc.setFont("helvetica", "normal"); doc.setFontSize(8.5); doc.setTextColor(slate.r, slate.g, slate.b);
      const contactLeft = [prof.ownerName, prof.phone].filter(Boolean).join("  \u00B7  ");
      if (contactLeft) doc.text(contactLeft, logoEndX, y + 28);
      if (prof.email) doc.text(prof.email, logoEndX, y + 40);
      if (prof.address) doc.text(prof.address, logoEndX, y + 52);
      const rightContact = [prof.phone, prof.email].filter(Boolean);
      if (rightContact.length) {
        doc.setFontSize(8.5); doc.setTextColor(lightSlate.r, lightSlate.g, lightSlate.b);
        let ry = y + 12;
        rightContact.forEach((line) => { doc.text(line!, pw - margin, ry, { align: "right" }); ry += 12; });
      }
    }
    y += 56;

    doc.setFillColor(green.r, green.g, green.b); doc.rect(0, y, pw, 4, "F"); y += 20;

    doc.setFont("helvetica", "bold"); doc.setFontSize(28); doc.setTextColor(navy.r, navy.g, navy.b);
    doc.text("ESTIMATE", margin, y + 4);
    doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor(slate.r, slate.g, slate.b);
    doc.text("Estimate No.", pw - margin - 120, y - 8);
    doc.setFont("helvetica", "bold"); doc.setTextColor(dark.r, dark.g, dark.b);
    doc.text(est.estimateNumber, pw - margin, y - 8, { align: "right" });
    doc.setFont("helvetica", "normal"); doc.setTextColor(slate.r, slate.g, slate.b);
    doc.text("Date", pw - margin - 120, y + 6);
    doc.setTextColor(dark.r, dark.g, dark.b); doc.text(est.date, pw - margin, y + 6, { align: "right" });
    y += 40;

    doc.setFillColor(grayBg.r, grayBg.g, grayBg.b); doc.setDrawColor(grayLine.r, grayLine.g, grayLine.b); doc.setLineWidth(0.75);
    const boxH = 80; doc.roundedRect(margin, y, cw, boxH, 6, 6, "FD");
    doc.setFontSize(7.5); doc.setFont("helvetica", "bold"); doc.setTextColor(green.r, green.g, green.b);
    doc.text("PREPARED FOR", margin + 14, y + 16);
    doc.setFont("helvetica", "normal"); doc.setTextColor(dark.r, dark.g, dark.b); doc.setFontSize(10);
    let cy = y + 32;
    if (est.customer.name) { doc.setFont("helvetica", "bold"); doc.text(est.customer.name, margin + 14, cy); doc.setFont("helvetica", "normal"); cy += 14; }
    if (est.customer.address) { doc.setTextColor(slate.r, slate.g, slate.b); doc.text(est.customer.address, margin + 14, cy); cy += 14; }
    const custContact = [est.customer.phone, est.customer.email].filter(Boolean).join("  \u00B7  ");
    if (custContact) { doc.setTextColor(slate.r, slate.g, slate.b); doc.setFontSize(9); doc.text(custContact, margin + 14, cy); }
    y += boxH + 20;

    const colDesc = margin; const colQty = margin + cw * 0.52; const colPrice = margin + cw * 0.72; const colAmount = pw - margin; const rowH = 30;
    doc.setFillColor(darkGreen.r, darkGreen.g, darkGreen.b); doc.roundedRect(margin, y, cw, rowH, 4, 4, "F");
    doc.setFillColor(darkGreen.r, darkGreen.g, darkGreen.b); doc.rect(margin, y + rowH - 6, cw, 6, "F");
    doc.setFontSize(7.5); doc.setFont("helvetica", "bold"); doc.setTextColor(255, 255, 255);
    doc.text("DESCRIPTION", colDesc + 12, y + 19); doc.text("QTY", colQty, y + 19, { align: "right" });
    doc.text("UNIT PRICE", colPrice, y + 19, { align: "right" }); doc.text("AMOUNT", colAmount - 12, y + 19, { align: "right" });
    y += rowH;

    doc.setFontSize(9);
    const total = est.total;
    est.items.forEach((item: LineItem, i: number) => {
      const qty = parseFloat(item.quantity) || 0; const price = parseFloat(item.price) || 0; const amount = qty * price;
      if (y > ph - 150) { doc.addPage(); y = margin; }
      if (i % 2 === 0) { doc.setFillColor(grayBg.r, grayBg.g, grayBg.b); doc.rect(margin, y, cw, rowH, "F"); }
      doc.setFillColor(green.r, green.g, green.b); doc.rect(margin, y, 2, rowH, "F");
      doc.setFont("helvetica", "normal"); doc.setTextColor(dark.r, dark.g, dark.b); doc.text(item.description || "\u2014", colDesc + 12, y + 19);
      doc.setTextColor(slate.r, slate.g, slate.b); doc.text(qty.toString(), colQty, y + 19, { align: "right" });
      doc.text(`$${price.toFixed(2)}`, colPrice, y + 19, { align: "right" });
      doc.setFont("helvetica", "bold"); doc.setTextColor(dark.r, dark.g, dark.b); doc.text(`$${amount.toFixed(2)}`, colAmount - 12, y + 19, { align: "right" });
      y += rowH;
      doc.setDrawColor(grayLine.r, grayLine.g, grayLine.b); doc.setLineWidth(0.5); doc.line(margin, y, pw - margin, y);
    });
    y += 12;

    const totalsX = pw - margin - 200; const totalsValX = pw - margin - 12;
    doc.setFontSize(9); doc.setFont("helvetica", "normal"); doc.setTextColor(slate.r, slate.g, slate.b);
    doc.text("Subtotal", totalsX, y + 14); doc.setTextColor(dark.r, dark.g, dark.b); doc.text(`$${total.toFixed(2)}`, totalsValX, y + 14, { align: "right" }); y += 24;
    doc.setDrawColor(grayLine.r, grayLine.g, grayLine.b); doc.setLineWidth(0.5); doc.line(totalsX, y, pw - margin, y); y += 4;
    doc.setFillColor(green.r, green.g, green.b); doc.roundedRect(totalsX - 10, y, 222, 38, 6, 6, "F");
    doc.setFontSize(11); doc.setFont("helvetica", "bold"); doc.setTextColor(255, 255, 255);
    doc.text("TOTAL DUE", totalsX + 6, y + 24); doc.setFontSize(16); doc.text(`$${total.toFixed(2)}`, totalsValX, y + 24, { align: "right" }); y += 56;

    if (est.notes) {
      if (y > ph - 140) { doc.addPage(); y = margin; }
      doc.setFillColor(grayBg.r, grayBg.g, grayBg.b); doc.setDrawColor(grayLine.r, grayLine.g, grayLine.b); doc.setLineWidth(0.5);
      const noteLines = doc.splitTextToSize(est.notes, cw - 28); const notesBoxH = 34 + noteLines.length * 12;
      doc.roundedRect(margin, y, cw, notesBoxH, 4, 4, "FD");
      doc.setFillColor(green.r, green.g, green.b); doc.rect(margin, y + 4, 3, notesBoxH - 8, "F");
      doc.setFontSize(7.5); doc.setFont("helvetica", "bold"); doc.setTextColor(green.r, green.g, green.b); doc.text("NOTES", margin + 14, y + 16);
      doc.setFont("helvetica", "normal"); doc.setTextColor(slate.r, slate.g, slate.b); doc.setFontSize(8.5);
      let ny = y + 30; noteLines.forEach((line: string) => { doc.text(line, margin + 14, ny); ny += 12; });
      y += notesBoxH + 16;
    }

    if (y > ph - 120) { doc.addPage(); y = margin; }
    doc.setDrawColor(grayLine.r, grayLine.g, grayLine.b); doc.setLineWidth(0.5); doc.line(margin, y, pw - margin, y); y += 16;
    doc.setFontSize(7.5); doc.setFont("helvetica", "bold"); doc.setTextColor(navy.r, navy.g, navy.b); doc.text("TERMS & CONDITIONS", margin, y); y += 14;
    doc.setFont("helvetica", "normal"); doc.setTextColor(slate.r, slate.g, slate.b); doc.setFontSize(8);
    const terms = ["This estimate is valid for 30 days from the date of issue.", "Payment is due upon completion unless otherwise agreed in writing.", "Prices are subject to change if scope of work changes."];
    terms.forEach((line) => { doc.text(`\u2022  ${line}`, margin, y); y += 13; });

    const footY = ph - 44;
    doc.setFillColor(navy.r, navy.g, navy.b); doc.rect(0, footY, pw, 44, "F");
    doc.setFillColor(green.r, green.g, green.b); doc.rect(0, footY, pw, 2, "F");
    doc.setFontSize(8.5); doc.setFont("helvetica", "normal"); doc.setTextColor(200, 215, 235);
    doc.text("This estimate is valid for 30 days  \u00B7  Powered by Preciso", pw / 2, footY + 26, { align: "center" });

    doc.save(`${est.estimateNumber}.pdf`);
  }

  if (notFound) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="px-6 text-center">
          <p className="text-lg font-semibold text-gray-800">Estimate not found</p>
          <p className="mt-1 text-sm text-gray-500">
            This link may be invalid or the estimate is no longer available.
          </p>
        </div>
      </div>
    );
  }

  if (!estimate) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-200 border-t-gray-600" />
      </div>
    );
  }

  const profile = estimate.profile;

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="mx-auto max-w-2xl px-4 py-8 sm:py-12">
        {/* Document card */}
        <div className="overflow-hidden rounded-lg bg-white shadow-sm ring-1 ring-gray-200">

          {/* Business header */}
          <div className="border-b border-gray-200 px-6 py-6 sm:px-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-center gap-4">
                {profile?.logo && (
                  <img
                    src={profile.logo}
                    alt={profile.businessName || "Logo"}
                    className="h-14 w-14 rounded-lg object-cover"
                  />
                )}
                <div>
                  <p className="text-xl font-bold text-gray-900">
                    {profile?.businessName}
                  </p>
                  {profile?.ownerName && (
                    <p className="text-sm text-gray-500">{profile.ownerName}</p>
                  )}
                </div>
              </div>
              <div className="text-sm text-gray-500 sm:text-right">
                {profile?.address && <p>{profile.address}</p>}
                {profile?.phone && <p>{profile.phone}</p>}
                {profile?.email && <p>{profile.email}</p>}
              </div>
            </div>
          </div>

          {/* ESTIMATE title row */}
          <div className="border-b border-gray-200 bg-gray-50 px-6 py-4 sm:px-8">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold tracking-tight text-gray-900">
                ESTIMATE
              </h1>
              <div className="text-right">
                <p className="text-sm text-gray-500">
                  {estimate.estimateNumber}
                </p>
                <p className="text-sm text-gray-500">{estimate.date}</p>
              </div>
            </div>
          </div>

          {/* Prepared For */}
          {(estimate.customer.name || estimate.customer.address) && (
            <div className="border-b border-gray-200 px-6 py-5 sm:px-8">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                Prepared For
              </p>
              <div className="mt-2">
                {estimate.customer.name && (
                  <p className="text-base font-semibold text-gray-900">
                    {estimate.customer.name}
                  </p>
                )}
                {estimate.customer.address && (
                  <p className="text-sm text-gray-600">
                    {estimate.customer.address}
                  </p>
                )}
                {estimate.customer.phone && (
                  <p className="mt-1 text-sm text-gray-500">{estimate.customer.phone}</p>
                )}
                {estimate.customer.email && (
                  <p className="text-sm text-gray-500">{estimate.customer.email}</p>
                )}
              </div>
            </div>
          )}

          {/* Line items — mobile cards */}
          <div className="px-6 sm:hidden">
            <div className="divide-y divide-gray-100">
              {estimate.items.map((item) => {
                const qty = parseFloat(item.quantity) || 0;
                const price = parseFloat(item.price) || 0;
                const amount = qty * price;
                return (
                  <div key={item.id} className="flex items-start justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <p className="text-sm text-gray-800">{item.description || "\u2014"}</p>
                      <p className="mt-0.5 text-xs text-gray-400">
                        {qty} \u00D7 ${price.toFixed(2)}
                      </p>
                    </div>
                    <p className="shrink-0 text-sm font-medium text-gray-900">
                      ${amount.toFixed(2)}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Line items — desktop table */}
          <div className="px-6 sm:px-8">
            <table className="hidden w-full sm:table">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="py-3 pr-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Description
                  </th>
                  <th className="w-16 py-3 px-2 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Qty
                  </th>
                  <th className="w-24 py-3 px-2 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Price
                  </th>
                  <th className="w-24 py-3 pl-2 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody>
                {estimate.items.map((item, i) => {
                  const qty = parseFloat(item.quantity) || 0;
                  const price = parseFloat(item.price) || 0;
                  const amount = qty * price;
                  return (
                    <tr
                      key={item.id}
                      className={
                        i < estimate.items.length - 1
                          ? "border-b border-gray-100"
                          : ""
                      }
                    >
                      <td className="py-3 pr-3 text-sm text-gray-800">
                        {item.description || "\u2014"}
                      </td>
                      <td className="py-3 px-2 text-right text-sm text-gray-600">
                        {qty}
                      </td>
                      <td className="py-3 px-2 text-right text-sm text-gray-600">
                        ${price.toFixed(2)}
                      </td>
                      <td className="py-3 pl-2 text-right text-sm font-medium text-gray-900">
                        ${amount.toFixed(2)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Total */}
          <div className="border-t-2 border-gray-900 mx-6 sm:mx-8" />
          <div className="flex items-center justify-between px-6 py-5 sm:px-8">
            <span className="text-base font-semibold text-gray-700">
              Total Due
            </span>
            <span className="text-2xl font-bold text-gray-900">
              ${estimate.total.toFixed(2)}
            </span>
          </div>

          {/* Estimate valid note */}
          {!responded && (
            <div className="border-t border-gray-100 px-6 py-3 sm:px-8">
              <p className="text-center text-xs text-gray-400">
                This estimate is valid for 30 days from the date of issue.
              </p>
            </div>
          )}
        </div>

        {/* Action area — below the document card */}
        {!responded ? (
          <div className="mt-6 space-y-3">
            <button
              type="button"
              onClick={() => handleResponse("approved")}
              disabled={submitting}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-green-600 py-3.5 text-base font-semibold text-white transition-colors hover:bg-green-700 active:bg-green-800 disabled:opacity-60"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              Approve Estimate
            </button>
            <button
              type="button"
              onClick={() => handleResponse("declined")}
              disabled={submitting}
              className="w-full rounded-lg border border-gray-300 bg-white py-3.5 text-base font-semibold text-gray-600 transition-colors hover:bg-gray-50 active:bg-gray-100 disabled:opacity-60"
            >
              Decline
            </button>
          </div>
        ) : (
          <div className="mt-6">
            {responded === "approved" ? (
              <div className="rounded-lg border border-green-200 bg-green-50 p-6 text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                  <svg
                    className="h-6 w-6 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2.5}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <p className="text-lg font-bold text-green-800">
                  Estimate Approved!
                </p>
                <p className="mt-1 text-sm text-green-700">
                  {profile?.businessName || "The contractor"} has been notified
                  and will be in touch to schedule your work.
                </p>
              </div>
            ) : (
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-6 text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
                  <svg
                    className="h-6 w-6 text-gray-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </div>
                <p className="text-lg font-bold text-gray-800">
                  Estimate Declined
                </p>
                <p className="mt-1 text-sm text-gray-500">
                  {profile?.businessName || "The contractor"} has been notified.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Download PDF */}
        <div className="mt-4">
          <button
            type="button"
            onClick={generatePDF}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white py-3 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 active:bg-gray-100"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Download PDF
          </button>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          {(profile?.phone || profile?.email) && (
            <p className="text-xs text-gray-400">
              Questions? Contact{" "}
              {[profile?.phone, profile?.email].filter(Boolean).join(" or ")}
            </p>
          )}
          <p className="mt-1 text-xs text-gray-300">Powered by Preciso</p>
        </div>
      </div>
    </div>
  );
}
