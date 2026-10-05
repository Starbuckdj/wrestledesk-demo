/** Sample club. Fictional people, fictional money, no payment credentials. */

export const club = {
  name: "Lot 9 Wrestling",
  unit: "Unit 9, 2200 Depot Ave, Des Moines, IA 50317",
  owner: "Dana Ruiz",
  phone: "(515) 555-0199",
  email: "desk@lot9.example.com",
};

export const plans = [
  { id: "youth", name: "Youth practice", price: 89, cadence: "month", blurb: "Ages 5–14. The early room or the 5:15 room." },
  { id: "hs", name: "High school", price: 119, cadence: "month", blurb: "Grades 9–12. Four nights plus Saturday open mat." },
  { id: "adult", name: "Adult wrestling", price: 99, cadence: "month", blurb: "18+. Evening folkstyle after the high school room clears." },
  { id: "bjj", name: "BJJ gi", price: 129, cadence: "month", blurb: "All belts. Gi classes on Mat 2." },
  { id: "bjj-nogi", name: "BJJ gi + no-gi", price: 159, cadence: "month", blurb: "Gi membership plus no-gi. One bill, not two." },
  { id: "family2", name: "Family, two athletes", price: 159, cadence: "month", blurb: "Same household. Compare it with two single dues." },
  { id: "family3", name: "Family, three athletes", price: 199, cadence: "month", blurb: "The third athlete is where the sibling price shows up." },
  { id: "punch10", name: "10-visit punch", price: 120, cadence: "pack", blurb: "Drop-ins and wrestlers in town for a week. Not monthly." },
];

export const saasTiers = [
  { id: "mat", name: "Mat", price: 49, points: ["1 club", "Up to 75 members", "Check-in, roster, waivers"] },
  { id: "club", name: "Club", price: 89, featured: true, points: ["Up to 200 members", "Family plans and billing runs", "Past-due queue and parent page"] },
  { id: "desk", name: "Desk", price: 149, points: ["SMS plus email", "Mat fees and punch passes", "More than one coach login"] },
];

export const waiverTemplate = `LOT 9 WRESTLING — PARTICIPATION WAIVER
Season 2026–27 · Unit 9, 2200 Depot Ave, Des Moines, Iowa

I am the parent or guardian, or I am the adult athlete named on this form. Wrestling and Brazilian jiu-jitsu include contact, takedowns, and the chance of injury, including skin infections. I accept that risk for myself or for the athlete named here.

Staff may give basic first aid and call emergency services. I will not send an athlete to practice with a contagious rash or an open wound.

The club may photograph practice and tournaments for the private parent page. I can tell Dana to leave a specific athlete out of photos.

This copy is a demo. It is not legal advice and it does not create a real contract.

A signature is good for one year. After that, the desk marks it expired and sends a new link.`;

const waiver = (status, extra = {}) => ({
  status,
  channel: extra.channel || null,
  sentAt: extra.sentAt || null,
  openedAt: extra.openedAt || null,
  signedAt: extra.signedAt || null,
  expiresAt: extra.expiresAt || null,
  sends: extra.sends || (status === "not_sent" ? 0 : 1),
});

const signed = (on, exp, channel = "email") =>
  waiver("signed", { channel, sentAt: on + "T14:00:00", openedAt: on + "T18:10:00", signedAt: on + "T18:16:00", expiresAt: exp, sends: 1 });

function m(id, first, last, age, group, weight, pin, track, waiverState, usa = null) {
  return { id, first, last, age, group, weight, pin, track, waiver: waiverState, usa };
}

