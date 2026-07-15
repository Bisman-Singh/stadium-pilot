import type { Amenity, Section, VenueData, Zone } from "./types";

/**
 * Synthetic data for the fictional "Crescent Bay Stadium". No real venue, club,
 * or sponsor is represented. The graph is authored so every upper tier has a
 * lift alternative and concourses link via step-free ramps through the plaza,
 * which keeps step-free routing solvable everywhere.
 *
 * Zone codes: N/E/S/W stands, tier 1 (lower) and 2 (upper); CN/CS concourses;
 * PL plaza; TH transit hub. Edges are authored once and treated as undirected.
 */

const zones: Zone[] = [
  { id: "N1", name: "North Stand Lower", role: "stand", level: 1, capacity: 6200, edges: [] },
  { id: "N2", name: "North Stand Upper", role: "stand", level: 3, capacity: 7400, edges: [] },
  { id: "E1", name: "East Stand Lower", role: "stand", level: 1, capacity: 6000, edges: [] },
  { id: "E2", name: "East Stand Upper", role: "stand", level: 3, capacity: 7200, edges: [] },
  { id: "S1", name: "South Stand Lower", role: "stand", level: 1, capacity: 6200, edges: [] },
  { id: "S2", name: "South Stand Upper", role: "stand", level: 3, capacity: 7400, edges: [] },
  { id: "W1", name: "West Stand Lower", role: "stand", level: 1, capacity: 6000, edges: [] },
  { id: "W2", name: "West Stand Upper", role: "stand", level: 3, capacity: 7200, edges: [] },
  {
    id: "CN",
    name: "North Concourse",
    role: "concourse",
    level: 2,
    capacity: 4500,
    edges: [
      { to: "N1", kind: "walkway", metres: 60 },
      { to: "N2", kind: "stairs", metres: 40 },
      { to: "N2", kind: "lift", metres: 45 },
      { to: "E1", kind: "walkway", metres: 75 },
      { to: "E2", kind: "stairs", metres: 45 },
      { to: "E2", kind: "lift", metres: 50 },
      { to: "PL", kind: "ramp", metres: 55 },
      { to: "CS", kind: "walkway", metres: 130 },
    ],
  },
  {
    id: "CS",
    name: "South Concourse",
    role: "concourse",
    level: 2,
    capacity: 4500,
    edges: [
      { to: "S1", kind: "walkway", metres: 60 },
      { to: "S2", kind: "stairs", metres: 40 },
      { to: "S2", kind: "lift", metres: 45 },
      { to: "W1", kind: "walkway", metres: 75 },
      { to: "W2", kind: "stairs", metres: 45 },
      { to: "W2", kind: "lift", metres: 50 },
      { to: "PL", kind: "ramp", metres: 55 },
    ],
  },
  {
    id: "PL",
    name: "Central Plaza",
    role: "plaza",
    level: 1,
    capacity: 9000,
    edges: [{ to: "TH", kind: "walkway", metres: 95 }],
  },
  { id: "TH", name: "Transit Hub", role: "transit", level: 1, capacity: 5000, edges: [] },
];

/** Six sections per stand, numbered by tier. Generated to stay DRY. */
function buildSections(): Section[] {
  const stands: { zoneId: string; base: number; tier: Section["tier"] }[] = [
    { zoneId: "N1", base: 101, tier: "lower" },
    { zoneId: "N2", base: 201, tier: "upper" },
    { zoneId: "E1", base: 111, tier: "lower" },
    { zoneId: "E2", base: 211, tier: "upper" },
    { zoneId: "S1", base: 121, tier: "lower" },
    { zoneId: "S2", base: 221, tier: "upper" },
    { zoneId: "W1", base: 131, tier: "lower" },
    { zoneId: "W2", base: 231, tier: "upper" },
  ];
  const sections: Section[] = [];
  for (const stand of stands) {
    for (let i = 0; i < 6; i++) {
      sections.push({ id: String(stand.base + i), zoneId: stand.zoneId, tier: stand.tier });
    }
  }
  return sections;
}

