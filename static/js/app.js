/**
 * Municipal Complaint Management System
 * Frontend Application Controller (Vanilla JavaScript)
 */

// Global State
let currentView = 'dashboard';
let allCategories = [];
let allDepartments = [];
let allLocations = [];

// Initialize on DOM Ready
document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    initFilterListeners();
    initFormSubmissions();
    
    // Initial Data Load
    loadMasterData().then(() => {
        loadDashboardData();
    });
});

// ==============================================================================
// NAVIGATION & VIEW SWITCHING
// ==============================================================================
function initNavigation() {
    const navButtons = document.querySelectorAll('.sidebar-nav .nav-item');
    navButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const view = btn.getAttribute('data-view');
            switchView(view);
        });
    });

    // Quick Lodge Complaint Header Button
    const lodgeBtn = document.getElementById('btn-open-lodge-modal');
    if (lodgeBtn) {
        lodgeBtn.addEventListener('click', openLodgeModal);
    }
}

function switchView(viewName) {
    currentView = viewName;

    // Update active nav button
    document.querySelectorAll('.sidebar-nav .nav-item').forEach(btn => {
        if (btn.getAttribute('data-view') === viewName) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

    // Update header current view title
    const headerTitle = document.getElementById('current-view-title');
    if (headerTitle) {
        headerTitle.textContent = viewName.charAt(0).toUpperCase() + viewName.slice(1);
    }

    // Toggle view panels
    document.querySelectorAll('.view-panel').forEach(panel => {
        panel.classList.remove('active');
    });

    const targetPanel = document.getElementById(`view-${viewName}`);
    if (targetPanel) {
        targetPanel.classList.add('active');
    }

    // Trigger view-specific data refresh
    if (viewName === 'dashboard') {
        loadDashboardData();
    } else if (viewName === 'complaints') {
        loadComplaints();
    } else if (viewName === 'categories') {
        loadCategories();
    } else if (viewName === 'departments') {
        loadDepartments();
    } else if (viewName === 'locations') {
        loadLocations();
    } else if (viewName === 'history') {
        loadAuditHistory();
    }
}

// ==============================================================================
// MASTER DATA (CATEGORIES, DEPARTMENTS, LOCATIONS)
// ==============================================================================
async function loadMasterData() {
    try {
        const [catsRes, deptsRes, locsRes] = await Promise.all([
            fetch('/api/categories'),
            fetch('/api/departments'),
            fetch('/api/locations')
        ]);

        allCategories = await catsRes.json();
        allDepartments = await deptsRes.json();
        allLocations = await locsRes.json();

        populateMasterDropdowns();
    } catch (err) {
        console.error('Failed to load master data:', err);
        showToast('Error loading system master data', 'error');
    }
}

function populateMasterDropdowns() {
    // 1. Complaint Filter Dropdowns
    const filterCat = document.getElementById('filter-category');
    if (filterCat) {
        filterCat.innerHTML = '<option value="">All Categories</option>' +
            allCategories.map(c => `<option value="${c.category_id}">${escapeHtml(c.category_name)}</option>`).join('');
    }

    const filterDept = document.getElementById('filter-department');
    if (filterDept) {
        filterDept.innerHTML = '<option value="">All Departments</option>' +
            allDepartments.map(d => `<option value="${d.department_id}">${escapeHtml(d.department_name)}</option>`).join('');
    }

    // 2. Lodge Modal Dropdowns
    const lodgeCat = document.getElementById('lodge-category');
    if (lodgeCat) {
        lodgeCat.innerHTML = '<option value="">Select Category...</option>' +
            allCategories.map(c => `<option value="${c.category_id}">${escapeHtml(c.category_name)}</option>`).join('');
    }

    const lodgeLoc = document.getElementById('lodge-location');
    if (lodgeLoc) {
        lodgeLoc.innerHTML = '<option value="">Select Location...</option>' +
            allLocations.map(l => `<option value="${l.location_id}">${escapeHtml(l.area)} - ${escapeHtml(l.address)}</option>`).join('');
    }

    const lodgeDept = document.getElementById('lodge-department');
    if (lodgeDept) {
        lodgeDept.innerHTML = '<option value="">Auto / Assign Later</option>' +
            allDepartments.map(d => `<option value="${d.department_id}">${escapeHtml(d.department_name)}</option>`).join('');
    }

    // 3. Status Update Modal Department Dropdown
    const updateDept = document.getElementById('update-department');
    if (updateDept) {
        updateDept.innerHTML = '<option value="">-- Select / Reassign Department --</option>' +
            allDepartments.map(d => `<option value="${d.department_id}">${escapeHtml(d.department_name)}</option>`).join('');
    }
}

// ==============================================================================
// 1. DASHBOARD VIEW
// ==============================================================================
async function loadDashboardData() {
    try {
        const statsRes = await fetch('/api/stats');
        const stats = await statsRes.json();

        // Update Stat Cards
        document.getElementById('stat-total').textContent = stats.total_complaints || 0;
        document.getElementById('stat-submitted').textContent = stats.status_counts['SUBMITTED'] || 0;
        document.getElementById('stat-progress').textContent = stats.status_counts['IN_PROGRESS'] || 0;
        document.getElementById('stat-resolved').textContent = stats.status_counts['RESOLVED'] || 0;

        // Update sidebar counter
        const sidebarCounter = document.getElementById('sidebar-complaint-count');
        if (sidebarCounter) {
            sidebarCounter.textContent = stats.total_complaints || 0;
        }

        // Render Category Progress Bars
        const catBarsContainer = document.getElementById('dashboard-category-bars');
        if (catBarsContainer) {
            const total = stats.total_complaints || 1;
            catBarsContainer.innerHTML = stats.category_breakdown.map(cat => {
                const count = cat.complaint_count || 0;
                const pct = Math.round((count / total) * 100);
                return `
                    <div class="metric-bar-item">
                        <div class="metric-bar-info">
                            <span>${escapeHtml(cat.category_name)}</span>
                            <span><strong>${count}</strong> (${pct}%)</span>
                        </div>
                        <div class="metric-bar-track">
                            <div class="metric-bar-fill" style="width: ${pct}%"></div>
                        </div>
                    </div>
                `;
            }).join('') || '<p class="text-muted">No category data recorded.</p>';
        }

        // Render Department Workload Bars
        const deptBarsContainer = document.getElementById('dashboard-dept-bars');
        if (deptBarsContainer) {
            const maxVal = Math.max(...stats.department_breakdown.map(d => d.complaint_count || 0), 1);
            deptBarsContainer.innerHTML = stats.department_breakdown.map(dept => {
                const count = dept.complaint_count || 0;
                const pct = Math.round((count / maxVal) * 100);
                return `
                    <div class="metric-bar-item">
                        <div class="metric-bar-info">
                            <span>${escapeHtml(dept.department_name)}</span>
                            <span><strong>${count}</strong> active tasks</span>
                        </div>
                        <div class="metric-bar-track">
                            <div class="metric-bar-fill teal" style="width: ${pct}%"></div>
                        </div>
                    </div>
                `;
            }).join('') || '<p class="text-muted">No department assignments recorded.</p>';
        }

        // Load Recent Complaints (limit to 5)
        const recentRes = await fetch('/api/complaints?limit=5');
        const recentComplaints = await recentRes.json();
        renderRecentComplaintsTable(recentComplaints);

    } catch (err) {
        console.error('Failed to load dashboard data:', err);
    }
}

function renderRecentComplaintsTable(complaints) {
    const tbody = document.querySelector('#dashboard-recent-table tbody');
    if (!tbody) return;

    if (!complaints || complaints.length === 0) {
        tbody.innerHTML = `<tr><td colspan="10" style="text-align:center; color: #94a3b8; padding: 24px;">No complaints registered yet.</td></tr>`;
        return;
    }

    tbody.innerHTML = complaints.map(c => `
        <tr>
            <td><strong>#${c.complaint_id}</strong></td>
            <td style="font-weight:600; max-width: 200px; text-overflow:ellipsis; overflow:hidden; white-space:nowrap;">
                ${escapeHtml(c.title)}
            </td>
            <td>
                <div>${escapeHtml(c.citizen_name)}</div>
                <div style="font-size:11px; color:#64748b;">${escapeHtml(c.citizen_phone)}</div>
            </td>
            <td>${escapeHtml(c.category_name)}</td>
            <td>${escapeHtml(c.area)}</td>
            <td>${escapeHtml(c.department_name || 'Unassigned')}</td>
            <td><span class="badge badge-prio-${c.priority}">${c.priority}</span></td>
            <td><span class="badge badge-status-${c.status}">${formatStatus(c.status)}</span></td>
            <td style="font-size:12px; color:#64748b;">${formatDate(c.submitted_at)}</td>
            <td>
                <button class="btn btn-outline-sm" onclick="viewComplaintDetail(${c.complaint_id})">View</button>
            </td>
        </tr>
    `).join('');
}

// ==============================================================================
// 2. COMPLAINTS VIEW
// ==============================================================================
function initFilterListeners() {
    const searchInput = document.getElementById('filter-search');
    const statusSelect = document.getElementById('filter-status');
    const prioSelect = document.getElementById('filter-priority');
    const catSelect = document.getElementById('filter-category');
    const deptSelect = document.getElementById('filter-department');
    const resetBtn = document.getElementById('btn-reset-filters');

    const debouncedLoad = debounce(() => loadComplaints(), 300);

    if (searchInput) searchInput.addEventListener('input', debouncedLoad);
    if (statusSelect) statusSelect.addEventListener('change', () => loadComplaints());
    if (prioSelect) prioSelect.addEventListener('change', () => loadComplaints());
    if (catSelect) catSelect.addEventListener('change', () => loadComplaints());
    if (deptSelect) deptSelect.addEventListener('change', () => loadComplaints());

    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            searchInput.value = '';
            statusSelect.value = '';
            prioSelect.value = '';
            catSelect.value = '';
            deptSelect.value = '';
            loadComplaints();
        });
    }
}

