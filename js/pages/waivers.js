import { load, save } from "../store.js";
import { bindReset, on, shell, toast } from "../ui.js";
import {
  allMembers,
  daysUntil,
  esc,
  findMember,
  fmtDate,
  fmtWhen,
  waiverSummary,
} from "../model.js";

let state = load();
const params = new URLSearchParams(location.search);
let filter = "all";
let expanded = null;
let channel = "email";
let composer = params.get("account") ? "preview" : null;
let selected = new Set();

if (params.get("account")) {
  const account = state.accounts.find((item) => item.id === params.get("account"));
  account?.members.forEach((member) => {
    if (member.waiver.status !== "signed") selected.add(member.id);
  });
}

function matches(member) {
  const waiver = member.waiver;
  if (filter === "all") return true;
  if (filter === "expiring") {
    return waiver.status === "signed" && daysUntil(waiver.expiresAt) !== null && daysUntil(waiver.expiresAt) <= 30;
  }
  return waiver.status === filter;
}

function counts() {
  const members = allMembers(state);
  const tally = { not_sent: 0, sent: 0, opened: 0, signed: 0, expired: 0, expiring: 0 };
  for (const member of members) {
    const status = member.waiver.status;
    if (tally[status] !== undefined) tally[status] += 1;
    if (status === "signed" && daysUntil(member.waiver.expiresAt) !== null && daysUntil(member.waiver.expiresAt) <= 30) tally.expiring += 1;
  }
  return tally;
}

function applySend(ids, { keepSigned }) {
  const now = new Date().toISOString();
  for (const id of ids) {
    const hit = findMember(state, id);
    if (!hit) continue;
    const waiver = hit.member.waiver;
    waiver.channel = channel;
    waiver.sentAt = now;
    waiver.sends = (waiver.sends || 0) + 1;
    if (keepSigned && waiver.status === "signed") continue;
    waiver.status = "sent";
    waiver.openedAt = null;
    waiver.signedAt = null;
    waiver.expiresAt = null;
  }
  save(state);
}

function messageFor(member, account) {
  const via = channel === "sms" ? "text" : "email";
  if (channel === "sms") {
    return `Lot 9: please sign the participation waiver for ${member.first} ${member.last}. Demo link only — nothing was actually texted. — Dana`;
  }
  return `To: ${account.payer.email}
Subject: Sign the Lot 9 waiver for ${member.first}

${account.payer.name.split(" ")[0]} —

${member.first} needs a signed waiver before the next practice. It takes about two minutes. A signature is good for a year.

This ${via} is a demo. It was not delivered.

— Dana Ruiz, Lot 9 Wrestling`;
}

function paint() {
  const tally = counts();
  const members = allMembers(state).filter(matches);
  const chosen = [...selected].map((id) => findMember(state, id)).filter(Boolean);
  const sample = chosen[0];

  const composerBlock = composer && chosen.length ? `
    <section class="composer">
      <p class="kicker">Send waiver · ${composer === "preview" ? "preview" : "queued"}</p>
      <h2 style="font-size:22px;margin-bottom:8px">${chosen.length} link${chosen.length === 1 ? "" : "s"} for ${esc([...new Set(chosen.map(({ account }) => account.household))].join(", "))}</h2>
      <div class="row-actions">
        <button type="button" class="${channel === "email" ? "btn small" : "ghost"}" data-action="channel" data-channel="email">Email the parent</button>
        <button type="button" class="${channel === "sms" ? "btn small" : "ghost"}" data-action="channel" data-channel="sms">Text a link</button>
      </div>
      <ul>${chosen.map(({ member, account }) => `<li>${esc(member.first)} ${esc(member.last)} · ${esc(account.payer.email)} · ${esc(account.payer.phone)} · now ${esc(member.waiver.status.replace("_", " "))}</li>`).join("")}</ul>
      ${sample ? `<div class="message">${esc(messageFor(sample.member, sample.account))}</div>` : ""}
      <p class="row-actions" style="margin-top:12px">
        <button type="button" class="ghost" data-action="cancel-send">Cancel</button>
        <button type="button" class="btn" data-action="queue-waivers">Queue ${chosen.length} link${chosen.length === 1 ? "" : "s"}</button>
      </p>
      <p class="muted" style="margin-top:8px">Queueing updates the status to sent. No email or SMS is delivered.</p>
    </section>` : "";

  const body = `
    <header class="page-head">
      <div>
        <p class="kicker">Waivers</p>
        <h1>Who signed, who opened, who you still have to chase</h1>
        <p>Pick athletes or a whole household, preview the email or text, then mark it sent. Resend anyone who went quiet.</p>
      </div>
      <button type="button" class="btn" data-action="open-composer">Send waiver</button>
    </header>
    <section class="metrics">
      ${[["not_sent", "Not sent"], ["sent", "Sent"], ["opened", "Opened"], ["signed", "Signed"], ["expired", "Expired"], ["expiring", "Expiring"]].map(([key, label]) => `<div class="metric"><b class="${key === "signed" ? "" : tally[key] ? "hot" : ""}">${tally[key]}</b><span>${label}</span></div>`).join("")}
    </section>
    ${composerBlock}
    <details style="margin-bottom:14px">
      <summary>Waiver copy on file</summary>
      <label class="field" style="margin-top:8px">Template
        <textarea data-change="template">${esc(state.waiverTemplate)}</textarea>
      </label>
      <p class="muted">Edits stay in this browser. This is not a legal form.</p>
    </details>
    <div class="filters">
      ${[["all", "All"], ["not_sent", "Not sent"], ["sent", "Sent"], ["opened", "Opened"], ["signed", "Signed"], ["expired", "Expired"], ["expiring", "Expiring soon"]].map(([id, label]) => `<button type="button" class="${filter === id ? "btn small" : "ghost"}" data-action="filter" data-filter="${id}">${label}</button>`).join("")}
    </div>
    <table>
      <thead><tr><th></th><th>Athlete</th><th>Household</th><th>Status</th><th></th></tr></thead>
      <tbody>
        ${members.map((member) => {
          const hit = findMember(state, member.id);
          const waiver = hit.member.waiver;
          const open = expanded === member.id;
          return `<tr>
            <td><input type="checkbox" data-change="pick" data-id="${esc(member.id)}" ${selected.has(member.id) ? "checked" : ""} aria-label="Select ${esc(member.first)}"></td>
            <td><button type="button" class="linkish" data-action="expand" data-id="${esc(member.id)}">${esc(member.first)} ${esc(member.last)}</button><div class="muted">${esc(member.group)}</div></td>
            <td>${esc(hit.account.household)}<div class="muted">${esc(hit.account.payer.email)}</div></td>
            <td class="${waiver.status === "signed" ? "" : "hot"}">${esc(waiverSummary(waiver))}</td>
            <td class="row-actions">
              <button type="button" class="ghost" data-action="resend" data-id="${esc(member.id)}">Resend</button>
              <button type="button" class="ghost" data-action="preview-link" data-id="${esc(member.id)}">Parent link</button>
            </td>
          </tr>
          ${open ? `<tr><td colspan="5"><div class="timeline">
            Sent ${waiver.sentAt ? esc(fmtWhen(waiver.sentAt)) : "—"} · ${esc(waiver.channel || "no channel")} · ${waiver.sends || 0} send${waiver.sends === 1 ? "" : "s"}<br>
            Opened ${waiver.openedAt ? esc(fmtWhen(waiver.openedAt)) : "—"}<br>
            Signed ${waiver.signedAt ? esc(fmtWhen(waiver.signedAt)) : "—"}<br>
            Expires ${waiver.expiresAt ? esc(fmtDate(waiver.expiresAt)) : "—"}
          </div></td></tr>` : ""}`;
        }).join("") || `<tr><td colspan="5" class="empty">Nobody in this filter.</td></tr>`}
      </tbody>
    </table>`;
  document.getElementById("app").innerHTML = shell("waivers.html", body);
}

