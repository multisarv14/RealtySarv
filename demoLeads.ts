import { Lead, Project, InventoryUnit, ParkingSlot, User, SiteVisit, Task, Message, BookingDetails, CustomerDocument, AgreementStatus, PossessionStatus, LeadStatus } from './types';

// Demo CRM data for the sample company. Every LeadSarv menu and tab gets realistic entries.
// Dates are relative to the day the demo company is seeded (npm run seed:reset refreshes them).

const FIRST = ['Aarav', 'Vivaan', 'Aditya', 'Vihaan', 'Arjun', 'Sai', 'Reyansh', 'Krishna', 'Ishaan', 'Rohan', 'Ananya', 'Diya', 'Priya', 'Neha', 'Kavya', 'Isha', 'Meera', 'Sneha', 'Pooja', 'Riya',
  'Amit', 'Rahul', 'Vikram', 'Sanjay', 'Manish', 'Nikhil', 'Karan', 'Deepak', 'Suresh', 'Ramesh', 'Anjali', 'Shweta', 'Divya', 'Swati', 'Rekha', 'Sunita', 'Nisha', 'Tanvi', 'Pallavi', 'Komal'];
const LAST = ['Sharma', 'Patil', 'Deshmukh', 'Kulkarni', 'Joshi', 'Mehta', 'Shah', 'Iyer', 'Nair', 'Reddy', 'Gupta', 'Verma', 'Chavan', 'Pawar', 'More', 'Jadhav', 'Bhosale', 'Kapoor', 'Malhotra', 'Desai'];
const MAIL = ['gmail.com', 'outlook.com', 'yahoo.in', 'gmail.com', 'hotmail.com'];

const PROJECTS = [
  { name: 'The Grand Towers', location: 'Downtown', interests: ['2BHK', '3BHK'], budgets: ['75L - 1Cr', '1.5Cr+'] },
  { name: 'Serene Gardens', location: 'Waterfront', interests: ['Villa', '2BHK'], budgets: ['1.5Cr+', '75L - 1Cr'] },
  { name: 'Orchid Residency', location: 'Suburbs', interests: ['1BHK', '2BHK'], budgets: ['50L - 75L', '75L - 1Cr'] },
];
const SOURCES: [string, string][] = [['Website', 'Digital Marketing'], ['Google Ads', 'Digital Marketing'], ['Facebook', 'Digital Marketing'], ['Referral', 'Offline'], ['Walk-in', 'Offline'], ['MagicBricks', 'Property Portals'], ['99acres', 'Property Portals']];
const PROFILES = ['IT Professional', 'Doctor', 'Business Owner'];
const LIVING = ['Rented Apartment', 'Owned Apartment', 'Family Home'];
const BANKS = ['HDFC Bank', 'ICICI Bank', 'Axis Bank', 'State Bank of India'];
const MODES = ['UPI', 'NEFT', 'Cheque', 'RTGS'] as const;
const PRICE: Record<string, number> = { '1BHK': 4200000, '2BHK': 6800000, '3BHK': 11500000, 'Villa': 18000000 };

export interface DemoContext {
  projects: Project[]; // their inventory is filled in here; booked leads take real units from it
  users: User[]; // sales team first; admin is users[0]
  milestones: { id: string; name: string }[];
}

const pad = (n: number, w = 2) => String(n).padStart(w, '0');
const dayISO = (offset: number) => { const d = new Date(); d.setDate(d.getDate() + offset); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };
const clock = (h: number, m = 0) => `${pad(h)}:${pad(m)}`;
const ampm = (h: number, m = 0) => `${pad(((h + 11) % 12) + 1)}:${pad(m)} ${h < 12 ? 'AM' : 'PM'}`;
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
/** What the lead list shows as the last-activity time: a clock time today, then Yesterday, weekday, date. */
const whenLabel = (daysAgo: number, h = 10, m = 30) => {
  if (daysAgo <= 0) return ampm(h, m);
  if (daysAgo === 1) return 'Yesterday';
  const d = new Date(); d.setDate(d.getDate() - daysAgo);
  return daysAgo < 7 ? WEEKDAYS[d.getDay()] : `${d.getDate()} ${MONTHS[d.getMonth()]}`;
};

