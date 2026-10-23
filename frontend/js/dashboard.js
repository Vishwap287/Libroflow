requireAuth();

// Live Date Formatter for Dashboard
const todayFormatted = new Date().toLocaleDateString("en-IN", {
  weekday: "long",
  day: "2-digit",
  month: "long",
  year: "numeric"
});
const todayEl = document.getElementById("todayLabel");
if (todayEl) {
  todayEl.textContent = todayFormatted;
}

// User Personalization Greeting
const currentUser = getUser();
const greetingEl = document.getElementById("welcomeGreeting");
if (greetingEl && currentUser) {
  greetingEl.textContent = `Welcome back, ${currentUser.fullName || currentUser.username} 👋`;
}

function statusBadge(status) {
  const map = {
    ISSUED: "issued",
    OVERDUE: "overdue",
    RETURNED: "returned",
  };
  const cls = map[status] || "returned";
  const label = status.charAt(0) + status.slice(1).toLowerCase();
  return `<span class="tab-badge ${cls}">${label}</span>`;
}

// Chart.js Typography & Palette Config
if (typeof Chart !== "undefined") {
  Chart.defaults.font.family = "'Plus Jakarta Sans', 'Inter', system-ui, sans-serif";
  Chart.defaults.font.size = 12;
  Chart.defaults.color = "#64748b";
}

// Render Doughnut Chart for Fines & Revenue Health
function renderFinesChart(stats) {
  const ctx = document.getElementById("finesChart");
  if (!ctx) return;

  if (typeof Chart === "undefined") {
    ctx.parentElement.innerHTML = `<div class="empty-row">Chart library failed to load.</div>`;
    return;
  }

  const collected = Number(stats.totalFinesCollected) || 0;
  const pending = Number(stats.totalFinesPending) || 0;
  const total = collected + pending;

  // Update center summary numbers
  const revEl = document.getElementById("totalRevenueText");
  const colEl = document.getElementById("collectedText");
  const penEl = document.getElementById("pendingText");

  if (revEl) revEl.textContent = formatCurrency(total);
  if (colEl) colEl.textContent = formatCurrency(collected);
  if (penEl) penEl.textContent = formatCurrency(pending);

  // Destroy previous chart if present
  if (window._finesDoughnutChart) {
    window._finesDoughnutChart.destroy();
  }

  // Draw modern doughnut
  window._finesDoughnutChart = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: ["Collected", "Pending Dues"],
      datasets: [{
        data: total > 0 ? [collected, pending] : [1, 0],
        backgroundColor: total > 0 ? ["#10b981", "#ef4444"] : ["#e2e8f0", "#cbd5e1"],
        borderColor: "#ffffff",
        borderWidth: 3,
        hoverOffset: 6,
      }],
    },
    options: {
      cutout: "75%",
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: "#0f172a",
          padding: 10,
          cornerRadius: 8,
          callbacks: {
            label: (item) => ` ₹${Number(item.raw).toFixed(2)}`,
          },
        },
      },
    },
  });
}

// Render Category Horizontal Bar Chart
async function loadCategoryChart() {
  const ctx = document.getElementById("categoryChart");
  if (!ctx) return;

  try {
    const books = await apiFetch("/books");
    const counts = {};
    books.forEach(b => {
      const cat = b.category || "Uncategorized";
      counts[cat] = (counts[cat] || 0) + 1;
    });

    const labels = Object.keys(counts).sort((a, b) => counts[b] - counts[a]);
    const data = labels.map(l => counts[l]);

    if (typeof Chart === "undefined") {
      ctx.parentElement.innerHTML = `<div class="empty-row">Chart library failed to load.</div>`;
      return;
    }

    const wrapper = document.getElementById("categoryChartWrapper");
    if (wrapper) {
      wrapper.style.height = Math.max(260, labels.length * 36) + "px";
    }

    // Modern Royal Blue to Indigo Gradient Rank
    const colors = labels.map((_, i) => {
      const t = labels.length <= 1 ? 0 : i / (labels.length - 1);
      // from royal blue #2563eb to indigo/violet #7c3aed
      const r = Math.round(37 + (124 - 37) * t);
      const g = Math.round(99 + (58 - 99) * t);
      const b = Math.round(235 + (237 - 235) * t);
      return `rgb(${r},${g},${b})`;
    });

    const dataLabelsPlugin = {
      id: "barDataLabels",
      afterDatasetsDraw(chart) {
        const { ctx: c } = chart;
        chart.getDatasetMeta(0).data.forEach((bar, i) => {
          const value = chart.data.datasets[0].data[i];
          c.save();
          c.fillStyle = "#0f172a";
          c.font = "600 11.5px 'Plus Jakarta Sans', sans-serif";
          c.textAlign = "left";
          c.textBaseline = "middle";
          c.fillText(`${value} title${value === 1 ? '' : 's'}`, bar.x + 8, bar.y);
          c.restore();
        });
      },
    };

    if (window._categoryChartInstance) {
      window._categoryChartInstance.destroy();
    }

    window._categoryChartInstance = new Chart(ctx, {
      type: "bar",
      data: {
        labels,
        datasets: [{
          data,
          backgroundColor: colors,
          borderRadius: 6,
          maxBarThickness: 22,
        }],
      },
      plugins: [dataLabelsPlugin],
      options: {
        indexAxis: "y",
        responsive: true,
        maintainAspectRatio: false,
        layout: { padding: { right: 55 } },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: "#0f172a",
            padding: 10,
            cornerRadius: 8,
            displayColors: false,
            callbacks: {
              label: (item) => `${item.raw} title${item.raw === 1 ? "" : "s"} in library`,
            },
          },
        },
        scales: {
          x: {
            beginAtZero: true,
            ticks: { precision: 0 },
            grid: { color: "#f1f5f9" },
          },
          y: {
            grid: { display: false },
            ticks: { autoSkip: false, font: { size: 12, weight: "600" } },
          },
        },
      },
    });
  } catch (err) {
    ctx.parentElement.innerHTML = `<div class="empty-row">Could not load category data — ${escapeHtml(err.message)}</div>`;
  }
}