const amenities: Amenity[] = [
  // Food — dietary variety, concentrated in concourses and plaza
  { id: "a-food-1", name: "Crescent Halal Grill", type: "food", zoneId: "CN", accessible: true, tags: ["halal", "kid-friendly"] },
  { id: "a-food-2", name: "Green Field Vegan Kitchen", type: "food", zoneId: "CS", accessible: true, tags: ["vegan", "veg"] },
  { id: "a-food-3", name: "Corner Flag Veg Wraps", type: "food", zoneId: "PL", accessible: true, tags: ["veg", "halal"] },
  { id: "a-food-4", name: "Free-From Bakehouse", type: "food", zoneId: "CN", accessible: true, tags: ["gluten-free", "veg"] },
  { id: "a-food-5", name: "Family Snack Stop", type: "food", zoneId: "CS", accessible: true, tags: ["kid-friendly", "veg"] },
  { id: "a-food-6", name: "Pitchside Burgers", type: "food", zoneId: "PL", accessible: true, tags: [] },
  { id: "a-food-7", name: "Bay Street Halal Kebabs", type: "food", zoneId: "N1", accessible: false, tags: ["halal"] },
  { id: "a-food-8", name: "Harbour Veg Bowls", type: "food", zoneId: "E1", accessible: false, tags: ["veg", "vegan", "gluten-free"] },
  { id: "a-food-9", name: "Coastal Kids Kitchen", type: "food", zoneId: "S1", accessible: false, tags: ["kid-friendly"] },
  { id: "a-food-10", name: "Meridia Street Food", type: "food", zoneId: "W1", accessible: false, tags: ["halal", "veg"] },
  { id: "a-food-11", name: "Plaza Gluten-Free Pizza", type: "food", zoneId: "PL", accessible: true, tags: ["gluten-free", "veg", "kid-friendly"] },
  { id: "a-food-12", name: "Transit Coffee & Bites", type: "food", zoneId: "TH", accessible: true, tags: ["veg"] },

  // Restrooms
  { id: "a-wc-1", name: "North Concourse Restrooms", type: "restroom", zoneId: "CN", accessible: false, tags: [] },
  { id: "a-wc-2", name: "South Concourse Restrooms", type: "restroom", zoneId: "CS", accessible: false, tags: [] },
  { id: "a-wc-3", name: "Plaza Restrooms", type: "restroom", zoneId: "PL", accessible: false, tags: [] },
  { id: "a-wc-4", name: "North Lower Restrooms", type: "restroom", zoneId: "N1", accessible: false, tags: [] },
  { id: "a-wc-5", name: "East Lower Restrooms", type: "restroom", zoneId: "E1", accessible: false, tags: [] },
  { id: "a-wc-6", name: "South Lower Restrooms", type: "restroom", zoneId: "S1", accessible: false, tags: [] },
  { id: "a-wc-7", name: "West Lower Restrooms", type: "restroom", zoneId: "W1", accessible: false, tags: [] },
  { id: "a-wc-8", name: "Transit Hub Restrooms", type: "restroom", zoneId: "TH", accessible: false, tags: [] },

  // Accessible restrooms (step-free, always accessible)
  { id: "a-awc-1", name: "North Concourse Accessible Restroom", type: "accessible-restroom", zoneId: "CN", accessible: true, tags: [] },
  { id: "a-awc-2", name: "South Concourse Accessible Restroom", type: "accessible-restroom", zoneId: "CS", accessible: true, tags: [] },
  { id: "a-awc-3", name: "Plaza Accessible Restroom", type: "accessible-restroom", zoneId: "PL", accessible: true, tags: [] },
  { id: "a-awc-4", name: "Transit Hub Accessible Restroom", type: "accessible-restroom", zoneId: "TH", accessible: true, tags: [] },

  // Water refill
  { id: "a-water-1", name: "North Concourse Water Refill", type: "water-refill", zoneId: "CN", accessible: true, tags: [] },
  { id: "a-water-2", name: "South Concourse Water Refill", type: "water-refill", zoneId: "CS", accessible: true, tags: [] },
  { id: "a-water-3", name: "Plaza Water Refill", type: "water-refill", zoneId: "PL", accessible: true, tags: [] },
  { id: "a-water-4", name: "East Lower Water Refill", type: "water-refill", zoneId: "E1", accessible: false, tags: [] },
  { id: "a-water-5", name: "West Lower Water Refill", type: "water-refill", zoneId: "W1", accessible: false, tags: [] },

  // First aid
  { id: "a-aid-1", name: "North First Aid Point", type: "first-aid", zoneId: "CN", accessible: true, tags: [], note: "Trained medics on site during the match." },
  { id: "a-aid-2", name: "South First Aid Point", type: "first-aid", zoneId: "CS", accessible: true, tags: [], note: "Trained medics on site during the match." },
  { id: "a-aid-3", name: "Plaza Medical Centre", type: "first-aid", zoneId: "PL", accessible: true, tags: [], note: "Main medical centre with step-free access." },

  // Prayer / multi-faith and sensory
  { id: "a-pray-1", name: "North Multi-Faith Prayer Room", type: "prayer-room", zoneId: "CN", accessible: true, tags: [], note: "Wudu facilities available." },
  { id: "a-pray-2", name: "South Multi-Faith Prayer Room", type: "prayer-room", zoneId: "CS", accessible: true, tags: [], note: "Quiet space for all faiths." },
  { id: "a-sensory-1", name: "Sensory Room", type: "sensory-room", zoneId: "CN", accessible: true, tags: ["kid-friendly"], note: "Low-stimulation space; ear defenders available." },

  // Recycling
  { id: "a-rec-1", name: "North Concourse Recycling", type: "recycling", zoneId: "CN", accessible: true, tags: [] },
  { id: "a-rec-2", name: "South Concourse Recycling", type: "recycling", zoneId: "CS", accessible: true, tags: [] },
  { id: "a-rec-3", name: "Plaza Recycling & Cup Return", type: "recycling", zoneId: "PL", accessible: true, tags: [] },
  { id: "a-rec-4", name: "North Lower Recycling", type: "recycling", zoneId: "N1", accessible: false, tags: [] },
  { id: "a-rec-5", name: "South Lower Recycling", type: "recycling", zoneId: "S1", accessible: false, tags: [] },
  { id: "a-rec-6", name: "Transit Hub Recycling", type: "recycling", zoneId: "TH", accessible: true, tags: [] },

  // Info, charging, atm, merchandise
  { id: "a-info-1", name: "Plaza Information Desk", type: "info", zoneId: "PL", accessible: true, tags: [] },
  { id: "a-info-2", name: "Transit Hub Info Point", type: "info", zoneId: "TH", accessible: true, tags: [] },
  { id: "a-info-3", name: "North Concourse Info Point", type: "info", zoneId: "CN", accessible: true, tags: [] },
  { id: "a-charge-1", name: "North Charging Lockers", type: "charging", zoneId: "CN", accessible: true, tags: [] },
  { id: "a-charge-2", name: "Plaza Charging Station", type: "charging", zoneId: "PL", accessible: true, tags: [] },
  { id: "a-atm-1", name: "Plaza ATM", type: "atm", zoneId: "PL", accessible: true, tags: [] },
  { id: "a-atm-2", name: "South Concourse ATM", type: "atm", zoneId: "CS", accessible: true, tags: [] },
  { id: "a-shop-1", name: "Plaza Megastore", type: "merchandise", zoneId: "PL", accessible: true, tags: [] },
  { id: "a-shop-2", name: "North Kit Stand", type: "merchandise", zoneId: "CN", accessible: true, tags: [] },
];

