/**
 * Municipal Complaint Management System - GitHub Pages Client-Side Database & API Adapter
 * Automatically activates on GitHub Pages (or static hosts) to provide a 100% interactive,
 * zero-server experience with client-side persistence in localStorage.
 */

(function () {
    const isStaticHost = window.location.hostname.endsWith('github.io') ||
                         window.location.protocol === 'file:' ||
                         window.location.port === '' ||
                         window.location.pathname.endsWith('.html');

    if (!isStaticHost) {
        // Running on Flask server; use real backend APIs
        return;
    }

    console.log('[MCMS] GitHub Pages detected. Activating client-side mock database adapter.');

    // 1. Initial Master Data Seeds
    const SEED_CATEGORIES = [
        { category_id: 1, category_name: "Garbage", description: "Solid waste collection, litter clearing, and dustbin maintenance" },
        { category_id: 2, category_name: "Water Supply", description: "Pipeline leaks, water pressure problems, contamination, and tanker supply" },
        { category_id: 3, category_name: "Road", description: "Potholes, road resurfacing, illegal road cutting, and footpath repairs" },
        { category_id: 4, category_name: "Street Light", description: "Faulty lamp posts, flickering street lights, and dark junction spots" },
        { category_id: 5, category_name: "Drainage", description: "Blocked storm drains, sewage overflow, and open manholes" }
    ];

    const SEED_DEPARTMENTS = [
        { department_id: 1, department_name: "Sanitation Department", contact_email: "sanitation@municipal.gov.in", contact_phone: "+91 98765 43210" },
        { department_id: 2, department_name: "Water Supply Department", contact_email: "watersupply@municipal.gov.in", contact_phone: "+91 98765 43211" },
        { department_id: 3, department_name: "Road Department", contact_email: "roads@municipal.gov.in", contact_phone: "+91 98765 43212" },
        { department_id: 4, department_name: "Electrical Department", contact_email: "electrical@municipal.gov.in", contact_phone: "+91 98765 43213" },
        { department_id: 5, department_name: "Drainage Department", contact_email: "drainage@municipal.gov.in", contact_phone: "+91 98765 43214" }
    ];

    const SEED_LOCATIONS = [
        { location_id: 1, address: "Near Metro Pillar 42, Outer Ring Road", area: "Indiranagar", city: "Bengaluru", pincode: "560038" },
        { location_id: 2, address: "Opposite City Hospital, 4th Main", area: "Jayanagar", city: "Bengaluru", pincode: "560011" },
        { location_id: 3, address: "Crossroad 7, Market Yard", area: "Koramangala", city: "Bengaluru", pincode: "560034" },
        { location_id: 4, address: "Plot 15, Lake View Road", area: "Whitefield", city: "Bengaluru", pincode: "560066" },
        { location_id: 5, address: "Near Government School, Ward 12", area: "Malleshwaram", city: "Bengaluru", pincode: "560003" },
        { location_id: 6, address: "Railway Station Approach Road", area: "Shivajinagar", city: "Bengaluru", pincode: "560051" }
    ];

    const SEED_USERS = [
        { user_id: 1, name: "System Administrator", email: "admin@gmail.com", password: "admin@123", role: "admin", phone: "9876543210" },
        { user_id: 2, name: "Ramesh Kumar (Student)", email: "student@gmail.com", password: "student@123", role: "student", phone: "9845012345" }
    ];

    const SEED_COMPLAINTS = [
        {
            complaint_id: 1,
            display_id: "CMP-1001",
            citizen_name: "Rajesh Kumar",
            citizen_phone: "9845012345",
            category_id: 1,
            category_name: "Garbage",
            location_id: 1,
            location_area: "Indiranagar",
            location_address: "Near Metro Pillar 42, Outer Ring Road",
            department_id: 1,
            department_name: "Sanitation Department",
            title: "Overflowing community garbage container",
            description: "The municipal garbage bin on the corner has not been emptied for 3 days and waste is spilling onto the street.",
            priority: "HIGH",
            status: "ASSIGNED",
            submitted_at: "2026-09-15 09:30:00",
            resolved_at: null
        },
        {
            complaint_id: 2,
            display_id: "CMP-1002",
            citizen_name: "Priya Sharma",
            citizen_phone: "9845123456",
            category_id: 2,
            category_name: "Water Supply",
            location_id: 2,
            location_area: "Jayanagar",
            location_address: "Opposite City Hospital, 4th Main",
            department_id: 2,
            department_name: "Water Supply Department",
            title: "Underground main pipeline leak causing water logging",
            description: "A clean drinking water pipeline burst in front of City Hospital leading to gallons of water wasted.",
            priority: "URGENT",
            status: "IN_PROGRESS",
            submitted_at: "2026-09-16 11:15:00",
            resolved_at: null
        },
        {
            complaint_id: 3,
            display_id: "CMP-1003",
            citizen_name: "Anand Verma",
            citizen_phone: "9845234567",
            category_id: 3,
            category_name: "Road",
            location_id: 3,
            location_area: "Koramangala",
            location_address: "Crossroad 7, Market Yard",
            department_id: 3,
            department_name: "Road Department",
            title: "Dangerous deep pothole near junction",
            description: "Large pothole in the middle of Crossroad 7 causing frequent traffic jams and two-wheeler skids.",
            priority: "MEDIUM",
            status: "SUBMITTED",
            submitted_at: "2026-09-17 14:00:00",
            resolved_at: null
        },
        {
            complaint_id: 4,
            display_id: "CMP-1004",
            citizen_name: "Sunita Patil",
            citizen_phone: "9845345678",
            category_id: 4,
            category_name: "Street Light",
            location_id: 4,
            location_area: "Whitefield",
            location_address: "Plot 15, Lake View Road",
            department_id: 4,
            department_name: "Electrical Department",
            title: "Street lights non-operational for entire lane",
            description: "Six consecutive street light poles on Lake View Road are not turning on at night, causing safety concerns.",
            priority: "HIGH",
            status: "RESOLVED",
            submitted_at: "2026-09-14 19:45:00",
            resolved_at: "2026-09-16 16:30:00"
        },
        {
            complaint_id: 5,
            display_id: "CMP-1005",
            citizen_name: "Mohammed Farhan",
            citizen_phone: "9845456789",
            category_id: 5,
            category_name: "Drainage",
            location_id: 5,
            location_area: "Malleshwaram",
            location_address: "Near Government School, Ward 12",
            department_id: 5,
            department_name: "Drainage Department",
            title: "Blocked stormwater drain ahead of monsoon",
            description: "Silt and plastic waste clogging stormwater drain causing overflow near the government school.",
            priority: "MEDIUM",
            status: "IN_PROGRESS",
            submitted_at: "2026-09-15 16:20:00",
            resolved_at: null
        }
    ];

    const SEED_HISTORY = [
        { history_id: 1, complaint_id: 1, old_status: null, new_status: "SUBMITTED", remarks: "Complaint logged by citizen via portal", updated_by: "System", updated_at: "2026-09-15 09:30:00" },
        { history_id: 2, complaint_id: 1, old_status: "SUBMITTED", new_status: "ASSIGNED", remarks: "Assigned to Sanitation Department Ward 4 Team", updated_by: "Municipal Admin", updated_at: "2026-09-15 10:15:00" },
        { history_id: 3, complaint_id: 2, old_status: null, new_status: "SUBMITTED", remarks: "Emergency water leakage reported", updated_by: "System", updated_at: "2026-09-16 11:15:00" },
        { history_id: 4, complaint_id: 2, old_status: "SUBMITTED", new_status: "ASSIGNED", remarks: "Assigned to Water Emergency Response Squad", updated_by: "Helpdesk Officer", updated_at: "2026-09-16 11:45:00" },
        { history_id: 5, complaint_id: 2, old_status: "ASSIGNED", new_status: "IN_PROGRESS", remarks: "Excavation and pipe replacement underway", updated_by: "Field Engineer Rao", updated_at: "2026-09-16 13:00:00" },
        { history_id: 6, complaint_id: 3, old_status: null, new_status: "SUBMITTED", remarks: "Pothole complaint registered", updated_by: "System", updated_at: "2026-09-17 14:00:00" },
        { history_id: 7, complaint_id: 4, old_status: null, new_status: "SUBMITTED", remarks: "Street light outage registered", updated_by: "System", updated_at: "2026-09-14 19:45:00" },
        { history_id: 8, complaint_id: 4, old_status: "SUBMITTED", new_status: "ASSIGNED", remarks: "Assigned to Electrical Maintenance Team", updated_by: "Admin Officer", updated_at: "2026-09-15 08:30:00" },
        { history_id: 9, complaint_id: 4, old_status: "ASSIGNED", new_status: "IN_PROGRESS", remarks: "Technician dispatched with replacement LED fixtures", updated_by: "EE Prakash", updated_at: "2026-09-15 11:00:00" },
        { history_id: 10, complaint_id: 4, old_status: "IN_PROGRESS", new_status: "RESOLVED", remarks: "All six sodium vapor fixtures replaced with 90W LED lamps. Circuit restored.", updated_by: "Inspector Ramesh", updated_at: "2026-09-16 16:30:00" },
        { history_id: 11, complaint_id: 5, old_status: null, new_status: "SUBMITTED", remarks: "Drain blockage complaint logged", updated_by: "System", updated_at: "2026-09-15 16:20:00" },
        { history_id: 12, complaint_id: 5, old_status: "SUBMITTED", new_status: "ASSIGNED", remarks: "Assigned to Drainage Clearance Squad", updated_by: "Helpdesk Officer", updated_at: "2026-09-16 09:00:00" },
        { history_id: 13, complaint_id: 5, old_status: "ASSIGNED", new_status: "IN_PROGRESS", remarks: "Suction vehicle and manual desilting in progress", updated_by: "Sanitary Inspector Dev", updated_at: "2026-09-17 10:00:00" }
    ];

    const SEED_RESOLUTIONS = {
        4: {
            resolution_id: 1,
            complaint_id: 4,
            resolution_description: "Replaced 6 faulty fixtures with high-efficiency 90W LED lamps and replaced damaged underground cable segment. Tested and working normally.",
            resolved_by: "Junior Engineer K. Suresh (Electrical Division)",
            resolved_at: "2026-09-16 16:30:00"
        }
    };

    // Helper to get or set JSON from localStorage
    function getStore(key, defaultVal) {
        try {
            const data = localStorage.getItem('mcms_' + key);
            return data ? JSON.parse(data) : defaultVal;
        } catch (e) {
            return defaultVal;
        }
    }

    function setStore(key, val) {
        try {
            localStorage.setItem('mcms_' + key, JSON.stringify(val));
        } catch (e) {}
    }

    // Initialize stores
    let categories = getStore('categories', SEED_CATEGORIES);
    let departments = getStore('departments', SEED_DEPARTMENTS);
    let locations = getStore('locations', SEED_LOCATIONS);
    let users = getStore('users', SEED_USERS);
    let complaints = getStore('complaints', SEED_COMPLAINTS);
    let history = getStore('history', SEED_HISTORY);
    let resolutions = getStore('resolutions', SEED_RESOLUTIONS);

    setStore('categories', categories);
    setStore('departments', departments);
    setStore('locations', locations);
    setStore('users', users);
    setStore('complaints', complaints);
    setStore('history', history);
    setStore('resolutions', resolutions);

    // Save auth session in sessionStorage/localStorage
    function getSession() {
        return getStore('session', null);
    }

    function setSession(user) {
        setStore('session', user);
    }

    function clearSession() {
        localStorage.removeItem('mcms_session');
    }

    function makeResponse(data, status = 200) {
        return new Response(JSON.stringify(data), {
            status: status,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    function parseComplaintId(val) {
        if (!val) return null;
        const str = String(val).trim().toUpperCase();
        const match = str.match(/^CMP-(\d+)$/);
        if (match) {
            const num = parseInt(match[1], 10);
            return num > 1000 ? num - 1000 : num;
        }
        if (/^\d+$/.test(str)) {
            const num = parseInt(str, 10);
            return num > 1000 ? num - 1000 : num;
        }
        return null;
    }

    // Intercept window.fetch
    const originalFetch = window.fetch;
    window.fetch = async function (input, init = {}) {
        const urlStr = typeof input === 'string' ? input : (input && input.url ? input.url : '');
        const method = (init.method || 'GET').toUpperCase();

        // Check if this is an API call
        if (urlStr.includes('/api/')) {
            const urlObj = new URL(urlStr, window.location.origin);
            const pathname = urlObj.pathname.replace(/^.*\/api\//, '/api/');
            const searchParams = urlObj.searchParams;

            let body = {};
            if (init.body) {
                try {
                    body = typeof init.body === 'string' ? JSON.parse(init.body) : init.body;
                } catch (e) {}
            }

            // Route 1: Auth Login
            if (pathname === '/api/auth/login' && method === 'POST') {
                const email = (body.email || '').trim().toLowerCase();
                const pass = (body.password || '').trim();
                const role = (body.role || '').trim().toLowerCase();

                const user = users.find(u => u.email.toLowerCase() === email && u.password === pass);
                if (!user) {
                    return makeResponse({ error: "Invalid email or password." }, 401);
                }
                if (role === 'admin' && user.role !== 'admin') {
                    return makeResponse({ error: "Access denied. Administrator privileges required." }, 403);
                }

                setSession(user);
                const redirect = user.role === 'admin' ? 'admin.html' : 'user.html';
                return makeResponse({
                    success: true,
                    message: "Login successful.",
                    user: user,
                    redirect: redirect
                });
            }

            // Route 2: Auth Register
            if (pathname === '/api/auth/register' && method === 'POST') {
                const name = (body.name || '').trim();
                const email = (body.email || '').trim().toLowerCase();
                const pass = (body.password || '').trim();
                const phone = (body.phone || '').trim();

                if (!name || !email || !pass) {
                    return makeResponse({ error: "Name, email, and password are required." }, 400);
                }

                if (users.some(u => u.email.toLowerCase() === email)) {
                    return makeResponse({ error: "An account with this email already exists." }, 409);
                }

                const newUser = {
                    user_id: users.length + 1,
                    name: name,
                    email: email,
                    password: pass,
                    role: "student",
                    phone: phone
                };
                users.push(newUser);
                setStore('users', users);
                setSession(newUser);

                return makeResponse({
                    success: true,
                    message: "Account registered successfully!",
                    user: newUser,
                    redirect: 'user.html'
                }, 201);
            }

            // Route 3: Auth Me
            if (pathname === '/api/auth/me') {
                const sess = getSession();
                return makeResponse({
                    authenticated: !!sess,
                    user: sess
                });
            }

            // Route 4: Auth Logout
            if (pathname === '/api/auth/logout') {
                clearSession();
                return makeResponse({ success: true, redirect: 'index.html' });
            }

            // Route 5: Categories
            if (pathname === '/api/categories') {
                if (method === 'GET') {
                    return makeResponse(categories);
                }
                if (method === 'POST') {
                    const newCat = {
                        category_id: categories.length + 1,
                        category_name: body.category_name,
                        description: body.description || ""
                    };
                    categories.push(newCat);
                    setStore('categories', categories);
                    return makeResponse(newCat, 201);
                }
            }

            // Route 6: Departments
            if (pathname === '/api/departments') {
                if (method === 'GET') {
                    const deptsWithStats = departments.map(d => {
                        const count = complaints.filter(c => c.department_id === d.department_id).length;
                        return {
                            ...d,
                            complaint_count: count,
                            assigned_count: count,
                            active_workload: complaints.filter(c => c.department_id === d.department_id && ['ASSIGNED', 'IN_PROGRESS'].includes(c.status)).length
                        };
                    });
                    return makeResponse(deptsWithStats);
                }
                if (method === 'POST') {
                    const newDept = {
                        department_id: departments.length + 1,
                        department_name: body.department_name,
                        contact_email: body.contact_email || "",
                        contact_phone: body.contact_phone || ""
                    };
                    departments.push(newDept);
                    setStore('departments', departments);
                    return makeResponse(newDept, 201);
                }
            }

            // Route 7: Locations
            if (pathname === '/api/locations') {
                if (method === 'GET') {
                    const locsWithStats = locations.map(l => {
                        const count = complaints.filter(c => c.location_id === l.location_id).length;
                        return { ...l, complaint_count: count };
                    });
                    return makeResponse(locsWithStats);
                }
                if (method === 'POST') {
                    const newLoc = {
                        location_id: locations.length + 1,
                        address: body.address,
                        area: body.area,
                        city: body.city || "Bengaluru",
                        pincode: body.pincode || ""
                    };
                    locations.push(newLoc);
                    setStore('locations', locations);
                    return makeResponse(newLoc, 201);
                }
            }

            // Route 8: Admin Dashboard Stats
            if (pathname === '/api/dashboard' || pathname === '/api/stats') {
                const total = complaints.length;
                const statusCounts = { SUBMITTED: 0, ASSIGNED: 0, IN_PROGRESS: 0, RESOLVED: 0, CLOSED: 0, REJECTED: 0 };
                const priorityCounts = { LOW: 0, MEDIUM: 0, HIGH: 0, URGENT: 0 };

                complaints.forEach(c => {
                    const st = c.status ? c.status.replace('-', '_') : 'SUBMITTED';
                    statusCounts[st] = (statusCounts[st] || 0) + 1;
                    if (c.priority) priorityCounts[c.priority] = (priorityCounts[c.priority] || 0) + 1;
                });

                const catBreakdown = categories.map(cat => ({
                    category_id: cat.category_id,
                    category_name: cat.category_name,
                    complaint_count: complaints.filter(c => c.category_id === cat.category_id).length
                }));

                const deptBreakdown = departments.map(d => ({
                    department_id: d.department_id,
                    department_name: d.department_name,
                    complaint_count: complaints.filter(c => c.department_id === d.department_id).length
                }));

                return makeResponse({
                    total_complaints: total,
                    status_counts: statusCounts,
                    priority_counts: priorityCounts,
                    category_breakdown: catBreakdown,
                    department_breakdown: deptBreakdown
                });
            }

            // Route 9: Complaints List & Submit
            if (pathname === '/api/complaints' || pathname === '/api/complaints/submit') {
                if (method === 'GET') {
                    const phone = searchParams.get('phone');
                    const status = searchParams.get('status');
                    const priority = searchParams.get('priority');
                    const catId = searchParams.get('category_id');
                    const search = searchParams.get('search');

                    let filtered = [...complaints];
                    if (phone) {
                        filtered = filtered.filter(c => c.citizen_phone && c.citizen_phone.includes(phone.trim()));
                    }
                    if (status) {
                        filtered = filtered.filter(c => c.status === status);
                    }
                    if (priority) {
                        filtered = filtered.filter(c => c.priority === priority);
                    }
                    if (catId) {
                        filtered = filtered.filter(c => String(c.category_id) === String(catId));
                    }
                    if (search) {
                        const q = search.toLowerCase();
                        filtered = filtered.filter(c =>
                            (c.title && c.title.toLowerCase().includes(q)) ||
                            (c.display_id && c.display_id.toLowerCase().includes(q)) ||
                            (c.citizen_name && c.citizen_name.toLowerCase().includes(q))
                        );
                    }
                    return makeResponse(filtered);
                }

                if (method === 'POST') {
                    const newId = complaints.length + 1;
                    const catObj = categories.find(c => c.category_id === parseInt(body.category_id, 10)) || {};
                    const locObj = locations.find(l => l.location_id === parseInt(body.location_id, 10)) || {};

                    const newCmp = {
                        complaint_id: newId,
                        display_id: `CMP-${1000 + newId}`,
                        citizen_name: body.citizen_name,
                        citizen_phone: body.phone,
                        category_id: parseInt(body.category_id, 10),
                        category_name: catObj.category_name || "General",
                        location_id: parseInt(body.location_id, 10),
                        location_area: locObj.area || "",
                        location_address: locObj.address || "",
                        department_id: null,
                        department_name: "Pending Assignment",
                        title: body.title,
                        description: body.description,
                        priority: body.priority || "MEDIUM",
                        status: "SUBMITTED",
                        submitted_at: new Date().toISOString().replace('T', ' ').substring(0, 19),
                        resolved_at: null
                    };

                    complaints.unshift(newCmp);
                    setStore('complaints', complaints);

                    const newHist = {
                        history_id: history.length + 1,
                        complaint_id: newId,
                        old_status: null,
                        new_status: "SUBMITTED",
                        remarks: "Complaint logged by citizen via portal",
                        updated_by: body.citizen_name || "Citizen",
                        updated_at: newCmp.submitted_at
                    };
                    history.push(newHist);
                    setStore('history', history);

                    return makeResponse({
                        success: true,
                        complaint_id: newId,
                        display_id: newCmp.display_id,
                        message: "Complaint submitted successfully."
                    }, 201);
                }
            }

            // Route 10: Assign Department
            const assignMatch = pathname.match(/\/api\/complaints\/([^\/]+)\/assign/);
            if (assignMatch && method === 'POST') {
                const targetDbId = parseComplaintId(assignMatch[1]);
                const cmp = complaints.find(c => c.complaint_id === targetDbId);
                if (!cmp) return makeResponse({ error: "Complaint not found" }, 404);

                const deptObj = departments.find(d => d.department_id === parseInt(body.department_id, 10)) || {};
                const oldStatus = cmp.status;
                cmp.department_id = deptObj.department_id;
                cmp.department_name = deptObj.department_name;
                if (cmp.status === 'SUBMITTED') cmp.status = 'ASSIGNED';

                setStore('complaints', complaints);

                history.push({
                    history_id: history.length + 1,
                    complaint_id: targetDbId,
                    old_status: oldStatus,
                    new_status: cmp.status,
                    remarks: body.remarks || `Assigned to ${deptObj.department_name}`,
                    updated_by: "Municipal Admin",
                    updated_at: new Date().toISOString().replace('T', ' ').substring(0, 19)
                });
                setStore('history', history);

                return makeResponse({ success: true, message: "Department assigned successfully." });
            }

            // Route 11: Update Status
            const statusMatch = pathname.match(/\/api\/complaints\/([^\/]+)\/status/);
            if (statusMatch && (method === 'POST' || method === 'PUT')) {
                const targetDbId = parseComplaintId(statusMatch[1]);
                const cmp = complaints.find(c => c.complaint_id === targetDbId);
                if (!cmp) return makeResponse({ error: "Complaint not found" }, 404);

                const oldStatus = cmp.status;
                const newStatus = (body.status || 'IN_PROGRESS').replace('-', '_');
                cmp.status = newStatus;
                if (newStatus === 'RESOLVED') {
                    cmp.resolved_at = new Date().toISOString().replace('T', ' ').substring(0, 19);
                }

                setStore('complaints', complaints);

                history.push({
                    history_id: history.length + 1,
                    complaint_id: targetDbId,
                    old_status: oldStatus,
                    new_status: newStatus,
                    remarks: body.remarks || `Status transitioned to ${newStatus}`,
                    updated_by: body.updated_by || "Municipal Admin",
                    updated_at: new Date().toISOString().replace('T', ' ').substring(0, 19)
                });
                setStore('history', history);

                return makeResponse({ success: true, message: "Status updated successfully." });
            }

            // Route 12: Add Resolution
            const resMatch = pathname.match(/\/api\/complaints\/([^\/]+)\/resolve/);
            if (resMatch && method === 'POST') {
                const targetDbId = parseComplaintId(resMatch[1]);
                const cmp = complaints.find(c => c.complaint_id === targetDbId);
                if (!cmp) return makeResponse({ error: "Complaint not found" }, 404);

                const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
                cmp.status = 'RESOLVED';
                cmp.resolved_at = now;
                setStore('complaints', complaints);

                resolutions[targetDbId] = {
                    resolution_id: Object.keys(resolutions).length + 1,
                    complaint_id: targetDbId,
                    resolution_description: body.resolution_description || body.description,
                    resolved_by: body.resolved_by || "Engineering Division",
                    resolved_at: now
                };
                setStore('resolutions', resolutions);

                history.push({
                    history_id: history.length + 1,
                    complaint_id: targetDbId,
                    old_status: "IN_PROGRESS",
                    new_status: "RESOLVED",
                    remarks: `Official resolution logged: ${body.resolution_description || body.description}`,
                    updated_by: body.resolved_by || "Engineering Division",
                    updated_at: now
                });
                setStore('history', history);

                return makeResponse({ success: true, message: "Resolution logged successfully." });
            }

            // Route 13: Track / Single Complaint Inspection
            const singleCmpMatch = pathname.match(/\/api\/complaints\/([^\/]+)$/);
            if (singleCmpMatch && method === 'GET') {
                const targetDbId = parseComplaintId(singleCmpMatch[1]);
                const cmp = complaints.find(c => c.complaint_id === targetDbId);
                if (!cmp) return makeResponse({ error: "Complaint not found" }, 404);

                const cmpHistory = history.filter(h => h.complaint_id === targetDbId);
                const cmpResolution = resolutions[targetDbId] || null;

                return makeResponse({
                    ...cmp,
                    history: cmpHistory,
                    resolution: cmpResolution
                });
            }

            // Route 14: Complaint History Log
            if (pathname === '/api/complaint-history' || pathname === '/api/history') {
                const cmpIdParam = searchParams.get('complaint_id');
                let histList = [...history].reverse();
                if (cmpIdParam) {
                    const dbId = parseComplaintId(cmpIdParam);
                    histList = histList.filter(h => h.complaint_id === dbId);
                }
                return makeResponse(histList);
            }
        }

        // Fallback to original fetch for normal requests
        return originalFetch.apply(this, arguments);
    };
})();
