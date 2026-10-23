requireAuth();

let allBooks = [];
let editingBookId = null;

function bookStatusBadge(book) {
  if (book.availableCopies <= 0) {
    return `<span class="tab-badge issued">Fully issued</span>`;
  }
  return `<span class="tab-badge available">Available</span>`;
}

function bookThumb(book) {
  if (book.imageUrl) {
    return `<img src="${escapeHtml(book.imageUrl)}" alt="" class="book-thumb" onerror="this.outerHTML='<div class=&quot;book-thumb placeholder&quot;>📕</div>'" />`;
  }
  return `<div class="book-thumb placeholder">📕</div>`;
}

function renderBooks(books) {
  const body = document.getElementById("booksBody");

  if (books.length === 0) {
    body.innerHTML = `<tr class="empty-row"><td colspan="7">No books found. Try a different search, or add a new book.</td></tr>`;
    return;
  }

  body.innerHTML = books.map(b => `
    <tr>
      <td>${bookThumb(b)}</td>
      <td>
        <div class="cell-title">${escapeHtml(b.title)}</div>
        <div class="cell-sub">${escapeHtml(b.author)}</div>
      </td>
      <td>${escapeHtml(b.category || "—")}</td>
      <td class="mono">${escapeHtml(b.isbn || "—")}</td>
      <td class="mono">${b.availableCopies} / ${b.totalCopies}</td>
      <td>${bookStatusBadge(b)}</td>
      <td style="text-align:right;">
        <button class="btn btn-ghost btn-sm" data-edit="${b.id}">Edit</button>
        <button class="btn btn-ghost btn-sm" data-delete="${b.id}" style="color:var(--rose);">Delete</button>
      </td>
    </tr>
  `).join("");

  body.querySelectorAll("[data-edit]").forEach(btn =>
    btn.addEventListener("click", () => openEditModal(btn.dataset.edit))
  );
  body.querySelectorAll("[data-delete]").forEach(btn =>
    btn.addEventListener("click", () => deleteBook(btn.dataset.delete))
  );
}

async function loadBooks(query) {
  const body = document.getElementById("booksBody");
  body.innerHTML = `<tr class="empty-row"><td colspan="7">Loading books…</td></tr>`;
  try {
    const path = query ? `/books?query=${encodeURIComponent(query)}` : "/books";
    allBooks = await apiFetch(path);
    renderBooks(allBooks);
  } catch (err) {
    body.innerHTML = `<tr class="empty-row"><td colspan="7">Could not load books — ${escapeHtml(err.message)}</td></tr>`;
  }
}

let searchTimer;
document.getElementById("searchInput").addEventListener("input", (e) => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => loadBooks(e.target.value), 300);
});

// ===================== Modal handling =====================
const bookModal = document.getElementById("bookModal");

function openAddModal() {
  editingBookId = null;
  document.getElementById("bookModalTitle").textContent = "Add book";
  document.getElementById("bookForm").reset();
  bookModal.style.display = "flex";
}

function openEditModal(id) {
  const book = allBooks.find(b => String(b.id) === String(id));
  if (!book) return;

  editingBookId = book.id;
  document.getElementById("bookModalTitle").textContent = "Edit book";
  document.getElementById("title").value = book.title || "";
  document.getElementById("imageUrl").value = book.imageUrl || "";
  document.getElementById("author").value = book.author || "";
  document.getElementById("isbn").value = book.isbn || "";
  document.getElementById("category").value = book.category || "";
  document.getElementById("publisher").value = book.publisher || "";
  document.getElementById("publishedYear").value = book.publishedYear || "";
  document.getElementById("rackLocation").value = book.rackLocation || "";
  document.getElementById("totalCopies").value = book.totalCopies;
  document.getElementById("price").value = book.price || "";
  document.getElementById("description").value = book.description || "";

  bookModal.style.display = "flex";
}

function closeModal() {
  bookModal.style.display = "none";
}

document.getElementById("addBookBtn").addEventListener("click", openAddModal);
document.getElementById("closeBookModal").addEventListener("click", closeModal);
document.getElementById("cancelBookBtn").addEventListener("click", closeModal);
bookModal.addEventListener("click", (e) => { if (e.target === bookModal) closeModal(); });

document.getElementById("saveBookBtn").addEventListener("click", async () => {
  const payload = {
    title: document.getElementById("title").value.trim(),
    imageUrl: document.getElementById("imageUrl").value.trim() || null,
    author: document.getElementById("author").value.trim(),
    isbn: document.getElementById("isbn").value.trim() || null,
    category: document.getElementById("category").value.trim() || null,
    publisher: document.getElementById("publisher").value.trim() || null,
    publishedYear: document.getElementById("publishedYear").value ? Number(document.getElementById("publishedYear").value) : null,
    rackLocation: document.getElementById("rackLocation").value.trim() || null,
    totalCopies: Number(document.getElementById("totalCopies").value),
    price: document.getElementById("price").value ? Number(document.getElementById("price").value) : null,
    description: document.getElementById("description").value.trim() || null,
  };

  if (!payload.title || !payload.author || payload.totalCopies === "" ) {
    showToast("Please fill in all required fields", "error");
    return;
  }

  try {
    if (editingBookId) {
      await apiFetch(`/books/${editingBookId}`, { method: "PUT", body: JSON.stringify(payload) });
      showToast("Book updated successfully");
    } else {
      payload.availableCopies = payload.totalCopies;
      await apiFetch("/books", { method: "POST", body: JSON.stringify(payload) });
      showToast("Book added to catalog");
    }
    closeModal();
    loadBooks(document.getElementById("searchInput").value);
  } catch (err) {
    showToast(err.message, "error");
  }
});

async function deleteBook(id) {
  if (!confirm("Delete this book from the catalog? This will also permanently delete its loan/transaction history. This cannot be undone.")) return;
  try {
    await apiFetch(`/books/${id}`, { method: "DELETE" });
    showToast("Book deleted");
    loadBooks(document.getElementById("searchInput").value);
  } catch (err) {
    showToast(err.message, "error");
  }
}

loadBooks();
