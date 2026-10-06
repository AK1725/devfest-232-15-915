/* ============================================================
   Tender Document Package Builder
   Everything runs in the browser. No backend, no storage service.
   ============================================================ */

const { PDFDocument, StandardFonts, rgb } = PDFLib;

const MAX_FILES = 30;
const MAX_TOTAL_BYTES = 50 * 1024 * 1024;

const state = {
  lang: localStorage.getItem("tpb_lang") === "bn" ? "bn" : "en",
  tender: null,
  requirements: [],
  files: [],          // { id, name, size, pages, hash, bytes, ok, error }
  matches: {},        // reqId -> fileId
  expiries: {}        // reqId -> "YYYY-MM-DD"
};

let fileSeq = 0;

/* ---------- helpers ---------- */
const $ = sel => document.querySelector(sel);
const t = key => (I18N[state.lang][key] ?? I18N.en[key] ?? key);
const num = n => localizeNumber(n, state.lang);

function esc(s){
  return String(s).replace(/[&<>"']/g, c =>
    ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[c]));
}

function toast(msg, isError){
  const el = document.createElement("div");
  el.className = "toast" + (isError ? " err" : "");
  el.textContent = msg;
  $("#toastHost").appendChild(el);
  setTimeout(() => el.remove(), 3600);
}

function fmtSize(bytes){
  if (bytes < 1024) return num(bytes) + " B";
  if (bytes < 1024 * 1024) return num((bytes / 1024).toFixed(0)) + " KB";
  return num((bytes / 1048576).toFixed(1)) + " MB";
}

function reqTitle(r){
  return state.lang === "bn" ? (r.title_bn || r.title_en) : (r.title_en || r.title_bn);
}

async function sha256(buffer){
  const digest = await crypto.subtle.digest("SHA-256", buffer);
  return [...new Uint8Array(digest)].map(b => b.toString(16).padStart(2, "0")).join("");
}

/* ============================================================
   Status rules (Problem Statement, Section 5)
   ============================================================ */
function statusOf(req){
  const fileId = state.matches[req.id];
  if (!fileId) return req.mandatory ? "missing" : "not_provided";
  if (req.has_expiry){
    const expiry = state.expiries[req.id];
    if (!expiry) return "expiry_needed";
    // Expiring ON the deadline is still OK — only strictly before is Expired.
    if (expiry < state.tender.submission_deadline) return "expired";
  }
  return "ok";
}

const BLOCKING = new Set(["missing", "expiry_needed", "expired"]);
const isBlocking = req => BLOCKING.has(statusOf(req));

/* ============================================================
   Duplicate handling (Section 4.6)
   Two files with identical content may not be matched to
   two different requirements.
   ============================================================ */
function duplicateIds(){
  const byHash = {};
  for (const f of state.files){
    if (!f.ok || !f.hash) continue;
    (byHash[f.hash] ||= []).push(f.id);
  }
  const dupes = new Set();
  for (const ids of Object.values(byHash)){
    if (ids.length > 1) ids.forEach(id => dupes.add(id));
  }
  return dupes;
}

/** Hashes already consumed by a requirement other than `exceptReqId`. */
function hashesInUse(exceptReqId){
  const used = new Set();
  for (const [reqId, fileId] of Object.entries(state.matches)){
    if (reqId === exceptReqId) continue;
    const f = state.files.find(x => x.id === fileId);
    if (f && f.hash) used.add(f.hash);
  }
  return used;
}

function fileById(id){ return state.files.find(f => f.id === id); }
function reqUsingFile(fileId){
  const entry = Object.entries(state.matches).find(([, fid]) => fid === fileId);
  return entry ? state.requirements.find(r => r.id === entry[0]) : null;
}

/* ============================================================
   Step 1 — load requirements.json
   ============================================================ */
