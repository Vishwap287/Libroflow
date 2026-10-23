requireAuth();

let allTransactions = [];
let activeFilter = "ALL";

function statusBadge(status) {
  const map = { ISSUED: "issued", OVERDUE: "overdue", RETURNED: "returned" };
  const cls = map[status] || "returned";
  const label = status.charAt(0) + status.slice(1).toLowerCase();
  return `<span class="tab-badge ${cls}">${label}</span>`;
}

function renderTransactions() {
  const body = document.getElementById("transactionsBody");
  const filtered = activeFilter === "ALL"
    ? allTransactions
    : allTransactions.filter(t => t.status === activeFilter);

  if (filtered.length === 0) {
    body.innerHTML = `<tr class="empty-row"><td colspan="7">No transactions in this view.</td></tr>`;
    return;
  }

  // Most recent first
  const sorted = [...filtered].sort((a, b) => new Date(b.issueDate) - new Date(a.issueDate));

  body.innerHTML = sorted.map(t => `
    <tr>
      <td>
        <div class="cell-title">${escapeHtml(t.book.title)}</div>
        <div class="cell-sub">${escapeHtml(t.book.author)}</div>
      </td>
      <td>${escapeHtml(t.member.name)}</td>
      <td class="mono">${formatDate(t.issueDate)}</td>
      <td class="mono">${formatDate(t.dueDate)}</td>
      <td>${statusBadge(t.status)}</td>
      <td class="mono">${t.fine > 0 ? formatCurrency(t.fine) : "—"}</td>
      <td style="text-align:right;">
        ${t.status !== "RETURNED"
          ? `<button class="btn btn-secondary btn-sm" data-return="${t.id}">Mark returned</button>`
          : `<span class="text-slate text-sm">Returned ${formatDate(t.returnDate)}</span>`}
      </td>
    </tr>
  `).join("");

  body.querySelectorAll("[data-return]").forEach(btn =>
    btn.addEventListener("click", () => returnBook(btn.dataset.return))
  );
}

async function loadTransactions() {
  const body = document.getElementById("transactionsBody");
  body.innerHTML = `<tr class="empty-row"><td colspan="7">Loading transactions…</td></tr>`;
  try {
    allTransactions = await apiFetch("/transactions");
    renderTransactions();
  } catch (err) {
    body.innerHTML = `<tr class="empty-row"><td colspan="7">Could not load transactions — ${escapeHtml(err.message)}</td></tr>`;
  }
}

document.querySelectorAll("[data-filter]").forEach(btn => {
  btn.addEventListener("click", () => {
    activeFilter = btn.dataset.filter;
    document.querySelectorAll("[data-filter]").forEach(b => b.classList.remove("btn-primary"));
    document.querySelectorAll("[data-filter]").forEach(b => b.classList.add("btn-secondary"));
    btn.classList.remove("btn-secondary");
    btn.classList.add("btn-primary");
    renderTransactions();
  });
});
// default active state
document.querySelector('[data-filter="ALL"]').classList.add("btn-primary");
document.querySelector('[data-filter="ALL"]').classList.remove("btn-secondary");

async function returnBook(transactionId) {
  if (!confirm("Mark this book as returned?")) return;
  try {
    const result = await apiFetch(`/transactions/return/${transactionId}`, { method: "POST" });
    if (result.fine > 0) {
      showToast(`Returned — fine of ${formatCurrency(result.fine)} applies`, "error");
    } else {
      showToast("Book returned — no fine due");
    }
    loadTransactions();
  } catch (err) {
    showToast(err.message, "error");
  }
}

// ===================== Issue Modal =====================
const issueModal = document.getElementById("issueModal");

async function openIssueModal() {
  const bookSelect = document.getElementById("issueBookSelect");
  const memberSelect = document.getElementById("issueMemberSelect");
  bookSelect.innerHTML = `<option value="">Loading books…</option>`;
  memberSelect.innerHTML = `<option value="">Loading members…</option>`;
  issueModal.style.display = "flex";

  try {
    const [books, members] = await Promise.all([apiFetch("/books"), apiFetch("/members")]);

    const availableBooks = books.filter(b => b.availableCopies > 0);
    bookSelect.innerHTML = availableBooks.length
      ? `<option value="">Select a book…</option>` + availableBooks.map(b =>
          `<option value="${b.id}">${escapeHtml(b.title)} — ${b.availableCopies} available</option>`
        ).join("")
      : `<option value="">No books currently available</option>`;

    memberSelect.innerHTML = `<option value="">Select a member…</option>` + members.map(m =>
      `<option value="${m.id}">${escapeHtml(m.name)}</option>`
    ).join("");
  } catch (err) {
    showToast(err.message, "error");
  }
}

function closeIssueModal() {
  issueModal.style.display = "none";
}

document.getElementById("issueBookBtn").addEventListener("click", openIssueModal);
document.getElementById("closeIssueModal").addEventListener("click", closeIssueModal);
document.getElementById("cancelIssueBtn").addEventListener("click", closeIssueModal);
issueModal.addEventListener("click", (e) => { if (e.target === issueModal) closeIssueModal(); });

document.getElementById("confirmIssueBtn").addEventListener("click", async () => {
  const bookId = document.getElementById("issueBookSelect").value;
  const memberId = document.getElementById("issueMemberSelect").value;
  const loanDays = Number(document.getElementById("loanDays").value) || 14;

  if (!bookId || !memberId) {
    showToast("Please select both a book and a member", "error");
    return;
  }

  try {
    await apiFetch("/transactions/issue", {
      method: "POST",
      body: JSON.stringify({ bookId: Number(bookId), memberId: Number(memberId), loanDays }),
    });
    showToast("Book issued successfully");
    closeIssueModal();
    loadTransactions();
  } catch (err) {
    showToast(err.message, "error");
  }
});

loadTransactions();
