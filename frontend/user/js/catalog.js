portalRequireAuth();

let allBooks = [];
let selectedBook = null;
let activeCategory = "ALL";

function bookThumb(book) {
  if (book.imageUrl) {
    return `<img src="${portalEscapeHtml(book.imageUrl)}" alt="${portalEscapeHtml(book.title)}" class="book-card-cover-img" onerror="this.outerHTML='<div class=&quot;book-card-cover-placeholder&quot;>📕</div>'" />`;
  }
  return `<div class="book-card-cover-placeholder">📕</div>`;
}

function availabilityPill(book) {
  if (book.availableCopies <= 0) {
    return `<span class="tab-badge issued">Fully borrowed</span>`;
  }
  return `<span class="tab-badge available">${book.availableCopies} available</span>`;
}

function renderCategoryDropdown() {
  const select = document.getElementById("categorySelect");
  if (!select) return;

  const categories = ["ALL", ...new Set(allBooks.map(b => b.category).filter(Boolean))].sort((a, b) => a === "ALL" ? -1 : a.localeCompare(b));

  select.innerHTML = categories.map(cat => {
    const isAll = cat === "ALL";
    const count = isAll ? allBooks.length : allBooks.filter(b => b.category === cat).length;
    const label = isAll ? `All Categories (${count})` : `${cat} (${count})`;
    return `<option value="${portalEscapeHtml(cat)}" ${cat === activeCategory ? "selected" : ""}>${label}</option>`;
  }).join("");

  select.onchange = (e) => {
    activeCategory = e.target.value;
    renderCatalog();
  };
}

function renderCatalog() {
  const grid = document.getElementById("catalogGrid");
  const query = document.getElementById("searchInput").value.trim().toLowerCase();
  const statusBar = document.getElementById("catalogStatusBar");
  const countLabel = document.getElementById("catalogCountLabel");

  let filtered = allBooks;
  if (activeCategory !== "ALL") {
    filtered = filtered.filter(b => b.category === activeCategory);
  }
  if (query) {
    filtered = filtered.filter(b =>
      (b.title || "").toLowerCase().includes(query) ||
      (b.author || "").toLowerCase().includes(query) ||
      (b.category || "").toLowerCase().includes(query)
    );
  }

  // Update status summary bar
  if (statusBar && countLabel) {
    if (activeCategory !== "ALL" || query) {
      statusBar.style.display = "flex";
      let filterText = `Showing <strong>${filtered.length}</strong> of ${allBooks.length} titles`;
      if (activeCategory !== "ALL") {
        filterText += ` · Category: <strong>${portalEscapeHtml(activeCategory)}</strong>`;
      }
      if (query) {
        filterText += ` · Search: "<strong>${portalEscapeHtml(query)}</strong>"`;
      }
      countLabel.innerHTML = filterText;
    } else {
      statusBar.style.display = "none";
    }
  }

  if (filtered.length === 0) {
    grid.innerHTML = `
      <div class="empty-row" style="grid-column:1/-1; padding:40px 20px; text-align:center;">
        <div style="font-size:32px; margin-bottom:8px;">🔍</div>
        <div style="font-size:16px; font-weight:700; color:var(--ink);">No books found</div>
        <div style="color:var(--slate); font-size:13.5px; margin-top:4px;">No titles match your filter criteria. Try selecting another category or clearing search.</div>
        <button class="btn btn-secondary btn-sm" style="margin-top:16px;" onclick="resetCatalogFilters()">Reset all filters</button>
      </div>`;
    return;
  }

  grid.innerHTML = filtered.map(b => `
    <div class="book-card">
      <div class="book-card-cover">
        ${bookThumb(b)}
        ${b.category ? `<span class="book-card-category-tag">${portalEscapeHtml(b.category)}</span>` : ""}
      </div>
      <div class="book-card-body">
        <div class="book-card-title">${portalEscapeHtml(b.title)}</div>
        <div class="book-card-author">${portalEscapeHtml(b.author)}</div>
        ${b.description ? `<div class="book-card-desc">${portalEscapeHtml(b.description)}</div>` : ""}
      </div>
      <div class="book-card-footer">
        ${availabilityPill(b)}
        ${b.availableCopies > 0
          ? `<button class="btn btn-primary btn-sm" data-issue="${b.id}">Borrow</button>`
          : `<button class="btn btn-secondary btn-sm" disabled>Unavailable</button>`}
      </div>
    </div>
  `).join("");

  grid.querySelectorAll("[data-issue]").forEach(btn =>
    btn.addEventListener("click", () => openIssueModal(btn.dataset.issue))
  );
}

function resetCatalogFilters() {
  activeCategory = "ALL";
  const select = document.getElementById("categorySelect");
  if (select) select.value = "ALL";
  const search = document.getElementById("searchInput");
  if (search) search.value = "";
  renderCatalog();
}

async function loadCatalog() {
  const grid = document.getElementById("catalogGrid");
  grid.innerHTML = `<div class="loading-row">Loading catalog…</div>`;
  try {
    allBooks = await portalApiFetchRoot("/books");
    renderCategoryDropdown();
    renderCatalog();
  } catch (err) {
    grid.innerHTML = `<div class="empty-row" style="grid-column:1/-1;">Could not load the catalog — ${portalEscapeHtml(err.message)}</div>`;
  }
}

let searchTimer;
document.getElementById("searchInput").addEventListener("input", () => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(renderCatalog, 250);
});

const clearBtn = document.getElementById("clearFilterBtn");
if (clearBtn) {
  clearBtn.addEventListener("click", resetCatalogFilters);
}

// ===================== Issue modal =====================
const issueModal = document.getElementById("issueModal");

function openIssueModal(bookId) {
  selectedBook = allBooks.find(b => String(b.id) === String(bookId));
  if (!selectedBook) return;

  document.getElementById("issueModalBookInfo").innerHTML =
    `<strong>${portalEscapeHtml(selectedBook.title)}</strong> by ${portalEscapeHtml(selectedBook.author)}`;
  document.getElementById("loanDays").value = 14;
  issueModal.style.display = "flex";
}

function closeIssueModal() {
  issueModal.style.display = "none";
  selectedBook = null;
}

document.getElementById("closeIssueModal").addEventListener("click", closeIssueModal);
document.getElementById("cancelIssueBtn").addEventListener("click", closeIssueModal);
issueModal.addEventListener("click", (e) => { if (e.target === issueModal) closeIssueModal(); });

document.getElementById("confirmIssueBtn").addEventListener("click", async () => {
  if (!selectedBook) return;
  const loanDays = Number(document.getElementById("loanDays").value) || 14;

  try {
    await portalApiFetch("/fines/issue", {
      method: "POST",
      body: JSON.stringify({ bookId: selectedBook.id, loanDays }),
    });
    portalShowToast(`"${selectedBook.title}" borrowed successfully`);
    closeIssueModal();
    loadCatalog();
  } catch (err) {
    portalShowToast(err.message, "error");
  }
});

loadCatalog();