async function loadComplaints() {
    const search = document.getElementById('filter-search')?.value || '';
    const status = document.getElementById('filter-status')?.value || '';
    const priority = document.getElementById('filter-priority')?.value || '';
    const category_id = document.getElementById('filter-category')?.value || '';
    const department_id = document.getElementById('filter-department')?.value || '';

    const params = new URLSearchParams();
    if (search.trim()) params.append('search', search.trim());
    if (status) params.append('status', status);
    if (priority) params.append('priority', priority);
    if (category_id) params.append('category_id', category_id);
    if (department_id) params.append('department_id', department_id);

    try {
        const res = await fetch(`/api/complaints?${params.toString()}`);
        const complaints = await res.json();
        renderComplaintsFullTable(complaints);
    } catch (err) {
        console.error('Failed to load complaints:', err);
    }
}

function renderComplaintsFullTable(complaints) {
    const tbody = document.querySelector('#complaints-full-table tbody');
    const counter = document.getElementById('complaints-table-count');
    if (!tbody) return;

    if (!complaints || complaints.length === 0) {
        tbody.innerHTML = `<tr><td colspan="10" style="text-align:center; color: #94a3b8; padding: 32px;">No matching complaints found.</td></tr>`;
        if (counter) counter.textContent = 'Showing 0 complaints';
        return;
    }

    if (counter) counter.textContent = `Showing ${complaints.length} complaint${complaints.length > 1 ? 's' : ''}`;

    tbody.innerHTML = complaints.map(c => `
        <tr>
            <td><strong>#${c.complaint_id}</strong></td>
            <td>
                <div style="font-weight:600; color:#0f172a;">${escapeHtml(c.title)}</div>
                <div style="font-size:11px; color:#64748b; max-width:280px; text-overflow:ellipsis; overflow:hidden; white-space:nowrap;">
                    ${escapeHtml(c.description)}
                </div>
            </td>
            <td>
                <div>${escapeHtml(c.citizen_name)}</div>
                <div style="font-size:11px; color:#64748b;">${escapeHtml(c.citizen_phone)}</div>
            </td>
            <td>${escapeHtml(c.category_name)}</td>
            <td>
                <div>${escapeHtml(c.area)}</div>
                <div style="font-size:11px; color:#64748b;">${escapeHtml(c.address)}</div>
            </td>
            <td>${escapeHtml(c.department_name || 'Unassigned')}</td>
            <td><span class="badge badge-prio-${c.priority}">${c.priority}</span></td>
            <td><span class="badge badge-status-${c.status}">${formatStatus(c.status)}</span></td>
            <td style="font-size:12px; color:#64748b;">${formatDate(c.submitted_at)}</td>
            <td>
                <button class="btn btn-primary btn-sm" onclick="viewComplaintDetail(${c.complaint_id})">Manage</button>
            </td>
        </tr>
    `).join('');
}

