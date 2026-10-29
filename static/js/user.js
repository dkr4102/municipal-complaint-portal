/**
 * Municipal Complaint Management System
 * USER DASHBOARD CONTROLLER (Vanilla JavaScript)
 */

let activeCitizenPhone = localStorage.getItem('municipal_citizen_phone') || '';
let userCategories = [];
let userLocations = [];

document.addEventListener('DOMContentLoaded', () => {
    checkUserSession();
    initUserMasterData();
    initUserEventListeners();

    // Check URL parameters for direct tracking navigation: ?view=track&id=CMP-1001
    const params = new URLSearchParams(window.location.search);
    const targetView = params.get('view');
    const targetId = params.get('id');

    if (activeCitizenPhone) {
        setPhoneActive(activeCitizenPhone);
    }

    if (targetView === 'track' && targetId) {
        switchUserView('track');
        trackComplaintById(targetId);
    } else if (targetView) {
        switchUserView(targetView);
    } else {
        switchUserView('dashboard');
        if (activeCitizenPhone) {
            loadUserDashboardData(activeCitizenPhone);
        }
    }
});

// ==============================================================================
// 1. VIEW SWITCHING
// ==============================================================================
function switchUserView(viewName) {
    document.querySelectorAll('.user-sidebar .nav-item').forEach(btn => {
        if (btn.getAttribute('data-view') === viewName) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

    document.querySelectorAll('.view-panel').forEach(panel => {
        panel.classList.remove('active');
    });

    const target = document.getElementById(`user-view-${viewName}`);
    if (target) target.classList.add('active');

    // Update glass header breadcrumb
    const breadcrumb = document.getElementById('user-current-breadcrumb');
    if (breadcrumb) {
        const titleMap = {
            'dashboard': 'Dashboard',
            'submit': 'Submit Complaint',
            'my-complaints': 'My Complaints',
            'track': 'Track Complaint'
        };
        breadcrumb.textContent = titleMap[viewName] || (viewName.charAt(0).toUpperCase() + viewName.slice(1));
    }

    if (viewName === 'dashboard' && activeCitizenPhone) {
        loadUserDashboardData(activeCitizenPhone);
    } else if (viewName === 'my-complaints') {
        const phoneInput = document.getElementById('my-complaints-phone-input');
        if (activeCitizenPhone && phoneInput) {
            phoneInput.value = activeCitizenPhone;
            loadMyComplaints(activeCitizenPhone);
        }
    } else if (viewName === 'submit') {
        const phoneInput = document.getElementById('submit-citizen-phone');
        if (activeCitizenPhone && phoneInput && !phoneInput.value) {
            phoneInput.value = activeCitizenPhone;
        }
    }
}

// ==============================================================================
// 2. MASTER DATA (CATEGORIES & LOCATIONS FOR SUBMIT FORM)
// ==============================================================================
async function initUserMasterData() {
    try {
        const [catsRes, locsRes] = await Promise.all([
            fetch('/api/categories'),
            fetch('/api/locations')
        ]);
        userCategories = await catsRes.json();
        userLocations = await locsRes.json();

        // Populate Category Dropdown
        const catSelect = document.getElementById('submit-category');
        if (catSelect) {
            catSelect.innerHTML = '<option value="">Select Category...</option>' +
                userCategories.map(c => `<option value="${c.category_id}">${escapeHtml(c.category_name)}</option>`).join('');
        }

        // Populate Location Dropdown
        const locSelect = document.getElementById('submit-location');
        if (locSelect) {
            locSelect.innerHTML = '<option value="">Select Ward / Location...</option>' +
                userLocations.map(l => `<option value="${l.location_id}">${escapeHtml(l.area)} &bull; ${escapeHtml(l.address)}</option>`).join('');
        }
    } catch (err) {
        console.error('Failed to load master dropdowns:', err);
    }
}

// ==============================================================================
// 3. EVENT LISTENERS
// ==============================================================================
function initUserEventListeners() {
    // 1. Dashboard Phone Lookup Form
    const dashPhoneForm = document.getElementById('form-user-dashboard-phone');
    if (dashPhoneForm) {
        dashPhoneForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const phone = document.getElementById('user-dashboard-phone-input').value.trim();
            if (phone) {
                setPhoneActive(phone);
                loadUserDashboardData(phone);
            }
        });
    }

    // 2. Submit Complaint Form
    const submitForm = document.getElementById('form-user-submit-complaint');
    if (submitForm) {
        submitForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const citizenName = document.getElementById('submit-citizen-name').value.trim();
            const phone = document.getElementById('submit-citizen-phone').value.trim();
            const title = document.getElementById('submit-title').value.trim();
            const categoryId = document.getElementById('submit-category').value;
            const priority = document.getElementById('submit-priority').value;
            const locationId = document.getElementById('submit-location').value;
            const description = document.getElementById('submit-description').value.trim();

            const submitBtn = submitForm.querySelector('button[type="submit"]');
            const originalBtnText = submitBtn ? submitBtn.innerHTML : 'Submit Complaint';

            const payload = {
                citizen_name: citizenName,
                phone: phone,
                title: title,
                category_id: parseInt(categoryId),
                priority: priority,
                location_id: parseInt(locationId),
                description: description
            };

            try {
                if (submitBtn) {
                    submitBtn.disabled = true;
                    submitBtn.innerHTML = '<span class="button-spinner"></span> Submitting Grievance...';
                }

                const res = await fetch('/api/user/complaints', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                const data = await res.json();
                if (!res.ok) {
                    throw new Error(data.error || 'Complaint submission could not be processed.');
                }

                setPhoneActive(phone);

                // Show Success Banner
                const banner = document.getElementById('submit-success-banner');
                const displayIdSpan = document.getElementById('success-display-id');
                const trackBtn = document.getElementById('btn-success-track');

                if (displayIdSpan) displayIdSpan.textContent = data.display_id || `CMP-${data.complaint_id}`;
                if (banner) banner.style.display = 'flex';

                if (trackBtn) {
                    trackBtn.onclick = () => {
                        switchUserView('track');
                        trackComplaintById(data.display_id || data.complaint_id);
                    };
                }

                submitForm.reset();
                showToast(`Complaint ${data.display_id} registered successfully!`, 'success');
                if (banner) banner.scrollIntoView({ behavior: 'smooth' });
            } catch (err) {
                showToast(err.message, 'error');
            } finally {
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = originalBtnText;
                }
            }
        });
    }

    // 3. My Complaints Search Form
    const myCompForm = document.getElementById('form-my-complaints-search');
    if (myCompForm) {
        myCompForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const phone = document.getElementById('my-complaints-phone-input').value.trim();
            if (phone) {
                setPhoneActive(phone);
                loadMyComplaints(phone);
            }
        });
    }

    // 4. Track Complaint Search Form
    const trackForm = document.getElementById('form-track-search');
    if (trackForm) {
        trackForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const rawId = document.getElementById('track-id-input').value.trim();
            if (rawId) {
                trackComplaintById(rawId);
            }
        });
    }
}