export const accounts = [
  {
    id: "alvarez",
    household: "Alvarez",
    payer: { name: "Marisol Alvarez", email: "marisol.alvarez@example.com", phone: "(515) 555-0172" },
    planId: "family3",
    status: "active",
    method: { kind: "card", label: "Visa •• 4242", autopay: true },
    dunning: { step: "none", log: [] },
    note: "Sofia still has not signed. Marisol opens texts after the kids are in bed.",
    members: [
      m("mateo", "Mateo", "Alvarez", 9, "10U", 65, "4412", "folkstyle", signed("2026-08-14", "2027-08-14"), { number: "IA-229001", expires: "2027-08-31" }),
      m("sofia", "Sofia", "Alvarez", 11, "12U", 78, "4413", "folkstyle", waiver("opened", { channel: "email", sentAt: "2026-09-28T18:12:00", openedAt: "2026-09-29T07:41:00", sends: 1 }), { number: "IA-229002", expires: "2027-08-31" }),
      m("luis", "Luis", "Alvarez", 16, "High school", 132, "4414", "folkstyle", signed("2026-08-14", "2027-08-14"), { number: "IA-229014", expires: "2027-03-01" }),
    ],
  },
  {
    id: "brennan",
    household: "Brennan",
    payer: { name: "Kelly Brennan", email: "kelly.brennan@example.com", phone: "(515) 555-0144" },
    planId: "family2",
    status: "past_due",
    method: { kind: "card", label: "Visa •• 1881 · declined", autopay: true },
    dunning: { step: "none", log: [] },
    note: "Kelly asked for a week. Card failed on the 1st. Owen's waiver lapsed in September.",
    members: [
      m("owen", "Owen", "Brennan", 8, "8U", 55, "2201", "folkstyle", waiver("expired", { channel: "email", sentAt: "2025-09-01T15:00:00", openedAt: "2025-09-01T19:00:00", signedAt: "2025-09-01T19:12:00", expiresAt: "2026-09-01", sends: 2 })),
      m("nora", "Nora", "Brennan", 13, "14U", 106, "2202", "folkstyle", waiver("sent", { channel: "sms", sentAt: "2026-10-01T09:30:00", sends: 1 }), { number: "IA-441220", expires: "2027-01-15" }),
    ],
  },
  {
    id: "ortiz",
    household: "Ortiz",
    payer: { name: "Elena Ortiz", email: "elena.ortiz@example.com", phone: "(515) 555-0160" },
    planId: "family2",
    status: "active",
    method: { kind: "card", label: "Mastercard •• 4410", autopay: true },
    dunning: { step: "none", log: [] },
    note: "",
    members: [
      m("caleb", "Caleb", "Ortiz", 10, "10U", 70, "3301", "folkstyle", signed("2026-08-20", "2027-08-20"), { number: "IA-300441", expires: "2027-06-30" }),
      m("mia", "Mia", "Ortiz", 8, "8U", 52, "3302", "folkstyle", signed("2026-08-20", "2027-08-20")),
    ],
  },
  {
    id: "peck",
    household: "Peck",
    payer: { name: "Chris Peck", email: "chris.peck@example.com", phone: "(515) 555-0188" },
    planId: "family2",
    status: "active",
    method: { kind: "card", label: "Visa •• 2290", autopay: true },
    dunning: { step: "none", log: [] },
    note: "",
    members: [
      m("jonah", "Jonah", "Peck", 9, "10U", 63, "5501", "folkstyle", signed("2026-09-02", "2027-09-02")),
      m("hana", "Hana", "Peck", 11, "12U", 80, "5502", "folkstyle", waiver("sent", { channel: "email", sentAt: "2026-09-20T11:05:00", sends: 1 }), { number: "IA-188320", expires: "2027-05-01" }),
    ],
  },
  {
    id: "bennett",
    household: "Bennett",
    payer: { name: "Aaron Bennett", email: "aaron.bennett@example.com", phone: "(515) 555-0133" },
    planId: "family2",
    status: "active",
    method: { kind: "card", label: "Visa •• 7751", autopay: true },
    dunning: { step: "none", log: [] },
    note: "Two high schoolers. Family price beats two HS dues by a lot.",
    members: [
      m("noah", "Noah", "Bennett", 15, "High school", 138, "6101", "folkstyle", signed("2026-08-11", "2027-08-11"), { number: "IA-552100", expires: "2027-02-28" }),
      m("isaac", "Isaac", "Bennett", 17, "High school", 170, "6102", "folkstyle", signed("2026-08-11", "2027-08-11"), { number: "IA-552118", expires: "2027-02-28" }),
    ],
  },
  {
    id: "grant",
    household: "Grant",
    payer: { name: "Megan Grant", email: "megan.grant@example.com", phone: "(515) 555-0127" },
    planId: "family2",
    status: "active",
    method: { kind: "card", label: "Visa •• 3004", autopay: true },
    dunning: { step: "none", log: [] },
    note: "",
    members: [
      m("leah", "Leah", "Grant", 10, "10U", 68, "1313", "folkstyle", signed("2026-09-05", "2027-09-05")),
      m("ty", "Ty", "Grant", 13, "14U", 100, "1314", "folkstyle", waiver("opened", { channel: "sms", sentAt: "2026-09-22T16:40:00", openedAt: "2026-09-22T20:02:00", sends: 1 })),
    ],
  },
  {
    id: "herrera",
    household: "Herrera",
    payer: { name: "Luis Herrera", email: "luis.herrera.parent@example.com", phone: "(515) 555-0194" },
    planId: "hs",
    status: "active",
    method: { kind: "card", label: "Visa •• 6621", autopay: true },
    dunning: { step: "none", log: [] },
    note: "Diego's waiver expires October 22. Send a new one before the Ames tournament.",
    members: [
      m("diego", "Diego", "Herrera", 15, "High school", 126, "7701", "folkstyle", signed("2025-10-22", "2026-10-22"), { number: "IA-771902", expires: "2026-11-30" }),
    ],
  },
  {
    id: "harper",
    household: "Harper",
    payer: { name: "Wes Harper", email: "wes.harper@example.com", phone: "(515) 555-0108" },
    planId: "hs",
    status: "active",
    method: { kind: "card", label: "Visa •• 1180", autopay: true },
    dunning: { step: "none", log: [] },
    note: "Pays his own dues. Senior.",
    members: [
      m("wes", "Wes", "Harper", 17, "High school", 152, "1216", "folkstyle", signed("2026-08-02", "2027-08-02"), { number: "IA-160044", expires: "2027-04-15" }),
    ],
  },
  {
    id: "cho",
    household: "Cho",
    payer: { name: "Helen Cho", email: "helen.cho@example.com", phone: "(515) 555-0156" },
    planId: "hs",
    status: "active",
    method: { kind: "card", label: "Mastercard •• 2844", autopay: true },
    dunning: { step: "none", log: [] },
    note: "",
    members: [
      m("emily", "Emily", "Cho", 16, "High school", 120, "1212", "folkstyle", signed("2026-08-18", "2027-08-18"), { number: "IA-120884", expires: "2027-03-20" }),
    ],
  },
  {
    id: "okonkwo",
    household: "Okonkwo",
    payer: { name: "Chidi Okonkwo", email: "chidi.okonkwo@example.com", phone: "(515) 555-0177" },
    planId: "youth",
    status: "active",
    method: { kind: "ach", label: "Bank transfer · Dana sends the invoice", autopay: false },
    dunning: { step: "none", log: [] },
    note: "Does not keep a card on file. Invoice every month.",
    members: [
      m("amara", "Amara", "Okonkwo", 7, "8U", 48, "8801", "folkstyle", signed("2026-09-01", "2027-09-01")),
    ],
  },
  {
    id: "haddad",
    household: "Haddad",
    payer: { name: "Rania Haddad", email: "rania.haddad@example.com", phone: "(515) 555-0139" },
    planId: "youth",
    status: "active",
    method: { kind: "card", label: "Visa •• 9090", autopay: true },
    dunning: { step: "none", log: [] },
    note: "New in September. Waiver never went out.",
    members: [
      m("samir", "Samir", "Haddad", 12, "12U", 90, "9901", "folkstyle", waiver("not_sent"), { number: "IA-990144", expires: "2027-09-01" }),
    ],
  },
  {
    id: "faris",
    household: "Faris",
    payer: { name: "Noor Faris", email: "noor.faris@example.com", phone: "(515) 555-0115" },
    planId: "youth",
    status: "active",
    method: { kind: "card", label: "Visa •• 5150", autopay: true },
    dunning: { step: "none", log: [] },
    note: "",
    members: [
      m("omar", "Omar", "Faris", 14, "14U", 112, "1414", "folkstyle", signed("2026-08-28", "2027-08-28"), { number: "IA-141400", expires: "2027-07-01" }),
    ],
  },
  {
    id: "adler",
    household: "Adler",
    payer: { name: "Paul Adler", email: "paul.adler@example.com", phone: "(515) 555-0181" },
    planId: "youth",
    status: "active",
    method: { kind: "card", label: "Visa •• 1515", autopay: true },
    dunning: { step: "none", log: [] },
    note: "",
    members: [
      m("quinn", "Quinn", "Adler", 7, "8U", 45, "1515", "folkstyle", waiver("sent", { channel: "email", sentAt: "2026-10-03T08:15:00", sends: 1 })),
    ],
  },
  {
    id: "walsh",
    household: "Walsh",
    payer: { name: "Erin Walsh", email: "erin.walsh@example.com", phone: "(515) 555-0102" },
    planId: "youth",
    status: "trial",
    method: { kind: "none", label: "No method yet", autopay: false },
    dunning: { step: "none", log: [] },
    note: "Second trial night. If they stay, put them on youth or wait for a sibling.",
    members: [
      m("ellis", "Ellis", "Walsh", 6, "8U", 42, "1111", "folkstyle", waiver("not_sent")),
    ],
  },
  {
    id: "patel",
    household: "Patel",
    payer: { name: "Priya Patel", email: "priya.patel@example.com", phone: "(515) 555-0166" },
    planId: "bjj-nogi",
    status: "active",
    method: { kind: "card", label: "Visa •• 1616", autopay: true },
    dunning: { step: "none", log: [] },
    note: "",
    members: [
      m("priya", "Priya", "Patel", 29, "Adult", 135, "1616", "bjj", signed("2026-07-12", "2027-07-12")),
    ],
  },
  {
    id: "nguyen",
    household: "Nguyen",
    payer: { name: "Minh Nguyen", email: "minh.nguyen@example.com", phone: "(515) 555-0122" },
    planId: "adult",
    status: "failed",
    method: { kind: "card", label: "Mastercard •• 9014 · failed", autopay: true },
    dunning: { step: "none", log: [] },
    note: "October charge failed. He still came to adult room last Thursday.",
    members: [
      m("minh", "Minh", "Nguyen", 34, "Adult", 170, "1717", "folkstyle", signed("2026-06-02", "2027-06-02")),
    ],
  },
  {
    id: "blake",
    household: "Blake",
    payer: { name: "Jordan Blake", email: "jordan.blake@example.com", phone: "(515) 555-0148" },
    planId: "adult",
    status: "active",
    method: { kind: "card", label: "Visa •• 1818", autopay: true },
    dunning: { step: "none", log: [] },
    note: "",
    members: [
      m("jordan", "Jordan", "Blake", 22, "Adult", 155, "1818", "both", signed("2026-05-19", "2027-05-19")),
    ],
  },
  {
    id: "kim",
    household: "Kim",
    payer: { name: "Alicia Kim", email: "alicia.kim@example.com", phone: "(515) 555-0190" },
    planId: "adult",
    status: "active",
    method: { kind: "card", label: "Visa •• 1919", autopay: true },
    dunning: { step: "none", log: [] },
    note: "",
    members: [
      m("alicia", "Alicia", "Kim", 41, "Adult", 145, "1919", "folkstyle", signed("2025-10-30", "2026-10-30")),
    ],
  },
  {
    id: "ibarra",
    household: "Ibarra",
    payer: { name: "Rosa Ibarra", email: "rosa.ibarra@example.com", phone: "(515) 555-0119" },
    planId: "adult",
    status: "active",
    method: { kind: "card", label: "Visa •• 2222", autopay: true },
    dunning: { step: "none", log: [] },
    note: "",
    members: [
      m("rosa", "Rosa", "Ibarra", 24, "Adult", 130, "2222", "folkstyle", signed("2026-04-04", "2027-04-04")),
    ],
  },
  {
    id: "feldman",
    household: "Feldman",
    payer: { name: "Nate Feldman", email: "nate.feldman@example.com", phone: "(515) 555-0170" },
    planId: "bjj",
    status: "active",
    method: { kind: "card", label: "Visa •• 2121", autopay: true },
    dunning: { step: "none", log: [] },
    note: "",
    members: [
      m("nate", "Nate", "Feldman", 31, "Adult", 185, "2121", "bjj", waiver("opened", { channel: "email", sentAt: "2026-09-15T12:00:00", openedAt: "2026-09-16T06:22:00", sends: 1 })),
    ],
  },
  {
    id: "santos",
    household: "Santos",
    payer: { name: "Chris Santos", email: "chris.santos@example.com", phone: "(515) 555-0151" },
    planId: "bjj",
    status: "paused",
    method: { kind: "card", label: "Visa •• 2020", autopay: false },
    dunning: {
      step: "paused",
      log: [
        { step: "reminded", at: "2026-09-06T09:00:00" },
        { step: "retry", at: "2026-09-10T09:00:00" },
        { step: "paused", at: "2026-09-15T18:40:00" },
      ],
    },
    note: "Paused after two failed months. He can watch, not train, until the balance is cleared.",
    members: [
      m("chris", "Chris", "Santos", 27, "Adult", 160, "2020", "bjj", signed("2026-01-09", "2027-01-09")),
    ],
  },
  {
    id: "varga",
    household: "Varga",
    payer: { name: "Cole Varga", email: "cole.varga@example.com", phone: "(515) 555-0106" },
    planId: "punch10",
    status: "punch",
    method: { kind: "punch", label: "10-visit punch · paid in September", autopay: false },
    dunning: { step: "none", log: [] },
    note: "In town through October. Visiting wrestler from Omaha.",
    members: [
      m("cole", "Cole", "Varga", 19, "Adult", 148, "2323", "folkstyle", waiver("not_sent"), null),
    ],
  },
];