type Bucket = 'followup' | 'active' | 'inactive' | 'visitScheduled' | 'visitPending' | 'visitDone' | 'token' | 'booked';

interface Spec {
  bucket: Bucket;
  status: LeadStatus;
  ageDays: number; // days since the lead came in
  unread?: boolean;
  fu?: { offset: number; type: 'Call' | 'Email' | 'Meeting'; time: string; note: string }[]; // pending follow-ups, offset in days from today
  doneFu?: { offset: number; note: string }[];
  visit?: { offset: number; time: string; status: 'Visit Scheduled' | 'Completed'; note?: string };
  token?: number;
  booking?: BookedSpec;
  notes?: string[]; // internal notes from the team
}
interface BookedSpec {
  agreement: AgreementStatus;
  possession: PossessionStatus;
  kyc: number; // verified KYC documents
  draftGenerated?: boolean;
  signedDraft?: CustomerDocument['status'];
  challan?: CustomerDocument['status'];
  lineup?: { office: string; offset: number; time: string };
  registered?: boolean;
  executed?: boolean;
  receipts: number; // extra payment receipts after the token
  demand?: boolean;
}

const KYC_DOCS = ['PAN Card', 'Aadhaar Card', 'Address Proof', 'Passport Size Photo', 'Bank Statement', 'ITR / Salary Slip'];

const UNIT_SPECS: Record<string, { area: number; carpet: number; rate: number; bedrooms: number; bathrooms: number }> = {
  '1BHK': { area: 640, carpet: 480, rate: 6500, bedrooms: 1, bathrooms: 1 },
  '2BHK': { area: 960, carpet: 720, rate: 6800, bedrooms: 2, bathrooms: 2 },
  '3BHK': { area: 1380, carpet: 1040, rate: 8300, bedrooms: 3, bathrooms: 3 },
  'Villa': { area: 2400, carpet: 1900, rate: 7500, bedrooms: 4, bathrooms: 4 },
};

/** Fill a project with units (wing / floor / flat) and parking so the booking form has something to choose. */
export function fillInventory(project: Project, types: string[], floors: number, perFloor: number): void {
  const wings = project.wings?.length ? project.wings : ['A'];
  const units: InventoryUnit[] = [];
  const parking: ParkingSlot[] = [];
  let n = 0;
  for (const wing of wings) {
    for (let floor = 1; floor <= floors; floor++) {
      for (let f = 1; f <= perFloor; f++) {
        const type = types[(floor + f) % types.length];
        const spec = UNIT_SPECS[type] ?? UNIT_SPECS['2BHK'];
        n++;
        units.push({
          id: `${project.id}-u${n}`, unitNumber: `${wing}-${floor}${pad(f)}`, wing, floor, type, area: spec.area, carpetArea: spec.carpet,
          price: Math.round((spec.area * (spec.rate + floor * 25)) / 1000) * 1000, status: 'Available', calculationBasis: 'rate', bedrooms: spec.bedrooms, bathrooms: spec.bathrooms,
        });
        parking.push({ id: `${project.id}-p${n}`, slotNumber: `P${pad(n, 3)}`, level: n % 2 ? 'Basement 1' : 'Basement 2', status: 'Available' });
      }
    }
  }
  project.inventory = units;
  project.parkingInventory = parking;
}

