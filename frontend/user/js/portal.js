// ===================== Global Config =====================
const PORTAL_RENDER_PROD_API = "https://libroflow-gq7o.onrender.com/api";
const portalIsLocal = typeof window !== "undefined" && window.location && 
  (window.location.hostname === "localhost" || 
   window.location.hostname === "127.0.0.1" || 
   window.location.hostname.startsWith("192.168."));

const PORTAL_BACKEND_HOST = (typeof window !== "undefined" && window.location && window.location.hostname) ? window.location.hostname : "localhost";

const PORTAL_API_ROOT = (typeof window !== "undefined" && window.LIBROFLOW_API_URL)
  || (typeof localStorage !== "undefined" && localStorage.getItem("libroflow_api_url"))
  || (portalIsLocal ? `http://${PORTAL_BACKEND_HOST}:8080/api` : PORTAL_RENDER_PROD_API);

const PORTAL_API_BASE_URL = `${PORTAL_API_ROOT}/portal`;
const ROOT_API_BASE_URL = PORTAL_API_ROOT; // for shared endpoints like /books

// ===================== Auth Helpers (namespaced, separate from admin session) =====================
function portalIsJwtExpired(token) {
  if (!token) return true;
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return false;
    const payload = JSON.parse(atob(parts[1]));
    if (!payload.exp) return false;
    return payload.exp * 1000 <= Date.now();
  } catch (e) {
    return false;
  }
}

function portalGetToken() {
  const token = localStorage.getItem("portal_token");
  if (token && portalIsJwtExpired(token)) {
    portalClearSession();
    return null;
  }
  return token;
}

function portalGetUser() {
  const raw = localStorage.getItem("portal_user");
  return raw ? JSON.parse(raw) : null;
}

function portalSetSession(token, user) {
  localStorage.setItem("portal_token", token);
  localStorage.setItem("portal_user", JSON.stringify(user));
}

function portalClearSession() {
  localStorage.removeItem("portal_token");
  localStorage.removeItem("portal_user");
}

function portalRequireAuth() {
  if (!portalGetToken()) {
    window.location.href = "login.html";
  }
}

function portalLogout() {
  portalClearSession();
  window.location.href = "login.html";
}

// ===================== API Fetch Wrapper =====================
async function portalApiFetch(path, options = {}) {
  return portalApiFetchBase(PORTAL_API_BASE_URL, path, options);
}

/** For shared endpoints outside the /portal prefix (e.g. /books) - still sends the member's token. */
async function portalApiFetchRoot(path, options = {}) {
  return portalApiFetchBase(ROOT_API_BASE_URL, path, options);
}

async function portalApiFetchBase(baseUrl, path, options = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  const token = portalGetToken();
  if (token) {
    headers["Authorization"] = "Bearer " + token;
  }

  const response = await fetch(baseUrl + path, { ...options, headers });

  const isJson = response.headers.get("content-type")?.includes("application/json");
  const body = isJson ? await response.json().catch(() => null) : null;

  if (response.status === 401) {
    portalClearSession();
    window.location.href = "login.html";
    throw new Error((body && body.message) || "Session expired. Please log in again.");
  }

  if (response.status === 403) {
    if (!portalGetToken()) {
      portalClearSession();
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
function portalShowToast(message, type = "success") {
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
function portalFormatDate(dateStr) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function portalFormatCurrency(amount) {
  if (amount === null || amount === undefined) return "₹0.00";
  return "₹" + Number(amount).toFixed(2);
}

function portalEscapeHtml(str) {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// ===================== Sidebar user chip =====================
function portalRenderSidebarUser() {
  const user = portalGetUser();
  if (!user) return;

  const nameEl = document.querySelector("[data-user-name]");
  const avatarEl = document.querySelector("[data-user-avatar]");

  if (nameEl) nameEl.textContent = user.fullName || user.email;
  if (avatarEl) avatarEl.textContent = (user.fullName || user.email).charAt(0).toUpperCase();
}

// ===================== Mobile nav (injected so no HTML file needs editing) =====================
function portalInitMobileNav() {
  const sidebar = document.querySelector(".sidebar");
  if (!sidebar || document.querySelector(".mobile-topbar")) return;

  const topbar = document.createElement("div");
  topbar.className = "mobile-topbar";
  topbar.innerHTML = `
    <button class="mobile-menu-btn" aria-label="Open menu">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
    </button>
    <div style="display:flex; align-items:center; gap:8px;">
      <img src="../img/logo.png" alt="LibroFlow" style="width:28px; height:28px; border-radius:7px; object-fit:cover; background:white; box-shadow:0 2px 8px rgba(0,0,0,0.2);" />
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

function portalInjectFavicon() {
  if (document.querySelector('link[rel="icon"]')) return;
  const link = document.createElement("link");
  link.rel = "icon";
  link.type = "image/png";
  link.href = "../img/logo.png";
  document.head.appendChild(link);
}

document.addEventListener("DOMContentLoaded", () => {
  portalInjectFavicon();
  portalRenderSidebarUser();
  portalInitMobileNav();
  const logoutBtn = document.querySelector("[data-logout]");
  if (logoutBtn) logoutBtn.addEventListener("click", portalLogout);
});
