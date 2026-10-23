requireAuth();

let currentPage = 0;
const pageSize = 10;
let currentFilter = "ALL";
let currentQuery = "";
let searchTimer;
let allMembers = [];

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

    const result = await apiFetch(`/portal/fines/all?${params.toString()}`);
    renderFines(result);
  } catch (err) {
    body.innerHTML = `<tr class="empty-row"><td colspan="8">Could not load fines — ${escapeHtml(err.message)}</td></tr>`;
    document.getElementById("pagination").style.display = "none";
  }
}

function renderFines(result) {
  const body = document.getElementById("finesBody");
  const fines = result.content || [];

  if (fines.length === 0) {
    body.innerHTML = `<tr class="empty-row"><td colspan="8">No fine records match this view.</td></tr>`;
    document.getElementById("pagination").style.display = "none";
    return;
  }

  body.innerHTML = fines.map(f => `
    <tr>
      <td>
        <div class="cell-title">${escapeHtml(f.userName)}</div>
        <div class="cell-sub">${escapeHtml(f.userEmail)}</div>
      </td>
      <td>
        ${f.bookTitle
          ? `<div class="cell-title">${escapeHtml(f.bookTitle)}</div><div class="cell-sub">${escapeHtml(f.bookAuthor || "")}</div>`
          : `<span class="text-slate text-sm">—</span>`}
      </td>
      <td class="mono">${formatDate(f.issueDate)}</td>
      <td class="mono">${formatDate(f.dueDate)}</td>
      <td class="mono">${formatDate(f.returnDate)}</td>
      <td class="mono">${f.overdueDays}</td>
      <td class="mono">${formatCurrency(f.fineAmount)}</td>
      <td>${paymentBadge(f.paymentStatus, f.fineAmount)}</td>
    </tr>
  `).join("");

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

// ===================== Log a Fine modal =====================
const logFineModal = document.getElementById("logFineModal");

async function openLogFineModal() {
  const select = document.getElementById("memberSelect");
  select.innerHTML = `<option value="">Loading members…</option>`;
  logFineModal.style.display = "flex";

  try {
    allMembers = await apiFetch("/portal/users");
    select.innerHTML = allMembers.length
      ? `<option value="">Select a member…</option>` + allMembers.map(m =>
          `<option value="${m.userId}">${escapeHtml(m.fullName)} — ${escapeHtml(m.email)}</option>`
        ).join("")
      : `<option value="">No registered members yet</option>`;
  } catch (err) {
    showToast(err.message, "error");
  }
}

function closeLogFineModal() {
  logFineModal.style.display = "none";
  document.getElementById("logFineForm").reset();
}

document.getElementById("logFineBtn").addEventListener("click", openLogFineModal);
document.getElementById("closeLogFineModal").addEventListener("click", closeLogFineModal);
document.getElementById("cancelLogFineBtn").addEventListener("click", closeLogFineModal);
logFineModal.addEventListener("click", (e) => { if (e.target === logFineModal) closeLogFineModal(); });

document.getElementById("saveLogFineBtn").addEventListener("click", async () => {
  const userId = document.getElementById("memberSelect").value;
  const issueDate = document.getElementById("issueDate").value;
  const dueDate = document.getElementById("dueDate").value;
  const returnDate = document.getElementById("returnDate").value || null;

  if (!userId || !issueDate || !dueDate) {
    showToast("Please select a member and fill in issue/due dates", "error");
    return;
  }

  try {
    await apiFetch("/portal/fines", {
      method: "POST",
      body: JSON.stringify({ userId: Number(userId), issueDate, dueDate, returnDate }),
    });
    showToast("Fine logged successfully");
    closeLogFineModal();
    loadFines();
  } catch (err) {
    showToast(err.message, "error");
  }
});

loadFines();