function resetSubmitForm() {
    document.getElementById('submit-success-banner').style.display = 'none';
}

function setPhoneActive(phone) {
    activeCitizenPhone = phone;
    localStorage.setItem('municipal_citizen_phone', phone);

    const input1 = document.getElementById('user-dashboard-phone-input');
    const input2 = document.getElementById('my-complaints-phone-input');
    const input3 = document.getElementById('submit-citizen-phone');
    if (input1) input1.value = phone;
    if (input2) input2.value = phone;
    if (input3 && !input3.value) input3.value = phone;
}

function clearUserPhone() {
    activeCitizenPhone = '';
    localStorage.removeItem('municipal_citizen_phone');
    const greetingBox = document.getElementById('user-greeting-box');
    if (greetingBox) greetingBox.style.display = 'none';

    document.getElementById('user-dashboard-phone-input').value = '';
    document.getElementById('user-stat-total').textContent = '0';
    document.getElementById('user-stat-submitted').textContent = '0';
    document.getElementById('user-stat-progress').textContent = '0';
    document.getElementById('user-stat-resolved').textContent = '0';

    const tbody = document.querySelector('#user-dashboard-recent-table tbody');
    if (tbody) tbody.innerHTML = `<tr><td colspan="7" class="text-center text-muted" style="padding: 24px;">Enter your phone number above to see your complaints.</td></tr>`;
}