accounts.find((a) => a.id === "varga").members[0].visitsLeft = 3;

export const classes = [
  { id: "mon-youth-early", name: "Youth 8U / 10U", day: "Mon", start: "16:00", end: "17:10", coachId: "dana", room: "Mat 1", track: "folkstyle", groups: ["8U", "10U"], roster: ["amara", "owen", "mia", "caleb", "quinn", "ellis", "leah", "mateo"] },
  { id: "mon-youth-late", name: "Youth 12U / 14U", day: "Mon", start: "17:15", end: "18:25", coachId: "andre", room: "Mat 1", track: "folkstyle", groups: ["12U", "14U"], roster: ["sofia", "nora", "hana", "jonah", "samir", "ty", "omar"] },
  { id: "mon-bjj", name: "BJJ gi", day: "Mon", start: "18:00", end: "19:15", coachId: "ren", room: "Mat 2", track: "bjj", groups: ["Adult"], roster: ["priya", "nate", "chris"] },
  { id: "mon-hs", name: "High school", day: "Mon", start: "18:30", end: "20:00", coachId: "dana", room: "Mat 1", track: "folkstyle", groups: ["High school"], roster: ["luis", "emily", "diego", "wes", "noah", "isaac"] },
  { id: "mon-adult", name: "Adult wrestling", day: "Mon", start: "19:45", end: "21:00", coachId: "andre", room: "Mat 1", track: "folkstyle", groups: ["Adult"], roster: ["minh", "jordan", "alicia", "rosa", "cole"] },
  { id: "mon-nogi", name: "No-gi", day: "Mon", start: "20:15", end: "21:15", coachId: "ren", room: "Mat 2", track: "bjj", groups: ["Adult"], roster: ["priya", "nate", "jordan"] },
  { id: "tue-youth", name: "Youth all ages", day: "Tue", start: "17:00", end: "18:15", coachId: "dana", room: "Mat 1", track: "folkstyle", groups: ["8U", "10U", "12U", "14U"] },
  { id: "tue-hs", name: "High school", day: "Tue", start: "18:30", end: "20:00", coachId: "andre", room: "Mat 1", track: "folkstyle", groups: ["High school"] },
  { id: "tue-bjj", name: "BJJ gi", day: "Tue", start: "19:30", end: "20:45", coachId: "ren", room: "Mat 2", track: "bjj", groups: ["Adult"] },
  { id: "wed-youth-early", name: "Youth 8U / 10U", day: "Wed", start: "16:00", end: "17:10", coachId: "dana", room: "Mat 1", track: "folkstyle", groups: ["8U", "10U"] },
  { id: "wed-youth-late", name: "Youth 12U / 14U", day: "Wed", start: "17:15", end: "18:25", coachId: "andre", room: "Mat 1", track: "folkstyle", groups: ["12U", "14U"] },
  { id: "wed-bjj", name: "BJJ gi", day: "Wed", start: "18:00", end: "19:15", coachId: "ren", room: "Mat 2", track: "bjj", groups: ["Adult"] },
  { id: "wed-hs", name: "High school", day: "Wed", start: "18:30", end: "20:00", coachId: "dana", room: "Mat 1", track: "folkstyle", groups: ["High school"] },
  { id: "thu-youth", name: "Youth all ages", day: "Thu", start: "17:30", end: "18:30", coachId: "dana", room: "Mat 1", track: "folkstyle", groups: ["8U", "10U", "12U", "14U"] },
  { id: "thu-hs", name: "High school", day: "Thu", start: "18:30", end: "20:00", coachId: "andre", room: "Mat 1", track: "folkstyle", groups: ["High school"] },
  { id: "thu-nogi", name: "No-gi", day: "Thu", start: "19:30", end: "20:45", coachId: "ren", room: "Mat 2", track: "bjj", groups: ["Adult"] },
  { id: "fri-cond", name: "Conditioning", day: "Fri", start: "17:00", end: "18:00", coachId: "andre", room: "Mat 1", track: "open", groups: ["High school", "Adult"] },
  { id: "fri-bjj", name: "BJJ gi", day: "Fri", start: "18:00", end: "19:15", coachId: "ren", room: "Mat 2", track: "bjj", groups: ["Adult"] },
  { id: "sat-open", name: "Open mat", day: "Sat", start: "09:00", end: "10:30", coachId: "dana", room: "Both mats", track: "open", groups: [] },
  { id: "sat-youth", name: "Youth tournament practice", day: "Sat", start: "10:30", end: "12:00", coachId: "dana", room: "Mat 1", track: "folkstyle", groups: ["8U", "10U", "12U", "14U"] },
];

