"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { jsPDF } from "jspdf";
import type { InvoiceData, LineItem } from "@/lib/types";
import { formatDisplayDate } from "@/lib/format";

export default function ViewInvoicePage() {
  const params = useParams();
  const [invoice, setInvoice] = useState<InvoiceData | null>(null);
  const [notFound, setNotFound] = useState(false);


  useEffect(() => {
    fetch(`/api/invoices/${params.invoiceId}/public`)
      .then((r) => {
        if (!r.ok) throw new Error("Not found");
        return r.json();
      })
      .then(setInvoice)
      .catch(() => setNotFound(true));
  }, [params.invoiceId]);

  function generatePDF() {
    if (!invoice) return;
    const inv = invoice;
    const prof = inv.profile;
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
    doc.text("INVOICE", margin, y + 4);
    if (inv.jobTitle) {
      doc.setFont("helvetica", "normal"); doc.setFontSize(13); doc.setTextColor(slate.r, slate.g, slate.b);
      doc.text(inv.jobTitle, margin, y + 22);
    }
    doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor(slate.r, slate.g, slate.b);
    doc.text("Invoice No.", pw - margin - 120, y - 8);
    doc.setFont("helvetica", "bold"); doc.setTextColor(dark.r, dark.g, dark.b);
    doc.text(inv.invoiceNumber, pw - margin, y - 8, { align: "right" });
    doc.setFont("helvetica", "normal"); doc.setTextColor(slate.r, slate.g, slate.b);
    doc.text("Date", pw - margin - 120, y + 6);
    doc.setTextColor(dark.r, dark.g, dark.b); doc.text(inv.date, pw - margin, y + 6, { align: "right" });
    doc.setTextColor(slate.r, slate.g, slate.b); doc.text("Due Date", pw - margin - 120, y + 20);
    doc.setTextColor(dark.r, dark.g, dark.b); doc.text(formatDisplayDate(inv.dueDate), pw - margin, y + 20, { align: "right" });
    y += 40;
    if (inv.jobTitle) y += 18;

    // Bill To box
    doc.setFillColor(grayBg.r, grayBg.g, grayBg.b); doc.setDrawColor(grayLine.r, grayLine.g, grayLine.b); doc.setLineWidth(0.75);
    const boxH = 80; doc.roundedRect(margin, y, cw, boxH, 6, 6, "FD");
    doc.setFontSize(7.5); doc.setFont("helvetica", "bold"); doc.setTextColor(green.r, green.g, green.b);
    doc.text("BILL TO", margin + 14, y + 16);
    doc.setFont("helvetica", "normal"); doc.setTextColor(dark.r, dark.g, dark.b); doc.setFontSize(10);
    let cy = y + 32;
    if (inv.customer.name) { doc.setFont("helvetica", "bold"); doc.text(inv.customer.name, margin + 14, cy); doc.setFont("helvetica", "normal"); cy += 14; }
    if (inv.customer.address) { doc.setTextColor(slate.r, slate.g, slate.b); doc.text(inv.customer.address, margin + 14, cy); cy += 14; }
    const custContact = [inv.customer.phone, inv.customer.email].filter(Boolean).join("  \u00B7  ");
    if (custContact) { doc.setTextColor(slate.r, slate.g, slate.b); doc.setFontSize(9); doc.text(custContact, margin + 14, cy); }

    // Estimate ref and status on right side of box
    doc.setFontSize(8); doc.setTextColor(slate.r, slate.g, slate.b);
    doc.text("Estimate Ref:", pw - margin - 14 - 100, y + 32);
    doc.setFont("helvetica", "bold"); doc.setTextColor(dark.r, dark.g, dark.b);
    doc.text(inv.estimateNumber, pw - margin - 14, y + 32, { align: "right" });
    doc.setFont("helvetica", "normal"); doc.setTextColor(slate.r, slate.g, slate.b);
    doc.text("Status:", pw - margin - 14 - 100, y + 46);
    const statusColor = inv.status === "paid" ? green : { r: 217, g: 119, b: 6 };
    doc.setFont("helvetica", "bold"); doc.setTextColor(statusColor.r, statusColor.g, statusColor.b);
    doc.text(inv.status === "paid" ? "Paid" : "Unpaid", pw - margin - 14, y + 46, { align: "right" });
    y += boxH + 20;

    // Table header
    const colDesc = margin; const colQty = margin + cw * 0.52; const colPrice = margin + cw * 0.72; const colAmount = pw - margin; const rowH = 30;
    doc.setFillColor(darkGreen.r, darkGreen.g, darkGreen.b); doc.roundedRect(margin, y, cw, rowH, 4, 4, "F");
    doc.setFillColor(darkGreen.r, darkGreen.g, darkGreen.b); doc.rect(margin, y + rowH - 6, cw, 6, "F");
    doc.setFontSize(7.5); doc.setFont("helvetica", "bold"); doc.setTextColor(255, 255, 255);
    doc.text("DESCRIPTION", colDesc + 12, y + 19); doc.text("QTY", colQty, y + 19, { align: "right" });
    doc.text("UNIT PRICE", colPrice, y + 19, { align: "right" }); doc.text("AMOUNT", colAmount - 12, y + 19, { align: "right" });
    y += rowH;

    // Line items
    doc.setFontSize(9);
    const total = inv.total;
    inv.items.forEach((item: LineItem, i: number) => {
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

    // Totals
    const totalsX = pw - margin - 200; const totalsValX = pw - margin - 12;
    doc.setFontSize(9); doc.setFont("helvetica", "normal"); doc.setTextColor(slate.r, slate.g, slate.b);
    doc.text("Subtotal", totalsX, y + 14); doc.setTextColor(dark.r, dark.g, dark.b); doc.text(`$${total.toFixed(2)}`, totalsValX, y + 14, { align: "right" }); y += 24;
    doc.setDrawColor(grayLine.r, grayLine.g, grayLine.b); doc.setLineWidth(0.5); doc.line(totalsX, y, pw - margin, y); y += 4;
    const totalLabel = inv.status === "paid" ? "AMOUNT PAID" : "AMOUNT DUE";
    doc.setFillColor(green.r, green.g, green.b); doc.roundedRect(totalsX - 10, y, 222, 38, 6, 6, "F");
    doc.setFontSize(11); doc.setFont("helvetica", "bold"); doc.setTextColor(255, 255, 255);
    doc.text(totalLabel, totalsX + 6, y + 24); doc.setFontSize(16); doc.text(`$${total.toFixed(2)}`, totalsValX, y + 24, { align: "right" }); y += 56;

    // Footer
    if (y > ph - 120) { doc.addPage(); y = margin; }
    doc.setDrawColor(grayLine.r, grayLine.g, grayLine.b); doc.setLineWidth(0.5); doc.line(margin, y, pw - margin, y); y += 16;
    doc.setFontSize(7.5); doc.setFont("helvetica", "bold"); doc.setTextColor(navy.r, navy.g, navy.b); doc.text("TERMS & CONDITIONS", margin, y); y += 14;
    doc.setFont("helvetica", "normal"); doc.setTextColor(slate.r, slate.g, slate.b); doc.setFontSize(8);
    const terms = [`Payment is due by ${formatDisplayDate(inv.dueDate)}.`, "Late payments may be subject to additional fees.", "Please reference the invoice number with your payment."];
    terms.forEach((line) => { doc.text(`\u2022  ${line}`, margin, y); y += 13; });

    const footY = ph - 44;
    doc.setFillColor(navy.r, navy.g, navy.b); doc.rect(0, footY, pw, 44, "F");
    doc.setFillColor(green.r, green.g, green.b); doc.rect(0, footY, pw, 2, "F");
    doc.setFontSize(8.5); doc.setFont("helvetica", "normal"); doc.setTextColor(200, 215, 235);
    doc.text(`Payment due by ${formatDisplayDate(inv.dueDate)}  \u00B7  Powered by Preciso`, pw / 2, footY + 26, { align: "center" });

    doc.save(`${inv.invoiceNumber}.pdf`);
  }

  if (notFound) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="px-6 text-center">
          <p className="text-lg font-semibold text-gray-800">Invoice not found</p>
          <p className="mt-1 text-sm text-gray-500">
            This link may be invalid or the invoice is no longer available.
          </p>
        </div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-200 border-t-gray-600" />
      </div>
    );
  }

  const profile = invoice.profile;
  const isPaid = invoice.status === "paid";

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

          {/* INVOICE title row */}
          <div className="border-b border-gray-200 bg-gray-50 px-6 py-4 sm:px-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-gray-900">
                  INVOICE
                </h1>
                {invoice.jobTitle && (
                  <p className="text-sm text-gray-600">{invoice.jobTitle}</p>
                )}
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">{invoice.invoiceNumber}</p>
                <p className="text-sm text-gray-500">{invoice.date}</p>
              </div>
            </div>
          </div>

          {/* Bill To + Details */}
          <div className="border-b border-gray-200 px-6 py-5 sm:px-8">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                  Bill To
                </p>
                <div className="mt-2">
                  {invoice.customer.name && (
                    <p className="text-base font-semibold text-gray-900">
                      {invoice.customer.name}
                    </p>
                  )}
                  {invoice.customer.address && (
                    <p className="text-sm text-gray-600">
                      {invoice.customer.address}
                    </p>
                  )}
                  {invoice.customer.phone && (
                    <p className="mt-1 text-sm text-gray-500">{invoice.customer.phone}</p>
                  )}
                  {invoice.customer.email && (
                    <p className="text-sm text-gray-500">{invoice.customer.email}</p>
                  )}
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                  Details
                </p>
                <div className="mt-2 space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Due Date</span>
                    <span className="font-medium text-gray-900">
                      {formatDisplayDate(invoice.dueDate)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Estimate Ref</span>
                    <span className="font-medium text-gray-900">
                      {invoice.estimateNumber}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Status</span>
                    <span
                      className={`font-semibold ${isPaid ? "text-green-600" : "text-amber-600"}`}
                    >
                      {isPaid ? "Paid" : "Unpaid"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Line items — mobile cards */}
          <div className="px-6 sm:hidden">
            <div className="divide-y divide-gray-100">
              {invoice.items.map((item) => {
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
                {invoice.items.map((item, i) => {
                  const qty = parseFloat(item.quantity) || 0;
                  const price = parseFloat(item.price) || 0;
                  const amount = qty * price;
                  return (
                    <tr
                      key={item.id}
                      className={
                        i < invoice.items.length - 1
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
              {isPaid ? "Amount Paid" : "Amount Due"}
            </span>
            <span className="text-2xl font-bold text-gray-900">
              ${invoice.total.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Payment status area */}
        {isPaid ? (
          <div className="mt-6">
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
              <p className="text-lg font-bold text-green-800">Payment Received</p>
              <p className="mt-1 text-sm text-green-700">
                This invoice has been paid in full. Thank you!
              </p>
            </div>
          </div>
        ) : (
          <div className="mt-6">
            <div className="rounded-lg border border-gray-200 bg-white p-6 text-center">
              <p className="text-sm font-semibold text-gray-800">
                To pay this invoice, contact {profile?.businessName || "the business"}:
              </p>
              <div className="mt-3 flex flex-col items-center gap-1.5">
                {profile?.phone && (
                  <a
                    href={`tel:${profile.phone}`}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    {profile.phone}
                  </a>
                )}
                {profile?.email && (
                  <a
                    href={`mailto:${profile.email}`}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    {profile.email}
                  </a>
                )}
              </div>
            </div>
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

        {/* Payment due footer message */}
        <div className="mt-6 text-center">
          {!isPaid && (
            <div className="text-sm text-gray-500">
              <p>Payment is due by {formatDisplayDate(invoice.dueDate)}.</p>
              {(profile?.phone || profile?.email) && (
                <p className="mt-1">
                  For payment questions, contact{" "}
                  {profile?.phone && <span>{profile.phone}</span>}
                  {profile?.phone && profile?.email && <br className="sm:hidden" />}
                  {profile?.phone && profile?.email && <span className="hidden sm:inline"> or </span>}
                  {profile?.email && <span>{profile.email}</span>}.
                </p>
              )}
            </div>
          )}
          <p className="mt-2 text-xs text-gray-300">Powered by Preciso</p>
        </div>
      </div>
    </div>
  );
}
