export interface TradeTemplate {
  slug: string;
  name: string;
  category: string;
  duration: string;
  notes: string;
  items: { description: string; quantity: string; typicalPrice: string }[];
}

export const tradeTemplates: TradeTemplate[] = [
  // ── Plumbing ──────────────────────────────────────────────
  {
    slug: "faucet-replacement",
    name: "Faucet Replacement",
    category: "Plumbing",
    duration: "2-3 hrs",
    notes:
      "Price valid for 30 days. Materials may vary based on site conditions. Includes removal of existing faucet and installation of customer-selected replacement. Supply lines replaced if corroded.",
    items: [
      { description: "Remove existing faucet & prep", quantity: "1", typicalPrice: "$65-100" },
      { description: "Install new faucet & test", quantity: "1", typicalPrice: "$95-145" },
      { description: "Faucet unit (standard single-handle)", quantity: "1", typicalPrice: "$100-160" },
      { description: "Supply lines & fittings", quantity: "1", typicalPrice: "$15-35" },
      { description: "Plumber\u2019s putty & sealant", quantity: "1", typicalPrice: "$15-35" },
    ],
  },
  {
    slug: "water-heater-install",
    name: "Water Heater Install",
    category: "Plumbing",
    duration: "4-6 hrs",
    notes:
      "Price valid for 30 days. Materials may vary based on site conditions. Includes draining and removal of old unit, installation of new 50-gallon tank water heater. Permit fees not included.",
    items: [
      { description: "Drain & remove old water heater", quantity: "1", typicalPrice: "$120-180" },
      { description: "Install new unit & connect plumbing", quantity: "1", typicalPrice: "$275-425" },
      { description: "Test & inspect connections", quantity: "1", typicalPrice: "$75-125" },
      { description: "50-gal tank water heater", quantity: "1", typicalPrice: "$750-1,150" },
      { description: "Connectors, fittings & expansion tank", quantity: "1", typicalPrice: "$140-220" },
      { description: "Gas flex line or electrical whip", quantity: "1", typicalPrice: "$90-150" },
    ],
  },
  {
    slug: "drain-cleaning",
    name: "Drain Cleaning",
    category: "Plumbing",
    duration: "1-2 hrs",
    notes:
      "Price valid for 30 days. Materials may vary based on site conditions. Standard drain snake up to 50 ft. Camera inspection available at additional cost if blockage persists.",
    items: [
      { description: "Diagnose & locate blockage", quantity: "1", typicalPrice: "$50-100" },
      { description: "Snake / auger drain clearing", quantity: "1", typicalPrice: "$120-180" },
      { description: "Drain treatment solution", quantity: "1", typicalPrice: "$20-50" },
      { description: "Replacement P-trap (if needed)", quantity: "1", typicalPrice: "$25-55" },
      { description: "Clean-out cap & sealant", quantity: "1", typicalPrice: "$15-35" },
    ],
  },
  {
    slug: "toilet-replacement",
    name: "Toilet Replacement",
    category: "Plumbing",
    duration: "2-3 hrs",
    notes:
      "Price valid for 30 days. Materials may vary based on site conditions. Includes removal of existing toilet, installation of new unit, and wax ring seal. Old toilet hauled away.",
    items: [
      { description: "Remove & dispose of old toilet", quantity: "1", typicalPrice: "$50-100" },
      { description: "Install new toilet & seal", quantity: "1", typicalPrice: "$95-155" },
      { description: "Toilet (elongated, standard height)", quantity: "1", typicalPrice: "$145-225" },
      { description: "Wax ring, bolts & supply line", quantity: "1", typicalPrice: "$20-40" },
      { description: "Caulk & mounting hardware", quantity: "1", typicalPrice: "$20-50" },
    ],
  },

  // ── Landscaping ───────────────────────────────────────────
  {
    slug: "weekly-maintenance",
    name: "Weekly Maintenance",
    category: "Landscaping",
    duration: "2-3 hrs",
    notes:
      "Price valid for 30 days. Materials may vary based on site conditions. Covers standard residential lot up to 1/4 acre. Additional area billed at $45/hr.",
    items: [
      { description: "Mowing & edging", quantity: "1", typicalPrice: "$45-85" },
      { description: "Blowing walkways & driveway", quantity: "1", typicalPrice: "$15-35" },
      { description: "Weed pulling (beds)", quantity: "1", typicalPrice: "$25-55" },
      { description: "Fuel & equipment wear", quantity: "1", typicalPrice: "$15-35" },
      { description: "Lawn treatment (seasonal)", quantity: "1", typicalPrice: "$10-30" },
    ],
  },
  {
    slug: "sprinkler-repair",
    name: "Sprinkler Repair",
    category: "Landscaping",
    duration: "2-4 hrs",
    notes:
      "Price valid for 30 days. Materials may vary based on site conditions. Covers diagnosis and repair of up to 3 zones. Additional zones at $45 each.",
    items: [
      { description: "System diagnosis & leak detection", quantity: "1", typicalPrice: "$65-110" },
      { description: "Repair / replace heads & valves", quantity: "1", typicalPrice: "$70-120" },
      { description: "Sprinkler heads (x4)", quantity: "1", typicalPrice: "$35-65" },
      { description: "PVC fittings & risers", quantity: "1", typicalPrice: "$20-40" },
      { description: "Valve diaphragm / solenoid", quantity: "1", typicalPrice: "$18-36" },
    ],
  },
  {
    slug: "tree-trimming",
    name: "Tree Trimming",
    category: "Landscaping",
    duration: "3-5 hrs",
    notes:
      "Price valid for 30 days. Materials may vary based on site conditions. Price based on trees up to 30 ft. Tall or hazardous trees quoted separately. Debris hauled away.",
    items: [
      { description: "Trimming & shaping (per tree)", quantity: "1", typicalPrice: "$135-215" },
      { description: "Debris cleanup & haul-away", quantity: "1", typicalPrice: "$90-150" },
      { description: "Equipment & fuel", quantity: "1", typicalPrice: "$45-85" },
      { description: "Wound sealant", quantity: "1", typicalPrice: "$8-22" },
    ],
  },

  // ── Electrical ────────────────────────────────────────────
  {
    slug: "outlet-installation",
    name: "Outlet Installation",
    category: "Electrical",
    duration: "1-2 hrs",
    notes:
      "Price valid for 30 days. Materials may vary based on site conditions. Includes installation of one standard 15A or 20A outlet. GFCI upgrade available. Permits if required by local code.",
    items: [
      { description: "Cut-in & run wiring", quantity: "1", typicalPrice: "$70-120" },
      { description: "Install outlet & cover plate", quantity: "1", typicalPrice: "$35-75" },
      { description: "Outlet receptacle (20A)", quantity: "1", typicalPrice: "$10-25" },
      { description: "Romex wire (15 ft)", quantity: "1", typicalPrice: "$14-30" },
      { description: "Box, plate & connectors", quantity: "1", typicalPrice: "$12-28" },
    ],
  },
  {
    slug: "panel-upgrade",
    name: "Panel Upgrade",
    category: "Electrical",
    duration: "6-8 hrs",
    notes:
      "Price valid for 30 days. Materials may vary based on site conditions. Upgrade from 100A to 200A panel. Permit and inspection fees not included. Utility coordination may be required.",
    items: [
      { description: "Disconnect & remove old panel", quantity: "1", typicalPrice: "$190-310" },
      { description: "Install 200A panel & breakers", quantity: "1", typicalPrice: "$350-550" },
      { description: "Re-terminate all circuits & test", quantity: "1", typicalPrice: "$225-375" },
      { description: "200A main breaker panel", quantity: "1", typicalPrice: "$650-1,050" },
      { description: "Breakers (assorted)", quantity: "1", typicalPrice: "$190-310" },
      { description: "Wire, conduit & grounding", quantity: "1", typicalPrice: "$70-130" },
    ],
  },
  {
    slug: "ceiling-fan-install",
    name: "Ceiling Fan Install",
    category: "Electrical",
    duration: "1-2 hrs",
    notes:
      "Price valid for 30 days. Materials may vary based on site conditions. Includes mounting bracket, wiring, and assembly. Existing ceiling box must support fan weight or will be upgraded.",
    items: [
      { description: "Remove old fixture (if applicable)", quantity: "1", typicalPrice: "$20-50" },
      { description: "Install fan-rated box & mount fan", quantity: "1", typicalPrice: "$80-140" },
      { description: "Ceiling fan (52\u2033 standard)", quantity: "1", typicalPrice: "$70-120" },
      { description: "Fan-rated ceiling box", quantity: "1", typicalPrice: "$12-28" },
      { description: "Wire nuts & mounting hardware", quantity: "1", typicalPrice: "$8-22" },
    ],
  },

  // ── Painting ──────────────────────────────────────────────
  {
    slug: "interior-room",
    name: "Interior Room",
    category: "Painting",
    duration: "4-6 hrs",
    notes:
      "Price valid for 30 days. Materials may vary based on site conditions. Standard 12\u00d712 room, walls & ceiling. Two coats of premium latex paint. Furniture moved to center and covered.",
    items: [
      { description: "Surface prep, patching & taping", quantity: "1", typicalPrice: "$80-140" },
      { description: "Prime & paint walls (2 coats)", quantity: "1", typicalPrice: "$125-205" },
      { description: "Ceiling painting", quantity: "1", typicalPrice: "$60-110" },
      { description: "Premium latex paint (2 gal)", quantity: "1", typicalPrice: "$55-95" },
      { description: "Primer (1 gal)", quantity: "1", typicalPrice: "$18-38" },
      { description: "Tape, drop cloths & sundries", quantity: "1", typicalPrice: "$12-30" },
    ],
  },
  {
    slug: "exterior-house",
    name: "Exterior House",
    category: "Painting",
    duration: "3-5 days",
    notes:
      "Price valid for 30 days. Materials may vary based on site conditions. Standard 2-story home up to 2,500 sq ft. Includes pressure washing, scraping, priming bare spots, and two coats.",
    items: [
      { description: "Pressure wash & surface prep", quantity: "1", typicalPrice: "$350-550" },
      { description: "Scrape, sand & prime bare areas", quantity: "1", typicalPrice: "$425-675" },
      { description: "Apply 2 coats exterior paint", quantity: "1", typicalPrice: "$950-1,450" },
      { description: "Trim, fascia & detail work", quantity: "1", typicalPrice: "$300-500" },
      { description: "Exterior paint (15 gal)", quantity: "1", typicalPrice: "$525-825" },
      { description: "Primer (5 gal)", quantity: "1", typicalPrice: "$110-210" },
      { description: "Caulk, tape & sundries", quantity: "1", typicalPrice: "$50-100" },
    ],
  },
  {
    slug: "cabinet-refinishing",
    name: "Cabinet Refinishing",
    category: "Painting",
    duration: "2-3 days",
    notes:
      "Price valid for 30 days. Materials may vary based on site conditions. Standard kitchen (up to 20 doors/drawers). Includes degreasing, sanding, priming, and two coats. Hardware reinstalled.",
    items: [
      { description: "Remove doors, drawers & hardware", quantity: "1", typicalPrice: "$150-250" },
      { description: "Degrease, sand & prime all surfaces", quantity: "1", typicalPrice: "$300-500" },
      { description: "Apply 2 coats cabinet paint", quantity: "1", typicalPrice: "$375-625" },
      { description: "Reassemble & adjust hardware", quantity: "1", typicalPrice: "$110-190" },
      { description: "Cabinet-grade enamel paint (3 gal)", quantity: "1", typicalPrice: "$120-210" },
      { description: "Bonding primer (2 gal)", quantity: "1", typicalPrice: "$60-110" },
      { description: "Sandpaper, tack cloth & supplies", quantity: "1", typicalPrice: "$20-50" },
    ],
  },

  // ── General Handyman ──────────────────────────────────────
  {
    slug: "drywall-repair",
    name: "Drywall Repair",
    category: "General Handyman",
    duration: "2-3 hrs",
    notes:
      "Price valid for 30 days. Materials may vary based on site conditions. Covers up to 3 patches (holes up to 6\u2033). Larger damage or water-damaged areas quoted separately.",
    items: [
      { description: "Cut out damaged area & prep", quantity: "1", typicalPrice: "$45-85" },
      { description: "Patch, tape & mud (3 coats)", quantity: "1", typicalPrice: "$70-120" },
      { description: "Sand & prime patch area", quantity: "1", typicalPrice: "$30-70" },
      { description: "Drywall piece & backer", quantity: "1", typicalPrice: "$15-35" },
      { description: "Joint compound & mesh tape", quantity: "1", typicalPrice: "$18-42" },
      { description: "Primer & sandpaper", quantity: "1", typicalPrice: "$10-30" },
    ],
  },
  {
    slug: "door-installation",
    name: "Door Installation",
    category: "General Handyman",
    duration: "2-4 hrs",
    notes:
      "Price valid for 30 days. Materials may vary based on site conditions. Includes removal of old door, installation of pre-hung interior door, and hardware. Trim work included.",
    items: [
      { description: "Remove existing door & frame", quantity: "1", typicalPrice: "$35-75" },
      { description: "Install pre-hung door & shim", quantity: "1", typicalPrice: "$95-165" },
      { description: "Install trim & casing", quantity: "1", typicalPrice: "$45-85" },
      { description: "Pre-hung interior door", quantity: "1", typicalPrice: "$90-150" },
      { description: "Lockset & hinges", quantity: "1", typicalPrice: "$22-48" },
      { description: "Shims, nails & caulk", quantity: "1", typicalPrice: "$12-28" },
    ],
  },
  {
    slug: "deck-repair",
    name: "Deck Repair",
    category: "General Handyman",
    duration: "4-6 hrs",
    notes:
      "Price valid for 30 days. Materials may vary based on site conditions. Covers replacement of up to 10 damaged deck boards, fastener replacement, and post tightening. Full rebuild quoted separately.",
    items: [
      { description: "Inspect & remove damaged boards", quantity: "1", typicalPrice: "$70-120" },
      { description: "Install replacement boards", quantity: "1", typicalPrice: "$135-215" },
      { description: "Tighten posts & railing hardware", quantity: "1", typicalPrice: "$55-105" },
      { description: "Pressure-treated deck boards (x10)", quantity: "1", typicalPrice: "$200-360" },
      { description: "Deck screws & fasteners", quantity: "1", typicalPrice: "$22-48" },
      { description: "Wood sealant (1 gal)", quantity: "1", typicalPrice: "$160-260" },
    ],
  },
];
