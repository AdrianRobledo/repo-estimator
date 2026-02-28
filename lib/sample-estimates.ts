export const TRADE_TYPES = [
  "Plumbing",
  "Electrical",
  "Landscaping",
  "Painting",
  "Handyman",
  "HVAC",
  "Roofing",
  "General Contractor",
  "Other",
] as const;

export type TradeType = (typeof TRADE_TYPES)[number];

interface SampleEstimate {
  customer: { name: string; address: string; phone: string; email: string };
  items: { description: string; quantity: string; price: string }[];
  notes: string;
}

interface SampleTemplate {
  name: string;
  items: { description: string; quantity: string; price: string }[];
  clientMessage: string;
}

export const sampleEstimates: Record<string, SampleEstimate> = {
  Plumbing: {
    customer: { name: "Sarah Mitchell", address: "742 Oak Street, Austin, TX 78701", phone: "(512) 555-0147", email: "sarah.mitchell@email.com" },
    items: [
      { description: "Kitchen faucet replacement (parts + labor)", quantity: "1", price: "285" },
      { description: "Garbage disposal installation", quantity: "1", price: "195" },
      { description: "Supply line replacement", quantity: "2", price: "45" },
    ],
    notes: "All parts included in pricing. Work area will be cleaned upon completion. 1-year warranty on labor.",
  },
  Electrical: {
    customer: { name: "David Chen", address: "1580 Elm Drive, Denver, CO 80202", phone: "(303) 555-0283", email: "david.chen@email.com" },
    items: [
      { description: "Panel inspection and breaker replacement", quantity: "1", price: "350" },
      { description: "Outlet installation (GFCI)", quantity: "4", price: "85" },
      { description: "Light fixture installation", quantity: "2", price: "120" },
    ],
    notes: "All work to code. Permit fees included if required. Materials included in pricing.",
  },
  Landscaping: {
    customer: { name: "Jennifer Park", address: "2045 Maple Lane, Portland, OR 97201", phone: "(503) 555-0391", email: "jennifer.park@email.com" },
    items: [
      { description: "Front yard cleanup and mulching", quantity: "1", price: "450" },
      { description: "Hedge trimming and shaping", quantity: "1", price: "175" },
      { description: "Flower bed installation (6ft x 12ft)", quantity: "1", price: "380" },
    ],
    notes: "Plants and materials included. Debris removal included. Recommend seasonal maintenance plan for best results.",
  },
  Painting: {
    customer: { name: "Robert Garcia", address: "876 Pine Avenue, Charlotte, NC 28202", phone: "(704) 555-0518", email: "robert.garcia@email.com" },
    items: [
      { description: "Living room painting (walls + ceiling, 14x18)", quantity: "1", price: "650" },
      { description: "Hallway painting (walls only)", quantity: "1", price: "280" },
      { description: "Trim and baseboard painting", quantity: "1", price: "195" },
    ],
    notes: "Includes 2 coats of premium paint. Furniture will be covered and protected. Color consultation available at no extra charge.",
  },
  Handyman: {
    customer: { name: "Lisa Thompson", address: "3210 Cedar Road, Nashville, TN 37201", phone: "(615) 555-0672", email: "lisa.thompson@email.com" },
    items: [
      { description: "Drywall patch and repair (3 areas)", quantity: "1", price: "175" },
      { description: "Door knob replacement", quantity: "3", price: "45" },
      { description: "Shelf installation with mounting hardware", quantity: "2", price: "65" },
    ],
    notes: "All materials included. Can schedule additional work during visit if needed.",
  },
  HVAC: {
    customer: { name: "Michael Brown", address: "4560 Birch Street, Phoenix, AZ 85001", phone: "(602) 555-0834", email: "michael.brown@email.com" },
    items: [
      { description: "AC system inspection and tune-up", quantity: "1", price: "189" },
      { description: "Air filter replacement (HEPA)", quantity: "2", price: "45" },
      { description: "Ductwork cleaning (whole house)", quantity: "1", price: "395" },
    ],
    notes: "Includes full system diagnostic report. All work guaranteed for 90 days. Emergency service available.",
  },
  Roofing: {
    customer: { name: "Amanda Wilson", address: "5890 Walnut Circle, Atlanta, GA 30301", phone: "(404) 555-0956", email: "amanda.wilson@email.com" },
    items: [
      { description: "Roof inspection and damage assessment", quantity: "1", price: "150" },
      { description: "Shingle repair (10 sq ft area)", quantity: "1", price: "475" },
      { description: "Flashing repair around chimney", quantity: "1", price: "325" },
    ],
    notes: "Photo documentation of all damage provided. 5-year warranty on repairs. We work with all major insurance providers.",
  },
  "General Contractor": {
    customer: { name: "James Martinez", address: "7120 Spruce Way, San Diego, CA 92101", phone: "(619) 555-1078", email: "james.martinez@email.com" },
    items: [
      { description: "Bathroom tile installation (floor, 8x10)", quantity: "1", price: "1200" },
      { description: "Vanity and sink installation", quantity: "1", price: "550" },
      { description: "Trim and finish carpentry", quantity: "1", price: "380" },
    ],
    notes: "Materials quoted separately upon selection. Timeline: 3-5 business days. Fully licensed and insured.",
  },
  Other: {
    customer: { name: "Karen Davis", address: "9340 Ash Boulevard, Seattle, WA 98101", phone: "(206) 555-1234", email: "karen.davis@email.com" },
    items: [
      { description: "Service call and consultation", quantity: "1", price: "150" },
      { description: "Labor (per hour)", quantity: "3", price: "85" },
      { description: "Materials and supplies", quantity: "1", price: "120" },
    ],
    notes: "Estimate valid for 30 days. Additional work quoted separately. Satisfaction guaranteed.",
  },
};