// ==============================================================================
// 4. LOAD CITIZEN DASHBOARD METRICS & RECENT COMPLAINTS
// ==============================================================================
async function loadUserDashboardData(phone) {
    try {
        const res = await fetch(`/api/user/stats?phone=${encodeURIComponent(phone)}`);
        const data = await res.json();

        // Update Stat Cards
        document.getElementById('user-stat-total').textContent = data.my_complaints || 0;
        document.getElementById('user-stat-submitted').textContent = data.submitted || 0;
        document.getElementById('user-stat-progress').textContent = data.in_progress || 0;
        document.getElementById('user-stat-resolved').textContent = data.resolved || 0;

        // Show Greeting
        const greetingBox = document.getElementById('user-greeting-box');
        if (data.citizen_name) {
            greetingBox.style.display = 'flex';
            document.getElementById('greeting-citizen-name').textContent = data.citizen_name;
            document.getElementById('greeting-citizen-phone').textContent = data.phone;
        } else {
            greetingBox.style.display = 'none';
        }

        // Render Recent Table
        const tbody = document.querySelector('#user-dashboard-recent-table tbody');
        if (!tbody) return;

        if (!data.recent_complaints || data.recent_complaints.length === 0) {
            tbody.innerHTML = `<tr><td colspan="7" class="text-center text-muted" style="padding: 24px;">No complaints registered under phone ${escapeHtml(phone)}.</td></tr>`;
            return;
        }

        tbody.innerHTML = data.recent_complaints.map(c => `
            <tr>
                <td><strong class="badge badge-pk">${c.display_id}</strong></td>
                <td style="font-weight:600;">${escapeHtml(c.title)}</td>
                <td>${escapeHtml(c.category_name)}</td>
                <td><span class="badge badge-prio-${c.priority}">${c.priority}</span></td>
                <td><span class="badge badge-status-${c.status}">${formatStatus(c.status)}</span></td>
                <td style="font-size:12px; color:#64748b;">${formatDate(c.submitted_at)}</td>
                <td>
                    <button class="btn btn-outline-sm" onclick="trackFromRecent('${c.display_id}')">Track</button>
                </td>
            </tr>
        `).join('');
    } catch (err) {
        console.error('Failed to load user dashboard data:', err);
    }
}

function trackFromRecent(displayId) {
    switchUserView('track');
    document.getElementById('track-id-input').value = displayId;
    trackComplaintById(displayId);
}

// ==============================================================================
// 5. LOAD ALL MY COMPLAINTS (PHONE-BASED)
// ==============================================================================
async function loadMyComplaints(phone) {
    try {
        const res = await fetch(`/api/user/complaints?phone=${encodeURIComponent(phone)}`);
        const complaints = await res.json();
        const tbody = document.querySelector('#user-my-complaints-table tbody');
        if (!tbody) return;

        if (!complaints || complaints.length === 0) {
            tbody.innerHTML = `<tr><td colspan="8" class="text-center text-muted" style="padding: 28px;">No complaints found for phone ${escapeHtml(phone)}.</td></tr>`;
            return;
        }

        tbody.innerHTML = complaints.map(c => `
            <tr>
                <td><strong class="badge badge-pk">${c.display_id}</strong></td>
                <td style="font-weight:600;">${escapeHtml(c.title)}</td>
                <td>${escapeHtml(c.category_name)}</td>
                <td>${escapeHtml(c.location_area)}</td>
                <td><span class="badge badge-prio-${c.priority}">${c.priority}</span></td>
                <td><span class="badge badge-status-${c.status}">${formatStatus(c.status)}</span></td>
                <td style="font-size:12px; color:#64748b;">${formatDate(c.submitted_at)}</td>
                <td>
                    <button class="btn btn-outline-sm" onclick="trackFromRecent('${c.display_id}')">View / Track</button>
                </td>
            </tr>
        `).join('');
    } catch (err) {
        console.error('Failed to load my complaints:', err);
    }
}

// ==============================================================================
// 6. TRACK COMPLAINT & RENDER VISUAL TIMELINE & RESOLUTION
// ==============================================================================
async function trackComplaintById(rawId) {
    const input = document.getElementById('track-id-input');
    if (input && rawId) input.value = rawId;

    try {
        const res = await fetch(`/api/user/complaints/${encodeURIComponent(rawId)}`);
        if (!res.ok) {
            const errData = await res.json();
            throw new Error(errData.error || 'Complaint not found. Please verify the ID.');
        }
        const data = await res.json();

        // Reveal Result Container
        const container = document.getElementById('track-result-card');
        if (container) container.style.display = 'flex';

        // 1. Populate Metadata
        const dispIdEl = document.getElementById('track-display-id');
        if (dispIdEl) dispIdEl.textContent = data.display_id;

        const titleEl = document.getElementById('track-title');
        if (titleEl) titleEl.textContent = data.title;
        
        const statusBadge = document.getElementById('track-status-badge');
        if (statusBadge) {
            statusBadge.textContent = formatStatus(data.status);
            statusBadge.className = `badge badge-status-${data.status}`;
        }

        const catEl = document.getElementById('track-category');
        if (catEl) catEl.textContent = data.category_name;

        const locEl = document.getElementById('track-location');
        if (locEl) locEl.textContent = `${data.location_area} &bull; ${data.location_address}`;

        const deptEl = document.getElementById('track-department');
        if (deptEl) deptEl.textContent = data.department_name || 'Pending Assignment';

        const prioBadge = document.getElementById('track-priority-badge');
        if (prioBadge) {
            prioBadge.textContent = data.priority;
            prioBadge.className = `badge badge-prio-${data.priority}`;
        }

        const currStatusEl = document.getElementById('track-current-status');
        if (currStatusEl) currStatusEl.textContent = formatStatus(data.status);

        const subAtEl = document.getElementById('track-submitted-at');
        if (subAtEl) subAtEl.textContent = formatDate(data.submitted_at);

        // 2. Render Visual Timeline Stepper
        renderVisualStepper(data.timeline || []);

        // 3. Render Resolution Details
        renderResolutionSection(data.resolution);

        // 4. Render History Log Table
        renderHistoryTable(data.history || []);

        // Scroll into view smoothly
        if (container) container.scrollIntoView({ behavior: 'smooth' });

    } catch (err) {
        const container = document.getElementById('track-result-card');
        if (container) container.style.display = 'none';
        showToast(err.message, 'error');
    }
}