async function loadRequirements(file){
  let data;
  try {
    data = JSON.parse(await file.text());
  } catch {
    return toast(t("err_bad_json"), true);
  }
  if (!data || !data.tender || !Array.isArray(data.requirements)){
    return toast(t("err_json_shape"), true);
  }

  state.tender = data.tender;
  state.requirements = data.requirements.slice().sort((a, b) => a.order - b.order);
  state.matches = {};
  state.expiries = {};

  renderTender();
  $("#step2").classList.remove("locked");
  $("#step3").classList.remove("locked");
  $("#step4").classList.remove("locked");
  renderAll();
  toast(t("ok_json_loaded"));
}

function renderTender(){
  const d = state.tender;
  const rows = [
    ["t_id", d.tender_id],
    ["t_title", d.title],
    ["t_entity", d.procuring_entity],
    ["t_bidder", d.bidder],
    ["t_deadline", d.submission_deadline],
    ["t_docs", num(state.requirements.length)]
  ];
  $("#tenderCard").innerHTML = `
    <h3>${esc(t("tender_details"))}</h3>
    <dl class="tender-grid">
      ${rows.map(([k, v]) => `
        <div class="tfield"><dt>${esc(t(k))}</dt><dd>${esc(v ?? "—")}</dd></div>
      `).join("")}
    </dl>`;
  $("#tenderCard").classList.remove("hidden");
}

/* ============================================================
   Step 2 — upload PDFs
   ============================================================ */
async function addFiles(fileList){
  const incoming = [...fileList];
  const alerts = [];
  let added = 0;

  for (const file of incoming){
    const isPdf = file.type === "application/pdf" || /\.pdf$/i.test(file.name);
    if (!isPdf){
      alerts.push(`${file.name} — ${t("err_not_pdf")}`);
      continue;
    }
    if (state.files.length >= MAX_FILES){ alerts.push(t("err_too_many")); break; }

    const total = state.files.reduce((s, f) => s + f.size, 0);
    if (total + file.size > MAX_TOTAL_BYTES){ alerts.push(t("err_too_big")); break; }

    const buffer = await file.arrayBuffer();
    const entry = {
      id: "f" + (++fileSeq),
      name: file.name,
      size: file.size,
      bytes: new Uint8Array(buffer),
      pages: 0,
      hash: null,
      ok: true,
      error: null
    };

    try {
      entry.hash = await sha256(buffer);
      const doc = await PDFDocument.load(entry.bytes, { ignoreEncryption: true });
      entry.pages = doc.getPageCount();
    } catch {
      entry.ok = false;
      entry.error = t("err_bad_pdf");
      alerts.push(`${file.name} — ${t("err_bad_pdf")}`);
    }

    state.files.push(entry);
    added++;
  }

  renderAlerts(alerts);
  renderAll();
  if (added) toast(`${num(added)} ${t("ok_files_added")}`);
}

function renderAlerts(list){
  const host = $("#fileAlerts");
  host.innerHTML = list.map(msg => `
    <div class="alert">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
        <circle cx="12" cy="12" r="10"/><path d="M12 8v5"/><path d="M12 16h.01"/>
      </svg>
      <span>${esc(msg)}</span>
    </div>`).join("");
}

function removeFile(id){
  state.files = state.files.filter(f => f.id !== id);
  for (const [reqId, fid] of Object.entries(state.matches)){
    if (fid === id) delete state.matches[reqId];
  }
  renderAll();
}