export const VENUE: VenueData = {
  event: {
    venueName: "Crescent Bay Stadium",
    capacity: 68500,
    competition: "World Cup 2026 — Group Stage, Matchday 2",
    fixture: "Atlantis vs. Meridia",
    kickoffLocal: "19:00",
    gatesOpenLocal: "17:00",
    localTimezone: "local",
  },
  zones,
  gates: [
    { id: "A", name: "Gate A — North", servesZones: ["N1", "N2"], throughputPerMin: 780 },
    { id: "B", name: "Gate B — East", servesZones: ["E1", "E2"], throughputPerMin: 720 },
    { id: "C", name: "Gate C — South", servesZones: ["S1", "S2"], throughputPerMin: 780 },
    { id: "D", name: "Gate D — West", servesZones: ["W1", "W2"], throughputPerMin: 720 },
    { id: "E", name: "Gate E — Northeast (Step-Free)", servesZones: ["N1", "E1"], throughputPerMin: 480 },
    { id: "F", name: "Gate F — Southwest (Step-Free)", servesZones: ["S1", "W1"], throughputPerMin: 480 },
    { id: "G", name: "Gate G — Plaza Main", servesZones: ["PL"], throughputPerMin: 960 },
    { id: "H", name: "Gate H — Transit", servesZones: ["TH"], throughputPerMin: 900 },
  ],
  sections: buildSections(),
  amenities,
  transit: [
    { id: "t-metro", mode: "metro", name: "Bay Line Metro", headwayMin: 4, accessible: true, note: "Step-free platform at the Transit Hub. Trains every 4 minutes for 90 minutes after full time." },
    { id: "t-shuttle-dt", mode: "shuttle", name: "Downtown Shuttle", headwayMin: 10, accessible: true, note: "Low-floor accessible buses to the city centre from the Transit Hub." },
    { id: "t-shuttle-air", mode: "shuttle", name: "Airport Shuttle", headwayMin: 20, accessible: true, note: "Direct accessible coach to the airport." },
    { id: "t-shuttle-pr", mode: "shuttle", name: "Park & Ride Shuttle", headwayMin: 8, accessible: true, note: "To remote parking Lots 2 to 5." },
    { id: "t-rideshare", mode: "rideshare", name: "Rideshare Pickup — East Plaza", accessible: true, note: "Designated pickup with an accessible waiting area near Gate G." },
    { id: "t-parking-acc", mode: "parking", name: "Accessible Parking — Lot 1", accessible: true, note: "120 accessible bays with step-free access to Gate E." },
    { id: "t-parking-gen", mode: "parking", name: "General Parking — Lots 2 to 5", accessible: false, note: "Use the Park & Ride Shuttle to reach the Transit Hub." },
  ],
};