// ==============================================================================
// 3. COMPLAINT DETAILS & WORKFLOW MODAL
// ==============================================================================
async function viewComplaintDetail(complaintId) {
    try {
        const res = await fetch(`/api/complaints/${complaintId}`);
        if (!res.ok) throw new Error('Complaint not found');
        const c = await res.json();

        // Populate Header Badges
        document.getElementById('modal-detail-id').textContent = `#${c.complaint_id}`;
        
        const prioBadge = document.getElementById('modal-detail-priority');
        prioBadge.textContent = c.priority;
        prioBadge.className = `badge badge-prio-${c.priority}`;

        const statusBadge = document.getElementById('modal-detail-status');
        statusBadge.textContent = formatStatus(c.status);
        statusBadge.className = `badge badge-status-${c.status}`;

        document.getElementById('modal-detail-title').textContent = c.title;

        // Info Grid
        document.getElementById('detail-citizen-name').textContent = c.citizen_name;
        document.getElementById('detail-citizen-phone').textContent = c.citizen_phone;
        document.getElementById('detail-category').textContent = c.category_name;
        document.getElementById('detail-department').textContent = c.department_name || 'Unassigned';
        document.getElementById('detail-location').textContent = `${c.address}, ${c.area}, ${c.city} - ${c.pincode || 'N/A'}`;
        document.getElementById('detail-submitted-at').textContent = formatDate(c.submitted_at);
        document.getElementById('detail-resolved-at').textContent = c.resolved_at ? formatDate(c.resolved_at) : 'Pending Resolution';

        // Description
        document.getElementById('detail-description').textContent = c.description;

        // Resolution Box (Table: resolutions)
        const resBox = document.getElementById('detail-resolution-box');
        if (c.status === 'RESOLVED' && (c.resolution_description || c.resolved_by)) {
            resBox.style.display = 'flex';
            document.getElementById('detail-resolution-desc').textContent = c.resolution_description || 'Resolved successfully.';
            document.getElementById('detail-resolved-by').textContent = c.resolved_by || 'Municipal Engineer';
            document.getElementById('detail-resolved-time').textContent = formatDate(c.resolution_timestamp || c.resolved_at);
        } else {
            resBox.style.display = 'none';
        }

        // Action Form Setup
        document.getElementById('update-complaint-id').value = c.complaint_id;
        document.getElementById('update-new-status').value = c.status;
        
        const deptSelect = document.getElementById('update-department');
        deptSelect.value = c.department_id || '';

        document.getElementById('update-remarks').value = '';
        document.getElementById('update-officer').value = '';
        document.getElementById('update-resolution-desc').value = c.resolution_description || '';
        document.getElementById('update-resolved-by').value = c.resolved_by || '';

        toggleResolutionFields();

        // Audit History Timeline (Table: complaint_history)
        renderHistoryTimeline(c.history || []);

        // Open Modal
        openModal('modal-complaint-detail');

    } catch (err) {
        console.error('Failed to load complaint detail:', err);
        showToast('Failed to load complaint details', 'error');
    }
}

