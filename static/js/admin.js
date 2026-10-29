/**
 * Municipal Complaint Management System
 * ADMIN DASHBOARD CONTROLLER (Vanilla JavaScript)
 */

let adminCurrentView = 'dashboard';
let adminCategories = [];
let adminDepartments = [];
const adminComplaintsCache = {};

document.addEventListener('DOMContentLoaded', () => {
    initAdminMasterData();
    initAdminFilterListeners();
    initAdminFormHandlers();
    initModalBackdropListeners();

    // Initial load
    switchAdminView('dashboard');
});

// ==============================================================================
// 1. VIEW SWITCHING
// ==============================================================================
function switchAdminView(viewName) {
    adminCurrentView = viewName;

    document.querySelectorAll('.admin-sidebar .nav-item').forEach(btn => {
        if (btn.getAttribute('data-view') === viewName) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

    const headerTitle = document.getElementById('admin-current-view-title');
    if (headerTitle) {
        headerTitle.textContent = viewName.charAt(0).toUpperCase() + viewName.slice(1);
    }

    document.querySelectorAll('.view-panel').forEach(panel => {
        panel.classList.remove('active');
    });

    const target = document.getElementById(`admin-view-${viewName}`);
    if (target) target.classList.add('active');

    if (viewName === 'dashboard') {
        loadAdminDashboardData();
    } else if (viewName === 'complaints') {
        loadAdminComplaints();
    } else if (viewName === 'categories') {
        loadAdminCategories();
    } else if (viewName === 'departments') {
        loadAdminDepartments();
    } else if (viewName === 'locations') {
        loadAdminLocations();
    } else if (viewName === 'history') {
        loadAdminHistory();
    }
}

// ==============================================================================
// 2. MASTER DATA INITIALIZATION
// ==============================================================================
async function initAdminMasterData() {
    try {
        const [catsRes, deptsRes] = await Promise.all([
            fetch('/api/categories'),
            fetch('/api/departments')
        ]);
        adminCategories = await catsRes.json();
        adminDepartments = await deptsRes.json();

        // Populate Complaint filter category dropdown
        const filterCat = document.getElementById('admin-filter-category');
        if (filterCat) {
            filterCat.innerHTML = '<option value="">All Categories</option>' +
                adminCategories.map(c => `<option value="${c.category_id}">${escapeHtml(c.category_name)}</option>`).join('');
        }

        // Populate Assign Department modal dropdown
        const assignDeptSelect = document.getElementById('assign-select-dept');
        if (assignDeptSelect) {
            assignDeptSelect.innerHTML = '<option value="">Select Department...</option>' +
                adminDepartments.map(d => `<option value="${d.department_id}">${escapeHtml(d.department_name)}</option>`).join('');
        }
    } catch (err) {
        console.error('Failed to load master data:', err);
    }
}

// ==============================================================================
// 3. ADMIN DASHBOARD DATA & AGGREGATE CARDS
// ==============================================================================
async function loadAdminDashboardData() {
    try {
        const res = await fetch('/api/dashboard');
        const stats = await res.json();

        // Update 6 Stat Cards
        document.getElementById('admin-stat-total').textContent = stats.total_complaints || 0;
        document.getElementById('admin-stat-submitted').textContent = stats.submitted || 0;
        document.getElementById('admin-stat-assigned').textContent = stats.assigned || 0;
        document.getElementById('admin-stat-progress').textContent = stats.in_progress || 0;
        document.getElementById('admin-stat-resolved').textContent = stats.resolved || 0;
        document.getElementById('admin-stat-closed').textContent = stats.closed || 0;

        // Update Sidebar counter
        const sideCounter = document.getElementById('admin-complaints-count');
        if (sideCounter) sideCounter.textContent = stats.total_complaints || 0;

        // Render Category Progress Bars
        const catBars = document.getElementById('admin-category-bars');
        if (catBars) {
            const total = stats.total_complaints || 1;
            catBars.innerHTML = (stats.category_breakdown || []).map(cat => {
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
            }).join('') || '<p class="text-muted">No categories recorded.</p>';
        }

        // Render Department Workload Bars
        const deptBars = document.getElementById('admin-dept-bars');
        if (deptBars) {
            const maxVal = Math.max(...(stats.department_breakdown || []).map(d => d.complaint_count || 0), 1);
            deptBars.innerHTML = (stats.department_breakdown || []).map(dept => {
                const count = dept.complaint_count || 0;
                const pct = Math.round((count / maxVal) * 100);
                return `
                    <div class="metric-bar-item">
                        <div class="metric-bar-info">
                            <span>${escapeHtml(dept.department_name)}</span>
                            <span><strong>${count}</strong> tasks</span>
                        </div>
                        <div class="metric-bar-track">
                            <div class="metric-bar-fill teal" style="width: ${pct}%"></div>
                        </div>
                    </div>
                `;
            }).join('') || '<p class="text-muted">No departments assigned.</p>';
        }

        // Render Recent Complaints Table
        const tbody = document.querySelector('#admin-recent-table tbody');
        if (tbody) {
            if (!stats.recent_complaints || stats.recent_complaints.length === 0) {
                tbody.innerHTML = `<tr><td colspan="8" class="text-center text-muted" style="padding: 20px;">No complaints registered.</td></tr>`;
            } else {
                tbody.innerHTML = stats.recent_complaints.map(c => {
                    adminComplaintsCache[c.complaint_id] = c;
                    return `
                    <tr>
                        <td><strong class="badge badge-pk">${c.display_id}</strong></td>
                        <td>${escapeHtml(c.citizen_name)}</td>
                        <td>${escapeHtml(c.category_name)}</td>
                        <td>${escapeHtml(c.department_name || 'Unassigned')}</td>
                        <td><span class="badge badge-prio-${c.priority}">${c.priority}</span></td>
                        <td><span class="badge badge-status-${c.status}">${formatStatus(c.status)}</span></td>
                        <td style="font-size:12px; color:#64748b;">${formatDate(c.submitted_at)}</td>
                        <td>
                            <button class="btn btn-outline-sm" onclick="handleAdminAction('assign', ${c.complaint_id})">Assign</button>
                        </td>
                    </tr>
                `;
                }).join('');
            }
        }
    } catch (err) {
        console.error('Failed to load admin dashboard data:', err);
    }
}

// ==============================================================================
// 4. COMPLAINTS MANAGEMENT & FILTERS
// ==============================================================================
function initAdminFilterListeners() {
    const searchInput = document.getElementById('admin-filter-search');
    const statusSelect = document.getElementById('admin-filter-status');
    const prioSelect = document.getElementById('admin-filter-priority');
    const catSelect = document.getElementById('admin-filter-category');
    const resetBtn = document.getElementById('btn-admin-reset-filters');

    const debouncedLoad = debounce(() => loadAdminComplaints(), 300);

    if (searchInput) searchInput.addEventListener('input', debouncedLoad);
    if (statusSelect) statusSelect.addEventListener('change', () => loadAdminComplaints());
    if (prioSelect) prioSelect.addEventListener('change', () => loadAdminComplaints());
    if (catSelect) catSelect.addEventListener('change', () => loadAdminComplaints());

    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            searchInput.value = '';
            statusSelect.value = '';
            prioSelect.value = '';
            catSelect.value = '';
            loadAdminComplaints();
        });
    }
}