// Load High-Impact KPI Cards
async function loadStats() {
  const grid = document.getElementById("statGrid");
  try {
    const stats = await apiFetch("/dashboard/stats");

    const totalBooks = stats.totalBooks || 0;
    const totalCopies = stats.totalCopies || 0;
    const availableCopies = stats.availableCopies || 0;
    const availPercent = totalCopies > 0 ? Math.round((availableCopies / totalCopies) * 100) : 100;
    const loanPercent = totalCopies > 0 ? Math.round((stats.booksIssued / totalCopies) * 100) : 0;

    grid.innerHTML = `
      <div class="stat-card">
        <div class="tab" style="background: linear-gradient(90deg, #3b82f6, #1d4ed8);"></div>
        <div class="flex-between">
          <div class="label" style="margin:0;">Total Titles</div>
          <div class="stat-icon-wrap" style="background:#eff6ff; color:#2563eb;">📚</div>
        </div>
        <div class="value" data-count="${totalBooks}">0</div>
        <div class="delta" style="display:flex; justify-content:space-between; align-items:center;">
          <span>Physical Inventory</span>
          <span class="mono" style="font-weight:700; color:var(--ink);">${totalCopies} copies</span>
        </div>
        <div class="stat-progress">
          <div class="stat-progress-bar" style="width:100%; background:linear-gradient(90deg, #3b82f6, #1d4ed8);"></div>
        </div>
      </div>

      <div class="stat-card">
        <div class="tab" style="background: linear-gradient(90deg, #10b981, #059669);"></div>
        <div class="flex-between">
          <div class="label" style="margin:0;">Available On Shelf</div>
          <div class="stat-icon-wrap" style="background:#ecfdf5; color:#059669;">📗</div>
        </div>
        <div class="value" data-count="${availableCopies}">0</div>
        <div class="delta" style="display:flex; justify-content:space-between; align-items:center;">
          <span>Stock Availability</span>
          <span class="mono" style="font-weight:700; color:#059669;">${availPercent}% In Stock</span>
        </div>
        <div class="stat-progress">
          <div class="stat-progress-bar" style="width:${availPercent}%; background:linear-gradient(90deg, #10b981, #059669);"></div>
        </div>
      </div>

      <div class="stat-card">
        <div class="tab" style="background: linear-gradient(90deg, #f59e0b, #d97706);"></div>
        <div class="flex-between">
          <div class="label" style="margin:0;">Active Loans</div>
          <div class="stat-icon-wrap" style="background:#fffbeb; color:#d97706;">📖</div>
        </div>
        <div class="value" data-count="${stats.booksIssued}">0</div>
        <div class="delta" style="display:flex; justify-content:space-between; align-items:center;">
          <span>Active Borrowers</span>
          <span class="mono" style="font-weight:700; color:var(--amber-dark);">${stats.totalMembers} Members</span>
        </div>
        <div class="stat-progress">
          <div class="stat-progress-bar" style="width:${Math.max(12, loanPercent)}%; background:linear-gradient(90deg, #f59e0b, #d97706);"></div>
        </div>
      </div>

      <div class="stat-card">
        <div class="tab" style="background: linear-gradient(90deg, #ef4444, #dc2626);"></div>
        <div class="flex-between">
          <div class="label" style="margin:0;">Overdue & Fines</div>
          <div class="stat-icon-wrap" style="background:#fef2f2; color:#dc2626;">⚠️</div>
        </div>
        <div class="value" data-count="${stats.overdueBooks}">0</div>
        <div class="delta" style="display:flex; justify-content:space-between; align-items:center;">
          <span>Pending Fees</span>
          <span class="mono" style="font-weight:700; color:#dc2626;">${formatCurrency(stats.totalFinesPending)}</span>
        </div>
        <div class="stat-progress">
          <div class="stat-progress-bar" style="width:${stats.overdueBooks > 0 ? 100 : 0}%; background:linear-gradient(90deg, #ef4444, #dc2626);"></div>
        </div>
      </div>
    `;

    animateStatCounters(grid);
    renderFinesChart(stats);
  } catch (err) {
    grid.innerHTML = `<div class="empty-row" style="grid-column:1/-1;">Could not load stats — ${escapeHtml(err.message)}</div>`;
  }
}