export const coaches = [
  {
    id: "dana",
    name: "Dana Ruiz",
    role: "Owner / head coach",
    focus: "Youth late nights when needed, high school, Saturday",
    certs: [
      { name: "USA Wrestling coach card", ref: "USAW-44102", expires: "2027-03-12" },
      { name: "SafeSport", ref: "SS-88311", expires: "2026-11-02" },
      { name: "Background check", ref: "IA-BG-1902", expires: "2027-01-15" },
    ],
  },
  {
    id: "andre",
    name: "Andre Brooks",
    role: "High school assistant",
    focus: "12U/14U, high school off-nights, adult room",
    certs: [
      { name: "USA Wrestling coach card", ref: "USAW-22881", expires: "2026-10-20" },
      { name: "SafeSport", ref: "SS-10229", expires: "2027-02-01" },
      { name: "Background check", ref: "IA-BG-4410", expires: "2027-06-01" },
    ],
  },
  {
    id: "ren",
    name: "Ren Park",
    role: "BJJ coach",
    focus: "Gi and no-gi on Mat 2",
    certs: [
      { name: "First aid / CPR", ref: "FA-5591", expires: "2026-12-01" },
      { name: "Background check", ref: "IA-BG-7781", expires: "2026-10-28" },
      { name: "BJJ black belt", ref: "Awarded 2016", expires: null },
    ],
  },
];