function toggleResolutionFields() {
    const status = document.getElementById('update-new-status').value;
    const resContainer = document.getElementById('resolution-input-fields');
    const resDesc = document.getElementById('update-resolution-desc');
    const resBy = document.getElementById('update-resolved-by');

    if (status === 'RESOLVED') {
        resContainer.style.display = 'flex';
        resDesc.setAttribute('required', 'true');
        resBy.setAttribute('required', 'true');
    } else {
        resContainer.style.display = 'none';
        resDesc.removeAttribute('required');
        resBy.removeAttribute('required');
    }
}

function renderHistoryTimeline(historyList) {
    const container = document.getElementById('detail-history-timeline');
    if (!container) return;

    if (!historyList || historyList.length === 0) {
        container.innerHTML = '<p style="color:#94a3b8; font-size:12px;">No status change history recorded.</p>';
        return;
    }

    container.innerHTML = historyList.map(h => `
        <div class="timeline-item">
            <div class="timeline-dot"></div>
            <div class="timeline-header">
                ${h.old_status ? `<span class="badge badge-status-${h.old_status}">${h.old_status}</span> &rarr; ` : ''}
                <span class="badge badge-status-${h.new_status}">${h.new_status}</span>
                <span class="timeline-meta">&bull; ${formatDate(h.updated_at)}</span>
            </div>
            <div class="timeline-content">${escapeHtml(h.remarks || 'Status transitioned')}</div>
            <div class="timeline-meta">Updated by: <strong>${escapeHtml(h.updated_by || 'System')}</strong></div>
        </div>
    `).join('');
}