// Animated Stat Counter Logic
function animateStatCounters(container) {
  const els = container.querySelectorAll(".value[data-count]");
  els.forEach(el => {
    const target = Number(el.dataset.count) || 0;
    const duration = 650;
    const start = performance.now();
    function tick(now) {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.round(eased * target);
      if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  });
}

// Active Loans Table with Smart Due-Date Tags
async function loadRecentIssued() {
  const body = document.getElementById("recentIssuedBody");
  try {
    const [transactions, finesPage] = await Promise.all([
      apiFetch("/transactions"),
      apiFetch("/portal/fines/all?status=ALL&page=0&size=100"),
    ]);

    const fromTransactions = transactions
      .filter(t => t.status === "ISSUED" || t.status === "OVERDUE")
      .map(t => ({
        title: t.book.title,
        author: t.book.author,
        who: t.member.name,
        dueDate: t.dueDate,
        status: t.status,
      }));

    const fromFines = (finesPage.content || [])
      .filter(f => f.returnDate === null && f.bookTitle)
      .map(f => ({
        title: f.bookTitle,
        author: f.bookAuthor,
        who: f.userName,
        dueDate: f.dueDate,
        status: new Date(f.dueDate) < new Date() ? "OVERDUE" : "ISSUED",
      }));

    const active = [...fromTransactions, ...fromFines]
      .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
      .slice(0, 7);

    if (active.length === 0) {
      body.innerHTML = `<tr class="empty-row"><td colspan="4">No books currently issued. All inventory available on shelf!</td></tr>`;
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    body.innerHTML = active.map(item => {
      const due = new Date(item.dueDate);
      due.setHours(0, 0, 0, 0);
      const diffDays = Math.round((due - today) / (1000 * 60 * 60 * 24));

      let dueBadge = '';
      if (diffDays < 0) {
        dueBadge = `<span class="tab-badge overdue" style="font-size:11px;">● Overdue (${Math.abs(diffDays)}d)</span>`;
      } else if (diffDays <= 3) {
        dueBadge = `<span class="tab-badge issued" style="font-size:11px;">● Due in ${diffDays}d</span>`;
      } else {
        dueBadge = `<span class="tab-badge returned" style="font-size:11px;">● ${formatDate(item.dueDate)}</span>`;
      }

      return `
        <tr>
          <td data-label="Book">
            <div class="cell-title">${escapeHtml(item.title)}</div>
            <div class="cell-sub">${escapeHtml(item.author || "Unknown")}</div>
          </td>
          <td data-label="Member">
            <div style="font-weight:600; color:var(--ink);">${escapeHtml(item.who)}</div>
            <div class="cell-sub">Library Member</div>
          </td>
          <td data-label="Due Date" class="mono">${dueBadge}</td>
          <td data-label="Status">${statusBadge(item.status)}</td>
        </tr>
      `;
    }).join("");
  } catch (err) {
    body.innerHTML = `<tr class="empty-row"><td colspan="4">Could not load activity — ${escapeHtml(err.message)}</td></tr>`;
  }
}

// Low Stock Alerts with Warning Pills
async function loadLowStock() {
  const body = document.getElementById("lowStockBody");
  try {
    const books = await apiFetch("/books");
    const lowStock = books
      .filter(b => b.availableCopies <= 1)
      .sort((a, b) => a.availableCopies - b.availableCopies)
      .slice(0, 5);

    if (lowStock.length === 0) {
      body.innerHTML = `<tr class="empty-row"><td colspan="2">All titles are well-stocked!</td></tr>`;
      return;
    }

    body.innerHTML = lowStock.map(b => {
      const stockBadge = b.availableCopies === 0
        ? `<span class="tab-badge overdue" style="font-size:11px;">Out of Stock</span>`
        : `<span class="tab-badge issued" style="font-size:11px;">1 copy left</span>`;

      return `
        <tr>
          <td>
            <div class="cell-title">${escapeHtml(b.title)}</div>
            <div class="cell-sub">${escapeHtml(b.author)} • ${escapeHtml(b.category || "General")}</div>
          </td>
          <td style="text-align:right;">
            ${stockBadge}
          </td>
        </tr>
      `;
    }).join("");
  } catch (err) {
    body.innerHTML = `<tr class="empty-row"><td colspan="2">Could not load — ${escapeHtml(err.message)}</td></tr>`;
  }
}

// Initialize Dashboard
loadStats();
loadRecentIssued();
loadLowStock();
loadCategoryChart();
