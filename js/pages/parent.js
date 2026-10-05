import { load, save } from "../store.js";
import { on, parentShell, toast } from "../ui.js";
import {
  classesForMember,
  clockLabel,
  coachById,
  daysUntil,
  esc,
  findAccount,
  fmtDate,
  money,
  openBalance,
  statusText,
  timeLabel,
  waiverSummary,
} from "../model.js";

let state = load();
const homes = ["alvarez", "brennan", "okonkwo", "herrera"];
let home = new URLSearchParams(location.search).get("home") || "alvarez";
if (!homes.includes(home)) home = "alvarez";

function waiverIsTight(member) {
  const days = daysUntil(member.waiver.expiresAt);
  return member.waiver.status === "signed" && days !== null && days <= 30;
}

function paint() {
  const account = findAccount(state, home);
  const balance = openBalance(state, account.id);
  const openInvoice = state.invoices.find((invoice) => invoice.accountId === account.id && invoice.status !== "paid");
  const problemKid = account.members.find((member) => member.waiver.status !== "signed" || (daysUntil(member.waiver.expiresAt) !== null && daysUntil(member.waiver.expiresAt) <= 30));

  const schedule = [];
  const seen = new Set();
  for (const member of account.members) {
    for (const item of classesForMember(member)) {
      if (seen.has(item.id)) continue;
      seen.add(item.id);
      schedule.push(item);
    }
  }
  const dayOrder = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  schedule.sort((a, b) => dayOrder.indexOf(a.day) - dayOrder.indexOf(b.day) || a.start.localeCompare(b.start));

  const history = state.history.filter((row) => account.members.some((member) => member.id === row.memberId));

  const body = `
    <p class="kicker">Parent page · ${esc(clockLabel())}</p>
    <h1 style="font-size:26px">${esc(account.payer.name)}</h1>
    <p class="muted">${esc(account.household)} household · ${statusText(account.status)}</p>
    <div class="switcher" aria-label="Sample households">
      ${homes.map((id) => `<a href="parent.html?home=${id}" ${id === home ? 'aria-current="true"' : ""}>${esc(findAccount(state, id).household)}</a>`).join("")}
    </div>
    ${account.members.map((member) => `<div class="kid"><div><strong>${esc(member.first)}</strong> <span class="muted">${esc(member.group)} · ${esc(member.weight)} lb</span><div class="${member.waiver.status === "signed" && !waiverIsTight(member) ? "muted" : "hot"}">${esc(waiverSummary(member.waiver))}</div></div>${member.waiver.status === "signed" && !waiverIsTight(member) ? "" : `<button type="button" class="ghost" data-action="sign" data-id="${esc(member.id)}">Sign</button>`}</div>`).join("")}
    <section class="callout ${balance ? "problem" : ""}">
      <div class="split"><span>Balance</span><strong class="${balance ? "hot" : ""}">${esc(money(balance))}</strong></div>
      <p class="muted" style="margin-top:6px">${openInvoice ? `${esc(openInvoice.id)} · ${esc(openInvoice.period)}` : "October dues are marked paid. November has not been sent."}</p>
      <button type="button" class="btn" style="margin-top:10px" data-action="pay">Pay</button>
    </section>
    ${problemKid ? `<section class="callout problem">
      <strong>${esc(problemKid.first)} needs a waiver</strong>
      <p class="muted" style="margin:6px 0 10px">${esc(waiverSummary(problemKid.waiver))}. Signing here updates the coach's waiver desk. It is still sample data.</p>
      <button type="button" class="btn small" data-action="sign" data-id="${esc(problemKid.id)}">Sign waiver</button>
    </section>` : ""}
    <h2 style="font-size:16px;margin:16px 0 6px">Tournament sign-up</h2>
    ${state.tournaments.map((tournament) => `
      <div style="padding:8px 0;border-bottom:1px solid var(--line)">
        <strong>${esc(tournament.name)}</strong>
        <div class="muted">${esc(fmtDate(tournament.date))} · ${esc(tournament.where)} · mat fee ${esc(money(tournament.fee))}</div>
        ${account.members.map((member) => {
          const on = tournament.signedUp.includes(member.id);
          const relevant = member.track === "bjj" ? tournament.id === "bjj-open" : tournament.id !== "bjj-open";
          if (!relevant && !on) return "";
          return `<label class="choice"><input type="checkbox" data-change="signup" data-tournament="${esc(tournament.id)}" data-id="${esc(member.id)}" ${on ? "checked" : ""}> ${esc(member.first)} ${on ? "is in" : "sign up"}</label>`;
        }).join("")}
      </div>`).join("")}
    <h2 style="font-size:16px;margin:16px 0 6px">This week</h2>
    ${schedule.map((item) => `<div class="kid"><div><strong>${esc(item.name)}</strong><div class="muted">${esc(item.day)} ${esc(timeLabel(item.start))} · ${esc(coachById(item.coachId)?.name.split(" ")[0] || "")}</div></div><span class="muted">${esc(item.room)}</span></div>`).join("")}
    <h2 style="font-size:16px;margin:16px 0 6px">Recent attendance</h2>
    ${history.length ? history.slice(-6).reverse().map((row) => {
      const member = account.members.find((item) => item.id === row.memberId);
      return `<div class="kid"><span>${esc(member?.first || "")} · ${esc(row.label)}</span><span class="muted">${esc(fmtDate(row.date))}</span></div>`;
    }).join("") : `<p class="empty">No practices logged yet.</p>`}
    <dialog class="sheet" id="pay-dialog">
      <h2 style="font-size:20px">Pay ${esc(money(balance || 0))}</h2>
      <p class="muted">Demo only. Submitting does not charge a card and does not mark the balance paid.</p>
      <form data-submit="pay-form" class="form-grid">
        <label class="field">Name on card<input autocomplete="off" placeholder="${esc(account.payer.name)}"></label>
        <label class="field">Card number<input inputmode="numeric" autocomplete="off" placeholder="4242 4242 4242 4242"></label>
        <label class="field">Exp<input autocomplete="off" placeholder="12 / 28"></label>
        <label class="field">CVC<input autocomplete="off" placeholder="123"></label>
        <button class="btn" type="submit">Submit payment</button>
      </form>
      <button type="button" class="ghost" data-action="close-pay">Close</button>
    </dialog>`;
  document.getElementById("app").innerHTML = parentShell(body);
}

