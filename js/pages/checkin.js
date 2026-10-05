import { classes } from "../data.js";
import { load, save } from "../store.js";
import { bindReset, on, shell, toast } from "../ui.js";
import {
  allMembers,
  clockLabel,
  coachById,
  esc,
  findMember,
  memberFlags,
  mondayClasses,
  statusText,
  timeLabel,
  waiverSummary,
} from "../model.js";

let state = load();
const params = new URLSearchParams(location.search);
let classId = params.get("class") || "mon-hs";
if (!classes.some((item) => item.id === classId && item.roster)) classId = "mon-hs";
let query = "";
let focusSearch = false;

function currentClass() {
  return classes.find((item) => item.id === classId);
}

function toggle(memberId) {
  const list = state.checkins[classId] || (state.checkins[classId] = []);
  const index = list.indexOf(memberId);
  const hit = findMember(state, memberId);
  if (!hit) return;
  if (index >= 0) {
    list.splice(index, 1);
    if (hit.account.status === "punch") hit.member.visitsLeft = (hit.member.visitsLeft || 0) + 1;
    toast(`${hit.member.first} checked out.`);
  } else {
    list.push(memberId);
    if (hit.account.status === "punch") {
      hit.member.visitsLeft = Math.max(0, (hit.member.visitsLeft || 0) - 1);
    }
    const flags = memberFlags(state, hit.member, hit.account);
    toast(flags.length ? `${hit.member.first} checked in. Flag: ${flags.join(", ")}.` : `${hit.member.first} checked in.`);
  }
  save(state);
  paint();
}

function paint() {
  const item = currentClass();
  const rosterIds = new Set(item.roster || []);
  const checked = new Set(state.checkins[classId] || []);
  const q = query.trim().toLowerCase();
  const roster = (item.roster || [])
    .map((id) => findMember(state, id))
    .filter(Boolean)
    .filter(({ member }) => !q || `${member.first} ${member.last} ${member.pin}`.toLowerCase().includes(q));
  const outsiders = q
    ? allMembers(state).filter((member) => !rosterIds.has(member.id) && `${member.first} ${member.last} ${member.pin}`.toLowerCase().includes(q))
    : [];

  const row = (member, account, onRoster) => {
    const flags = memberFlags(state, member, account);
    const isIn = checked.has(member.id);
    return `<tr>
      <td><strong>${esc(member.first)} ${esc(member.last)}</strong><div class="muted">${esc(member.group)} · ${esc(member.weight)} lb · PIN ${esc(member.pin)}</div></td>
      <td>${statusText(account.status)}${account.status === "punch" ? `<div class="muted">${member.visitsLeft} visits left</div>` : ""}</td>
      <td class="${flags.some((flag) => flag.startsWith("Waiver")) ? "hot" : ""}">${esc(waiverSummary(member.waiver))}</td>
      <td class="${flags.length ? "hot" : "muted"}">${flags.length ? esc(flags.join(" · ")) : "Clear"}</td>
      <td><button type="button" class="${isIn ? "ghost" : "btn small"}" data-action="toggle-in" data-id="${esc(member.id)}">${isIn ? "Undo" : onRoster ? "Check in" : "Drop in"}</button></td>
    </tr>`;
  };

  const body = `
    <header class="page-head">
      <div>
        <p class="kicker">Front desk · ${esc(clockLabel())}</p>
        <h1>${esc(item.name)}</h1>
        <p>${esc(timeLabel(item.start))}–${esc(timeLabel(item.end))} · ${esc(item.room)} · ${esc(coachById(item.coachId)?.name || "")}. Unpaid and missing waivers still show. Lot 9 usually lets the kid on the mat and deals with the parent after.</p>
      </div>
      <div><b>${checked.size}</b> <span class="muted">in the room</span></div>
    </header>
    <div class="class-switch" role="group" aria-label="Monday classes">
      ${mondayClasses().filter((entry) => entry.roster).map((entry) => `<button type="button" class="ghost" aria-pressed="${entry.id === classId}" data-action="switch-class" data-id="${esc(entry.id)}">${esc(entry.name)}</button>`).join("")}
    </div>
    <div class="kiosk-search">
      <label class="field">Search the room
        <input class="search" data-input="search" value="${esc(query)}" placeholder="Name" autofocus>
      </label>
      <label class="field">PIN
        <input class="pin" inputmode="numeric" maxlength="4" data-input="pin" placeholder="••••" aria-label="Four digit PIN">
      </label>
    </div>
    <table>
      <thead><tr><th>Athlete</th><th>Account</th><th>Waiver</th><th>Flag</th><th></th></tr></thead>
      <tbody>
        ${roster.map(({ member, account }) => row(member, account, true)).join("") || `<tr><td colspan="5" class="empty">Nobody on this roster matches.</td></tr>`}
      </tbody>
    </table>
    ${outsiders.length ? `<h2 style="margin-top:18px;font-size:16px">Not on this class</h2><table><tbody>${outsiders.map((member) => {
      const hit = findMember(state, member.id);
      return row(hit.member, hit.account, false);
    }).join("")}</tbody></table>` : ""}
    ${[...checked].filter((id) => !(item.roster || []).includes(id)).length ? `<h2 style="margin-top:18px;font-size:16px">Dropped in</h2><table><tbody>${[...checked].filter((id) => !(item.roster || []).includes(id)).map((id) => {
      const hit = findMember(state, id);
      return hit ? row(hit.member, hit.account, false) : "";
    }).join("")}</tbody></table>` : ""}`;
  document.getElementById("app").innerHTML = shell("checkin.html", body);
  if (focusSearch) {
    const search = document.querySelector("[data-input='search']");
    search?.focus();
    search?.setSelectionRange(query.length, query.length);
  }
}

bindReset(() => {
  state = load();
  paint();
});

on("switch-class", (el) => {
  classId = el.dataset.id;
  query = "";
  paint();
});

on("toggle-in", (el) => toggle(el.dataset.id));

on("search", (el) => {
  query = el.value;
  focusSearch = true;
  paint();
  focusSearch = false;
});

on("pin", (el) => {
  const pin = el.value.replace(/\D/g, "").slice(0, 4);
  el.value = pin;
  if (pin.length < 4) return;
  const member = allMembers(state).find((item) => item.pin === pin);
  el.value = "";
  if (!member) {
    toast("No athlete uses that PIN.");
    return;
  }
  if (!(currentClass().roster || []).includes(member.id)) {
    query = member.last;
  }
  toggle(member.id);
});

paint();
