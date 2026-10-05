import { plans, saasTiers } from "../data.js";
import { load, save } from "../store.js";
import { bindReset, on, paper, shell, toast } from "../ui.js";
import {
  esc,
  findAccount,
  fmtWhen,
  invoiceLinesForPeriod,
  matFeeLines,
  money,
  planById,
  statusText,
  sumLines,
} from "../model.js";

let state = load();
const params = new URLSearchParams(location.search);
let tab = params.get("tab") || "queue";
let flow = params.get("flow") === "1";
let flowStep = 1;
let previewIndex = 0;
let includeMat = false;
let channel = "email";
const matTournament = "iowa-kids";

function defaultIds() {
  const only = params.get("only");
  if (only && findAccount(state, only)) return [only];
  return state.accounts.filter((account) => {
    const plan = planById(account.planId);
    if (!plan || plan.cadence !== "month") return false;
    if (["trial", "paused", "punch"].includes(account.status)) return false;
    if (!account.method.autopay) return true;
    return account.status === "past_due" || account.status === "failed";
  }).map((account) => account.id);
}

let selected = new Set(defaultIds());

function alreadyQueued(accountId) {
  return state.invoices.some((invoice) => invoice.accountId === accountId && invoice.period === "November 2026");
}

function drafts() {
  const rows = [];
  for (const id of selected) {
    const account = findAccount(state, id);
    if (!account || alreadyQueued(id)) continue;
    const plan = planById(account.planId);
    if (!plan || plan.cadence !== "month") continue;
    if (account.status === "paused" || account.status === "trial") continue;
    let lines = invoiceLinesForPeriod(account, "November 2026");
    if (includeMat) lines = lines.concat(matFeeLines(state, account, matTournament));
    rows.push({
      id: "PREVIEW",
      accountId: id,
      period: "November 2026",
      issued: "2026-11-01",
      due: "2026-11-05",
      status: "draft",
      lines,
      total: sumLines(lines),
      channel,
    });
  }
  return rows;
}

function messageFor(draft) {
  const account = findAccount(state, draft.accountId);
  const names = account.members.map((member) => member.first).join(", ");
  if (channel === "sms") {
    return `Lot 9: November dues for ${account.household} are ${money(draft.total)}. Athletes: ${names}. This is a demo link and does not take a payment. — Dana`;
  }
  return `Subject: November dues — Lot 9 Wrestling

${account.payer.name.split(" ")[0]} —

November practice dues are ${money(draft.total)}, due Nov 5.
Athletes on the bill: ${names}.

The pay link in the real product would open the parent page. In this demo it does not leave the browser and it does not charge a card.

— Dana Ruiz
Lot 9 Wrestling`;
}

function queueRows() {
  return state.accounts.filter((account) => ["past_due", "failed", "paused"].includes(account.status));
}

function renderQueue() {
  const rows = queueRows();
  return `
    <p class="muted" style="margin-bottom:10px">Three moves, in order: remind them, retry the card, then pause mat access. Buttons only mark the step. They do not text anyone or talk to a processor.</p>
    <table>
      <thead><tr><th>Household</th><th>Amount</th><th>Step</th><th>What Dana can do</th></tr></thead>
      <tbody>
        ${rows.map((account) => {
          const open = state.invoices.find((invoice) => invoice.accountId === account.id && ["past_due", "failed", "sent"].includes(invoice.status));
          const amount = open?.total || planById(account.planId)?.price || 0;
          const step = account.dunning.step;
          return `<tr>
            <td><a class="rowlink" href="family.html?id=${esc(account.id)}">${esc(account.household)}</a><div class="muted">${esc(account.payer.name)} · ${esc(account.method.label)}</div></td>
            <td class="hot">${esc(money(amount))}<div class="muted">${statusText(account.status)}</div></td>
            <td>${esc(step === "none" ? "Not started" : step === "reminded" ? "Reminder sent" : step === "retry" ? "Retry scheduled" : "Access paused")}
              <div class="muted">${account.dunning.log.length ? esc(fmtWhen(account.dunning.log.at(-1).at)) : ""}</div></td>
            <td class="row-actions">
              <button type="button" class="ghost" data-action="remind" data-id="${esc(account.id)}" ${step !== "none" ? "disabled" : ""}>Mark reminder sent</button>
              <button type="button" class="ghost" data-action="retry" data-id="${esc(account.id)}" ${step === "paused" ? "disabled" : ""}>Mark retry</button>
              <button type="button" class="ghost" data-action="pause" data-id="${esc(account.id)}" ${account.status === "paused" ? "disabled" : ""}>Pause mat access</button>
            </td>
          </tr>`;
        }).join("")}
      </tbody>
    </table>`;
}

