portalRequireAuth();

let currentPage = 0;
const pageSize = 8;
let currentFilter = "ALL";
let currentQuery = "";
let searchTimer;

function paymentBadge(status, amount) {
  if (!amount || amount <= 0) {
    return `<span class="tab-badge returned">No fine due</span>`;
  }
  const cls = status === "PAID" ? "paid" : "unpaid";
  const label = status === "PAID" ? "Paid" : "Unpaid";
  return `<span class="tab-badge ${cls}">${label}</span>`;
}

async function loadFines() {
  const body = document.getElementById("finesBody");
  body.innerHTML = `<tr class="empty-row"><td colspan="8">Loading fines…</td></tr>`;

  try {
    const params = new URLSearchParams({
      page: currentPage,
      size: pageSize,
      status: currentFilter,
    });
    if (currentQuery) params.set("query", currentQuery);

    const result = await portalApiFetch(`/fines?${params.toString()}`);
    renderFines(result);
  } catch (err) {
    body.innerHTML = `<tr class="empty-row"><td colspan="8">Could not load fines — ${portalEscapeHtml(err.message)}</td></tr>`;
    document.getElementById("pagination").style.display = "none";
  }
}

let currentFinesList = [];
let pendingActionFineId = null;

const paymentModal = document.getElementById("paymentModal");
const returnModal = document.getElementById("returnModal");

function renderFines(result) {
  const body = document.getElementById("finesBody");
  const fines = result.content || [];
  currentFinesList = fines;

  if (fines.length === 0) {
    body.innerHTML = `<tr class="empty-row"><td colspan="8">No fine records match this view.</td></tr>`;
    document.getElementById("pagination").style.display = "none";
    return;
  }

  body.innerHTML = fines.map(f => `
    <tr>
      <td data-label="Book">
        ${f.bookTitle
          ? `<div class="cell-title">${portalEscapeHtml(f.bookTitle)}</div><div class="cell-sub">${portalEscapeHtml(f.bookAuthor || "")}</div>`
          : `<span class="text-slate text-sm">—</span>`}
      </td>
      <td data-label="Issued" class="mono">${portalFormatDate(f.issueDate)}</td>
      <td data-label="Due" class="mono">${portalFormatDate(f.dueDate)}</td>
      <td data-label="Returned" class="mono">${f.returnDate ? portalFormatDate(f.returnDate) : '<span style="color:#d97706; font-weight:600;">Not returned</span>'}</td>
      <td data-label="Overdue Days" class="mono">${f.overdueDays}</td>
      <td data-label="Fine Amount" class="mono">${portalFormatCurrency(f.fineAmount)}</td>
      <td data-label="Status">${paymentBadge(f.paymentStatus, f.fineAmount)}</td>
      <td data-label="Action" style="text-align:right;">
        <div style="display:flex; gap:6px; justify-content:flex-end; flex-wrap:wrap;">
          ${f.returnDate === null
            ? `<button class="btn btn-secondary btn-sm" data-return="${f.fineId}">Mark returned</button>`
            : ""}
          ${f.paymentStatus === "UNPAID" && f.fineAmount > 0
            ? `<button class="btn btn-primary btn-sm" data-pay="${f.fineId}" style="background:linear-gradient(135deg, #059669 0%, #10b981 100%); border-color:#059669;">Pay now</button>`
            : ""}
          ${f.returnDate !== null && f.paymentStatus === "PAID"
            ? `<span class="tab-badge paid" style="font-size:11px;">Paid ${portalFormatDate(f.paymentDate)}</span>`
            : ""}
          ${f.returnDate !== null && f.paymentStatus === "UNPAID" && f.fineAmount <= 0
            ? `<span class="text-slate text-sm">—</span>`
            : ""}
        </div>
      </td>
    </tr>
  `).join("");

  body.querySelectorAll("[data-pay]").forEach(btn =>
    btn.addEventListener("click", () => openPaymentModal(btn.dataset.pay))
  );
  body.querySelectorAll("[data-return]").forEach(btn =>
    btn.addEventListener("click", () => openReturnModal(btn.dataset.return))
  );

  renderPagination(result);
}

function renderPagination(result) {
  const pagination = document.getElementById("pagination");
  const pageInfo = document.getElementById("pageInfo");
  const pageControls = document.getElementById("pageControls");

  const totalPages = result.totalPages || 1;
  const pageNum = result.number || 0;

  pagination.style.display = "flex";
  pageInfo.textContent = `Page ${pageNum + 1} of ${totalPages} · ${result.totalElements} total record${result.totalElements === 1 ? "" : "s"}`;

  pageControls.innerHTML = `
    <button ${pageNum === 0 ? "disabled" : ""} id="prevPageBtn">← Prev</button>
    <button ${pageNum >= totalPages - 1 ? "disabled" : ""} id="nextPageBtn">Next →</button>
  `;

  const prevBtn = document.getElementById("prevPageBtn");
  const nextBtn = document.getElementById("nextPageBtn");
  if (prevBtn) prevBtn.addEventListener("click", () => { currentPage--; loadFines(); });
  if (nextBtn) nextBtn.addEventListener("click", () => { currentPage++; loadFines(); });
}

