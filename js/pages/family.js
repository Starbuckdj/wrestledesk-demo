import { plans } from "../data.js";
import { load, save } from "../store.js";
import { bindReset, on, paper, shell, toast } from "../ui.js";
import {
  esc,
  findAccount,
  money,
  openBalance,
  planById,
  statusText,
  stickerPrice,
  waiverSummary,
} from "../model.js";

let state = load();
const params = new URLSearchParams(location.search);
let accountId = params.get("id") || "alvarez";

function paint() {
  const account = findAccount(state, accountId);
  if (!account) {
    document.getElementById("app").innerHTML = shell("members.html", `<h1>No household</h1><p><a href="members.html">Back to members</a></p>`);
    return;
  }
  const plan = planById(account.planId);
  const sticker = stickerPrice(account);
  const price = plan?.cadence === "month" ? plan.price : 0;
  const saveAmount = Math.max(0, sticker - price);
  const invoices = state.invoices.filter((invoice) => invoice.accountId === account.id);
  const balance = openBalance(state, account.id);
  const showMath = account.planId === "family2" || account.planId === "family3" || account.members.length > 1;

  const body = `
    <header class="page-head">
      <div>
        <p class="kicker"><a href="members.html">Members</a> · household</p>
        <h1>${esc(account.household)}</h1>
        <p>${esc(account.payer.name)} · ${esc(account.payer.email)} · ${esc(account.payer.phone)}</p>
      </div>
      <div>
        <div class="${balance ? "hot" : ""}" style="font-size:28px;font-weight:800;letter-spacing:-0.04em">${esc(money(balance))}</div>
        <div class="muted">open balance</div>
      </div>
    </header>
    ${showMath ? `<section class="math" aria-label="Sibling price">
      <div><span class="muted">Each athlete alone</span><b>${esc(money(sticker))}</b></div>
      <div><span class="muted">${esc(plan?.name || "Plan")}</span><b>${esc(money(price))}</b></div>
      <div><span class="muted">Sibling discount</span><b>${esc(money(saveAmount))}</b></div>
    </section>` : ""}
    <div class="two">
      <section>
        <h2 style="font-size:16px;margin-bottom:8px">Athletes</h2>
        <table>
          <thead><tr><th>Name</th><th>Group</th><th>Weight</th><th>Waiver</th><th>PIN</th></tr></thead>
          <tbody>
            ${account.members.map((member) => `<tr>
              <td>${esc(member.first)} ${esc(member.last)}<div class="muted">${member.usa ? `USA card ${esc(member.usa.number)}` : "No USA card on file"}</div></td>
              <td>${esc(member.group)} · ${member.age}</td>
              <td>${esc(member.weight)} lb</td>
              <td class="${member.waiver.status === "signed" ? "" : "hot"}">${esc(waiverSummary(member.waiver))}</td>
              <td class="mono">${esc(member.pin)}</td>
            </tr>`).join("")}
          </tbody>
        </table>
        <form data-submit="add-athlete" class="form-grid" style="margin-top:14px;max-width:520px">
          <strong>Add an athlete to this household</strong>
          <div class="filters">
            <label class="field">First<input name="first" required></label>
            <label class="field">Last<input name="last" value="${esc(account.members[0]?.last || "")}" required></label>
            <label class="field">Age<input name="age" inputmode="numeric" required></label>
            <label class="field">Group<select name="group"><option>8U</option><option>10U</option><option>12U</option><option>14U</option><option>High school</option><option>Adult</option></select></label>
            <label class="field">Weight (lb)<input name="weight" inputmode="numeric" required></label>
          </div>
          <button class="btn small" type="submit">Add to household</button>
        </form>
      </section>
      <section>
        <h2 style="font-size:16px;margin-bottom:8px">Billing</h2>
        <p class="muted">${esc(account.method.label)} · ${statusText(account.status)}</p>
        <label class="field" style="margin-top:10px">Plan
          <select data-change="plan">
            ${plans.map((item) => `<option value="${item.id}" ${item.id === account.planId ? "selected" : ""}>${esc(item.name)} · ${esc(money(item.price))}</option>`).join("")}
          </select>
        </label>
        <p class="muted" style="margin:8px 0 12px">${esc(plan?.blurb || "")}</p>
        <div class="row-actions">
          <a class="btn small" href="billing.html?flow=1&only=${esc(account.id)}">Add to November run</a>
          <a class="ghost" href="waivers.html?account=${esc(account.id)}">Send missing waivers</a>
        </div>
        <label class="field" style="margin-top:14px">Desk note
          <textarea data-change="note">${esc(account.note || "")}</textarea>
        </label>
      </section>
    </div>
    <section style="margin-top:22px">
      <h2 style="font-size:16px;margin-bottom:8px">Invoices</h2>
      ${invoices.length ? invoices.map((invoice) => `<div style="margin-bottom:16px">${paper(invoice, account)}<p class="muted" style="margin-top:6px">${statusText(invoice.status)}</p></div>`).join("") : `<p class="empty">No invoices yet.</p>`}
    </section>`;
  document.getElementById("app").innerHTML = shell("members.html", body);
}

bindReset(() => {
  state = load();
  paint();
});

on("plan", (el) => {
  const account = findAccount(state, accountId);
  account.planId = el.value;
  if (account.status === "trial" && el.value !== "youth") account.status = "active";
  save(state);
  toast("Plan updated on this sample household.");
  paint();
});

on("note", (el) => {
  const account = findAccount(state, accountId);
  account.note = el.value;
  save(state);
});

on("add-athlete", (form) => {
  const data = new FormData(form);
  const account = findAccount(state, accountId);
  const first = String(data.get("first") || "").trim();
  const last = String(data.get("last") || "").trim();
  const age = Number(data.get("age"));
  const weight = Number(data.get("weight"));
  if (!first || !last || !age || !weight) return;
  const id = `${first}-${last}-${Date.now()}`.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  account.members.push({
    id,
    first,
    last,
    age,
    group: String(data.get("group")),
    weight,
    pin: String(1000 + (state.accounts.reduce((sum, item) => sum + item.members.length, 0) % 9000)),
    track: "folkstyle",
    waiver: { status: "not_sent", channel: null, sentAt: null, openedAt: null, signedAt: null, expiresAt: null, sends: 0 },
    usa: null,
  });
  save(state);
  toast(`${first} added. Waiver is not sent yet.`);
  paint();
});

paint();