function renderInvoices() {
  const rows = [...state.invoices].sort((a, b) => (a.status === "paid") - (b.status === "paid"));
  return `<table>
    <thead><tr><th>Invoice</th><th>Household</th><th>Period</th><th>Status</th><th>Total</th><th></th></tr></thead>
    <tbody>
      ${rows.map((invoice) => {
        const account = findAccount(state, invoice.accountId);
        return `<tr>
          <td class="mono">${esc(invoice.id)}</td>
          <td><a class="rowlink" href="family.html?id=${esc(account.id)}">${esc(account.household)}</a></td>
          <td>${esc(invoice.period)}</td>
          <td>${statusText(invoice.status)}</td>
          <td class="num">${esc(money(invoice.total))}</td>
          <td>${invoice.status === "paid" ? "" : `<button type="button" class="ghost" data-action="mark-paid" data-id="${esc(invoice.id)}">Mark paid</button>`}</td>
        </tr>`;
      }).join("")}
    </tbody>
  </table>
  <p class="muted" style="margin-top:8px">Mark paid is a desk note. It does not capture a payment.</p>`;
}

function renderPlans() {
  return `<table>
    <thead><tr><th>Plan</th><th>Price</th><th>Who it's for</th></tr></thead>
    <tbody>
      ${plans.map((plan) => `<tr><td>${esc(plan.name)}</td><td>${esc(money(plan.price))}${plan.cadence === "month" ? "/mo" : ""}</td><td class="muted">${esc(plan.blurb)}</td></tr>`).join("")}
    </tbody>
  </table>
  <p class="muted" style="margin-top:12px">Family plans are the sibling price. The Alvarez bill shows three single dues, then the discount, then $199. WrestleDesk's own example pricing (what a club would pay for this software) is separate and labeled on the marketing page: ${saasTiers.map((tier) => `${tier.name} ${money(tier.price)}`).join(", ")}.</p>`;
}

function renderMethod() {
  return `<form data-submit="pay-form" class="form-grid" style="max-width:420px">
    <p>Save a card on the club's file. This form is a prop. It does not store the number and it does not call Stripe or any other processor.</p>
    <label class="field">Name on card<input name="name" autocomplete="off" placeholder="Marisol Alvarez"></label>
    <label class="field">Card number<input name="card" inputmode="numeric" autocomplete="off" placeholder="4242 4242 4242 4242"></label>
    <div class="filters">
      <label class="field">Exp<input name="exp" autocomplete="off" placeholder="12 / 28"></label>
      <label class="field">CVC<input name="cvc" autocomplete="off" placeholder="123"></label>
      <label class="field">ZIP<input name="zip" autocomplete="off" placeholder="50317"></label>
    </div>
    <button class="btn" type="submit">Save card</button>
  </form>`;
}