bindReset(() => {
  state = load();
  selected = new Set();
  composer = null;
  paint();
});

on("filter", (el) => { filter = el.dataset.filter; paint(); });
on("channel", (el) => { channel = el.dataset.channel; paint(); });
on("expand", (el) => { expanded = expanded === el.dataset.id ? null : el.dataset.id; paint(); });
on("pick", (el) => {
  if (el.checked) selected.add(el.dataset.id);
  else selected.delete(el.dataset.id);
});
on("open-composer", () => {
  if (!selected.size) {
    toast("Pick at least one athlete.");
    return;
  }
  composer = "preview";
  paint();
});
on("cancel-send", () => { composer = null; paint(); });
on("queue-waivers", () => {
  const ids = [...selected];
  applySend(ids, { keepSigned: false });
  toast(`${ids.length} waiver link${ids.length === 1 ? "" : "s"} marked sent. Nothing was emailed or texted.`);
  composer = null;
  selected = new Set();
  filter = "sent";
  paint();
});
on("resend", (el) => {
  const hit = findMember(state, el.dataset.id);
  const keep = hit.member.waiver.status === "signed";
  channel = hit.member.waiver.channel || channel;
  applySend([el.dataset.id], { keepSigned: keep });
  toast(keep ? `Reminder marked for ${hit.member.first}. Still signed.` : `Link marked sent again for ${hit.member.first}.`);
  paint();
});
on("preview-link", (el) => {
  const hit = findMember(state, el.dataset.id);
  const waiver = hit.member.waiver;
  if (waiver.status === "sent") {
    waiver.status = "opened";
    waiver.openedAt = new Date().toISOString();
    save(state);
  }
  const existing = document.getElementById("link-dialog");
  existing?.remove();
  const dialog = document.createElement("dialog");
  dialog.id = "link-dialog";
  dialog.className = "sheet";
  dialog.innerHTML = `<h2 style="font-size:20px">Parent link</h2>
    <p class="muted">lot9.example/w/${esc(hit.member.id)} · demo only</p>
    <pre class="message" style="margin-top:12px">${esc(state.waiverTemplate)}</pre>
    <p style="margin-top:12px">Status for ${esc(hit.member.first)}: ${esc(waiverSummary(hit.member.waiver))}</p>
    <p class="row-actions" style="margin-top:12px"><button type="button" class="btn" data-action="close-dialog">Close</button></p>`;
  document.body.appendChild(dialog);
  dialog.showModal();
  paint();
});
on("close-dialog", () => {
  document.getElementById("link-dialog")?.close();
  document.getElementById("link-dialog")?.remove();
});
on("template", (el) => {
  state.waiverTemplate = el.value;
  save(state);
});

paint();