// ==============================================================================
// 4. CATEGORIES, DEPARTMENTS, LOCATIONS VIEWS
// ==============================================================================
async function loadCategories() {
    try {
        const res = await fetch('/api/categories');
        allCategories = await res.json();
        const container = document.getElementById('categories-container');
        if (!container) return;

        container.innerHTML = allCategories.map(cat => `
            <div class="entity-card">
                <div class="entity-card-header">
                    <div class="entity-title">${escapeHtml(cat.category_name)}</div>
                    <span class="entity-badge">${cat.complaint_count || 0} complaints</span>
                </div>
                <div class="entity-desc">${escapeHtml(cat.description || 'No description provided')}</div>
                <div class="entity-meta-row">
                    <div class="meta-item">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                            <line x1="3" y1="9" x2="21" y2="9"></line>
                        </svg>
                        <span>Category ID: <strong>#${cat.category_id}</strong></span>
                    </div>
                </div>
            </div>
        `).join('');

        populateMasterDropdowns();
    } catch (err) {
        console.error('Failed to load categories:', err);
    }
}

async function loadDepartments() {
    try {
        const res = await fetch('/api/departments');
        allDepartments = await res.json();
        const container = document.getElementById('departments-container');
        if (!container) return;

        container.innerHTML = allDepartments.map(d => `
            <div class="entity-card">
                <div class="entity-card-header">
                    <div class="entity-title">${escapeHtml(d.department_name)}</div>
                    <span class="entity-badge">${d.active_count || 0} Active</span>
                </div>
                <div class="entity-meta-row">
                    <div class="meta-item">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                            <polyline points="22,6 12,13 2,6"></polyline>
                        </svg>
                        <span>${escapeHtml(d.contact_email || 'N/A')}</span>
                    </div>
                    <div class="meta-item">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                        </svg>
                        <span>${escapeHtml(d.contact_phone || 'N/A')}</span>
                    </div>
                    <div class="meta-item" style="margin-top:4px; font-weight:600; color:#1d4ed8;">
                        <span>Total Assigned All-Time: ${d.total_assigned || 0}</span>
                    </div>
                </div>
            </div>
        `).join('');

        populateMasterDropdowns();
    } catch (err) {
        console.error('Failed to load departments:', err);
    }
}