export function buildDemoLeads(ctx: DemoContext): Lead[] {
  // Units for every project (done first so booked leads can pick real ones)
  const byName = new Map(ctx.projects.map((pr) => [pr.name, pr]));
  const layout: Record<string, [string[], number, number]> = { 'The Grand Towers': [['2BHK', '3BHK'], 8, 5], 'Serene Gardens': [['Villa', '2BHK'], 6, 8], 'Orchid Residency': [['1BHK', '2BHK'], 6, 4] };
  for (const pr of ctx.projects) { const [types, floors, per] = layout[pr.name] ?? [['2BHK'], 5, 2]; fillInventory(pr, types, floors, per); }
  const takeUnit = (projectName: string, interest: string) => {
    const pr = byName.get(projectName);
    const unit = pr?.inventory.find((u) => u.status === 'Available' && u.type === interest) ?? pr?.inventory.find((u) => u.status === 'Available');
    const slot = pr?.parkingInventory.find((s) => s.status === 'Available');
    if (unit) unit.status = 'Booked';
    if (slot) { slot.status = 'Booked'; if (unit) slot.assignedUnitId = unit.id; }
    return { unit, slot };
  };

  const team = ctx.users.filter((u) => u.role !== 'Admin');
  const owners = team.length ? team : ctx.users;
  const specs: Spec[] = [];

  // ---- Leads > Follow-up (10): open follow-ups, some overdue, some today, some later
  const fuPlan: [number, 'Call' | 'Email' | 'Meeting', string, string][] = [
    [-3, 'Call', '11:00', 'Share revised price sheet and payment plan'],
    [-2, 'Call', '16:30', 'Client was travelling; call back for site visit slot'],
    [-1, 'Meeting', '12:00', 'Office meeting to discuss loan eligibility'],
    [0, 'Call', '10:30', 'Confirm weekend site visit'],
    [0, 'Call', '15:00', 'Send brochure again and take feedback'],
    [0, 'Email', '17:30', 'Email floor plans and RERA details'],
    [1, 'Call', '11:30', 'Discuss budget revision with spouse'],
    [1, 'Meeting', '14:00', 'Show 3D walkthrough at the sales gallery'],
    [3, 'Call', '12:30', 'Check if bank pre-approval has come'],
    [5, 'Call', '18:00', 'Follow up on festive offer details'],
  ];
  fuPlan.forEach(([offset, type, time, note], i) => specs.push({
    bucket: 'followup', status: (['New', 'Contacted', 'Qualified'] as LeadStatus[])[i % 3], ageDays: 3 + i * 2, unread: i === 3 || i === 5,
    fu: [{ offset, type, time, note }], doneFu: i % 2 ? [{ offset: offset - 4, note: 'Introductory call done, shared brochure' }] : [],
  }));

  // ---- Leads > Active (14): no open follow-up
  (['New', 'New', 'New', 'New', 'New', 'New', 'Contacted', 'Contacted', 'Contacted', 'Contacted', 'Qualified', 'Qualified', 'Qualified', 'Qualified'] as LeadStatus[])
    .forEach((status, i) => specs.push({
      bucket: 'active', status, ageDays: status === 'New' ? i % 3 : 4 + i, unread: status === 'New' && i < 5,
      doneFu: status === 'Qualified' ? [{ offset: -2 - i, note: 'Discussed requirement, shortlisted two options' }] : [],
    }));

  // Every list below holds at least 10 records, so each tab looks "lived in" and scrolls.

  // ---- Leads > Inactive (10)
  const lostReasons = ['Budget is far below the available inventory', 'Not interested in under-construction projects', 'Bought elsewhere', 'Looking for rental, not purchase', 'Number not reachable after 4 attempts', 'Wants a different city',
    'Possession date is too far away', 'Decided to wait for lower interest rates', 'Only wanted a price comparison', 'Family postponed the purchase'];
  lostReasons.forEach((reason, i) => specs.push({ bucket: 'inactive', status: 'Unqualified', ageDays: 20 + i * 3, notes: [reason] }));

  // ---- Visits > Scheduled (10): today, tomorrow and later
  [[0, '11:00'], [0, '16:00'], [1, '10:30'], [1, '15:30'], [2, '12:00'], [3, '11:30'], [4, '17:00'], [5, '10:00'], [6, '14:30'], [7, '12:30']].forEach(([offset, time], i) => specs.push({
    bucket: 'visitScheduled', status: 'Qualified', ageDays: 5 + i, visit: { offset: offset as number, time: time as string, status: 'Visit Scheduled', note: i % 2 ? 'Coming with family, 4 people' : 'Wants to see the sample flat and amenities' },
  }));

  // ---- Visits > Pending (10): date passed, still marked scheduled
  Array.from({ length: 10 }, (_, i) => -(i + 1)).forEach((offset, i) => specs.push({
    bucket: 'visitPending', status: 'Qualified', ageDays: 8 + i * 2, visit: { offset, time: clock(10 + (i % 7), i % 2 ? 30 : 0), status: 'Visit Scheduled', note: 'Outcome not updated after the visit' },
  }));

  // ---- Visits > Completed (10)
  Array.from({ length: 10 }, (_, i) => -(i + 1)).forEach((offset, i) => specs.push({
    bucket: 'visitDone', status: 'Qualified', ageDays: 12 + i * 2, visit: { offset, time: clock(10 + (i % 7), 30), status: 'Completed', note: 'Liked the layout; asked about possession timeline' },
    fu: i < 4 ? [{ offset: i - 1, type: 'Call', time: '12:00', note: 'Ask for booking decision after the visit' }] : [], notes: ['Visited with spouse. Interested in higher floors.'],
  }));

  // ---- Booking > Token (10)
  [51000, 75000, 101000, 51000, 125000, 151000, 201000, 61000, 90000, 110000].forEach((token, i) => specs.push({
    bucket: 'token', status: 'Qualified', ageDays: 10 + i * 2, token, visit: { offset: -(4 + i), time: '11:00', status: 'Completed' },
    fu: i < 4 ? [{ offset: i - 1, type: 'Call', time: '13:00', note: 'Collect KYC documents for booking confirmation' }] : [],
  }));

  // ---- Booking > Confirmed: every agreement stage, each with 10+ records and a mix of "what to do next"
  const pay = (i: number) => (i % 4);
  const drafted: BookedSpec[] = Array.from({ length: 10 }, (_, i) => [
    { agreement: 'Drafted', possession: 'Pending', kyc: 0, receipts: 0 },
    { agreement: 'Drafted', possession: 'Pending', kyc: 4, receipts: 0 },
    { agreement: 'Drafted', possession: 'Pending', kyc: 6, draftGenerated: true, receipts: 1, demand: true },
  ][i % 3] as BookedSpec);
  const signature: BookedSpec[] = Array.from({ length: 10 }, (_, i) => [
    { agreement: 'Signature', possession: 'Pending', kyc: 6, draftGenerated: true, signedDraft: 'Pending', receipts: 1 },
    { agreement: 'Signature', possession: 'Pending', kyc: 6, draftGenerated: true, signedDraft: 'Verified', receipts: 1, demand: true },
    { agreement: 'Signature', possession: 'Pending', kyc: 5, draftGenerated: true, signedDraft: 'Pending', receipts: 0 },
  ][i % 3] as BookedSpec);
  const ats: BookedSpec[] = Array.from({ length: 10 }, (_, i) => [
    { agreement: 'ATS', possession: 'Pending', kyc: 6, draftGenerated: true, signedDraft: 'Verified', challan: 'Pending', receipts: 2 },
    { agreement: 'ATS', possession: 'Pending', kyc: 6, draftGenerated: true, signedDraft: 'Verified', challan: 'Verified', receipts: 2, demand: true },
    { agreement: 'ATS', possession: 'Pending', kyc: 6, draftGenerated: true, signedDraft: 'Verified', challan: 'Verified', lineup: { office: 'Sub-Registrar Office, Haveli 4', offset: [0, 1, 2, -1][i % 4], time: '11:30' }, receipts: 2 },
  ][i % 3] as BookedSpec);
  const regBase: Omit<BookedSpec, 'possession' | 'receipts'> = { agreement: 'Registered', kyc: 6, signedDraft: 'Verified', challan: 'Verified', registered: true, executed: true };
  const registered: BookedSpec[] = [
    ...Array.from({ length: 2 }, (_, i): BookedSpec => ({ ...regBase, possession: 'Pending', receipts: 3 + i, demand: i === 0 })),
    ...Array.from({ length: 10 }, (_, i): BookedSpec => ({ ...regBase, possession: 'Scheduled', receipts: 4 + (i % 2) })),
    ...Array.from({ length: 10 }, (_, i): BookedSpec => ({ ...regBase, possession: 'Handed Over', receipts: 5 + (i % 2) })),
  ];
  [...drafted, ...signature, ...ats, ...registered].forEach((b, i) => specs.push({
    bucket: 'booked', status: 'Converted', ageDays: 25 + i * 3, token: 101000 + pay(i) * 25000, booking: b,
    fu: i % 7 === 1 || i % 11 === 3 || (b.possession === 'Scheduled' && i % 3 === 0) ? [{ offset: i % 2 ? -1 : 0, type: 'Call', time: '14:30', note: b.possession === 'Scheduled' ? 'Coordinate possession date and snag list' : 'Remind about pending documents' }] : [],
  }));

  const mk = (spec: Spec, i: number): Lead => {
    const proj = PROJECTS[(i + (spec.bucket === 'token' ? 1 : 0)) % PROJECTS.length];
    const interest = proj.interests[(i >> 1) % proj.interests.length];
    const budget = proj.budgets[i % proj.budgets.length];
    const [source, channel] = SOURCES[(i * 3 + 1) % SOURCES.length];
    const owner = owners[i % owners.length];
    const first = FIRST[i % FIRST.length];
    const last = LAST[(i * 3 + Math.floor(i / FIRST.length)) % LAST.length];
    const name = `${first} ${last}`;
    const id = `lead-${pad(i + 1, 3)}`;
    const digits = String(9000000000 + ((i * 7654321 + 1234567) % 999999999));
    const phone = `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
    const email = `${first}.${last}${i + 1}@${MAIL[i % MAIL.length]}`.toLowerCase();

    // ---- conversation: the customer's enquiry first, then the team's notes
    const msgs: Message[] = [];
    const ask = [
      `Hi, I saw your ad for ${proj.name}. Please share the price list for ${interest}.`,
      `Looking for a ${interest} in ${proj.location}. Budget around ${budget}.`,
      `Is ${proj.name} RERA registered? Could you share the possession timeline?`,
      `Interested in ${proj.name}. Can we visit this weekend?`,
    ][i % 4];
    msgs.push({ id: `${id}-m1`, content: ask, time: clock(9, 10 + (i % 40)), sender: 'received' });
    if (spec.bucket !== 'active' || spec.status !== 'New') {
      msgs.push({ id: `${id}-m2`, content: 'Called and shared the brochure and price sheet on WhatsApp.', time: clock(11, 5 + (i % 50)), sender: 'sent' });
      msgs.push({ id: `${id}-m3`, content: ['Prefers a higher floor with a good view.', 'Wants to compare with another project before deciding.', 'Needs a home loan; asked for bank tie-ups.', 'Decision maker is the spouse; plan a joint visit.'][i % 4], time: clock(11, 20 + (i % 30)), sender: 'sent' });
    }
    (spec.notes || []).forEach((n, k) => msgs.push({ id: `${id}-n${k}`, content: n, time: clock(13, 10 + k), sender: 'sent' }));
    if (spec.visit?.status === 'Completed') msgs.push({ id: `${id}-v`, content: `Site visit done at ${proj.name}. Client liked the sample flat.`, time: clock(15, 0), sender: 'sent' });
    if (spec.token) msgs.push({ id: `${id}-t`, content: `Token of ₹${spec.token.toLocaleString('en-IN')} received via ${MODES[i % MODES.length]}.`, time: clock(16, 20), sender: 'sent' });
    if (spec.booking) msgs.push({ id: `${id}-b`, content: 'Booking confirmed and unit allotted. Documents in progress.', time: clock(17, 0), sender: 'sent' });

    // ---- tasks
    const tasks: Task[] = [];
    (spec.fu || []).forEach((f, k) => tasks.push({
      id: `${id}-fu${k}`, leadId: id, title: `Follow-up: ${f.type}`, description: `Scheduled for ${f.time}. \nNotes: ${f.note}`,
      dueDate: dayISO(f.offset), priority: f.offset < 0 ? 'High' : 'Medium', status: 'Pending', assignedTo: owner.name,
    }));
    (spec.doneFu || []).forEach((f, k) => tasks.push({
      id: `${id}-dfu${k}`, leadId: id, title: 'Follow-up: Call', description: `Scheduled for 11:00. \nNotes: ${f.note}`,
      dueDate: dayISO(f.offset), priority: 'Medium', status: 'Completed', assignedTo: owner.name,
    }));

    // ---- visits
    const siteVisits: SiteVisit[] = spec.visit ? [{ id: `${id}-sv`, leadId: id, date: dayISO(spec.visit.offset), time: spec.visit.time, propertyOfInterest: proj.name, notes: spec.visit.note, status: spec.visit.status }] : [];

    let bookingDetails: BookingDetails | undefined;
    const customData: Record<string, any> = {};
    if (spec.booking) {
      const b = spec.booking;
      const { unit, slot } = takeUnit(proj.name, interest);
      const basic = unit?.price ?? PRICE[interest] ?? 6800000;
      const other = Math.round(basic * 0.03), society = 25000, legal = 25000, maint = 50000, corpus = 50000;
      const totalConsideration = basic + other + society + legal + maint + corpus;
      const gst = Math.round(totalConsideration * 0.05), stamp = Math.round(basic * 0.06), reg = 30000;
      const docs: Record<string, CustomerDocument> = {};
      KYC_DOCS.forEach((d, k) => { docs[d] = k < b.kyc ? { status: 'Verified', fileName: `${d.replace(/\W+/g, '_')}_${first}.pdf` } : { status: 'Pending' }; });
      const unitDocuments: Record<string, CustomerDocument> = {};
      if (b.signedDraft) unitDocuments['Agreement Draft'] = b.signedDraft === 'Verified' ? { status: 'Verified', fileName: `Agreement_${last}.pdf` } : { status: b.signedDraft };
      if (b.challan) unitDocuments['Challan Copy'] = b.challan === 'Verified' ? { status: 'Verified', fileName: `Challan_${last}.pdf` } : { status: b.challan };
      const tokenAmount = spec.token ?? 101000;
      const payments = Array.from({ length: b.receipts }).map((_, k) => ({
        id: `${id}-pay${k}`, date: dayISO(-(40 - k * 7)), amount: Math.round(totalConsideration * (k === 0 ? 0.1 : 0.05)) - (k === 0 ? tokenAmount : 0),
        mode: MODES[(i + k) % MODES.length], transactionId: `TXN${pad(i + 1, 3)}${pad(k, 2)}A9`, bankName: BANKS[(i + k) % BANKS.length], milestoneName: ctx.milestones[Math.min(k, ctx.milestones.length - 1)]?.name,
      }));
      bookingDetails = {
        primaryApplicant: {
          id: `${id}-app`, fullName: name, relationValue: 'Self', dob: `${1978 + (i % 15)}-${pad(1 + (i % 12))}-${pad(1 + ((i * 3) % 27))}`,
          pan: `ABCPD${pad(1000 + i * 13, 4).slice(0, 4)}${String.fromCharCode(65 + (i % 26))}`, aadhaar: `${pad(2000 + i * 7, 4)} ${pad(4100 + i * 11, 4)} ${pad(6200 + i * 3, 4)}`,
          presentAddress: `Flat ${100 + i}, Shivaji Nagar, Pune 411005`, permanentAddress: `Flat ${100 + i}, Shivaji Nagar, Pune 411005`, isSameAddress: true,
          mobile: phone, email, occupation: ['Service', 'Business', 'Professional'][i % 3], nationality: 'Indian', customerDocuments: docs,
        },
        coApplicants: [], unitId: unit?.id ?? `unit-${i + 1}`, parkingId: slot?.id ?? `p-${i + 1}`,
        priceBreakup: { basicSalePrice: basic, floorPLC: 0, otherCharges: other, societyFormationCharges: society, legalCharges: legal, maintenanceCharges: maint, corpusFund: corpus, totalConsideration, gst, stampDuty: stamp, registrationCharges: reg, grandTotal: totalConsideration + gst + stamp + reg },
        paymentPlanId: 'pp-1',
        tokenDetails: { amount: tokenAmount, mode: MODES[i % MODES.length], transactionId: `TXN${pad(i + 1, 3)}TK${pad(i * 7, 3)}`, bankName: BANKS[i % BANKS.length], transactionDate: dayISO(-(45 + (i % 10))) },
        payments,
        demands: b.demand && ctx.milestones[1] ? [{ milestoneId: ctx.milestones[1].id, generatedDate: dayISO(-3), dueDate: dayISO(10) }] : [],
        declarationAccepted: true,
        unitDocuments,
      };
      if (b.draftGenerated) customData.agreementDraftGenerated = true;
      if (b.lineup) { customData.atsLineupDetails = { office: b.lineup.office, date: dayISO(b.lineup.offset), time: b.lineup.time }; customData.isLineupDone = true; }
      if (b.registered) {
        customData.atsLineupDetails = { office: 'Sub-Registrar Office, Haveli 4', date: dayISO(-20), time: '11:00' }; customData.isLineupDone = true;
        customData.registrationDetails = { regNumber: `HVL4-${pad(1200 + i, 5)}-2026`, bookNumber: 'Book 1', volume: String(40 + (i % 9)), regDate: dayISO(-18) }; customData.isRegistrationDetailsDone = true;
      }
      if (b.executed) { customData.executionDetails = { executionDate: dayISO(-15), remarks: 'Agreement executed and registered copy collected.' }; customData.isExecutionDone = true; }
    }

    const lastMsg = msgs[msgs.length - 1];
    return {
      id, name, avatarInitials: `${first[0]}${last[0]}`.toUpperCase(),
      lastMessage: lastMsg.content, time: whenLabel(spec.unread ? 0 : (i * 5) % 9, 9 + (i % 9), (i * 7) % 60),
      chatStatus: 'offline', leadStatus: spec.status, read: !spec.unread, messages: msgs,
      email, phone, initialInterest: [interest], siteVisits, tasks, channelSource: channel, leadSource: source,
      preferredLocation: proj.location, budget, clientProfile: PROFILES[i % PROFILES.length], livingPlace: LIVING[i % LIVING.length],
      propertyImages: [], ownerId: owner.id, ...(i % 4 === 1 ? { channelPartnerId: ['cp-1', 'cp-2', 'cp-1', 'cp-5', 'cp-3'][(i >> 2) % 5] } : {}), leadProject: proj.name, leadDate: dayISO(-spec.ageDays),
      bookingStatus: spec.booking ? 'Booked' : 'Pending',
      agreementStatus: spec.booking?.agreement ?? 'Drafted', possessionStatus: spec.booking?.possession ?? 'Pending',
      ...(spec.token ? { tokenAmount: spec.token } : {}),
      ...(bookingDetails ? { bookingDetails } : {}),
      customData,
    };
  };

  const leads = specs.map(mk);
  // A few people enquired twice (same mobile and email under another entry), so Operations > Lead merge has real work.
  for (const [keep, dup] of [[17, 63], [30, 88], [44, 102]]) {
    if (leads[keep] && leads[dup]) { leads[dup].phone = leads[keep].phone; leads[dup].email = leads[keep].email; leads[dup].name = leads[keep].name; leads[dup].avatarInitials = leads[keep].avatarInitials; }
  }
  return leads;
}