function openPaymentModal(fineId) {
  const fine = currentFinesList.find(f => String(f.fineId) === String(fineId));
  if (!fine) return;
  pendingActionFineId = fineId;

  document.getElementById("payModalAmount").textContent = portalFormatCurrency(fine.fineAmount);
  document.getElementById("payModalBookTitle").textContent = fine.bookTitle || "General Library Fine";
  document.getElementById("payModalOverdue").textContent = `${fine.overdueDays} days`;

  const confirmBtn = document.getElementById("confirmPayBtn");
  confirmBtn.disabled = false;
  confirmBtn.textContent = `Confirm & Pay ${portalFormatCurrency(fine.fineAmount)}`;

  paymentModal.style.display = "flex";
}

function closePaymentModal() {
  paymentModal.style.display = "none";
  pendingActionFineId = null;
}

function openReturnModal(fineId) {
  const fine = currentFinesList.find(f => String(f.fineId) === String(fineId));
  if (!fine) return;
  pendingActionFineId = fineId;

  document.getElementById("returnModalBookTitle").textContent = fine.bookTitle || "Borrowed Book";
  document.getElementById("returnModalBookAuthor").textContent = fine.bookAuthor ? `By ${fine.bookAuthor}` : "";
  document.getElementById("returnModalDueDate").textContent = portalFormatDate(fine.dueDate);

  const warnEl = document.getElementById("returnModalWarning");
  if (warnEl) {
    warnEl.style.display = (fine.overdueDays > 0 || (fine.dueDate && new Date(fine.dueDate) < new Date())) ? "block" : "none";
  }

  const confirmBtn = document.getElementById("confirmReturnBtn");
  confirmBtn.disabled = false;
  confirmBtn.textContent = "Confirm Return";

  returnModal.style.display = "flex";
}

function closeReturnModal() {
  returnModal.style.display = "none";
  pendingActionFineId = null;
}

// Modal event listeners
document.getElementById("closePaymentModal")?.addEventListener("click", closePaymentModal);
document.getElementById("cancelPayBtn")?.addEventListener("click", closePaymentModal);
paymentModal?.addEventListener("click", (e) => { if (e.target === paymentModal) closePaymentModal(); });

document.getElementById("closeReturnModal")?.addEventListener("click", closeReturnModal);
document.getElementById("cancelReturnBtn")?.addEventListener("click", closeReturnModal);
returnModal?.addEventListener("click", (e) => { if (e.target === returnModal) closeReturnModal(); });

document.getElementById("confirmPayBtn")?.addEventListener("click", async () => {
  if (!pendingActionFineId) return;
  const btn = document.getElementById("confirmPayBtn");
  btn.disabled = true;
  btn.textContent = "Processing payment...";

  try {
    const result = await portalApiFetch(`/fines/${pendingActionFineId}/pay`, { method: "POST" });
    closePaymentModal();
    portalShowToast(`Payment successful! ${portalFormatCurrency(result.fineAmount)} settled.`);
    loadFines();
  } catch (err) {
    portalShowToast(err.message, "error");
    btn.disabled = false;
    btn.textContent = "Try Again";
  }
});

document.getElementById("confirmReturnBtn")?.addEventListener("click", async () => {
  if (!pendingActionFineId) return;
  const btn = document.getElementById("confirmReturnBtn");
  btn.disabled = true;
  btn.textContent = "Returning book...";

  try {
    const result = await portalApiFetch(`/fines/${pendingActionFineId}/return`, { method: "POST" });
    closeReturnModal();
    if (result.fineAmount > 0) {
      portalShowToast(`Book returned! Overdue fee of ${portalFormatCurrency(result.fineAmount)} recorded.`, "error");
    } else {
      portalShowToast("Book returned successfully with zero fees!");
    }
    loadFines();
  } catch (err) {
    portalShowToast(err.message, "error");
    btn.disabled = false;
    btn.textContent = "Try Again";
  }
});

// ===================== Filters & search =====================
document.querySelectorAll("[data-filter]").forEach(btn => {
  btn.addEventListener("click", () => {
    currentFilter = btn.dataset.filter;
    currentPage = 0;
    document.querySelectorAll("[data-filter]").forEach(b => {
      b.classList.remove("btn-primary");
      b.classList.add("btn-secondary");
    });
    btn.classList.remove("btn-secondary");
    btn.classList.add("btn-primary");
    loadFines();
  });
});
document.querySelector('[data-filter="ALL"]').classList.add("btn-primary");
document.querySelector('[data-filter="ALL"]').classList.remove("btn-secondary");

document.getElementById("searchInput").addEventListener("input", (e) => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    currentQuery = e.target.value;
    currentPage = 0;
    loadFines();
  }, 300);
});

loadFines();
