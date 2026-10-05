import { classes } from "../data.js";
import { load } from "../store.js";
import { bindReset, shell } from "../ui.js";
import { coachById, esc, timeLabel } from "../model.js";

const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const state = load();

function paint() {
  const body = `
    <header class="page-head">
      <div>
        <p class="kicker">Schedule</p>
        <h1>Week on the mats</h1>
        <p>Two rooms. Dana and Andre split folkstyle. Ren has Mat 2 for gi and no-gi. Monday classes open the check-in desk.</p>
      </div>
    </header>
    <div class="week">
      ${days.map((day) => `
        <section class="day">
          <h2>${day}</h2>
          ${classes.filter((item) => item.day === day).map((item) => {
            const href = item.roster ? `checkin.html?class=${item.id}` : "schedule.html";
            return `<a class="class-block" href="${href}">
              <span class="mono">${esc(timeLabel(item.start))}–${esc(timeLabel(item.end))}</span>
              <strong>${esc(item.name)}</strong>
              <span>${esc(coachById(item.coachId)?.name || "")} · ${esc(item.room)}</span>
            </a>`;
          }).join("")}
        </section>`).join("")}
    </div>`;
  document.getElementById("app").innerHTML = shell("schedule.html", body);
}

bindReset(() => paint());
paint();
void state;
