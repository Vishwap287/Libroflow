portalRequireAuth();

const user = portalGetUser();
const welcomeEl = document.getElementById("welcomeMsg");
if (welcomeEl) {
  welcomeEl.textContent = `Welcome back, ${user?.fullName || "Scholar"} 👋`;
}

const todayEl = document.getElementById("todayLabel");
if (todayEl) {
  todayEl.textContent = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric"
  });
}

const deptEl = document.getElementById("userDeptBadge");
if (deptEl) {
  deptEl.textContent = user?.department ? `Dept: ${user.department}` : "Library Scholar";
}

function paymentBadge(status, amount) {
  if (!amount || amount <= 0) {
    return `<span class="tab-badge returned">No fine due</span>`;
  }
  const cls = status === "PAID" ? "paid" : "unpaid";
  const label = status === "PAID" ? "Settled" : "Unpaid";
  return `<span class="tab-badge ${cls}">${label}</span>`;
}

/** Gently counts each stat card's number up from 0 to its real value. */
function animateStatCounters(container) {
  const els = container.querySelectorAll(".value[data-count]");
  els.forEach(el => {
    const target = Number(el.dataset.count) || 0;
    const duration = 650;
    const start = performance.now();
    function tick(now) {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      el.textContent = Math.round(eased * target);
      if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  });
}

async function loadDashboard() {
  const grid = document.getElementById("statGrid");
  const body = document.getElementById("recentFinesBody");

  try {
    const summary = await portalApiFetch("/users/me/dashboard");

    // Dynamic Account Standing Update
    const standingBadge = document.getElementById("standingBadge");
    const standingSub = document.getElementById("standingSub");
    const standingMsg = document.getElementById("standingMsg");
    const standingActions = document.getElementById("standingActions");

    if (summary.pendingFineAmount > 0) {
      if (standingBadge) {
        standingBadge.className = "tab-badge unpaid";
        standingBadge.textContent = "Dues Pending";
      }
      if (standingSub) standingSub.textContent = "Action required on outstanding balance";
      if (standingMsg) {
        standingMsg.innerHTML = `You have an unsettled fine of <strong style="color:var(--rose);">${portalFormatCurrency(summary.pendingFineAmount)}</strong>. Please settle your dues to maintain uninterrupted borrowing privileges.`;
      }
      if (standingActions) {
        standingActions.innerHTML = `
          <a href="fines.html" class="btn btn-primary btn-sm" style="flex:1; justify-content:center;">Pay Dues Now &rarr;</a>
          <a href="catalog.html" class="btn btn-secondary btn-sm">Catalog</a>
        `;
      }
    } else {
      if (standingBadge) {
        standingBadge.className = "tab-badge paid";
        standingBadge.textContent = "All Dues Clear";
      }
      if (standingSub) standingSub.textContent = "Good standing with library";
      if (standingMsg) {
        standingMsg.textContent = "Your account is in excellent standing with zero outstanding dues. You are free to borrow books anytime from our open catalog.";
      }
      if (standingActions) {
        standingActions.innerHTML = `
          <a href="catalog.html" class="btn btn-primary btn-sm" style="flex:1; justify-content:center;">Explore Catalog &rarr;</a>
          <a href="fines.html" class="btn btn-secondary btn-sm">Statement</a>
        `;
      }
    }

    // 4 Modern Executive KPI Cards
    grid.innerHTML = `
      <div class="stat-card">
        <div class="tab" style="background: linear-gradient(90deg, #6366f1, #4f46e5);"></div>
        <div class="flex-between">
          <div class="label" style="margin:0;">Total Fines</div>
          <div class="stat-icon-wrap" style="background:#eef2ff; color:#4f46e5;">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
          </div>
        </div>
        <div class="value" data-count="${summary.totalFinesCount}">0</div>
        <div class="delta" style="display:flex; justify-content:space-between; align-items:center;">
          <span>Lifetime Assessed</span>
          <span class="mono" style="font-weight:700; color:var(--ink);">${portalFormatCurrency(summary.totalFineAmount)}</span>
        </div>
        <div class="stat-progress">
          <div class="stat-progress-bar" style="width:100%; background:linear-gradient(90deg, #6366f1, #4f46e5);"></div>
        </div>
      </div>

      <div class="stat-card">
        <div class="tab" style="background: linear-gradient(90deg, #2563eb, #1d4ed8);"></div>
        <div class="flex-between">
          <div class="label" style="margin:0;">Books Issued</div>
          <div class="stat-icon-wrap" style="background:#eff6ff; color:#2563eb;">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
          </div>
        </div>
        <div class="value" data-count="${summary.booksIssuedCount}">0</div>
        <div class="delta" style="display:flex; justify-content:space-between; align-items:center;">
          <span>Active On Loan</span>
          <span class="mono" style="font-weight:700; color:#2563eb;">${summary.booksIssuedCount} / 3 Allowed</span>
        </div>
        <div class="stat-progress">
          <div class="stat-progress-bar" style="width:${Math.min(100, Math.round((summary.booksIssuedCount / 3) * 100))}%; background:linear-gradient(90deg, #2563eb, #1d4ed8);"></div>
        </div>
      </div>

      <div class="stat-card">
        <div class="tab" style="background: linear-gradient(90deg, #ef4444, #dc2626);"></div>
        <div class="flex-between">
          <div class="label" style="margin:0;">Pending Dues</div>
          <div class="stat-icon-wrap" style="background:${summary.pendingFineAmount > 0 ? "#fef2f2" : "#f8fafc"}; color:${summary.pendingFineAmount > 0 ? "#dc2626" : "#10b981"};">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          </div>
        </div>
        <div class="value" data-count="${summary.pendingFinesCount}" style="color:${summary.pendingFineAmount > 0 ? "#dc2626" : "var(--ink)"};">0</div>
        <div class="delta" style="display:flex; justify-content:space-between; align-items:center;">
          <span>Outstanding Balance</span>
          <span class="mono" style="font-weight:700; color:${summary.pendingFineAmount > 0 ? "#dc2626" : "#059669"};">${portalFormatCurrency(summary.pendingFineAmount)}</span>
        </div>
        <div class="stat-progress">
          <div class="stat-progress-bar" style="width:${summary.pendingFineAmount > 0 ? 100 : 0}%; background:linear-gradient(90deg, #ef4444, #dc2626);"></div>
        </div>
      </div>

      <div class="stat-card">
        <div class="tab" style="background: linear-gradient(90deg, #10b981, #059669);"></div>
        <div class="flex-between">
          <div class="label" style="margin:0;">Paid Fines</div>
          <div class="stat-icon-wrap" style="background:#ecfdf5; color:#059669;">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
          </div>
        </div>
        <div class="value" data-count="${summary.paidFinesCount}">0</div>
        <div class="delta" style="display:flex; justify-content:space-between; align-items:center;">
          <span>Successfully Settled</span>
          <span class="mono" style="font-weight:700; color:#059669;">${portalFormatCurrency(summary.paidFineAmount)}</span>
        </div>
        <div class="stat-progress">
          <div class="stat-progress-bar" style="width:100%; background:linear-gradient(90deg, #10b981, #059669);"></div>
        </div>
      </div>
    `;

    animateStatCounters(grid);

    if (summary.recentFines.length === 0) {
      body.innerHTML = `
        <tr class="empty-row">
          <td colspan="7" style="padding:40px 20px; text-align:center;">
            <div style="font-size:28px; margin-bottom:8px;">📚</div>
            <div style="font-weight:700; color:var(--ink); font-size:15px;">No fine records on your account</div>
            <div style="color:var(--slate); font-size:13px; margin-top:2px;">Books returned within the 14-day loan window accrue zero fines.</div>
            <a href="catalog.html" class="btn btn-primary btn-sm" style="margin-top:14px; display:inline-flex;">Browse Library Catalog &rarr;</a>
          </td>
        </tr>`;
    } else {
      body.innerHTML = summary.recentFines.map(f => `
        <tr>
          <td data-label="Book">
            <div style="display:flex; align-items:center; gap:12px;">
              <div style="width:36px; height:46px; border-radius:6px; background:#f1f5f9; border:1px solid var(--border); display:flex; align-items:center; justify-content:center; font-size:16px; flex-shrink:0;">
                📖
              </div>
              <div>
                <div class="cell-title" style="font-weight:700; color:var(--ink);">${portalEscapeHtml(f.bookTitle || "Untitled Book")}</div>
                <div class="cell-sub" style="color:var(--slate); font-size:12px;">${portalEscapeHtml(f.bookAuthor || "Unknown Author")}</div>
              </div>
            </div>
          </td>
          <td data-label="Issued" class="mono">${portalFormatDate(f.issueDate)}</td>
          <td data-label="Due" class="mono">${portalFormatDate(f.dueDate)}</td>
          <td data-label="Returned" class="mono">${f.returnDate ? portalFormatDate(f.returnDate) : '<span style="color:#d97706; font-weight:600;">Not returned</span>'}</td>
          <td data-label="Overdue Days" class="mono">${f.overdueDays > 0 ? `<span class="tab-badge overdue">${f.overdueDays} days</span>` : "0"}</td>
          <td data-label="Fine" class="mono" style="font-weight:700;">${portalFormatCurrency(f.fineAmount)}</td>
          <td data-label="Status">${paymentBadge(f.paymentStatus, f.fineAmount)}</td>
        </tr>
      `).join("");
    }
  } catch (err) {
    grid.innerHTML = `<div class="empty-row" style="grid-column:1/-1;">Could not load your dashboard — ${portalEscapeHtml(err.message)}</div>`;
    body.innerHTML = `<tr class="empty-row"><td colspan="7">—</td></tr>`;
  }
}

loadDashboard();