async function loadLocations() {
    try {
        const res = await fetch('/api/locations');
        allLocations = await res.json();
        const tbody = document.querySelector('#locations-table tbody');
        if (!tbody) return;

        tbody.innerHTML = allLocations.map(l => `
            <tr>
                <td><strong>#${l.location_id}</strong></td>
                <td>${escapeHtml(l.address)}</td>
                <td style="font-weight:600;">${escapeHtml(l.area)}</td>
                <td>${escapeHtml(l.city)}</td>
                <td>${escapeHtml(l.pincode || '-')}</td>
                <td><span class="badge badge-status-ASSIGNED">${l.complaint_count || 0} complaints</span></td>
            </tr>
        `).join('');

        populateMasterDropdowns();
    } catch (err) {
        console.error('Failed to load locations:', err);
    }
}

// ==============================================================================
// 5. AUDIT HISTORY VIEW
// ==============================================================================
async function loadAuditHistory() {
    const filterId = document.getElementById('history-filter-id')?.value || '';
    const params = new URLSearchParams();
    if (filterId.trim()) params.append('complaint_id', filterId.trim());

    try {
        const res = await fetch(`/api/history?${params.toString()}`);
        const history = await res.json();
        const tbody = document.querySelector('#audit-history-table tbody');
        if (!tbody) return;

        if (!history || history.length === 0) {
            tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; color:#94a3b8; padding:24px;">No history records found.</td></tr>`;
            return;
        }

        tbody.innerHTML = history.map(h => `
            <tr>
                <td>#${h.history_id}</td>
                <td><strong>#${h.complaint_id}</strong></td>
                <td style="max-width:220px; text-overflow:ellipsis; overflow:hidden; white-space:nowrap; font-weight:500;">
                    ${escapeHtml(h.complaint_title)}
                </td>
                <td>${escapeHtml(h.citizen_name)}</td>
                <td>
                    ${h.old_status ? `<span class="badge badge-status-${h.old_status}">${h.old_status}</span> &rarr; ` : ''}
                    <span class="badge badge-status-${h.new_status}">${h.new_status}</span>
                </td>
                <td>${escapeHtml(h.remarks || '-')}</td>
                <td style="font-weight:600;">${escapeHtml(h.updated_by || 'System')}</td>
                <td style="font-size:12px; color:#64748b;">${formatDate(h.updated_at)}</td>
            </tr>
        `).join('');
    } catch (err) {
        console.error('Failed to load history:', err);
    }
}

