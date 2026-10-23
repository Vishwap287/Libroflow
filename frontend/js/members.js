requireAuth();

let allMembers = [];
let editingMemberId = null;

function memberStatusBadge(status) {
  if (status === "SUSPENDED") {
    return `<span class="tab-badge overdue">Suspended</span>`;
  }
  return `<span class="tab-badge available">Active</span>`;
}

function renderMembers(members) {
  const body = document.getElementById("membersBody");

  if (members.length === 0) {
    body.innerHTML = `<tr class="empty-row"><td colspan="5">No members found. Try a different search, or add a new member.</td></tr>`;
    return;
  }

  body.innerHTML = members.map(m => `
    <tr>
      <td>
        <div class="cell-title">${escapeHtml(m.name)}</div>
      </td>
      <td>
        <div>${escapeHtml(m.email || "—")}</div>
        <div class="cell-sub">${escapeHtml(m.phone || "")}</div>
      </td>
      <td class="mono">${formatDate(m.membershipDate)}</td>
      <td>${memberStatusBadge(m.status)}</td>
      <td style="text-align:right;">
        <button class="btn btn-ghost btn-sm" data-edit="${m.id}">Edit</button>
        <button class="btn btn-ghost btn-sm" data-delete="${m.id}" style="color:var(--rose);">Delete</button>
      </td>
    </tr>
  `).join("");

  body.querySelectorAll("[data-edit]").forEach(btn =>
    btn.addEventListener("click", () => openEditModal(btn.dataset.edit))
  );
  body.querySelectorAll("[data-delete]").forEach(btn =>
    btn.addEventListener("click", () => deleteMember(btn.dataset.delete))
  );
}

async function loadMembers(query) {
  const body = document.getElementById("membersBody");
  body.innerHTML = `<tr class="empty-row"><td colspan="5">Loading members…</td></tr>`;
  try {
    const path = query ? `/members?query=${encodeURIComponent(query)}` : "/members";
    allMembers = await apiFetch(path);
    renderMembers(allMembers);
  } catch (err) {
    body.innerHTML = `<tr class="empty-row"><td colspan="5">Could not load members — ${escapeHtml(err.message)}</td></tr>`;
  }
}

let searchTimer;
document.getElementById("searchInput").addEventListener("input", (e) => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => loadMembers(e.target.value), 300);
});

// ===================== Modal handling =====================
const memberModal = document.getElementById("memberModal");

function openAddModal() {
  editingMemberId = null;
  document.getElementById("memberModalTitle").textContent = "Add member";
  document.getElementById("memberForm").reset();
  memberModal.style.display = "flex";
}

function openEditModal(id) {
  const member = allMembers.find(m => String(m.id) === String(id));
  if (!member) return;

  editingMemberId = member.id;
  document.getElementById("memberModalTitle").textContent = "Edit member";
  document.getElementById("name").value = member.name || "";
  document.getElementById("email").value = member.email || "";
  document.getElementById("phone").value = member.phone || "";
  document.getElementById("address").value = member.address || "";
  document.getElementById("status").value = member.status || "ACTIVE";

  memberModal.style.display = "flex";
}

function closeModal() {
  memberModal.style.display = "none";
}

document.getElementById("addMemberBtn").addEventListener("click", openAddModal);
document.getElementById("closeMemberModal").addEventListener("click", closeModal);
document.getElementById("cancelMemberBtn").addEventListener("click", closeModal);
memberModal.addEventListener("click", (e) => { if (e.target === memberModal) closeModal(); });

document.getElementById("saveMemberBtn").addEventListener("click", async () => {
  const payload = {
    name: document.getElementById("name").value.trim(),
    email: document.getElementById("email").value.trim() || null,
    phone: document.getElementById("phone").value.trim() || null,
    address: document.getElementById("address").value.trim() || null,
    status: document.getElementById("status").value,
  };

  if (!payload.name) {
    showToast("Please enter the member's name", "error");
    return;
  }

  try {
    if (editingMemberId) {
      await apiFetch(`/members/${editingMemberId}`, { method: "PUT", body: JSON.stringify(payload) });
      showToast("Member updated successfully");
    } else {
      await apiFetch("/members", { method: "POST", body: JSON.stringify(payload) });
      showToast("Member added");
    }
    closeModal();
    loadMembers(document.getElementById("searchInput").value);
  } catch (err) {
    showToast(err.message, "error");
  }
});

async function deleteMember(id) {
  if (!confirm("Delete this member? This will also permanently delete their loan/transaction history. This cannot be undone.")) return;
  try {
    await apiFetch(`/members/${id}`, { method: "DELETE" });
    showToast("Member deleted");
    loadMembers(document.getElementById("searchInput").value);
  } catch (err) {
    showToast(err.message, "error");
  }
}

loadMembers();