export const sampleTemplates: Record<string, SampleTemplate[]> = {
  Plumbing: [
    {
      name: "Faucet Replacement",
      items: [
        { description: "Faucet replacement (parts + labor)", quantity: "1", price: "285" },
        { description: "Supply line replacement", quantity: "2", price: "45" },
      ],
      clientMessage: "Thank you for choosing us! All parts included. 1-year warranty on labor.",
    },
    {
      name: "Drain Cleaning",
      items: [
        { description: "Drain cleaning and snaking", quantity: "1", price: "175" },
        { description: "Camera inspection", quantity: "1", price: "95" },
      ],
      clientMessage: "Includes full drain inspection and cleaning. Emergency service available.",
    },
  ],
  Electrical: [
    {
      name: "Outlet Installation",
      items: [
        { description: "Outlet installation (GFCI)", quantity: "1", price: "85" },
        { description: "Wiring and connection", quantity: "1", price: "65" },
      ],
      clientMessage: "All work to code. Materials included in pricing.",
    },
    {
      name: "Light Fixture Install",
      items: [
        { description: "Light fixture installation", quantity: "1", price: "120" },
        { description: "Switch/dimmer installation", quantity: "1", price: "75" },
      ],
      clientMessage: "Fixture not included unless specified. Clean installation guaranteed.",
    },
  ],
  Landscaping: [
    {
      name: "Yard Cleanup",
      items: [
        { description: "Yard cleanup and debris removal", quantity: "1", price: "250" },
        { description: "Mulching", quantity: "1", price: "175" },
      ],
      clientMessage: "All debris removed. Plants and materials included.",
    },
    {
      name: "Lawn Maintenance",
      items: [
        { description: "Lawn mowing and edging", quantity: "1", price: "75" },
        { description: "Hedge trimming", quantity: "1", price: "95" },
      ],
      clientMessage: "Weekly or bi-weekly service available. Ask about our seasonal packages.",
    },
  ],
  Painting: [
    {
      name: "Interior Room",
      items: [
        { description: "Room painting (walls + ceiling)", quantity: "1", price: "650" },
        { description: "Trim and baseboard painting", quantity: "1", price: "195" },
      ],
      clientMessage: "Includes 2 coats of premium paint. Furniture protected during work.",
    },
    {
      name: "Exterior Touch-Up",
      items: [
        { description: "Exterior surface prep and priming", quantity: "1", price: "300" },
        { description: "Exterior painting (per side)", quantity: "1", price: "450" },
      ],
      clientMessage: "Weather-resistant paint used. Best results in dry conditions.",
    },
  ],
  Handyman: [
    {
      name: "General Repairs",
      items: [
        { description: "Drywall patch and repair", quantity: "1", price: "175" },
        { description: "General labor (per hour)", quantity: "2", price: "65" },
      ],
      clientMessage: "All materials included. Can add on work during the visit.",
    },
    {
      name: "Furniture Assembly",
      items: [
        { description: "Furniture assembly", quantity: "1", price: "95" },
        { description: "Wall mounting/anchoring", quantity: "1", price: "55" },
      ],
      clientMessage: "Hardware included. We assemble all major brands.",
    },
  ],
  HVAC: [
    {
      name: "AC Tune-Up",
      items: [
        { description: "AC system inspection and tune-up", quantity: "1", price: "189" },
        { description: "Air filter replacement", quantity: "1", price: "45" },
      ],
      clientMessage: "Full system diagnostic included. 90-day guarantee on all work.",
    },
    {
      name: "Duct Cleaning",
      items: [
        { description: "Ductwork cleaning (whole house)", quantity: "1", price: "395" },
        { description: "Vent cover cleaning", quantity: "1", price: "65" },
      ],
      clientMessage: "Improves air quality and system efficiency. Recommended annually.",
    },
  ],
  Roofing: [
    {
      name: "Roof Repair",
      items: [
        { description: "Roof inspection", quantity: "1", price: "150" },
        { description: "Shingle repair (per area)", quantity: "1", price: "475" },
      ],
      clientMessage: "Photo documentation provided. 5-year warranty on repairs.",
    },
    {
      name: "Gutter Service",
      items: [
        { description: "Gutter cleaning and inspection", quantity: "1", price: "185" },
        { description: "Gutter guard installation (per linear ft)", quantity: "20", price: "12" },
      ],
      clientMessage: "Prevents water damage and extends roof life. Recommended twice yearly.",
    },
  ],
  "General Contractor": [
    {
      name: "Bathroom Remodel",
      items: [
        { description: "Tile installation (floor)", quantity: "1", price: "1200" },
        { description: "Vanity and sink installation", quantity: "1", price: "550" },
      ],
      clientMessage: "Materials quoted separately upon selection. Fully licensed and insured.",
    },
    {
      name: "Kitchen Update",
      items: [
        { description: "Cabinet installation", quantity: "1", price: "1500" },
        { description: "Countertop installation", quantity: "1", price: "900" },
      ],
      clientMessage: "Includes demo of existing surfaces. Timeline discussed at consultation.",
    },
  ],
  Other: [
    {
      name: "Service Call",
      items: [
        { description: "Service call and consultation", quantity: "1", price: "150" },
        { description: "Labor (per hour)", quantity: "1", price: "85" },
      ],
      clientMessage: "Estimate valid for 30 days. Additional work quoted separately.",
    },
    {
      name: "Basic Job",
      items: [
        { description: "Labor", quantity: "1", price: "200" },
        { description: "Materials and supplies", quantity: "1", price: "100" },
      ],
      clientMessage: "Satisfaction guaranteed. Thank you for your business.",
    },
  ],
};