function renderFlow() {
  const rows = drafts();
  const total = rows.reduce((sum, row) => sum + row.total, 0);
  const preview = rows[Math.min(previewIndex, Math.max(rows.length - 1, 0))];
  const choices = state.accounts.filter((account) => {
    const plan = planById(account.planId);
    return plan && plan.cadence === "month" && !["paused", "trial"].includes(account.status);
  });
  return `
    <header class="page-head">
      <div>
        <p class="kicker">Billing run · step ${flowStep} of 3</p>
        <h1>${flowStep === 1 ? "Who gets a November invoice" : flowStep === 2 ? "Preview the run" : "Queue it"}</h1>
        <p>Autopay households start unchecked. Bank-transfer and anyone past due start checked. Uncheck anyone you do not want on this run.</p>
      </div>
      <button type="button" class="ghost" data-action="close-flow">Back to billing</button>
    </header>
    ${flowStep === 1 ? `
      <div class="flow">
        ${choices.map((account) => {
          const queued = alreadyQueued(account.id);
          return `<label class="choice"><input type="checkbox" data-change="pick" data-id="${esc(account.id)}" ${selected.has(account.id) ? "checked" : ""} ${queued ? "disabled" : ""}> ${esc(account.household)} · ${esc(planById(account.planId).name)} · ${esc(money(planById(account.planId).price))} <span class="muted">${queued ? "· already queued" : account.method.autopay ? "· card on file" : "· send an invoice"} · ${esc(account.method.label)}</span></label>`;
        }).join("")}
        <label class="choice"><input type="checkbox" data-change="mat" ${includeMat ? "checked" : ""}> Add Iowa Kids Folkstyle mat fees ($25) for athletes already signed up</label>
        <div class="row-actions" style="margin-top:12px">
          <span class="muted">Send by</span>
          <button type="button" class="${channel === "email" ? "btn small" : "ghost"}" data-action="channel" data-channel="email">Email</button>
          <button type="button" class="${channel === "sms" ? "btn small" : "ghost"}" data-action="channel" data-channel="sms">Text</button>
        </div>
        <p style="margin-top:16px"><button type="button" class="btn" data-action="to-preview" ${rows.length ? "" : "disabled"}>Preview ${rows.length} invoice${rows.length === 1 ? "" : "s"} · ${esc(money(total))}</button></p>
      </div>` : ""}
    ${flowStep === 2 && preview ? `
      <div class="flow">
        <p>${rows.length} invoices · ${esc(money(total))} · ${channel === "sms" ? "text" : "email"}. Nothing sends until you queue the run.</p>
        <div class="row-actions" style="margin:12px 0">
          <button type="button" class="ghost" data-action="prev-preview">Previous</button>
          <span>Preview ${previewIndex + 1} of ${rows.length}</span>
          <button type="button" class="ghost" data-action="next-preview">Next</button>
        </div>
        ${paper(preview, findAccount(state, preview.accountId))}
        <h2 style="font-size:16px;margin:16px 0 8px">${channel === "sms" ? "Text" : "Email"} the parent would get</h2>
        <div class="message">${esc(messageFor(preview))}</div>
        <p style="margin-top:16px" class="row-actions">
          <button type="button" class="ghost" data-action="flow-step" data-step="1">Edit who</button>
          <button type="button" class="btn" data-action="flow-step" data-step="3">Continue</button>
        </p>
      </div>` : ""}
    ${flowStep === 3 ? `
      <div class="flow">
        <p>You are about to queue <strong>${rows.length}</strong> November invoices totaling <strong>${esc(money(total))}</strong>.</p>
        <p class="muted" style="margin-top:8px">No card will be charged. No email or text will be delivered. The invoices show up in the list as sent.</p>
        <ul>
          ${rows.map((row) => `<li>${esc(findAccount(state, row.accountId).household)} · ${esc(money(row.total))}</li>`).join("")}
        </ul>
        <p class="row-actions">
          <button type="button" class="ghost" data-action="flow-step" data-step="2">Back to preview</button>
          <button type="button" class="btn" data-action="queue-run">Queue the run</button>
        </p>
      </div>` : ""}`;
}

