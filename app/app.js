"use strict";
function load(key, fallback) {
  try {
    const v = localStorage.getItem(key);
    return v === null ? fallback : JSON.parse(v);
  } catch { return fallback; }
}
function save(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* private mode: works until reload */ }
}

const $ = (id) => document.getElementById(id);
const SYM = { "/": "÷", "*": "×", "-": "−", "+": "+" };
let cur = "0", prev = null, op = null, fresh = false, history = load("calc-history", []);
const fmt = (n) => (Math.abs(n) >= 1e15 || (Math.abs(n) < 1e-9 && n !== 0) ? n.toExponential(8).replace(/\.?0+e/, "e") : String(Number(n.toPrecision(14))));

function calc(a, b, o) {
  return o === "+" ? a + b : o === "-" ? a - b : o === "*" ? a * b : b === 0 ? NaN : a / b;
}
function press(k) {
  if (/^\d$/.test(k)) { cur = fresh || cur === "0" ? k : cur.length < 16 ? cur + k : cur; fresh = false; }
  else if (k === ".") { if (fresh) { cur = "0."; fresh = false; } else if (!cur.includes(".")) cur += "."; }
  else if (k === "C") { cur = "0"; prev = op = null; }
  else if (k === "±") cur = cur.startsWith("-") ? cur.slice(1) : cur === "0" ? cur : "-" + cur;
  else if (k === "%") cur = fmt(prev !== null && (op === "+" || op === "-") ? (prev * Number(cur)) / 100 : Number(cur) / 100);
  else if (k === "Backspace") { cur = fresh ? cur : cur.length > 1 ? cur.slice(0, -1) : "0"; }
  else if (k in SYM) {
    if (prev !== null && op && !fresh) cur = fmt(calc(prev, Number(cur), op));
    prev = Number(cur); op = k; fresh = true;
  } else if (k === "=" || k === "Enter") {
    if (prev === null || !op) return;
    const expr = `${fmt(prev)} ${SYM[op]} ${cur}`, r = calc(prev, Number(cur), op);
    cur = Number.isNaN(r) ? "Can't divide by 0" : fmt(r);
    if (!Number.isNaN(r)) { history.unshift({ expr, r: cur }); history = history.slice(0, 50); save("calc-history", history); }
    prev = op = null; fresh = true;
  }
  render();
}
function render() {
  $("val").textContent = cur;
  $("expr").textContent = prev !== null && op ? `${fmt(prev)} ${SYM[op]}` : "";
  $("hist").innerHTML = history.map((h, i) => `<li><button data-h="${i}"><small>${h.expr} =</small>${h.r}</button></li>`).join("") || '<li style="color:var(--muted)">Nothing yet.</li>';
}
$("keys").addEventListener("click", (e) => { const b = e.target.closest("[data-k]"); if (b) { press(b.dataset.k); b.blur(); } });
$("hist").addEventListener("click", (e) => { const b = e.target.closest("[data-h]"); if (b) { cur = history[b.dataset.h].r; fresh = true; render(); } });
$("clear-h").addEventListener("click", () => { history = []; save("calc-history", history); render(); });
document.addEventListener("keydown", (e) => {
  const k = e.key === "x" ? "*" : e.key === "Escape" ? "C" : e.key;
  if (/^[\d.+\-*/%=]$/.test(k) || ["Enter", "Backspace", "C"].includes(k)) { e.preventDefault(); press(k); }
});
render();
