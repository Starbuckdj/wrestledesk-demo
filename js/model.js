import { classes, coaches, plans } from "./data.js";

export const DESK_NOW = new Date(2026, 9, 5, 18, 41, 0);

export function esc(value) {
  return String(value ?? "").replace(/[&<>"']/g, (ch) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  }[ch]));
}

export function money(amount) {
  const n = Number(amount) || 0;
  const formatted = Math.abs(n).toLocaleString("en-US", { style: "currency", currency: "USD" });
  return n < 0 ? `−${formatted}` : formatted;
}

export function planById(id) {
  return plans.find((plan) => plan.id === id) || null;
}

export function coachById(id) {
  return coaches.find((coach) => coach.id === id) || null;
}

export function fmtDate(iso) {
  if (!iso) return "—";
  const date = new Date(iso.length === 10 ? `${iso}T12:00:00` : iso);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function fmtWhen(iso) {
  if (!iso) return "—";
  const date = new Date(iso.length === 10 ? `${iso}T12:00:00` : iso);
  return date.toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

export function clockLabel() {
  return DESK_NOW.toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function daysUntil(iso) {
  if (!iso) return null;
  const date = new Date(iso.length === 10 ? `${iso}T12:00:00` : iso);
  const today = new Date(2026, 9, 5, 12, 0, 0);
  return Math.round((date - today) / 86400000);
}

export function timeLabel(hhmm) {
  const [h, m] = hhmm.split(":").map(Number);
  const suffix = h >= 12 ? "pm" : "am";
  const hour = h % 12 || 12;
  return m === 0 ? `${hour}${suffix}` : `${hour}:${String(m).padStart(2, "0")}${suffix}`;
}

export const STATUS_LABEL = {
  active: "Active",
  past_due: "Past due",
  failed: "Failed payment",
  paused: "Paused",
  trial: "Trial",
  punch: "Punch pass",
  paid: "Paid",
  sent: "Sent",
  draft: "Draft",
  not_sent: "Not sent",
  opened: "Opened",
  signed: "Signed",
  expired: "Expired",
  reminded: "Reminder sent",
  retry: "Retry scheduled",
  none: "Not started",
};

export function isHotStatus(status) {
  return status === "past_due" || status === "failed" || status === "expired" || status === "paused";
}

export function statusText(status) {
  const label = STATUS_LABEL[status] || status;
  return `<span class="${isHotStatus(status) ? "hot" : ""}">${esc(label)}</span>`;
}

export function allMembers(state) {
  return state.accounts.flatMap((account) =>
    account.members.map((member) => ({ ...member, accountId: account.id, household: account.household }))
  );
}

export function findAccount(state, id) {
  return state.accounts.find((account) => account.id === id) || null;
}

export function findMember(state, id) {
  for (const account of state.accounts) {
    const member = account.members.find((item) => item.id === id);
    if (member) return { account, member };
  }
  return null;
}

export function monthlyPrice(account) {
  const plan = planById(account.planId);
  if (!plan || plan.cadence !== "month") return 0;
  if (account.status === "paused" || account.status === "trial" || account.status === "punch") return 0;
  return plan.price;
}

export function mrr(state) {
  return state.accounts.reduce((sum, account) => sum + monthlyPrice(account), 0);
}

export function pastDueAccounts(state) {
  return state.accounts.filter((account) => account.status === "past_due" || account.status === "failed");
}

export function openInvoices(state, accountId) {
  return state.invoices.filter((invoice) => {
    if (accountId && invoice.accountId !== accountId) return false;
    return invoice.status === "sent" || invoice.status === "past_due" || invoice.status === "failed" || invoice.status === "draft";
  });
}

export function openBalance(state, accountId) {
  return openInvoices(state, accountId).reduce((sum, invoice) => sum + invoice.total, 0);
}

export function activeMemberCount(state) {
  return state.accounts.reduce((sum, account) => {
    if (account.status === "paused" || account.status === "punch") return sum;
    return sum + account.members.length;
  }, 0);
}

export function stickerPrice(account) {
  return account.members.reduce((sum, member) => {
    if (member.group === "High school") return sum + 119;
    if (member.group === "Adult") return sum + (member.track === "bjj" ? 129 : 99);
    return sum + 89;
  }, 0);
}

export function waiverSummary(waiver) {
  if (!waiver) return "Not sent";
  if (waiver.status === "signed" || waiver.status === "expired") {
    const days = daysUntil(waiver.expiresAt);
    if (waiver.status === "expired" || (days !== null && days < 0)) return `Expired ${fmtDate(waiver.expiresAt)}`;
    if (days !== null && days <= 30) return `Signed · expires ${fmtDate(waiver.expiresAt)}`;
    return `Signed · through ${fmtDate(waiver.expiresAt)}`;
  }
  if (waiver.status === "opened") return `Opened ${fmtWhen(waiver.openedAt)}`;
  if (waiver.status === "sent") return `Sent ${fmtWhen(waiver.sentAt)} · ${waiver.channel === "sms" ? "text" : "email"}`;
  return "Not sent";
}

export function waiverIsProblem(waiver) {
  if (!waiver || waiver.status === "not_sent" || waiver.status === "sent" || waiver.status === "opened" || waiver.status === "expired") return true;
  const days = daysUntil(waiver.expiresAt);
  return days !== null && days <= 30;
}

export function memberFlags(state, member, account) {
  const flags = [];
  if (account.status === "past_due" || account.status === "failed") flags.push("Unpaid");
  if (account.status === "paused") flags.push("Access paused");
  if (account.status === "punch" && (member.visitsLeft || 0) <= 0) flags.push("Punch card empty");
  if (!member.waiver || member.waiver.status !== "signed") flags.push("Waiver");
  else if (waiverIsProblem(member.waiver) && member.waiver.status === "signed") flags.push("Waiver expiring");
  return flags;
}

export function classesForMember(member) {
  const seen = new Set();
  return classes.filter((item) => {
    if (seen.has(item.id)) return false;
    const onRoster = item.roster?.includes(member.id);
    const open = item.track === "open" && item.groups.length === 0;
    const groupOk = item.groups.includes(member.group);
    const trackOk = item.track === "open" || item.track === member.track || member.track === "both";
    const keep = onRoster || open || (groupOk && trackOk);
    if (keep) seen.add(item.id);
    return keep;
  });
}

export function mondayClasses() {
  return classes.filter((item) => item.day === "Mon");
}

export function checkedInCount(state) {
  return mondayClasses().reduce((sum, item) => sum + (state.checkins[item.id]?.length || 0), 0);
}

export function rosterFor(state, classId) {
  const item = classes.find((entry) => entry.id === classId);
  if (!item?.roster) return [];
  return item.roster.map((id) => findMember(state, id)).filter(Boolean);
}

export function weightBucket(weight) {
  if (weight < 60) return "Under 60";
  if (weight < 80) return "60–79";
  if (weight < 100) return "80–99";
  if (weight < 126) return "100–125";
  if (weight < 146) return "126–145";
  return "146+";
}

export function invoiceLinesForPeriod(account, periodLabel) {
  const plan = planById(account.planId);
  if (!plan || plan.cadence !== "month") return [];
  if (account.planId === "family2" || account.planId === "family3") {
    const lines = account.members.map((member) => ({
      desc: `${member.first} ${member.last} · ${member.group === "High school" ? "High school" : member.group === "Adult" ? "Adult" : "Youth practice"}`,
      amount: member.group === "High school" ? 119 : member.group === "Adult" ? 99 : 89,
    }));
    const sticker = lines.reduce((sum, line) => sum + line.amount, 0);
    const discount = sticker - plan.price;
    if (discount > 0) lines.push({ desc: "Sibling discount (family plan)", amount: -discount });
    return lines;
  }
  return [{ desc: `${plan.name} — ${periodLabel}`, amount: plan.price }];
}

export function sumLines(lines) {
  return lines.reduce((sum, line) => sum + line.amount, 0);
}

export function matFeeLines(state, account, tournamentId) {
  const tournament = state.tournaments.find((item) => item.id === tournamentId);
  if (!tournament) return [];
  const kids = account.members.filter((member) => tournament.signedUp.includes(member.id));
  if (!kids.length) return [];
  return [{
    desc: `Mat fee · ${tournament.name} · ${kids.map((kid) => kid.first).join(", ")}`,
    amount: tournament.fee * kids.length,
  }];
}

export function alerts(state) {
  const items = [];
  for (const account of pastDueAccounts(state)) {
    const invoice = state.invoices.find((row) => row.accountId === account.id && (row.status === "past_due" || row.status === "failed"));
    items.push({
      tone: "hot",
      href: "billing.html?tab=queue",
      text: `${account.payer.name} · ${account.status === "failed" ? "card failed" : "past due"} ${money(invoice?.total || planById(account.planId)?.price || 0)}`,
    });
  }
  const waiting = openBalance(state, "okonkwo");
  if (waiting > 0) {
    items.push({
      tone: "",
      href: "billing.html?tab=invoices",
      text: `Okonkwo invoice is out (${money(waiting)}). Bank transfer, not late yet.`,
    });
  }
  const waiverItems = [];
  for (const member of allMembers(state)) {
    const waiver = member.waiver;
    if (waiver?.status === "expired") {
      waiverItems.push({ tone: "hot", href: "waivers.html", text: `${member.first} ${member.last} waiver expired ${fmtDate(waiver.expiresAt)}` });
    } else if (waiver?.status === "signed") {
      const days = daysUntil(waiver.expiresAt);
      if (days !== null && days >= 0 && days <= 30) {
        waiverItems.push({ tone: "hot", href: "waivers.html", text: `${member.first} ${member.last} waiver expires ${fmtDate(waiver.expiresAt)}` });
      }
    } else if (!waiver || waiver.status === "not_sent") {
      waiverItems.push({ tone: "hot", href: "waivers.html", text: `${member.first} ${member.last} has no waiver on file` });
    }
  }
  items.push(...waiverItems.slice(0, 4));
  for (const coach of coaches) {
    for (const cert of coach.certs) {
      if (!cert.expires) continue;
      const days = daysUntil(cert.expires);
      if (days !== null && days <= 45) {
        items.push({
          tone: "hot",
          href: "coaches.html",
          text: `${coach.name.split(" ")[0]} · ${cert.name} ${days < 0 ? "expired" : `expires ${fmtDate(cert.expires)}`}`,
        });
      }
    }
  }
  return items;
}

export { classes, coaches, plans };