function renderPage() {
  const due = queueRows().filter((account) => account.status !== "paused");
  const dueAmount = due.reduce((sum, account) => {
    const open = state.invoices.find((invoice) => invoice.accountId === account.id && ["past_due", "failed"].includes(invoice.status));
    return sum + (open?.total || 0);
  }, 0);
  return `
    <header class="page-head">
      <div>
        <p class="kicker">Billing</p>
        <h1>Dues, invoices, and the people who have not paid</h1>
        <p>Most households are on a card. The November run is for bank transfer plus anyone whose card already failed.</p>
      </div>
      <button type="button" class="btn" data-action="start-run">Run November billing</button>
    </header>
    <section class="metrics">
      <div class="metric"><b>${defaultIds().length}</b><span>Ready for the November run</span></div>
      <div class="metric"><b class="hot">${due.length}</b><span>Past due or failed</span></div>
      <div class="metric"><b class="hot">${esc(money(dueAmount))}</b><span>Still open from those accounts</span></div>
      <div class="metric"><b>${state.invoices.filter((invoice) => invoice.status === "paid").length}</b><span>Paid invoices in the sample</span></div>
    </section>
    <div class="tabs" role="tablist">
      ${[["queue", "Past due"], ["invoices", "Invoices"], ["plans", "Plans"], ["method", "Card form"]].map(([id, label]) => `<button type="button" role="tab" aria-selected="${tab === id}" data-action="tab" data-tab="${id}">${label}</button>`).join("")}
    </div>
    ${tab === "queue" ? renderQueue() : tab === "invoices" ? renderInvoices() : tab === "plans" ? renderPlans() : renderMethod()}`;
}

function paint() {
  document.getElementById("app").innerHTML = shell("billing.html", flow ? renderFlow() : renderPage());
}

bindReset(() => {
  state = load();
  selected = new Set(defaultIds());
  flow = false;
  paint();
});

on("tab", (el) => { tab = el.dataset.tab; paint(); });
on("start-run", () => { flow = true; flowStep = 1; paint(); });
on("close-flow", () => { flow = false; paint(); });
on("channel", (el) => { channel = el.dataset.channel; paint(); });
on("to-preview", () => { flowStep = 2; previewIndex = 0; paint(); });
on("flow-step", (el) => { flowStep = Number(el.dataset.step); paint(); });
on("prev-preview", () => { previewIndex = Math.max(0, previewIndex - 1); paint(); });
on("next-preview", () => { previewIndex = Math.min(drafts().length - 1, previewIndex + 1); paint(); });
on("pick", (el) => {
  if (el.checked) selected.add(el.dataset.id);
  else selected.delete(el.dataset.id);
  paint();
});
on("mat", (el) => { includeMat = el.checked; paint(); });

on("queue-run", () => {
  const rows = drafts();
  for (const draft of rows) {
    state.invoices.unshift({
      ...draft,
      id: `L9-${state.nextInvoice++}`,
      status: "sent",
      sentAt: new Date().toISOString(),
      openedAt: null,
      paidAt: null,
    });
  }
  save(state);
  toast(`${rows.length} invoices queued. Nothing was charged and nothing was emailed.`);
  flow = false;
  tab = "invoices";
  paint();
});

function stamp(account, step) {
  account.dunning.step = step;
  account.dunning.log.push({ step, at: new Date().toISOString() });
}

on("remind", (el) => {
  const account = findAccount(state, el.dataset.id);
  stamp(account, "reminded");
  save(state);
  toast(`Reminder marked sent for ${account.household}. No message left this browser.`);
  paint();
});

on("retry", (el) => {
  const account = findAccount(state, el.dataset.id);
  stamp(account, "retry");
  save(state);
  toast(`Retry marked for ${account.household}. No card was retried.`);
  paint();
});

on("pause", (el) => {
  const account = findAccount(state, el.dataset.id);
  account.status = "paused";
  account.method.autopay = false;
  stamp(account, "paused");
  save(state);
  toast(`${account.household} is paused at the door. Check-in will flag them.`);
  paint();
});

on("mark-paid", (el) => {
  const invoice = state.invoices.find((item) => item.id === el.dataset.id);
  if (!invoice) return;
  invoice.status = "paid";
  invoice.paidAt = new Date().toISOString();
  const account = findAccount(state, invoice.accountId);
  const still = state.invoices.some((item) => item.accountId === account.id && ["past_due", "failed"].includes(item.status));
  if (!still && ["past_due", "failed", "paused"].includes(account.status)) account.status = "active";
  save(state);
  toast(`${invoice.id} marked paid on the desk. No money moved.`);
  paint();
});

on("pay-form", (form) => {
  form.reset();
  toast("Demo only. Those card fields were cleared and were not saved. No payment processor was contacted.");
});

paint();
