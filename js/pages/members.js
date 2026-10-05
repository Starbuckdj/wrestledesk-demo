import { plans } from "../data.js";
import { load } from "../store.js";
import { bindReset, on, shell } from "../ui.js";
import {
  allMembers,
  esc,
  money,
  openBalance,
  planById,
  statusText,
  waiverSummary,
  weightBucket,
} from "../model.js";

let state = load();
let mode = "households";
let filters = { q: "", plan: "all", status: "all", group: "all", weight: "all" };
let focusSearch = false;

const groups = ["8U", "10U", "12U", "14U", "High school", "Adult"];
const weights = ["Under 60", "60–79", "80–99", "100–125", "126–145", "146+"];

function paint() {
  const athleteMode = mode === "athletes" || filters.group !== "all" || filters.weight !== "all";
  const members = allMembers(state).filter((member) => {
    const account = state.accounts.find((item) => item.id === member.accountId);
    const plan = planById(account.planId);
    const blob = `${member.first} ${member.last} ${account.household} ${account.payer.name}`.toLowerCase();
    if (filters.q && !blob.includes(filters.q.toLowerCase())) return false;
    if (filters.plan !== "all" && account.planId !== filters.plan) return false;
    if (filters.status !== "all" && account.status !== filters.status) return false;
    if (filters.group !== "all" && member.group !== filters.group) return false;
    if (filters.weight !== "all" && weightBucket(member.weight) !== filters.weight) return false;
    return true;
  });

  const accounts = state.accounts.filter((account) => {
    const blob = `${account.household} ${account.payer.name} ${account.members.map((member) => member.first).join(" ")}`.toLowerCase();
    if (filters.q && !blob.includes(filters.q.toLowerCase())) return false;
    if (filters.plan !== "all" && account.planId !== filters.plan) return false;
    if (filters.status !== "all" && account.status !== filters.status) return false;
    return true;
  }).sort((a, b) => {
    const rank = (status) => (status === "failed" || status === "past_due" ? 0 : status === "paused" ? 1 : 2);
    return rank(a.status) - rank(b.status);
  });

  const householdTable = `
    <table>
      <thead><tr><th>Household</th><th>Payer</th><th>Plan</th><th>Athletes</th><th>Status</th><th>Open</th></tr></thead>
      <tbody>
        ${accounts.map((account) => {
          const plan = planById(account.planId);
          const balance = openBalance(state, account.id);
          return `<tr>
            <td><a class="rowlink" href="family.html?id=${esc(account.id)}">${esc(account.household)}</a></td>
            <td>${esc(account.payer.name)}<div class="muted">${esc(account.payer.email)}</div></td>
            <td>${esc(plan?.name || "")}<div class="muted">${plan?.cadence === "month" ? esc(money(plan.price)) + "/mo" : esc(money(plan?.price || 0))}</div></td>
            <td>${account.members.map((member) => esc(member.first)).join(", ")}</td>
            <td>${statusText(account.status)}</td>
            <td class="num ${balance ? "hot" : ""}">${esc(money(balance))}</td>
          </tr>`;
        }).join("") || `<tr><td colspan="6" class="empty">No households match.</td></tr>`}
      </tbody>
    </table>`;

  const athleteTable = `
    <table>
      <thead><tr><th>Athlete</th><th>Household</th><th>Group</th><th>Weight</th><th>Plan</th><th>Waiver</th></tr></thead>
      <tbody>
        ${members.map((member) => {
          const account = state.accounts.find((item) => item.id === member.accountId);
          return `<tr>
            <td><a class="rowlink" href="family.html?id=${esc(account.id)}">${esc(member.first)} ${esc(member.last)}</a><div class="muted">PIN ${esc(member.pin)}</div></td>
            <td>${esc(account.household)}</td>
            <td>${esc(member.group)}</td>
            <td>${esc(member.weight)} lb</td>
            <td>${esc(planById(account.planId)?.name || "")}</td>
            <td class="${member.waiver.status === "signed" ? "" : "hot"}">${esc(waiverSummary(member.waiver))}</td>
          </tr>`;
        }).join("") || `<tr><td colspan="6" class="empty">No athletes match.</td></tr>`}
      </tbody>
    </table>`;

  const body = `
    <header class="page-head">
      <div>
        <p class="kicker">Memberships</p>
        <h1>Households on the books</h1>
        <p>Bills sit on the family, not on each kid. <a href="family.html?id=alvarez">Open the Alvarez family</a> — one parent, three athletes, one sibling price.</p>
      </div>
      <div class="row-actions">
        <button type="button" class="${athleteMode ? "ghost" : "btn small"}" data-action="mode" data-mode="households">Households</button>
        <button type="button" class="${athleteMode ? "btn small" : "ghost"}" data-action="mode" data-mode="athletes">Every athlete</button>
      </div>
    </header>
    <div class="filters">
      <label class="field">Search<input class="search" data-input="q" value="${esc(filters.q)}" placeholder="Name or parent"></label>
      <label class="field">Plan<select data-change="plan">${["all", ...plans.map((plan) => plan.id)].map((id) => `<option value="${id}" ${filters.plan === id ? "selected" : ""}>${id === "all" ? "All plans" : esc(plans.find((plan) => plan.id === id).name)}</option>`).join("")}</select></label>
      <label class="field">Status<select data-change="status">${["all", "active", "past_due", "failed", "paused", "trial", "punch"].map((id) => `<option value="${id}" ${filters.status === id ? "selected" : ""}>${id === "all" ? "All statuses" : id.replace("_", " ")}</option>`).join("")}</select></label>
      <label class="field">Age group<select data-change="group"><option value="all">All ages</option>${groups.map((group) => `<option ${filters.group === group ? "selected" : ""}>${esc(group)}</option>`).join("")}</select></label>
      <label class="field">Weight class<select data-change="weight"><option value="all">All weights</option>${weights.map((bucket) => `<option ${filters.weight === bucket ? "selected" : ""}>${esc(bucket)}</option>`).join("")}</select></label>
    </div>
    ${athleteMode ? athleteTable : householdTable}`;
  document.getElementById("app").innerHTML = shell("members.html", body);
  if (focusSearch) {
    const search = document.querySelector("[data-input='q']");
    search?.focus();
    const len = filters.q.length;
    search?.setSelectionRange(len, len);
  }
}

bindReset(() => {
  state = load();
  paint();
});
on("mode", (el) => {
  mode = el.dataset.mode;
  if (mode === "households") {
    filters.group = "all";
    filters.weight = "all";
  }
  paint();
});
on("q", (el) => { filters.q = el.value; focusSearch = true; paint(); focusSearch = false; });
on("plan", (el) => { filters.plan = el.value; paint(); });
on("status", (el) => { filters.status = el.value; paint(); });
on("group", (el) => { filters.group = el.value; mode = "athletes"; paint(); });
on("weight", (el) => { filters.weight = el.value; mode = "athletes"; paint(); });
paint();
