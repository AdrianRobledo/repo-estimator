export interface TradeTemplate {
  slug: string;
  name: string;
  iconPath: string;
  extraIconPath?: string;
  items: { description: string; quantity: string; price: string }[];
}

export const tradeTemplates: TradeTemplate[] = [
  {
    slug: "plumbing",
    name: "Plumbing",
    iconPath:
      "M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z",
    items: [
      { description: "Diagnose & repair leak", quantity: "1", price: "185" },
      { description: "Replace supply valve", quantity: "1", price: "45" },
      { description: "Materials & fittings", quantity: "1", price: "65" },
    ],
  },
  {
    slug: "landscaping",
    name: "Landscaping",
    iconPath:
      "M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z",
    items: [
      { description: "Lawn mowing & edging", quantity: "1", price: "75" },
      { description: "Hedge trimming", quantity: "1", price: "120" },
      { description: "Mulch (3 yards)", quantity: "1", price: "255" },
    ],
  },
  {
    slug: "electrical",
    name: "Electrical",
    iconPath: "M13 10V3L4 14h7v7l9-11h-7z",
    items: [
      { description: "Install new outlet (x2)", quantity: "1", price: "190" },
      { description: "Replace light fixture", quantity: "1", price: "150" },
      { description: "Breaker inspection", quantity: "1", price: "125" },
    ],
  },
  {
    slug: "painting",
    name: "Painting",
    iconPath:
      "M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01",
    items: [
      { description: "Interior room (x3)", quantity: "1", price: "1050" },
      { description: "Trim & baseboards", quantity: "1", price: "200" },
      { description: "Paint & materials", quantity: "1", price: "180" },
    ],
  },
  {
    slug: "handyman",
    name: "General Handyman",
    iconPath:
      "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z",
    extraIconPath: "M15 12a3 3 0 11-6 0 3 3 0 016 0z",
    items: [
      { description: "Drywall patch (x2)", quantity: "1", price: "170" },
      { description: "Door hardware replace", quantity: "1", price: "65" },
      { description: "Labor (2 hrs)", quantity: "1", price: "150" },
    ],
  },
];