function renderFiles(){
  const list = $("#fileList");
  const head = $("#fileHead");

  if (!state.files.length){
    list.innerHTML = "";
    head.classList.add("hidden");
    return;
  }
  head.classList.remove("hidden");
  $("#fileCount").textContent = num(state.files.length);

  const dupes = duplicateIds();

  list.innerHTML = state.files.map(f => {
    const owner = reqUsingFile(f.id);
    const classes = ["fileitem"];
    if (!f.ok) classes.push("is-bad");
    else if (dupes.has(f.id)) classes.push("is-dupe");

    const meta = [];
    if (f.ok) meta.push(`${num(f.pages)} ${f.pages === 1 ? t("page_one") : t("pages")}`);
    meta.push(fmtSize(f.size));
    if (dupes.has(f.id)) meta.push(`<strong>${esc(t("dupe"))}</strong>`);
    if (!f.ok) meta.push(esc(f.error));
    if (owner) meta.push(`<span class="fi-used">${esc(t("matched_to"))}: ${esc(reqTitle(owner))}</span>`);

    return `
      <li class="${classes.join(" ")}">
        <span class="fi-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/>
          </svg>
        </span>
        <span class="fi-body">
          <span class="fi-name">${esc(f.name)}</span>
          <span class="fi-meta">${meta.join("<span>·</span>")}</span>
        </span>
        <button class="icon-btn" type="button" data-remove="${f.id}" title="${esc(t("remove_file"))}" aria-label="${esc(t("remove_file"))}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
        </button>
      </li>`;
  }).join("");
}

/* ============================================================
   Step 3 — match, expiry, status
   ============================================================ */
function renderRequirements(){
  const host = $("#reqList");
  if (!state.requirements.length){ host.innerHTML = ""; return; }

  const dupes = duplicateIds();

  host.innerHTML = state.requirements.map(r => {
    const status = statusOf(r);
    const matchedId = state.matches[r.id] || "";
    const blockedHashes = hashesInUse(r.id);

    const options = [`<option value="">${esc(t("select_file"))}</option>`].concat(
      state.files.filter(f => f.ok).map(f => {
        const takenElsewhere = Object.entries(state.matches)
          .some(([rid, fid]) => fid === f.id && rid !== r.id);
        const dupeBlocked = f.hash && blockedHashes.has(f.hash) && matchedId !== f.id;
        const disabled = takenElsewhere || dupeBlocked;
        const label = f.name + (dupes.has(f.id) ? ` (${t("dupe")})` : "");
        return `<option value="${f.id}"${matchedId === f.id ? " selected" : ""}${disabled ? " disabled" : ""}>${esc(label)}</option>`;
      })
    ).join("");

    const needsExpiry = r.has_expiry && matchedId;
    const expiryInput = r.has_expiry
      ? `<input type="date" data-expiry="${r.id}" value="${esc(state.expiries[r.id] || "")}"
           ${matchedId ? "" : "disabled"} class="${needsExpiry && !state.expiries[r.id] ? "need" : ""}"
           aria-label="${esc(t("expiry_label"))}">`
      : `<span class="small muted">${esc(t("expiry_na"))}</span>`;

    const rowClass = ["req"];
    if (BLOCKING.has(status)) rowClass.push("blocking");
    else if (status === "ok") rowClass.push("good");

    return `
      <div class="${rowClass.join(" ")}">
        <span class="req-order">${num(r.order)}</span>
        <div class="req-title">
          <div class="req-name">${esc(reqTitle(r))}</div>
          <div class="req-tags">
            <span class="tag ${r.mandatory ? "req-tag" : ""}">${esc(t(r.mandatory ? "tag_mandatory" : "tag_optional"))}</span>
            ${r.has_expiry ? `<span class="tag">${esc(t("tag_expiry"))}</span>` : ""}
          </div>
        </div>
        <div class="req-match"><select data-match="${r.id}">${options}</select></div>
        <div class="req-expiry">${expiryInput}</div>
        <div class="req-status-cell">
          <span class="status s-${status}"><span class="dot"></span>${esc(t("st_" + status))}</span>
        </div>
      </div>`;
  }).join("");
}

function renderSummary(){
  const counts = { ok: 0, blocking: 0, optional: 0 };
  for (const r of state.requirements){
    const s = statusOf(r);
    if (s === "ok") counts.ok++;
    else if (BLOCKING.has(s)) counts.blocking++;
    else counts.optional++;
  }
  $("#summary").innerHTML = `
    <span class="chip ok"><span class="dot"></span>${num(counts.ok)} ${esc(t("sum_ok"))}</span>
    <span class="chip ${counts.blocking ? "err" : "neutral"}"><span class="dot"></span>${num(counts.blocking)} ${esc(t("sum_blocking"))}</span>
    <span class="chip neutral"><span class="dot"></span>${num(counts.optional)} ${esc(t("sum_optional"))}</span>`;
}