async function loadAdminComplaints() {
    const search = document.getElementById('admin-filter-search')?.value || '';
    const status = document.getElementById('admin-filter-status')?.value || '';
    const priority = document.getElementById('admin-filter-priority')?.value || '';
    const category_id = document.getElementById('admin-filter-category')?.value || '';

    const params = new URLSearchParams();
    if (search.trim()) params.append('search', search.trim());
    if (status) params.append('status', status);
    if (priority) params.append('priority', priority);
    if (category_id) params.append('category_id', category_id);

    try {
        const res = await fetch(`/api/complaints?${params.toString()}`);
        const complaints = await res.json();
        const tbody = document.querySelector('#admin-all-complaints-table tbody');
        if (!tbody) return;

        if (!complaints || complaints.length === 0) {
            tbody.innerHTML = `<tr><td colspan="10" class="text-center text-muted" style="padding: 28px;">No matching complaints found.</td></tr>`;
            return;
        }

        tbody.innerHTML = complaints.map(c => {
            adminComplaintsCache[c.complaint_id] = c;
            return `
            <tr>
                <td><strong class="badge badge-pk">${c.display_id}</strong></td>
                <td>
                    <div>${escapeHtml(c.citizen_name)}</div>
                    <div style="font-size:11px; color:#64748b;">${escapeHtml(c.citizen_phone)}</div>
                </td>
                <td style="font-weight:600; max-width:180px; text-overflow:ellipsis; overflow:hidden; white-space:nowrap;">
                    ${escapeHtml(c.title)}
                </td>
                <td>${escapeHtml(c.category_name)}</td>
                <td>${escapeHtml(c.location_area)}</td>
                <td>${escapeHtml(c.department_name || 'Unassigned')}</td>
                <td><span class="badge badge-prio-${c.priority}">${c.priority}</span></td>
                <td><span class="badge badge-status-${c.status}">${formatStatus(c.status)}</span></td>
                <td style="font-size:12px; color:#64748b;">${formatDate(c.submitted_at)}</td>
                <td>
                    <div style="display:flex; gap:6px; flex-wrap:wrap;">
                        <button class="btn btn-outline-sm" title="Assign Department" onclick="handleAdminAction('assign', ${c.complaint_id})">Assign</button>
                        <button class="btn btn-outline-sm" title="Update Status" onclick="handleAdminAction('status', ${c.complaint_id})">Status</button>
                        <button class="btn btn-outline-sm" style="color:#15803d; border-color:#86efac;" title="Add Resolution" onclick="handleAdminAction('resolve', ${c.complaint_id})">Resolve</button>
                        <button class="btn btn-outline-sm" title="View History" onclick="handleAdminAction('history', ${c.complaint_id})">History</button>
                    </div>
                </td>
            </tr>
        `;
        }).join('');
    } catch (err) {
        console.error('Failed to load complaints:', err);
    }
}