export const defaultCheckins = {
  "mon-youth-early": ["amara", "mia", "caleb", "quinn", "leah", "mateo"],
  "mon-youth-late": ["sofia", "hana", "jonah", "samir", "ty"],
  "mon-bjj": ["priya", "nate"],
  "mon-hs": ["emily"],
  "mon-adult": [],
  "mon-nogi": [],
};

export const tournaments = [
  { id: "iowa-kids", name: "Iowa Kids Folkstyle", date: "2026-11-08", where: "Ames", fee: 25, note: "Mat fee only. Entry is still on the tournament site.", signedUp: ["mateo", "caleb", "noah"] },
  { id: "girls-duals", name: "Girls Folkstyle Duals", date: "2026-11-15", where: "Cedar Rapids", fee: 20, note: "Mat fee. Sofia is the one who wants this.", signedUp: ["sofia"] },
  { id: "bjj-open", name: "Midwest BJJ Open", date: "2026-12-06", where: "Des Moines", fee: 40, note: "Gi divisions. Mat fee goes on the December run.", signedUp: ["priya"] },
];

export const attendanceHistory = [
  { memberId: "mateo", date: "2026-09-28", label: "Youth 8U / 10U" },
  { memberId: "mateo", date: "2026-09-30", label: "Youth 8U / 10U" },
  { memberId: "mateo", date: "2026-10-02", label: "Youth tournament practice" },
  { memberId: "sofia", date: "2026-09-28", label: "Youth 12U / 14U" },
  { memberId: "sofia", date: "2026-10-01", label: "Youth 12U / 14U" },
  { memberId: "luis", date: "2026-09-29", label: "High school" },
  { memberId: "luis", date: "2026-10-02", label: "High school" },
  { memberId: "owen", date: "2026-09-28", label: "Youth 8U / 10U" },
  { memberId: "nora", date: "2026-09-29", label: "Youth 12U / 14U" },
  { memberId: "amara", date: "2026-10-01", label: "Youth 8U / 10U" },
  { memberId: "emily", date: "2026-10-02", label: "High school" },
];

