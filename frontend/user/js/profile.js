portalRequireAuth();

let currentProfile = null;

function renderProfile(profile) {
  const view = document.getElementById("profileView");
  view.innerHTML = `
    <div class="profile-card" style="padding:0 0 18px 0;">
      <div class="avatar-lg">${profile.fullName.charAt(0).toUpperCase()}</div>
      <div class="details">
        <h3>${portalEscapeHtml(profile.fullName)}</h3>
        <div class="meta">
          <span>${portalEscapeHtml(profile.email)}</span>
          <span class="tab-badge available" style="margin-top:4px;">${portalEscapeHtml(profile.status)}</span>
        </div>
      </div>
    </div>
    <div class="info-row"><div class="k">Phone</div><div class="v">${portalEscapeHtml(profile.phone || "—")}</div></div>
    <div class="info-row"><div class="k">Department</div><div class="v">${portalEscapeHtml(profile.department || "—")}</div></div>
    <div class="info-row"><div class="k">Member since</div><div class="v mono">${portalFormatDate(profile.createdAt)}</div></div>
  `;
}

async function loadProfile() {
  try {
    currentProfile = await portalApiFetch("/users/me");
    renderProfile(currentProfile);
  } catch (err) {
    document.getElementById("profileView").innerHTML =
      `<div class="empty-row">Could not load profile — ${portalEscapeHtml(err.message)}</div>`;
  }
}

// ===================== Edit modal =====================
const editModal = document.getElementById("editModal");

document.getElementById("editProfileBtn").addEventListener("click", () => {
  if (!currentProfile) return;
  document.getElementById("editFullName").value = currentProfile.fullName || "";
  document.getElementById("editPhone").value = currentProfile.phone || "";
  document.getElementById("editDepartment").value = currentProfile.department || "";
  editModal.style.display = "flex";
});

function closeEditModal() {
  editModal.style.display = "none";
}
document.getElementById("closeEditModal").addEventListener("click", closeEditModal);
document.getElementById("cancelEditBtn").addEventListener("click", closeEditModal);
editModal.addEventListener("click", (e) => { if (e.target === editModal) closeEditModal(); });

document.getElementById("saveEditBtn").addEventListener("click", async () => {
  const payload = {
    fullName: document.getElementById("editFullName").value.trim(),
    phone: document.getElementById("editPhone").value.trim() || null,
    department: document.getElementById("editDepartment").value.trim() || null,
  };

  if (!payload.fullName) {
    portalShowToast("Please enter your full name", "error");
    return;
  }

  try {
    currentProfile = await portalApiFetch("/users/me", { method: "PUT", body: JSON.stringify(payload) });
    renderProfile(currentProfile);

    // keep the sidebar name + localStorage in sync
    const user = portalGetUser();
    if (user) {
      user.fullName = currentProfile.fullName;
      portalSetSession(portalGetToken(), user);
      portalRenderSidebarUser();
    }

    closeEditModal();
    portalShowToast("Profile updated successfully");
  } catch (err) {
    portalShowToast(err.message, "error");
  }
});

// ===================== Change password =====================
document.getElementById("passwordForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const currentPassword = document.getElementById("currentPassword").value;
  const newPassword = document.getElementById("newPassword").value;
  const confirmNewPassword = document.getElementById("confirmNewPassword").value;

  if (newPassword !== confirmNewPassword) {
    portalShowToast("New passwords do not match", "error");
    return;
  }

  const btn = document.getElementById("changePasswordBtn");
  btn.disabled = true;
  btn.textContent = "Updating...";

  try {
    await portalApiFetch("/users/me/password", {
      method: "PUT",
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    portalShowToast("Password changed successfully");
    document.getElementById("passwordForm").reset();
  } catch (err) {
    portalShowToast(err.message, "error");
  } finally {
    btn.disabled = false;
    btn.textContent = "Update password";
  }
});

loadProfile();