/* ============================================================
   Step 4 — blockers and generation
   ============================================================ */
function renderBlockers(){
  const host = $("#blockers");
  const problems = state.requirements.filter(isBlocking).map(r => {
    const s = statusOf(r);
    return `${reqTitle(r)} — ${t("b_" + s)}`;
  });

  const ready = state.tender && problems.length === 0 &&
                state.requirements.some(r => state.matches[r.id]);

  $("#generateBtn").disabled = !ready;
  $("#csvBtn").disabled = !state.tender || !state.requirements.length;

  if (!problems.length){ host.classList.add("hidden"); return; }
  host.classList.remove("hidden");
  host.innerHTML = `
    <h4>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
        <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/>
        <path d="M12 9v4"/><path d="M12 17h.01"/>
      </svg>
      ${esc(t("blockers_title"))}
    </h4>
    <ul>${problems.map(p => `<li>${esc(p)}</li>`).join("")}</ul>`;
}

function includedRequirements(){
  return state.requirements.filter(r => state.matches[r.id]);
}

async function generatePackage(){
  const btn = $("#generateBtn");
  const status = $("#genStatus");
  btn.disabled = true;
  status.className = "gen-status";
  status.textContent = t("generating");

  try {
    const out = await PDFDocument.create();
    const font = await out.embedFont(StandardFonts.Helvetica);
    const bold = await out.embedFont(StandardFonts.HelveticaBold);
    const included = includedRequirements();
    const withIndex = $("#optIndex").checked;

    // Page numbers are known up front, so the index can be accurate.
    const frontMatter = withIndex ? 2 : 1;
    let cursor = frontMatter + 1;
    const starts = included.map(r => {
      const start = cursor;
      cursor += fileById(state.matches[r.id]).pages;
      return { req: r, start };
    });

    drawCover(out, bold, font, included);
    if (withIndex) drawIndex(out, bold, font, starts);

    for (const r of included){
      const f = fileById(state.matches[r.id]);
      const src = await PDFDocument.load(f.bytes, { ignoreEncryption: true });
      const pages = await out.copyPages(src, src.getPageIndices());
      pages.forEach(p => out.addPage(p));
    }

    drawFooters(out, font);

    const bytes = await out.save();
    download(new Blob([bytes], { type: "application/pdf" }),
             `${state.tender.tender_id}_Package.pdf`);

    status.className = "gen-status success";
    status.textContent = t("gen_done");
    toast(t("ok_generated"));
  } catch (err){
    status.className = "gen-status failure";
    status.textContent = `${t("gen_fail")} ${err.message}`;
    toast(t("gen_fail"), true);
  } finally {
    renderBlockers();
  }
}

/* ---------- PDF drawing (Section 6) ---------- */
const A4 = [595.28, 841.89];
const INK = rgb(0.07, 0.09, 0.12);
const SOFT = rgb(0.38, 0.42, 0.48);