function planById(id) {
  return plans.find((p) => p.id === id);
}

function soloPrice(member) {
  if (member.group === "High school") return 119;
  if (member.group === "Adult") return member.track === "bjj" ? 129 : 99;
  return 89;
}

function soloLabel(member) {
  if (member.group === "High school") return "High school";
  if (member.group === "Adult") return member.track === "bjj" ? "BJJ gi" : "Adult wrestling";
  return "Youth practice";
}

export function lineItems(account, periodLabel) {
  const plan = planById(account.planId);
  if (!plan) return [];
  if (account.planId === "family2" || account.planId === "family3") {
    const lines = account.members.map((member) => ({
      desc: `${member.first} ${member.last} · ${soloLabel(member)}`,
      amount: soloPrice(member),
    }));
    const sticker = lines.reduce((sum, line) => sum + line.amount, 0);
    const discount = sticker - plan.price;
    if (discount > 0) lines.push({ desc: "Sibling discount (family plan)", amount: -discount });
    return lines;
  }
  if (account.planId === "punch10") {
    return [{ desc: `10-visit punch — ${periodLabel}`, amount: plan.price }];
  }
  return [{ desc: `${plan.name} — ${periodLabel}`, amount: plan.price }];
}

function invoiceTotal(lines) {
  return lines.reduce((sum, line) => sum + line.amount, 0);
}

