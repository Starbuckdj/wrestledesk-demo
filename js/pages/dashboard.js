import { classes, coaches } from "../data.js";
import { load } from "../store.js";
import { bindReset, on, shell } from "../ui.js";
import {
  activeMemberCount,
  alerts,
  checkedInCount,
  clockLabel,
  coachById,
  esc,
  money,
  mrr,
  pastDueAccounts,
  timeLabel,
} from "../model.js";

let state = load();

function paint() {
  const dueAccounts = pastDueAccounts(state);
  const dueAmount = dueAccounts.reduce((sum, account) => sum + (account.planId ? (state.invoices.find((invoice) => invoice.accountId === account.id && (invoice.status === "past_due" || invoice.status === "failed"))?.total || 0) : 0), 0);
  const monday = classes.filter((item) => item.day === "Mon");
  const alertItems = alerts(state).slice(0, 7);
  const body = `
    <header class="page-head">
      <div>
        <p class="kicker">Owner desk · ${esc(clockLabel())}</p>
        <h1>Lot 9 tonight</h1>
        <p>High school is on Mat 1. BJJ is on Mat 2. The desk clock stays on this sample Monday so the room does not change under you.</p>
      </div>
      <a class="btn small" href="billing.html?flow=1">Run November billing</a>
    </header>
    <section class="metrics" aria-label="Club numbers">
      <div class="metric"><b>${activeMemberCount(state)}</b><span>Active members</span></div>
      <div class="metric"><b>${esc(money(mrr(state)))}</b><span>Monthly dues on the books</span></div>
      <div class="metric"><b class="${dueAccounts.length ? "hot" : ""}">${dueAccounts.length}</b><span>Past due or failed · ${esc(money(dueAmount))}</span></div>
      <div class="metric"><b>${checkedInCount(state)}</b><span>Check-ins today</span></div>
    </section>
    <div class="two">
      <section class="block">
        <h2>Today's rooms</h2>
        <table>
          <thead><tr><th>Class</th><th>Coach</th><th>In</th></tr></thead>
          <tbody>
            ${monday.map((item) => {
              const inCount = state.checkins[item.id]?.length || 0;
              const size = item.roster?.length || 0;
              return `<tr>
                <td><a class="rowlink" href="checkin.html?class=${esc(item.id)}">${esc(item.name)}</a><div class="muted">${esc(timeLabel(item.start))}–${esc(timeLabel(item.end))} · ${esc(item.room)}</div></td>
                <td>${esc(coachById(item.coachId)?.name || "")}</td>
                <td class="num">${inCount}${size ? ` / ${size}` : ""}</td>
              </tr>`;
            }).join("")}
          </tbody>
        </table>
      </section>
      <section class="block">
        <h2>Needs a look</h2>
        <table>
          <tbody>
            ${alertItems.map((item) => `<tr><td><a class="rowlink ${item.tone === "hot" ? "hot" : ""}" href="${esc(item.href)}">${esc(item.text)}</a></td></tr>`).join("")}
          </tbody>
        </table>
        <p style="margin-top:10px"><a href="waivers.html">Waiver desk</a> · <a href="billing.html?tab=queue">Past-due queue</a></p>
      </section>
    </div>
    <section class="block" style="margin-top:22px">
      <h2>Upcoming tournaments</h2>
      <table>
        <thead><tr><th>Event</th><th>When</th><th>Mat fee</th><th>Signed up</th></tr></thead>
        <tbody>
          ${state.tournaments.map((item) => `<tr>
            <td>${esc(item.name)}<div class="muted">${esc(item.where)} · ${esc(item.note)}</div></td>
            <td>${esc(item.date)}</td>
            <td>${esc(money(item.fee))}</td>
            <td class="num">${item.signedUp.length}</td>
          </tr>`).join("")}
        </tbody>
      </table>
    </section>`;
  document.getElementById("app").innerHTML = shell("dashboard.html", body);
}

bindReset(() => {
  state = load();
  paint();
});
on("noop", () => {});
paint();