function drawCover(doc, bold, font, included){
  const page = doc.addPage(A4);
  const [w, h] = A4;
  const left = 64;
  let y = h - 110;

  page.drawRectangle({ x: 0, y: h - 46, width: w, height: 46, color: rgb(0.08, 0.16, 0.26) });
  page.drawText("TENDER DOCUMENT PACKAGE", {
    x: left, y: h - 31, size: 13, font: bold, color: rgb(1, 1, 1)
  });

  page.drawText(String(state.tender.title || ""), { x: left, y, size: 21, font: bold, color: INK });
  y -= 14;
  page.drawLine({ start: { x: left, y }, end: { x: w - left, y }, thickness: 1, color: rgb(0.85, 0.87, 0.9) });
  y -= 34;

  const today = new Date().toISOString().slice(0, 10);
  const fields = [
    ["Tender ID", state.tender.tender_id],
    ["Procuring entity", state.tender.procuring_entity],
    ["Bidder", state.tender.bidder],
    ["Submission deadline", state.tender.submission_deadline],
    ["Package created on", today]
  ];
  for (const [label, value] of fields){
    page.drawText(label.toUpperCase(), { x: left, y, size: 7.5, font: bold, color: SOFT });
    page.drawText(String(value ?? "—"), { x: left, y: y - 14, size: 12, font, color: INK });
    y -= 36;
  }

  y -= 10;
  page.drawText("DOCUMENTS INCLUDED IN THIS PACKAGE", { x: left, y, size: 7.5, font: bold, color: SOFT });
  y -= 20;

  included.forEach((r, i) => {
    if (y < 70){ return; }
    const title = r.title_en || r.title_bn || r.id;
    page.drawText(`${i + 1}.`, { x: left, y, size: 10.5, font: bold, color: SOFT });
    page.drawText(title, { x: left + 22, y, size: 10.5, font, color: INK });
    y -= 18;
  });
}

function drawIndex(doc, bold, font, starts){
  const page = doc.addPage(A4);
  const [w, h] = A4;
  const left = 64;
  let y = h - 100;

  page.drawText("INDEX", { x: left, y, size: 18, font: bold, color: INK });
  y -= 12;
  page.drawLine({ start: { x: left, y }, end: { x: w - left, y }, thickness: 1, color: rgb(0.85, 0.87, 0.9) });
  y -= 28;

  page.drawText("DOCUMENT", { x: left, y, size: 7.5, font: bold, color: SOFT });
  page.drawText("STARTS ON PAGE", { x: w - left - 90, y, size: 7.5, font: bold, color: SOFT });
  y -= 20;

  for (const { req, start } of starts){
    if (y < 70) break;
    const title = req.title_en || req.title_bn || req.id;
    page.drawText(title, { x: left, y, size: 10.5, font, color: INK });
    page.drawText(String(start), { x: w - left - 40, y, size: 10.5, font: bold, color: INK });
    y -= 18;
  }
}

/** Footer on EVERY page: "<tender_id> | Page X of Y" (Section 6.3). */
function drawFooters(doc, font){
  const pages = doc.getPages();
  const total = pages.length;
  pages.forEach((page, i) => {
    const { width } = page.getSize();
    const label = `${state.tender.tender_id} | Page ${i + 1} of ${total}`;
    const size = 8;
    const textWidth = font.widthOfTextAtSize(label, size);

    // A clean white strip in the bottom margin keeps the footer readable
    // without drawing over the document body.
    page.drawRectangle({ x: 0, y: 0, width, height: 20, color: rgb(1, 1, 1) });
    page.drawText(label, {
      x: (width - textWidth) / 2,
      y: 7,
      size,
      font,
      color: rgb(0.32, 0.36, 0.42)
    });
  });
}