export function buildInvoices() {
  const octoberOverride = { brennan: "past_due", nguyen: "failed", okonkwo: "sent" };
  const rows = [];
  let n = 2401;
  for (const account of accounts) {
    if (account.status === "trial" || account.status === "punch" || account.status === "paused") continue;
    const status = octoberOverride[account.id] || "paid";
    const lines = lineItems(account, "October 2026");
    rows.push({
      id: `L9-${n++}`,
      accountId: account.id,
      period: "October 2026",
      issued: "2026-10-01",
      due: "2026-10-05",
      status,
      lines,
      total: invoiceTotal(lines),
      channel: account.method.kind === "ach" ? "email" : "email",
      sentAt: "2026-10-01T08:05:00",
      openedAt: status === "paid" || status === "past_due" ? "2026-10-01T18:40:00" : null,
      paidAt: status === "paid" ? "2026-10-01T18:46:00" : null,
    });
  }
  const santosLines = [{ desc: "BJJ gi — September 2026", amount: 129 }];
  rows.push({
    id: "L9-2314",
    accountId: "santos",
    period: "September 2026",
    issued: "2026-09-01",
    due: "2026-09-05",
    status: "failed",
    lines: santosLines,
    total: 129,
    channel: "email",
    sentAt: "2026-09-01T08:05:00",
    openedAt: "2026-09-02T21:12:00",
    paidAt: null,
  });
  rows.push({
    id: "L9-2288",
    accountId: "varga",
    period: "Punch card",
    issued: "2026-09-18",
    due: "2026-09-18",
    status: "paid",
    lines: [{ desc: "10-visit punch", amount: 120 }],
    total: 120,
    channel: "email",
    sentAt: "2026-09-18T17:10:00",
    openedAt: "2026-09-18T17:22:00",
    paidAt: "2026-09-18T17:24:00",
  });
  return rows;
}

export function buildState() {
  const varga = accounts.find((a) => a.id === "varga");
  if (!varga.members[0].visitsLeft) varga.members[0].visitsLeft = 3;
  return {
    version: 1,
    accounts: structuredClone(accounts),
    invoices: buildInvoices(),
    checkins: structuredClone(defaultCheckins),
    tournaments: structuredClone(tournaments),
    history: structuredClone(attendanceHistory),
    waiverTemplate,
    nextInvoice: 2501,
  };
}