function renderVisualStepper(timeline) {
    const stepper = document.getElementById('visual-timeline-stepper');
    if (!stepper) return;

    // Determine completion index
    let activeIdx = 0;
    timeline.forEach((step, idx) => {
        if (step.is_done || step.is_current) {
            activeIdx = idx;
        }
    });
    const totalSteps = timeline.length;
    const progressPct = totalSteps > 1 ? Math.min(100, Math.round((activeIdx / (totalSteps - 1)) * 100)) : 0;

    stepper.innerHTML = `
        <div class="step-line-track">
            <div class="step-line-fill" style="width: ${progressPct}%;"></div>
        </div>
        ${timeline.map((step, idx) => {
            const stateClass = step.is_current ? 'current' : (step.is_done ? 'done' : '');
            const iconSymbol = step.is_done ? '✓' : (idx + 1);
            return `
                <div class="step-node ${stateClass}">
                    <div class="step-icon">${iconSymbol}</div>
                    <span class="step-label">${escapeHtml(step.label)}</span>
                    ${step.timestamp ? `<span class="step-time">${formatDate(step.timestamp)}</span>` : ''}
                </div>
            `;
        }).join('')}
    `;
}

function renderResolutionSection(resolution) {
    const box = document.getElementById('resolution-content-box');
    if (!box) return;

    if (resolution && resolution.available) {
        box.innerHTML = `
            <div class="resolution-box-green">
                <h4>✓ Official Resolution Certificate (Table: resolutions)</h4>
                <p><strong>Remediation Action:</strong> ${escapeHtml(resolution.description)}</p>
                <div class="res-meta">
                    <span><strong>Resolved By:</strong> ${escapeHtml(resolution.resolved_by)}</span>
                    <span><strong>Resolution Date:</strong> ${formatDate(resolution.resolved_at)}</span>
                </div>
            </div>
        `;
    } else {
        box.innerHTML = `
            <div class="resolution-unavailable-box">
                Resolution is not available yet. Investigation or field work is in progress.
            </div>
        `;
    }
}

function renderHistoryTable(history) {
    const tbody = document.querySelector('#track-history-table tbody');
    if (!tbody) return;

    if (!history || history.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" class="text-center text-muted" style="padding: 16px;">No history transitions logged.</td></tr>`;
        return;
    }

    tbody.innerHTML = history.map(h => `
        <tr>
            <td style="font-size:12px; color:#64748b;">${formatDate(h.updated_at)}</td>
            <td>
                ${h.old_status ? `<span class="badge badge-status-${h.old_status}">${h.old_status}</span> &rarr; ` : ''}
                <span class="badge badge-status-${h.new_status}">${h.new_status}</span>
            </td>
            <td>${escapeHtml(h.remarks || '-')}</td>
            <td><strong>${escapeHtml(h.updated_by || 'System')}</strong></td>
        </tr>
    `).join('');
}

// ==============================================================================
// UTILITIES
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

async function checkUserSession() {
    try {
        const res = await fetch('/api/auth/me');
        const data = await res.json();
        if (data.authenticated && data.user) {
            if (data.user.phone) {
                setPhoneActive(data.user.phone);
                localStorage.setItem('municipal_citizen_phone', data.user.phone);
            }
            const authBadge = document.getElementById('header-auth-badge');
            if (authBadge) {
                authBadge.innerHTML = `Student: <strong>${escapeHtml(data.user.name)}</strong>`;
            }
        }
    } catch (e) {}
}

async function logoutUser() {
    try {
        await fetch('/api/auth/logout', { method: 'POST' });
    } catch (e) {}
    localStorage.removeItem('municipal_citizen_phone');
    const isStatic = window.location.hostname.endsWith('github.io') || window.location.pathname.endsWith('.html');
    window.location.href = isStatic ? 'index.html' : '/';
}

