import { coaches } from "../data.js";
import { load } from "../store.js";
import { bindReset, shell } from "../ui.js";
import { daysUntil, esc, fmtDate } from "../model.js";

const state = load();

function paint() {
  const body = `
    <header class="page-head">
      <div>
        <p class="kicker">Staff</p>
        <h1>Coaches and the cards that expire</h1>
        <p>USA Wrestling, SafeSport, background checks. The hot dates are inside 45 days of the sample Monday.</p>
      </div>
    </header>
    <table>
      <thead><tr><th>Coach</th><th>Credential</th><th>Reference</th><th>Expires</th></tr></thead>
      <tbody>
        ${coaches.flatMap((coach) => coach.certs.map((cert, index) => {
          const days = cert.expires ? daysUntil(cert.expires) : null;
          const soon = days !== null && days <= 45;
          return `<tr>
            <td>${index === 0 ? `<strong>${esc(coach.name)}</strong><div class="muted">${esc(coach.role)}<br>${esc(coach.focus)}</div>` : ""}</td>
            <td>${esc(cert.name)}</td>
            <td class="mono">${esc(cert.ref)}</td>
            <td class="${soon ? "hot" : ""}">${cert.expires ? esc(fmtDate(cert.expires)) : "No expiry"}${soon ? `<div>${days < 0 ? "Expired" : `${days} days`}</div>` : ""}</td>
          </tr>`;
        })).join("")}
      </tbody>
    </table>`;
  document.getElementById("app").innerHTML = shell("coaches.html", body);
}

bindReset(() => paint());
paint();
void state;