on("pay", () => {
  document.getElementById("pay-dialog")?.showModal();
});
on("close-pay", () => document.getElementById("pay-dialog")?.close());
on("pay-form", (form) => {
  form.reset();
  document.getElementById("pay-dialog")?.close();
  toast("Demo only. Nothing was charged. The balance is unchanged.");
});
on("sign", (el) => {
  const account = findAccount(state, home);
  const member = account.members.find((item) => item.id === el.dataset.id);
  const now = new Date().toISOString();
  member.waiver.status = "signed";
  member.waiver.signedAt = now;
  member.waiver.openedAt = member.waiver.openedAt || now;
  member.waiver.sentAt = member.waiver.sentAt || now;
  member.waiver.channel = member.waiver.channel || "email";
  member.waiver.expiresAt = "2027-10-05";
  member.waiver.sends = member.waiver.sends || 1;
  save(state);
  toast(`${member.first}'s waiver is signed on the sample desk.`);
  paint();
});
on("signup", (el) => {
  const tournament = state.tournaments.find((item) => item.id === el.dataset.tournament);
  const set = new Set(tournament.signedUp);
  if (el.checked) set.add(el.dataset.id);
  else set.delete(el.dataset.id);
  tournament.signedUp = [...set];
  save(state);
  const member = findAccount(state, home).members.find((item) => item.id === el.dataset.id);
  toast(el.checked ? `${member.first} is on the list. Mat fee can go on the next billing run. Not charged now.` : `${member.first} taken off ${tournament.name}.`);
  paint();
});

paint();
