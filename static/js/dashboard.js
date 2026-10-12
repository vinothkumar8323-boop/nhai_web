/**
 * NHAI CCMS STREET LIGHT PERFORMANCE DASHBOARD
 * Interactive Controller: Charts, SLA Simulator, Panel Explorer, Telemetry Modals
 */

document.addEventListener('DOMContentLoaded', () => {
  // Application State
  const state = {
    summary: window.__INITIAL_SUMMARY__ || null,
    panelsPage: 1,
    panelsLimit: 20,
    panelsTotalPages: 1,
    filters: {
      section: 'all',
      health: 'all',
      search: '',
      sort_by: 'non_burning_lights',
      sort_order: 'desc'
    },
    simulatedSelectedIds: new Set(),
    charts: {}
  };

  // DOM Elements
  const tabButtons = document.querySelectorAll('.nav-tab');
  const tabContents = document.querySelectorAll('.tab-content');
  const themeToggleBtn = document.getElementById('themeToggleBtn');
  const uploadModal = document.getElementById('uploadModal');
  const detailModal = document.getElementById('detailModal');
  const openUploadModalBtn = document.getElementById('openUploadModalBtn');
  const closeUploadModalBtn = document.getElementById('closeUploadModalBtn');
  const closeDetailModalBtn = document.getElementById('closeDetailModalBtn');
  const printReportBtn = document.getElementById('printReportBtn');

  // Simulator Elements
  const simTop5Btn = document.getElementById('simTop5Btn');
  const simTop15Btn = document.getElementById('simTop15Btn');
  const simResetBtn = document.getElementById('simResetBtn');
  const simBurningVal = document.getElementById('simBurningVal');
  const simRecoveredLamps = document.getElementById('simRecoveredLamps');
  const simRecoveredKw = document.getElementById('simRecoveredKw');
  const simDeficitKw = document.getElementById('simDeficitKw');
  const simSlaBadge = document.getElementById('simSlaBadge');
  const simProgressBar = document.getElementById('simProgressBar');

  // Panel Filter Elements
  const panelSearchInput = document.getElementById('panelSearchInput');
  const sectionFilterSelect = document.getElementById('sectionFilterSelect');
  const healthFilterSelect = document.getElementById('healthFilterSelect');
  const panelsTableBody = document.getElementById('panelsTableBody');
  const prevPageBtn = document.getElementById('prevPageBtn');
  const nextPageBtn = document.getElementById('nextPageBtn');
  const pageIndicator = document.getElementById('pageIndicator');
  const panelsCountLabel = document.getElementById('panelsCountLabel');

  // Initialize
  initTheme();
  initTabs();
  initModals();
  initCharts();
  initSimulator();
  initPanelExplorer();
  initFileUpload();

  if (printReportBtn) {
    printReportBtn.addEventListener('click', () => window.print());
  }

  // ==========================================================================
  // Theme Management
  // ==========================================================================
  function initTheme() {
    const savedTheme = localStorage.getItem('nhai-theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);

    if (themeToggleBtn) {
      themeToggleBtn.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('nhai-theme', newTheme);
        updateThemeIcon(newTheme);
        updateChartThemes(newTheme);
      });
    }
  }

  function updateThemeIcon(theme) {
    if (!themeToggleBtn) return;
    themeToggleBtn.innerHTML = theme === 'dark' 
      ? '☀️ <span class="sr-only">Light</span>' 
      : '🌙 <span class="sr-only">Dark</span>';
  }

  // ==========================================================================
  // Tab Switching
  // ==========================================================================
  function initTabs() {
    tabButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const targetTab = btn.getAttribute('data-tab');
        
        tabButtons.forEach(b => b.classList.remove('active'));
        tabContents.forEach(c => c.classList.remove('active'));

        btn.classList.add('active');
        const activeContent = document.getElementById(targetTab);
        if (activeContent) {
          activeContent.classList.add('active');
        }

        // Trigger chart resize if navigating to overview
        if (targetTab === 'tab-overview') {
          Object.values(state.charts).forEach(c => c && c.resize && c.resize());
        }
      });
    });
  }

  // ==========================================================================
  // Modals
  // ==========================================================================
  function initModals() {
    if (openUploadModalBtn) {
      openUploadModalBtn.addEventListener('click', () => {
        uploadModal.classList.add('active');
      });
    }

    if (closeUploadModalBtn) {
      closeUploadModalBtn.addEventListener('click', () => {
        uploadModal.classList.remove('active');
      });
    }

    if (closeDetailModalBtn) {
      closeDetailModalBtn.addEventListener('click', () => {
        detailModal.classList.remove('active');
      });
    }

    // Close on backdrop click
    [uploadModal, detailModal].forEach(modal => {
      if (modal) {
        modal.addEventListener('click', (e) => {
          if (e.target === modal) {
            modal.classList.remove('active');
          }
        });
      }
    });
  }

  // ==========================================================================
  // Charts Initialization (Chart.js)
  // ==========================================================================
  function initCharts() {
    if (!state.summary) return;

    const isLight = document.documentElement.getAttribute('data-theme') === 'light';
    const textColor = isLight ? '#475569' : '#94a3b8';
    const gridColor = isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)';

    // 1. Overall Lamp Health Doughnut Chart
    const healthCtx = document.getElementById('networkHealthChart');
    if (healthCtx) {
      const activeLamps = state.summary.kpis.burning_lamps;
      const failedLamps = state.summary.kpis.non_burning_lamps;
      
      state.charts.healthChart = new Chart(healthCtx, {
        type: 'doughnut',
        data: {
          labels: ['Active Burning', 'Non-Burning Outage'],
          datasets: [{
            data: [activeLamps, failedLamps],
            backgroundColor: ['#10b981', '#ef4444'],
            borderColor: isLight ? '#ffffff' : '#0f2038',
            borderWidth: 3,
            hoverOffset: 6
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom',
              labels: { color: textColor, font: { family: 'Inter', size: 12 } }
            },
            tooltip: {
              callbacks: {
                label: (ctx) => {
                  const val = ctx.raw;
                  const total = activeLamps + failedLamps;
                  const pct = ((val / total) * 100).toFixed(2);
                  return ` ${ctx.label}: ${val.toLocaleString()} lamps (${pct}%)`;
                }
              }
            }
          },
          cutout: '72%'
        }
      });
    }

    // 2. Section-Wise Operational Status Bar Chart
    const sectionCtx = document.getElementById('sectionChart');
    if (sectionCtx) {
      const sections = state.summary.sections;
      state.charts.sectionChart = new Chart(sectionCtx, {
        type: 'bar',
        data: {
          labels: sections.map(s => s.section),
          datasets: [
            {
              label: 'Burning Active',
              data: sections.map(s => s.burning_lamps),
              backgroundColor: '#10b981',
              borderRadius: 4
            },
            {
              label: 'Non-Burning Deficit',
              data: sections.map(s => s.non_burning_lamps),
              backgroundColor: '#ef4444',
              borderRadius: 4
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            x: {
              grid: { color: gridColor },
              ticks: { color: textColor, font: { family: 'Inter' } }
            },
            y: {
              grid: { color: gridColor },
              ticks: { color: textColor, font: { family: 'Inter' } }
            }
          },
          plugins: {
            legend: {
              position: 'top',
              labels: { color: textColor, font: { family: 'Inter', size: 12 } }
            }
          }
        }
      });
    }

    // 3. Wattage Failure Distribution Horizontal Bar Chart
    const wattageCtx = document.getElementById('wattageChart');
    if (wattageCtx) {
      const wattages = state.summary.wattages;
      state.charts.wattageChart = new Chart(wattageCtx, {
        type: 'bar',
        indexAxis: 'y',
        data: {
          labels: wattages.map(w => w.rating_label),
          datasets: [
            {
              label: 'Deficit Outages (Count)',
              data: wattages.map(w => w.non_burning_lamps),
              backgroundColor: '#f59e0b',
              borderRadius: 4
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            x: {
              grid: { color: gridColor },
              ticks: { color: textColor, font: { family: 'Inter' } }
            },
            y: {
              grid: { color: gridColor },
              ticks: { color: textColor, font: { family: 'Inter' } }
            }
          },
          plugins: {
            legend: {
              position: 'top',
              labels: { color: textColor, font: { family: 'Inter', size: 12 } }
            },
            tooltip: {
              callbacks: {
                afterLabel: (ctx) => {
                  const item = wattages[ctx.dataIndex];
                  return `Failure Rate: ${item.failure_percentage}%\nDeficit Load: ${item.deficit_load_kw} kW`;
                }
              }
            }
          }
        }
      });
    }

    // 4. CCMS Health Tiers Donut Chart
    const tiersCtx = document.getElementById('tiersChart');
    if (tiersCtx) {
      const tiers = state.summary.health_tiers;
      state.charts.tiersChart = new Chart(tiersCtx, {
        type: 'doughnut',
        data: {
          labels: ['100% Optimal', '90-99% Minor', '70-89% Moderate', '<70% Critical'],
          datasets: [{
            data: [tiers.optimal.count, tiers.minor.count, tiers.moderate.count, tiers.critical.count],
            backgroundColor: ['#10b981', '#3b82f6', '#f59e0b', '#ef4444'],
            borderColor: isLight ? '#ffffff' : '#0f2038',
            borderWidth: 2
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom',
              labels: { color: textColor, font: { family: 'Inter', size: 12 } }
            }
          },
          cutout: '65%'
        }
      });
    }
  }

  function updateChartThemes(theme) {
    const isLight = theme === 'light';
    const textColor = isLight ? '#475569' : '#94a3b8';
    const gridColor = isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)';

    Object.values(state.charts).forEach(chart => {
      if (!chart) return;
      if (chart.options.scales) {
        if (chart.options.scales.x) {
          chart.options.scales.x.grid.color = gridColor;
          chart.options.scales.x.ticks.color = textColor;
        }
        if (chart.options.scales.y) {
          chart.options.scales.y.grid.color = gridColor;
          chart.options.scales.y.ticks.color = textColor;
        }
      }
      if (chart.options.plugins && chart.options.plugins.legend) {
        chart.options.plugins.legend.labels.color = textColor;
      }
      chart.update();
    });
  }

  // ==========================================================================
  // SLA Rectification Simulator ("What-If" Engine)
  // ==========================================================================
  function initSimulator() {
    const priorityList = state.summary?.priority_action_list || [];
    const priorityCheckboxes = document.querySelectorAll('.priority-sim-checkbox');

    priorityCheckboxes.forEach(cb => {
      cb.addEventListener('change', (e) => {
        const id = cb.getAttribute('data-id');
        if (cb.checked) {
          state.simulatedSelectedIds.add(id);
        } else {
          state.simulatedSelectedIds.delete(id);
        }
        runSimulation();
      });
    });

    if (simTop5Btn) {
      simTop5Btn.addEventListener('click', () => {
        state.simulatedSelectedIds.clear();
        priorityList.slice(0, 5).forEach(p => state.simulatedSelectedIds.add(p.ccms_id));
        syncCheckboxes();
        runSimulation();
      });
    }

    if (simTop15Btn) {
      simTop15Btn.addEventListener('click', () => {
        state.simulatedSelectedIds.clear();
        priorityList.slice(0, 15).forEach(p => state.simulatedSelectedIds.add(p.ccms_id));
        syncCheckboxes();
        runSimulation();
      });
    }

    if (simResetBtn) {
      simResetBtn.addEventListener('click', () => {
        state.simulatedSelectedIds.clear();
        syncCheckboxes();
        runSimulation();
      });
    }
  }

  function syncCheckboxes() {
    document.querySelectorAll('.priority-sim-checkbox').forEach(cb => {
      const id = cb.getAttribute('data-id');
      cb.checked = state.simulatedSelectedIds.has(id);
    });
  }

  async function runSimulation() {
    const ids = Array.from(state.simulatedSelectedIds);
    try {
      const response = await fetch('/api/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ panel_ids: ids })
      });
      const data = await response.json();
      updateSimulationUI(data);
    } catch (err) {
      console.error('Simulation error:', err);
    }
  }

  function updateSimulationUI(data) {
    if (simBurningVal) simBurningVal.textContent = `${data.simulated_burning_percentage}%`;
    if (simRecoveredLamps) simRecoveredLamps.textContent = `+${data.recovered_lamps}`;
    if (simRecoveredKw) simRecoveredKw.textContent = `+${data.recovered_kw} kW`;
    if (simDeficitKw) simDeficitKw.textContent = `${data.simulated_deficit_kw} kW`;

    if (simProgressBar) {
      simProgressBar.style.width = `${Math.min(100, data.simulated_burning_percentage)}%`;
      if (data.sla_achieved) {
        simProgressBar.className = 'progress-bar-fill progress-success';
      } else {
        simProgressBar.className = 'progress-bar-fill progress-warning';
      }
    }

    if (simSlaBadge) {
      if (data.sla_achieved) {
        simSlaBadge.className = 'kpi-badge badge-success';
        simSlaBadge.textContent = `✓ SLA COMPLIANT (>95.0%) [Gain: +${data.gain_percentage}%]`;
      } else {
        simSlaBadge.className = 'kpi-badge badge-warning';
        simSlaBadge.textContent = `⚠ SLA DEFICIT (Target: 95.0%) [Gain: +${data.gain_percentage}%]`;
      }
    }
  }

  // ==========================================================================
  // CCMS Panel Inventory Explorer (Search, Filter, Pagination, Details)
  // ==========================================================================
  function initPanelExplorer() {
    fetchPanels();

    let debounceTimer;
    if (panelSearchInput) {
      panelSearchInput.addEventListener('input', (e) => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          state.filters.search = e.target.value;
          state.panelsPage = 1;
          fetchPanels();
        }, 300);
      });
    }

    if (sectionFilterSelect) {
      sectionFilterSelect.addEventListener('change', (e) => {
        state.filters.section = e.target.value;
        state.panelsPage = 1;
        fetchPanels();
      });
    }

    if (healthFilterSelect) {
      healthFilterSelect.addEventListener('change', (e) => {
        state.filters.health = e.target.value;
        state.panelsPage = 1;
        fetchPanels();
      });
    }

    if (prevPageBtn) {
      prevPageBtn.addEventListener('click', () => {
        if (state.panelsPage > 1) {
          state.panelsPage--;
          fetchPanels();
        }
      });
    }

    if (nextPageBtn) {
      nextPageBtn.addEventListener('click', () => {
        if (state.panelsPage < state.panelsTotalPages) {
          state.panelsPage++;
          fetchPanels();
        }
      });
    }

    // Sort by table headers
    document.querySelectorAll('[data-sort]').forEach(th => {
      th.addEventListener('click', () => {
        const field = th.getAttribute('data-sort');
        if (state.filters.sort_by === field) {
          state.filters.sort_order = state.filters.sort_order === 'asc' ? 'desc' : 'asc';
        } else {
          state.filters.sort_by = field;
          state.filters.sort_order = 'desc';
        }
        fetchPanels();
      });
    });
  }

  async function fetchPanels() {
    const params = new URLSearchParams({
      page: state.panelsPage,
      limit: state.panelsLimit,
      section: state.filters.section,
      health: state.filters.health,
      search: state.filters.search,
      sort_by: state.filters.sort_by,
      sort_order: state.filters.sort_order
    });

    try {
      const res = await fetch(`/api/panels?${params.toString()}`);
      const data = await res.json();
      state.panelsTotalPages = data.total_pages;

      renderPanelsTable(data.panels, data.total);
      updatePaginationControls(data);
    } catch (err) {
      console.error('Failed to fetch panels:', err);
    }
  }

  function renderPanelsTable(panels, total) {
    if (!panelsTableBody) return;
    if (panelsCountLabel) panelsCountLabel.textContent = `${total} Panels Matching Filters`;

    if (panels.length === 0) {
      panelsTableBody.innerHTML = `
        <tr>
          <td colspan="10" style="text-align: center; padding: 2.5rem; color: var(--text-muted);">
            No CCMS panels found matching the current search criteria.
          </td>
        </tr>`;
      return;
    }

    panelsTableBody.innerHTML = panels.map((p, idx) => {
      const badgeClass = p.health_tier === 'optimal' ? 'badge-success' 
        : p.health_tier === 'minor' ? 'badge-blue' 
        : p.health_tier === 'moderate' ? 'badge-warning' 
        : 'badge-danger';

      return `
        <tr>
          <td><strong style="color: var(--nhai-gold); font-family: var(--font-display);">${p.ccms_id}</strong></td>
          <td>${p.section}</td>
          <td>${p.ward}</td>
          <td><strong>${p.connected_lights}</strong></td>
          <td style="color: var(--status-green); font-weight: 600;">${p.burning_lights}</td>
          <td style="color: ${p.non_burning_lights > 0 ? 'var(--status-red)' : 'var(--text-muted)'}; font-weight: 700;">
            ${p.non_burning_lights}
          </td>
          <td>
            <div style="display: flex; align-items: center; gap: 0.5rem;">
              <span>${p.burning_percentage}%</span>
              <div style="width: 50px; height: 5px; background: var(--bg-surface); border-radius: 99px; overflow: hidden;">
                <div style="width: ${p.burning_percentage}%; height: 100%; background: ${p.burning_percentage >= 90 ? '#10b981' : p.burning_percentage >= 70 ? '#f59e0b' : '#ef4444'};"></div>
              </div>
            </div>
          </td>
          <td>${p.connected_load_kw} kW</td>
          <td style="color: ${p.non_burning_load_w > 0 ? 'var(--status-red)' : 'var(--text-muted)'};">
            ${(p.non_burning_load_w / 1000).toFixed(2)} kW
          </td>
          <td><span class="kpi-badge ${badgeClass}">${p.health_label}</span></td>
          <td>
            <button class="btn btn-secondary btn-inspect" data-id="${p.ccms_id}" style="padding: 0.3rem 0.65rem; font-size: 0.75rem;">
              🔍 Telemetry
            </button>
          </td>
        </tr>
      `;
    }).join('');

    // Attach inspect buttons
    document.querySelectorAll('.btn-inspect').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        showPanelTelemetryModal(id);
      });
    });
  }

  function updatePaginationControls(data) {
    if (pageIndicator) {
      pageIndicator.textContent = `Page ${data.page} of ${Math.max(1, data.total_pages)}`;
    }
    if (prevPageBtn) prevPageBtn.disabled = data.page <= 1;
    if (nextPageBtn) nextPageBtn.disabled = data.page >= data.total_pages;
  }

  // ==========================================================================
  // Single Panel Detail Telemetry Modal
  // ==========================================================================
  async function showPanelTelemetryModal(ccmsId) {
    try {
      const res = await fetch(`/api/panel/${ccmsId}`);
      if (!res.ok) throw new Error('Panel not found');
      const p = await res.json();

      const modalTitle = document.getElementById('detailModalTitle');
      const modalBody = document.getElementById('detailModalBody');

      if (modalTitle) modalTitle.textContent = `CCMS Panel Telemetry: ${p.ccms_id}`;
      
      if (modalBody) {
        const wattagesHtml = Object.entries(p.wattages).map(([rating, w]) => {
          if (w.total === 0) return '';
          return `
            <tr>
              <td><strong>${rating}</strong></td>
              <td>${w.total}</td>
              <td style="color: var(--status-green);">${w.burning}</td>
              <td style="color: ${w.non_burning > 0 ? 'var(--status-red)' : 'var(--text-muted)'}; font-weight: 700;">${w.non_burning}</td>
            </tr>
          `;
        }).filter(Boolean).join('');

        modalBody.innerHTML = `
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1.25rem;">
            <div style="background: var(--bg-surface); padding: 1rem; border-radius: var(--radius-sm); border: 1px solid var(--border-subtle);">
              <span style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase;">Location & Zone</span>
              <p style="font-size: 1rem; font-weight: 700; margin-top: 0.25rem;">${p.section} • Ward ${p.ward}</p>
              <p style="font-size: 0.8rem; color: var(--text-secondary);">${p.region}</p>
            </div>
            <div style="background: var(--bg-surface); padding: 1rem; border-radius: var(--radius-sm); border: 1px solid var(--border-subtle);">
              <span style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase;">Operational Health</span>
              <p style="font-size: 1.1rem; font-weight: 800; color: ${p.burning_percentage >= 90 ? 'var(--status-green)' : 'var(--status-red)'}; margin-top: 0.25rem;">
                ${p.burning_percentage}% Burning
              </p>
              <p style="font-size: 0.8rem; color: var(--text-secondary);">${p.health_label}</p>
            </div>
          </div>

          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.75rem; margin-bottom: 1.25rem; text-align: center;">
            <div style="background: var(--bg-surface); padding: 0.75rem; border-radius: var(--radius-sm);">
              <span style="font-size: 0.7rem; color: var(--text-muted); text-transform: uppercase;">Connected Load</span>
              <p style="font-size: 1.1rem; font-weight: 700;">${p.connected_load_kw} kW</p>
            </div>
            <div style="background: var(--bg-surface); padding: 0.75rem; border-radius: var(--radius-sm);">
              <span style="font-size: 0.7rem; color: var(--text-muted); text-transform: uppercase;">Recorded Active</span>
              <p style="font-size: 1.1rem; font-weight: 700; color: var(--status-green);">${p.recorded_load_kw} kW</p>
            </div>
            <div style="background: var(--bg-surface); padding: 0.75rem; border-radius: var(--radius-sm);">
              <span style="font-size: 0.7rem; color: var(--text-muted); text-transform: uppercase;">Deficit Load</span>
              <p style="font-size: 1.1rem; font-weight: 700; color: var(--status-red);">${(p.non_burning_load_w / 1000).toFixed(2)} kW</p>
            </div>
          </div>

          <h4 style="font-size: 0.9rem; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 0.5rem; color: var(--text-secondary);">
            Equipped Lamp Wattage Distribution
          </h4>
          <table class="dashboard-table" style="width: 100%;">
            <thead>
              <tr>
                <th>Rating</th>
                <th>Total Installed</th>
                <th>Burning</th>
                <th>Non-Burning</th>
              </tr>
            </thead>
            <tbody>
              ${wattagesHtml || '<tr><td colspan="4" style="text-align: center;">No specific rating distribution recorded.</td></tr>'}
            </tbody>
          </table>
        `;
      }

      detailModal.classList.add('active');
    } catch (err) {
      alert(`Could not load details for panel: ${err.message}`);
    }
  }

  // ==========================================================================
  // File Upload (Excel Drag & Drop)
  // ==========================================================================
  function initFileUpload() {
    const dropzone = document.getElementById('excelDropzone');
    const fileInput = document.getElementById('excelFileInput');
    const uploadStatus = document.getElementById('uploadStatus');

    if (!dropzone || !fileInput) return;

    dropzone.addEventListener('click', () => fileInput.click());

    dropzone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropzone.classList.add('dragover');
    });

    dropzone.addEventListener('dragleave', () => dropzone.classList.remove('dragover'));

    dropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropzone.classList.remove('dragover');
      if (e.dataTransfer.files.length > 0) {
        handleUploadFile(e.dataTransfer.files[0]);
      }
    });

    fileInput.addEventListener('change', (e) => {
      if (e.target.files.length > 0) {
        handleUploadFile(e.target.files[0]);
      }
    });

    async function handleUploadFile(file) {
      if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
        uploadStatus.innerHTML = '<span style="color: var(--status-red);">Please select a valid Excel (.xlsx) file.</span>';
        return;
      }

      uploadStatus.innerHTML = '<span style="color: var(--status-blue);">Uploading and parsing telemetry data...</span>';
      const formData = new FormData();
      formData.append('file', file);

      try {
        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        });
        const data = await res.json();
        if (res.ok) {
          uploadStatus.innerHTML = `<span style="color: var(--status-green);">✓ ${data.message} Reloading dashboard...</span>`;
          setTimeout(() => window.location.reload(), 1200);
        } else {
          uploadStatus.innerHTML = `<span style="color: var(--status-red);">Error: ${data.detail || 'Upload failed'}</span>`;
        }
      } catch (err) {
        uploadStatus.innerHTML = `<span style="color: var(--status-red);">Upload failed: ${err.message}</span>`;
      }
    }
  }
});