function download(blob, filename){
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

/* ============================================================
   Extras — auto-match and CSV checklist
   ============================================================ */
function tokenize(s){
  return s.toLowerCase().replace(/[^a-z0-9\s]+/g, " ").split(/\s+/).filter(x => x.length > 2);
}

function autoMatch(){
  const dupes = duplicateIds();
  const seenHash = hashesInUse(null);
  let count = 0;

  for (const r of state.requirements){
    if (state.matches[r.id]) continue;
    const wanted = tokenize(r.title_en || "");
    if (!wanted.length) continue;

    let best = null, bestScore = 0;
    for (const f of state.files){
      if (!f.ok) continue;
      if (reqUsingFile(f.id)) continue;
      if (f.hash && seenHash.has(f.hash)) continue;

      const have = tokenize(f.name.replace(/\.pdf$/i, ""));
      let score = 0;
      for (const token of wanted){
        if (have.some(h => h.startsWith(token.slice(0, 4)) || token.startsWith(h.slice(0, 4)))) score++;
      }
      if (score > bestScore){ bestScore = score; best = f; }
    }

    if (best && bestScore >= 1){
      state.matches[r.id] = best.id;
      if (best.hash) seenHash.add(best.hash);
      count++;
    }
  }

  renderAll();
  toast(count ? `${num(count)} ${t("ok_automatch")}` : t("none_automatch"));
}

function exportCsv(){
  const header = [t("csv_doc"), t("csv_file"), t("csv_pages"), t("csv_expiry"), t("csv_status")];
  const rows = state.requirements.map(r => {
    const f = fileById(state.matches[r.id]);
    return [
      reqTitle(r),
      f ? f.name : "",
      f ? f.pages : "",
      state.expiries[r.id] || "",
      t("st_" + statusOf(r))
    ];
  });
  const csv = [header, ...rows]
    .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\r\n");
  download(new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" }),
           `${state.tender.tender_id}_Checklist.csv`);
  toast(t("ok_csv"));
}

/* ============================================================
   Language
   ============================================================ */
function applyLanguage(){
  document.documentElement.setAttribute("data-lang", state.lang);
  document.documentElement.setAttribute("lang", t("html_lang"));
  localStorage.setItem("tpb_lang", state.lang);

  document.querySelectorAll("[data-i18n]").forEach(el => {
    el.textContent = t(el.getAttribute("data-i18n"));
  });
  if (state.tender) renderTender();
  renderAll();
}

/* ============================================================
   Render + wiring
   ============================================================ */
function renderAll(){
  renderFiles();
  renderRequirements();
  renderSummary();
  renderBlockers();
}

function wireDropzone(zone, input, handler){
  zone.addEventListener("click", () => input.click());
  zone.addEventListener("keydown", e => {
    if (e.key === "Enter" || e.key === " "){ e.preventDefault(); input.click(); }
  });
  ["dragenter", "dragover"].forEach(ev =>
    zone.addEventListener(ev, e => { e.preventDefault(); zone.classList.add("drag"); }));
  ["dragleave", "drop"].forEach(ev =>
    zone.addEventListener(ev, e => { e.preventDefault(); zone.classList.remove("drag"); }));
  zone.addEventListener("drop", e => {
    if (e.dataTransfer?.files?.length) handler(e.dataTransfer.files);
  });
  input.addEventListener("change", () => {
    if (input.files.length) handler(input.files);
    input.value = "";
  });
}

function init(){
  applyLanguage();

  wireDropzone($("#jsonDrop"), $("#jsonInput"), files => loadRequirements(files[0]));
  wireDropzone($("#pdfDrop"), $("#pdfInput"), files => addFiles(files));

  $("#langToggle").addEventListener("click", () => {
    state.lang = state.lang === "en" ? "bn" : "en";
    applyLanguage();
  });

  $("#fileList").addEventListener("click", e => {
    const btn = e.target.closest("[data-remove]");
    if (btn) removeFile(btn.getAttribute("data-remove"));
  });

  $("#reqList").addEventListener("change", e => {
    const sel = e.target.closest("[data-match]");
    if (sel){
      const reqId = sel.getAttribute("data-match");
      if (sel.value) state.matches[reqId] = sel.value;
      else { delete state.matches[reqId]; delete state.expiries[reqId]; }
      renderAll();
      return;
    }
    const date = e.target.closest("[data-expiry]");
    if (date){
      const reqId = date.getAttribute("data-expiry");
      if (date.value) state.expiries[reqId] = date.value;
      else delete state.expiries[reqId];
      renderAll();
    }
  });

  $("#autoMatchBtn").addEventListener("click", autoMatch);
  $("#clearFilesBtn").addEventListener("click", () => {
    state.files = [];
    state.matches = {};
    renderAlerts([]);
    renderAll();
  });
  $("#generateBtn").addEventListener("click", generatePackage);
  $("#csvBtn").addEventListener("click", exportCsv);
}

document.addEventListener("DOMContentLoaded", init);
