import { resetState } from "./store.js";
import { esc, money } from "./model.js";

const handlers = {};

export function on(action, fn) {
  handlers[action] = fn;
}

document.addEventListener("click", (event) => {
  const el = event.target.closest("[data-action]");
  if (!el) return;
  const fn = handlers[el.dataset.action];
  if (!fn) return;
  if (el.tagName === "BUTTON" || el.tagName === "A") event.preventDefault();
  fn(el, event);
});

document.addEventListener("change", (event) => {
  const el = event.target.closest("[data-change]");
  if (!el) return;
  handlers[el.dataset.change]?.(el, event);
});

document.addEventListener("input", (event) => {
  const el = event.target.closest("[data-input]");
  if (!el) return;
  handlers[el.dataset.input]?.(el, event);
});

document.addEventListener("submit", (event) => {
  const form = event.target.closest("[data-submit]");
  if (!form) return;
  event.preventDefault();
  handlers[form.dataset.submit]?.(form, event);
});

export function toast(message) {
  let el = document.querySelector(".toast");
  if (!el) {
    el = document.createElement("div");
    el.className = "toast";
    el.setAttribute("role", "status");
    el.setAttribute("aria-live", "polite");
    document.body.appendChild(el);
  }
  el.textContent = message;
  el.hidden = false;
  clearTimeout(el._timer);
  el._timer = setTimeout(() => {
    el.hidden = true;
  }, 3600);
}

const NAV = [
  ["dashboard.html", "01", "Desk"],
  ["checkin.html", "02", "Check-in"],
  ["members.html", "03", "Members"],
  ["billing.html", "04", "Billing"],
  ["schedule.html", "05", "Schedule"],
  ["waivers.html", "06", "Waivers"],
  ["coaches.html", "07", "Coaches"],
  ["parent.html", "08", "Parent page"],
];

export function shell(active, body) {
  const links = NAV.map(([href, num, label]) => {
    const current = href === active ? ' aria-current="page"' : "";
    return `<a href="${href}"${current}><span class="idx">${num}</span>${label}</a>`;
  }).join("");
  return `
    <p class="demo-banner"><span class="mono">DEMO</span> Sample club, sample data, stored only in this browser. No real payments, emails, or texts.</p>
    <div class="frame">
      <aside class="sidebar">
        <a class="brand" href="dashboard.html">
          <span class="brand-mark">WrestleDesk</span>
          <span class="muted">Lot 9 · Des Moines</span>
        </a>
        <nav class="nav" aria-label="Desk">${links}</nav>
        <div class="side-foot">
          <p class="muted">Signed in as Dana Ruiz</p>
          <button type="button" data-action="reset-demo">Reset sample data</button>
          <a href="../index.html">Marketing site</a>
        </div>
      </aside>
      <main id="content" class="main">${body}</main>
    </div>`;
}

export function parentShell(body) {
  return `
    <p class="demo-banner"><span class="mono">DEMO</span> Parent view for Lot 9. Sample data only. The pay button does not charge a card.</p>
    <div class="parent-wrap">
      <header class="parent-bar">
        <a href="dashboard.html">Desk</a>
        <strong>Lot 9</strong>
        <a href="parent.html">Portal</a>
      </header>
      <main id="content">${body}</main>
    </div>`;
}

export function bindReset(reload) {
  on("reset-demo", () => {
    resetState();
    toast("Sample data put back.");
    reload();
  });
}

export function field(label, control) {
  return `<label class="field"><span>${label}</span>${control}</label>`;
}

export function paper(invoice, account) {
  const rows = invoice.lines.map((line) => `
    <tr>
      <td>${esc(line.desc)}</td>
      <td class="num">${esc(money(line.amount))}</td>
    </tr>`).join("");
  return `
    <article class="paper">
      <header class="split">
        <div>
          <strong>Lot 9 Wrestling</strong>
          <div class="muted">Unit 9, 2200 Depot Ave, Des Moines</div>
        </div>
        <div class="mono">${esc(invoice.id)}</div>
      </header>
      <p>Bill to ${esc(account.payer.name)}<br>${esc(account.payer.email)}<br>${esc(account.payer.phone)}</p>
      <p class="muted">${esc(invoice.period)} · due ${esc(invoice.due)}</p>
      <table class="lines">
        <tbody>${rows}</tbody>
        <tfoot>
          <tr><th>Due</th><td class="num">${esc(money(invoice.total))}</td></tr>
        </tfoot>
      </table>
      <p class="muted">Demo invoice. Nothing here charges a card or leaves this browser.</p>
    </article>`;
}

export { esc };
