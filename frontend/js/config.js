// ===================== Global Config =====================
const RENDER_PROD_API = "https://libroflow-gq7o.onrender.com/api";
const isLocal = typeof window !== "undefined" && window.location && 
  (window.location.hostname === "localhost" || 
   window.location.hostname === "127.0.0.1" || 
   window.location.hostname.startsWith("192.168."));

const BACKEND_HOST = (typeof window !== "undefined" && window.location && window.location.hostname) ? window.location.hostname : "localhost";

const API_BASE_URL = (typeof window !== "undefined" && window.LIBROFLOW_API_URL)
  || (typeof localStorage !== "undefined" && localStorage.getItem("libroflow_api_url"))
  || (isLocal ? `http://${BACKEND_HOST}:8080/api` : RENDER_PROD_API);

// ===================== Auth Helpers =====================
function isJwtExpired(token) {
  if (!token) return true;
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return false;
    const payload = JSON.parse(atob(parts[1]));
    if (!payload.exp) return false;
    // Check if expired (exp is in seconds)
    return payload.exp * 1000 <= Date.now();
  } catch (e) {
    return false;
  }
}

function getToken() {
  const token = localStorage.getItem("lms_token");
  if (token && isJwtExpired(token)) {
    clearSession();
    return null;
  }
  return token;
}

function getUser() {
  const raw = localStorage.getItem("lms_user");
  return raw ? JSON.parse(raw) : null;
}

function setSession(token, user) {
  localStorage.setItem("lms_token", token);
  localStorage.setItem("lms_user", JSON.stringify(user));
}

function clearSession() {
  localStorage.removeItem("lms_token");
  localStorage.removeItem("lms_user");
}

function requireAuth() {
  if (!getToken()) {
    window.location.href = "login.html";
  }
}

function logout() {
  clearSession();
  window.location.href = "login.html";
}

// ===================== API Fetch Wrapper =====================
async function apiFetch(path, options = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  const token = getToken();
  if (token) {
    headers["Authorization"] = "Bearer " + token;
  }

  const response = await fetch(API_BASE_URL + path, { ...options, headers });

  const isJson = response.headers.get("content-type")?.includes("application/json");
  const body = isJson ? await response.json().catch(() => null) : null;

  if (response.status === 401) {
    clearSession();
    window.location.href = "login.html";
    throw new Error((body && body.message) || "Session expired. Please log in again.");
  }

  if (response.status === 403) {
    // If forbidden because token is missing or expired, redirect to login
    if (!getToken()) {
      clearSession();
      window.location.href = "login.html";
      throw new Error("Authentication required. Please log in.");
    }
    const message = (body && body.message) || "Access denied (403): You do not have permission for this action.";
    throw new Error(message);
  }

  if (!response.ok) {
    const message = (body && body.message) || `Request failed (${response.status})`;
    throw new Error(message);
  }

  return body;
}

// ===================== Toast Notifications =====================
function showToast(message, type = "success") {
  let container = document.querySelector(".toast-container");
  if (!container) {
    container = document.createElement("div");
    container.className = "toast-container";
    document.body.appendChild(container);
  }

  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.textContent = message;
  container.appendChild(toast);

  setTimeout(() => toast.remove(), 3500);
}

// ===================== Formatting Helpers =====================
function formatDate(dateStr) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function formatCurrency(amount) {
  if (amount === null || amount === undefined) return "₹0.00";
  return "₹" + Number(amount).toFixed(2);
}

function escapeHtml(str) {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// ===================== Sidebar user chip + active link =====================
function renderSidebarUser() {
  const user = getUser();
  if (!user) return;

  const nameEl = document.querySelector("[data-user-name]");
  const roleEl = document.querySelector("[data-user-role]");
  const avatarEl = document.querySelector("[data-user-avatar]");

  if (nameEl) nameEl.textContent = user.fullName || user.username;
  if (roleEl) roleEl.textContent = user.role === "ADMIN" ? "Administrator" : "Librarian";
  if (avatarEl) avatarEl.textContent = (user.fullName || user.username).charAt(0).toUpperCase();
}

// ===================== Mobile nav (injected so no HTML file needs editing) =====================
function initMobileNav() {
  const sidebar = document.querySelector(".sidebar");
  if (!sidebar || document.querySelector(".mobile-topbar")) return;

  const topbar = document.createElement("div");
  topbar.className = "mobile-topbar";
  topbar.innerHTML = `
    <button class="mobile-menu-btn" aria-label="Open menu">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
    </button>
    <div style="display:flex; align-items:center; gap:8px;">
      <img src="img/logo.png" alt="LibroFlow" style="width:28px; height:28px; border-radius:7px; object-fit:cover; background:white; box-shadow:0 2px 8px rgba(0,0,0,0.2);" />
      <span class="mobile-topbar-brand">LibroFlow</span>
    </div>
  `;
  document.body.prepend(topbar);

  const backdrop = document.createElement("div");
  backdrop.className = "sidebar-backdrop";
  document.body.appendChild(backdrop);

  const closeSidebar = () => {
    sidebar.classList.remove("open");
    backdrop.classList.remove("visible");
  };
  const openSidebar = () => {
    sidebar.classList.add("open");
    backdrop.classList.add("visible");
  };

  topbar.querySelector(".mobile-menu-btn").addEventListener("click", openSidebar);
  backdrop.addEventListener("click", closeSidebar);
  sidebar.querySelectorAll(".nav-link, .logout-btn").forEach(el => el.addEventListener("click", closeSidebar));
}

function injectFavicon() {
  if (document.querySelector('link[rel="icon"]')) return;
  const link = document.createElement("link");
  link.rel = "icon";
  link.type = "image/png";
  link.href = "img/logo.png";
  document.head.appendChild(link);
}

document.addEventListener("DOMContentLoaded", () => {
  injectFavicon();
  renderSidebarUser();
  initMobileNav();
  const logoutBtn = document.querySelector("[data-logout]");
  if (logoutBtn) logoutBtn.addEventListener("click", logout);
});