// ==============================================================================
// 5. MODAL WORKFLOW ACTIONS (ASSIGN, STATUS, RESOLVE, HISTORY)
// ==============================================================================
function handleAdminAction(action, complaintId) {
    const c = adminComplaintsCache[complaintId];
    if (!c) {
        // Fallback fetch if not in cache
        fetch(`/api/complaints/${complaintId}`)
            .then(res => res.json())
            .then(data => {
                adminComplaintsCache[complaintId] = data;
                handleAdminAction(action, complaintId);
            });
        return;
    }

    const titleLabel = `${c.display_id || ('CMP-' + (1000 + c.complaint_id))}: ${c.title}`;
    if (action === 'assign') {
        openAssignModal(c.complaint_id, titleLabel, c.category_name || '');
    } else if (action === 'status') {
        openStatusModal(c.complaint_id, titleLabel, c.status);
    } else if (action === 'resolve') {
        openResolutionModal(c.complaint_id, titleLabel);
    } else if (action === 'history') {
        openHistoryModal(c.complaint_id, titleLabel);
    }
}

function openAssignModal(complaintId, title, categoryName) {
    document.getElementById('assign-complaint-id').value = complaintId;
    document.getElementById('assign-display-title').textContent = title;
    document.getElementById('assign-category-name').textContent = categoryName;
    document.getElementById('assign-remarks').value = '';
    openModal('modal-assign-department');
}

function openStatusModal(complaintId, title, currentStatus) {
    document.getElementById('status-complaint-id').value = complaintId;
    document.getElementById('status-display-title').textContent = title;
    
    const badge = document.getElementById('status-current-badge');
    badge.textContent = formatStatus(currentStatus);
    badge.className = `badge badge-status-${currentStatus}`;

    document.getElementById('status-new-select').value = currentStatus;
    document.getElementById('status-remarks').value = '';
    document.getElementById('status-updated-by').value = '';
    openModal('modal-update-status');
}

function openResolutionModal(complaintId, title) {
    document.getElementById('res-complaint-id').value = complaintId;
    document.getElementById('res-display-title').textContent = title;
    document.getElementById('res-desc').value = '';
    document.getElementById('res-by').value = '';
    openModal('modal-add-resolution');
}