// ==============================================================================
// 6. FORM SUBMISSIONS & MODAL HANDLERS
// ==============================================================================
function initFormSubmissions() {
    // 1. Lodge Complaint Form
    const lodgeForm = document.getElementById('form-lodge-complaint');
    if (lodgeForm) {
        lodgeForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const payload = {
                citizen_name: document.getElementById('lodge-citizen-name').value,
                phone: document.getElementById('lodge-citizen-phone').value,
                category_id: parseInt(document.getElementById('lodge-category').value),
                location_id: parseInt(document.getElementById('lodge-location').value),
                department_id: document.getElementById('lodge-department').value ? parseInt(document.getElementById('lodge-department').value) : null,
                priority: document.getElementById('lodge-priority').value,
                title: document.getElementById('lodge-title').value,
                description: document.getElementById('lodge-description').value
            };

            try {
                const res = await fetch('/api/complaints', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.error || 'Failed to lodge complaint');

                showToast(`Complaint #${data.complaint_id} lodged successfully!`, 'success');
                lodgeForm.reset();
                closeModal('modal-lodge-complaint');

                // Refresh data
                loadDashboardData();
                if (currentView === 'complaints') loadComplaints();
            } catch (err) {
                showToast(err.message, 'error');
            }
        });
    }

    // 2. Update Status Form
    const updateForm = document.getElementById('form-update-status');
    if (updateForm) {
        updateForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const complaintId = document.getElementById('update-complaint-id').value;
            const newStatus = document.getElementById('update-new-status').value;
            const deptId = document.getElementById('update-department').value;
            const remarks = document.getElementById('update-remarks').value;
            const officer = document.getElementById('update-officer').value;
            const resDesc = document.getElementById('update-resolution-desc').value;
            const resBy = document.getElementById('update-resolved-by').value;

            const payload = {
                new_status: newStatus,
                department_id: deptId ? parseInt(deptId) : null,
                remarks: remarks,
                updated_by: officer,
                resolution_description: resDesc,
                resolved_by: resBy
            };

            try {
                const res = await fetch(`/api/complaints/${complaintId}/status`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.error || 'Failed to update status');

                showToast(`Complaint #${complaintId} status updated to ${newStatus}`, 'success');
                // Reload modal details
                viewComplaintDetail(complaintId);
                // Refresh background views
                loadDashboardData();
                if (currentView === 'complaints') loadComplaints();
            } catch (err) {
                showToast(err.message, 'error');
            }
        });
    }

    // 3. Add Category Form
    const catForm = document.getElementById('form-add-category');
    if (catForm) {
        catForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const payload = {
                category_name: document.getElementById('cat-name').value,
                description: document.getElementById('cat-desc').value
            };

            try {
                const res = await fetch('/api/categories', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.error || 'Failed to add category');

                showToast('Category created successfully', 'success');
                catForm.reset();
                closeModal('modal-add-category');
                loadCategories();
            } catch (err) {
                showToast(err.message, 'error');
            }
        });
    }

    // 4. Add Department Form
    const deptForm = document.getElementById('form-add-department');
    if (deptForm) {
        deptForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const payload = {
                department_name: document.getElementById('dept-name').value,
                contact_email: document.getElementById('dept-email').value,
                contact_phone: document.getElementById('dept-phone').value
            };

            try {
                const res = await fetch('/api/departments', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.error || 'Failed to add department');

                showToast('Department created successfully', 'success');
                deptForm.reset();
                closeModal('modal-add-department');
                loadDepartments();
            } catch (err) {
                showToast(err.message, 'error');
            }
        });
    }

    // 5. Add Location Form
    const locForm = document.getElementById('form-add-location');
    if (locForm) {
        locForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const payload = {
                address: document.getElementById('loc-address').value,
                area: document.getElementById('loc-area').value,
                city: document.getElementById('loc-city').value,
                pincode: document.getElementById('loc-pincode').value
            };

            try {
                const res = await fetch('/api/locations', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.error || 'Failed to add location');

                showToast('Location created successfully', 'success');
                locForm.reset();
                closeModal('modal-add-location');
                loadLocations();
            } catch (err) {
                showToast(err.message, 'error');
            }
        });
    }
}

// Modal helper functions
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('active');
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
    }
}

function openLodgeModal() {
    openModal('modal-lodge-complaint');
}

function openAddCategoryModal() {
    openModal('modal-add-category');
}

function openAddDepartmentModal() {
    openModal('modal-add-department');
}

function openAddLocationModal() {
    openModal('modal-add-location');
}

// ==============================================================================
// UTILITIES: TOASTS & FORMATTERS
// ==============================================================================
function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;

    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(10px)';
        toast.style.transition = 'all 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3500);
}

function formatStatus(status) {
    if (!status) return 'SUBMITTED';
    return status.replace('_', ' ');
}

function formatDate(dateString) {
    if (!dateString) return '-';
    try {
        const d = new Date(dateString);
        return d.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch {
        return dateString;
    }
}

function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function debounce(func, wait) {
    let timeout;
    return function (...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}