async function openHistoryModal(complaintId, title) {
    document.getElementById('history-modal-title').textContent = `Audit History - ${title}`;
    openModal('modal-view-history');

    try {
        const res = await fetch(`/api/complaints/${complaintId}`);
        const c = await res.json();
        const timeline = document.getElementById('admin-complaint-timeline');
        if (!timeline) return;

        if (!c.history || c.history.length === 0) {
            timeline.innerHTML = '<p class="text-muted" style="font-size:12px;">No status change history recorded.</p>';
            return;
        }

        timeline.innerHTML = c.history.map(h => `
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
    } catch (err) {
        showToast('Failed to load history', 'error');
    }
}

function initAdminFormHandlers() {
    // 1. Assign Department Form
    const assignForm = document.getElementById('form-assign-department');
    if (assignForm) {
        assignForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const cid = document.getElementById('assign-complaint-id').value;
            const deptId = document.getElementById('assign-select-dept').value;
            const remarks = document.getElementById('assign-remarks').value;

            try {
                const res = await fetch(`/api/complaints/${cid}/department`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ department_id: parseInt(deptId), remarks: remarks })
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.error || 'Assignment failed');

                showToast(data.message, 'success');
                closeModal('modal-assign-department');
                refreshCurrentAdminView();
            } catch (err) {
                showToast(err.message, 'error');
            }
        });
    }

    // 2. Update Status Form
    const statusForm = document.getElementById('form-update-status-admin');
    if (statusForm) {
        statusForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const cid = document.getElementById('status-complaint-id').value;
            const newStatus = document.getElementById('status-new-select').value;
            const remarks = document.getElementById('status-remarks').value;
            const updatedBy = document.getElementById('status-updated-by').value;

            try {
                const res = await fetch(`/api/complaints/${cid}/status`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ new_status: newStatus, remarks: remarks, updated_by: updatedBy })
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.error || 'Update failed');

                showToast(data.message, 'success');
                closeModal('modal-update-status');
                refreshCurrentAdminView();
            } catch (err) {
                showToast(err.message, 'error');
            }
        });
    }

    // 3. Add Resolution Form
    const resForm = document.getElementById('form-add-resolution-admin');
    if (resForm) {
        resForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const cid = document.getElementById('res-complaint-id').value;
            const desc = document.getElementById('res-desc').value;
            const by = document.getElementById('res-by').value;

            try {
                const res = await fetch(`/api/complaints/${cid}/resolution`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ resolution_description: desc, resolved_by: by })
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.error || 'Resolution failed');

                showToast('Resolution saved and marked as RESOLVED!', 'success');
                closeModal('modal-add-resolution');
                refreshCurrentAdminView();
            } catch (err) {
                showToast(err.message, 'error');
            }
        });
    }

    // 4. Add Category Form
    const catForm = document.getElementById('form-admin-add-category');
    if (catForm) {
        catForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('admin-cat-name').value.trim();
            const desc = document.getElementById('admin-cat-desc').value.trim();

            try {
                const res = await fetch('/api/categories', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ category_name: name, description: desc })
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.error || 'Failed to add category');

                showToast('Category created successfully', 'success');
                catForm.reset();
                closeModal('modal-admin-add-category');
                loadAdminCategories();
                initAdminMasterData();
            } catch (err) {
                showToast(err.message, 'error');
            }
        });
    }

    // 5. Add Department Form
    const deptForm = document.getElementById('form-admin-add-department');
    if (deptForm) {
        deptForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('admin-dept-name').value.trim();
            const email = document.getElementById('admin-dept-email').value.trim();
            const phone = document.getElementById('admin-dept-phone').value.trim();

            try {
                const res = await fetch('/api/departments', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ department_name: name, contact_email: email, contact_phone: phone })
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.error || 'Failed to add department');

                showToast('Department created successfully', 'success');
                deptForm.reset();
                closeModal('modal-admin-add-department');
                loadAdminDepartments();
                initAdminMasterData();
            } catch (err) {
                showToast(err.message, 'error');
            }
        });
    }

    // 6. Add Location Form
    const locForm = document.getElementById('form-admin-add-location');
    if (locForm) {
        locForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const address = document.getElementById('admin-loc-address').value.trim();
            const area = document.getElementById('admin-loc-area').value.trim();
            const city = document.getElementById('admin-loc-city').value.trim();
            const pincode = document.getElementById('admin-loc-pincode').value.trim();

            try {
                const res = await fetch('/api/locations', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ address: address, area: area, city: city, pincode: pincode })
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.error || 'Failed to add location');

                showToast('Location created successfully', 'success');
                locForm.reset();
                closeModal('modal-admin-add-location');
                loadAdminLocations();
            } catch (err) {
                showToast(err.message, 'error');
            }
        });
    }
}

function refreshCurrentAdminView() {
    loadAdminDashboardData();
    if (adminCurrentView === 'complaints') loadAdminComplaints();
}

// ==============================================================================
// 6. MASTER ENTITIES LOADERS (CATEGORIES, DEPARTMENTS, LOCATIONS, HISTORY)
// ==============================================================================
async function loadAdminCategories() {
    try {
        const res = await fetch('/api/categories');
        const categories = await res.json();
        const tbody = document.querySelector('#admin-categories-table tbody');
        if (!tbody) return;

        tbody.innerHTML = categories.map(c => `
            <tr>
                <td><strong>#${c.category_id}</strong></td>
                <td style="font-weight:700;">${escapeHtml(c.category_name)}</td>
                <td>${escapeHtml(c.description || '-')}</td>
                <td><span class="badge badge-pk">${c.complaint_count || 0} complaints</span></td>
                <td>
                    <button class="btn btn-danger-sm" onclick="deleteCategory(${c.category_id}, '${escapeHtml(c.category_name)}')">Delete</button>
                </td>
            </tr>
        `).join('');
    } catch (err) {
        console.error('Failed to load categories:', err);
    }
}

async function deleteCategory(categoryId, categoryName) {
    if (!confirm(`Are you sure you want to delete category "${categoryName}"?`)) return;

    try {
        const res = await fetch(`/api/categories/${categoryId}`, { method: 'DELETE' });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Delete failed');

        showToast('Category deleted', 'success');
        loadAdminCategories();
        initAdminMasterData();
    } catch (err) {
        showToast(err.message, 'error');
    }
}

async function loadAdminDepartments() {
    try {
        const res = await fetch('/api/departments');
        const departments = await res.json();
        const tbody = document.querySelector('#admin-departments-table tbody');
        if (!tbody) return;

        tbody.innerHTML = departments.map(d => `
            <tr>
                <td><strong>#${d.department_id}</strong></td>
                <td style="font-weight:700;">${escapeHtml(d.department_name)}</td>
                <td>${escapeHtml(d.contact_email || '-')}</td>
                <td>${escapeHtml(d.contact_phone || '-')}</td>
                <td><span class="badge badge-pk">${d.total_assigned || 0}</span></td>
                <td><span class="badge badge-status-ASSIGNED">${d.active_count || 0} Active</span></td>
            </tr>
        `).join('');
    } catch (err) {
        console.error('Failed to load departments:', err);
    }
}

async function loadAdminLocations() {
    try {
        const res = await fetch('/api/locations');
        const locations = await res.json();
        const tbody = document.querySelector('#admin-locations-table tbody');
        if (!tbody) return;

        tbody.innerHTML = locations.map(l => `
            <tr>
                <td><strong>#${l.location_id}</strong></td>
                <td>${escapeHtml(l.address)}</td>
                <td style="font-weight:700;">${escapeHtml(l.area)}</td>
                <td>${escapeHtml(l.city)}</td>
                <td>${escapeHtml(l.pincode || '-')}</td>
                <td><span class="badge badge-pk">${l.complaint_count || 0} complaints</span></td>
            </tr>
        `).join('');
    } catch (err) {
        console.error('Failed to load locations:', err);
    }
}

async function loadAdminHistory() {
    const filterId = document.getElementById('admin-history-filter-id')?.value || '';
    const params = new URLSearchParams();
    if (filterId.trim()) params.append('complaint_id', filterId.trim());

    try {
        const res = await fetch(`/api/history?${params.toString()}`);
        const history = await res.json();
        const tbody = document.querySelector('#admin-history-table tbody');
        if (!tbody) return;

        if (!history || history.length === 0) {
            tbody.innerHTML = `<tr><td colspan="7" class="text-center text-muted" style="padding: 24px;">No history records found.</td></tr>`;
            return;
        }

        tbody.innerHTML = history.map(h => `
            <tr>
                <td>#${h.history_id}</td>
                <td><strong class="badge badge-pk">${h.display_id}</strong></td>
                <td>${h.old_status ? `<span class="badge badge-status-${h.old_status}">${h.old_status}</span>` : '<span class="text-muted">-</span>'}</td>
                <td><span class="badge badge-status-${h.new_status}">${h.new_status}</span></td>
                <td>${escapeHtml(h.remarks || '-')}</td>
                <td><strong>${escapeHtml(h.updated_by || 'System')}</strong></td>
                <td style="font-size:12px; color:#64748b;">${formatDate(h.updated_at)}</td>
            </tr>
        `).join('');
    } catch (err) {
        console.error('Failed to load history:', err);
    }
}

// ==============================================================================
// MODAL & UTILITY HELPERS
// ==============================================================================
function initModalBackdropListeners() {
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                overlay.classList.remove('active');
            }
        });
    });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            document.querySelectorAll('.modal-overlay.active').forEach(m => m.classList.remove('active'));
        }
    });
}

function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.add('active');
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.remove('active');
}

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

async function logoutAdmin() {
    try {
        await fetch('/api/auth/logout', { method: 'POST' });
    } catch (e) {}
    window.location.href = '/';
}

