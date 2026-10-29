"""
Municipal Complaint Management System - Flask Application
Backend API & Web Controller supporting User & Admin Dashboards
"""

import re
import sqlite3
from flask import Flask, render_template, request, jsonify, session, redirect, url_for
from database import get_db_connection, db_transaction, db_query, init_db, seed_data

app = Flask(__name__)
app.secret_key = "municipal_complaint_management_system_secure_key_2026"

@app.errorhandler(sqlite3.OperationalError)
def handle_sqlite_operational_error(e):
    err_str = str(e).lower()
    if "locked" in err_str or "busy" in err_str:
        return jsonify({
            "error": "The SQLite database is locked by DB Browser for SQLite. Please click 'Write Changes' (Ctrl+S) or close DB Browser, then retry."
        }), 503
    return jsonify({"error": str(e)}), 500

# Ensure tables and seed data are initialized on startup
with app.app_context():
    init_db()
    seed_data()


def parse_complaint_id(val):
    """Parses raw complaint ID or formatted string like CMP-1004 into an integer ID."""
    if val is None:
        return None
    val_str = str(val).strip().upper()
    match = re.match(r"^CMP-(\d+)$", val_str)
    if match:
        num = int(match.group(1))
        # If ID format is 1000 + db_id (e.g. 1001 -> 1)
        if num > 1000:
            return num - 1000
        return num
    if val_str.isdigit():
        return int(val_str)
    return None


def format_display_id(db_id):
    """Formats an integer database ID into a clean display code like CMP-1001."""
    if not db_id:
        return "CMP-0000"
    return f"CMP-{1000 + int(db_id)}"


# ==============================================================================
# HTML PAGE ROUTES
# ==============================================================================
@app.route("/")
def home():
    """Landing Home Page with Student & Admin Login and Registration."""
    return render_template("index.html")


@app.route("/user")
def user_dashboard():
    """User Dashboard for citizens and students (submit, view, track grievances)."""
    return render_template("user.html")


@app.route("/admin")
def admin_dashboard():
    """Admin Dashboard for municipal officers (manage, assign, resolve, audit)."""
    # Enforce admin authentication
    if session.get("user_role") != "admin":
        return redirect("/?auth_modal=admin&msg=Please+login+as+Admin+to+access+the+Admin+Dashboard")
    return render_template("admin.html")


# ==============================================================================
# AUTHENTICATION APIS (STUDENT / CITIZEN & ADMIN)
# ==============================================================================
@app.route("/api/auth/login", methods=["POST"])
def auth_login():
    """
    Authenticates admin or student users against the SQLite 'users' table.
    Accepts: { email, password, role }
    """
    data = request.get_json() or {}
    email = str(data.get("email", "")).strip().lower()
    password = str(data.get("password", "")).strip()
    role_requested = str(data.get("role", "")).strip().lower()

    if not email or not password:
        return jsonify({"error": "Email and password are required."}), 400

    with db_query() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM users WHERE LOWER(email) = ?", (email,))
        user = cursor.fetchone()

        if not user or user["password"] != password:
            return jsonify({"error": "Invalid email or password."}), 401

        # Check role permission
        user_role = user["role"]
        if role_requested:
            if role_requested == "admin" and user_role != "admin":
                return jsonify({"error": "Access denied. This account does not have Administrator privileges."}), 403
            if role_requested == "student" and user_role not in ("student", "user"):
                return jsonify({"error": "Please login using the Admin portal."}), 403

        # Store session
        session["user_id"] = user["user_id"]
        session["user_name"] = user["name"]
        session["user_email"] = user["email"]
        session["user_role"] = user["role"]
        session["user_phone"] = user["phone"] or ""

        redirect_url = "/admin" if user["role"] == "admin" else "/user"
        return jsonify({
            "success": True,
            "message": f"Welcome back, {user['name']}!",
            "user": {
                "user_id": user["user_id"],
                "name": user["name"],
                "email": user["email"],
                "role": user["role"],
                "phone": user["phone"] or ""
            },
            "redirect": redirect_url
        })


@app.route("/api/auth/register", methods=["POST"])
def auth_register():
    """
    Registers a new student/citizen user into the SQLite 'users' and 'citizens' tables.
    Accepts: { name, email, password, phone }
    """
    data = request.get_json() or {}
    name = str(data.get("name", "")).strip()
    email = str(data.get("email", "")).strip().lower()
    password = str(data.get("password", "")).strip()
    phone = str(data.get("phone", "")).strip()
    role = "student"

    if not name or not email or not password:
        return jsonify({"error": "Name, email, and password are required fields."}), 400

    if len(password) < 4:
        return jsonify({"error": "Password must be at least 4 characters long."}), 400

    with db_query() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT user_id FROM users WHERE LOWER(email) = ?", (email,))
        if cursor.fetchone():
            return jsonify({"error": "An account with this email already exists. Please log in."}), 409

    with db_transaction() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO users (name, email, password, role, phone)
            VALUES (?, ?, ?, ?, ?)
        """, (name, email, password, role, phone))
        new_id = cursor.lastrowid

        # Also register in citizens table if phone is provided
        if phone:
            cursor.execute("SELECT citizen_id FROM citizens WHERE phone = ?", (phone,))
            if not cursor.fetchone():
                cursor.execute("INSERT INTO citizens (citizen_name, phone) VALUES (?, ?)", (name, phone))

    # Log user into session automatically
    session["user_id"] = new_id
    session["user_name"] = name
    session["user_email"] = email
    session["user_role"] = role
    session["user_phone"] = phone

    return jsonify({
        "success": True,
        "message": "Account registered successfully!",
        "user": {
            "user_id": new_id,
            "name": name,
            "email": email,
            "role": role,
            "phone": phone
        },
        "redirect": "/user"
    }), 201


@app.route("/api/auth/me", methods=["GET"])
def auth_current_user():
    """Returns the currently authenticated user from the session, if any."""
    if "user_id" in session:
        return jsonify({
            "authenticated": True,
            "user": {
                "user_id": session.get("user_id"),
                "name": session.get("user_name"),
                "email": session.get("user_email"),
                "role": session.get("user_role"),
                "phone": session.get("user_phone", "")
            }
        })
    return jsonify({"authenticated": False, "user": None})


@app.route("/api/auth/logout", methods=["POST", "GET"])
def auth_logout():
    """Logs out the active user and clears the session."""
    session.clear()
    if request.method == "GET":
        return redirect("/")
    return jsonify({"success": True, "message": "Logged out successfully.", "redirect": "/"})


# ==============================================================================
# API: ADMIN DASHBOARD AGGREGATES
# ==============================================================================
@app.route("/api/dashboard", methods=["GET"])
@app.route("/api/stats", methods=["GET"])
def get_admin_dashboard_stats():
    """Returns live SQLite aggregate statistics for the Admin Dashboard."""
    with db_query() as conn:
        cursor = conn.cursor()

        # Total complaints count
        cursor.execute("SELECT COUNT(*) FROM complaints")
        total_complaints = cursor.fetchone()[0]

        # Status counts grouped by status
        cursor.execute("""
            SELECT status, COUNT(*) as count 
            FROM complaints 
            GROUP BY status
        """)
        status_counts = {row["status"]: row["count"] for row in cursor.fetchall()}

        for st in ["SUBMITTED", "ASSIGNED", "IN_PROGRESS", "RESOLVED", "CLOSED", "REJECTED"]:
            status_counts.setdefault(st, 0)

        # Priority counts
        cursor.execute("""
            SELECT priority, COUNT(*) as count 
            FROM complaints 
            GROUP BY priority
        """)
        priority_counts = {row["priority"]: row["count"] for row in cursor.fetchall()}
        for pr in ["LOW", "MEDIUM", "HIGH", "URGENT"]:
            priority_counts.setdefault(pr, 0)

        # Category breakdown
        cursor.execute("""
            SELECT c.category_id, c.category_name, COUNT(cmp.complaint_id) as complaint_count
            FROM categories c
            LEFT JOIN complaints cmp ON c.category_id = cmp.category_id
            GROUP BY c.category_id, c.category_name
            ORDER BY complaint_count DESC
        """)
        category_breakdown = [dict(row) for row in cursor.fetchall()]

        # Department breakdown
        cursor.execute("""
            SELECT d.department_id, d.department_name, COUNT(cmp.complaint_id) as complaint_count
            FROM departments d
            LEFT JOIN complaints cmp ON d.department_id = cmp.department_id
            GROUP BY d.department_id, d.department_name
            ORDER BY complaint_count DESC
        """)
        department_breakdown = [dict(row) for row in cursor.fetchall()]

        # Recent complaints for Admin
        cursor.execute("""
            SELECT 
                c.complaint_id,
                c.title,
                cz.citizen_name,
                cat.category_name,
                d.department_name,
                c.priority,
                c.status,
                c.submitted_at
            FROM complaints c
            JOIN citizens cz ON c.citizen_id = cz.citizen_id
            JOIN categories cat ON c.category_id = cat.category_id
            LEFT JOIN departments d ON c.department_id = d.department_id
            ORDER BY c.complaint_id DESC
            LIMIT 6
        """)
        recent_raw = [dict(r) for r in cursor.fetchall()]
        recent_complaints = []
        for r in recent_raw:
            r["display_id"] = format_display_id(r["complaint_id"])
            recent_complaints.append(r)

    return jsonify({
        "total_complaints": total_complaints,
        "submitted": status_counts["SUBMITTED"],
        "assigned": status_counts["ASSIGNED"],
        "in_progress": status_counts["IN_PROGRESS"],
        "resolved": status_counts["RESOLVED"],
        "closed": status_counts["CLOSED"],
        "rejected": status_counts["REJECTED"],
        "status_counts": status_counts,
        "priority_counts": priority_counts,
        "category_breakdown": category_breakdown,
        "department_breakdown": department_breakdown,
        "recent_complaints": recent_complaints
    })


# ==============================================================================
# API: USER DASHBOARD (CITIZEN PORTAL)
# ==============================================================================
@app.route("/api/user/stats", methods=["GET"])
def get_user_stats():
    """Returns citizen complaint statistics filtered by their phone number."""
    phone = (request.args.get("phone") or "").strip()

    if not phone:
        with db_query() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT COUNT(*) FROM complaints")
            total = cursor.fetchone()[0]
        return jsonify({
            "citizen_name": None,
            "total_complaints": total,
            "my_complaints": 0,
            "submitted": 0,
            "in_progress": 0,
            "resolved": 0,
            "recent_complaints": []
        })

    with db_query() as conn:
        cursor = conn.cursor()
        # Find citizen by phone
        cursor.execute("SELECT citizen_id, citizen_name, phone FROM citizens WHERE phone = ?", (phone,))
        citizen = cursor.fetchone()
        if not citizen:
            return jsonify({
                "citizen_name": None,
                "my_complaints": 0,
                "submitted": 0,
                "in_progress": 0,
                "resolved": 0,
                "recent_complaints": []
            })

        citizen_id = citizen["citizen_id"]

        cursor.execute("""
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN status = 'SUBMITTED' THEN 1 ELSE 0 END) as submitted,
                SUM(CASE WHEN status IN ('ASSIGNED', 'IN_PROGRESS') THEN 1 ELSE 0 END) as in_progress,
                SUM(CASE WHEN status IN ('RESOLVED', 'CLOSED') THEN 1 ELSE 0 END) as resolved
            FROM complaints 
            WHERE citizen_id = ?
        """, (citizen_id,))
        counts_row = cursor.fetchone()

        # Citizen's recent complaints
        cursor.execute("""
            SELECT 
                c.complaint_id,
                c.title,
                cat.category_name,
                c.priority,
                c.status,
                c.submitted_at
            FROM complaints c
            JOIN categories cat ON c.category_id = cat.category_id
            WHERE c.citizen_id = ?
            ORDER BY c.complaint_id DESC
            LIMIT 5
        """, (citizen_id,))
        recent = []
        for row in cursor.fetchall():
            item = dict(row)
            item["display_id"] = format_display_id(item["complaint_id"])
            recent.append(item)

        citizen_name = citizen["citizen_name"]
        citizen_phone = citizen["phone"]

    return jsonify({
        "citizen_name": citizen["citizen_name"],
        "phone": citizen["phone"],
        "my_complaints": counts_row["total"] or 0,
        "submitted": counts_row["submitted"] or 0,
        "in_progress": counts_row["in_progress"] or 0,
        "resolved": counts_row["resolved"] or 0,
        "recent_complaints": recent
    })


@app.route("/api/user/complaints", methods=["GET", "POST"])
def handle_user_complaints():
    """
    GET: Retrieve complaints belonging to a citizen (by phone).
    POST: Submit a new complaint by a citizen (auto-creates citizen, logs history).
    """
    if request.method == "POST":
        data = request.get_json() or {}
        citizen_name = (data.get("citizen_name") or "").strip()
        phone = (data.get("phone") or "").strip()
        title = (data.get("title") or "").strip()
        category_id = data.get("category_id")
        description = (data.get("description") or "").strip()
        location_id = data.get("location_id")
        priority = (data.get("priority") or "MEDIUM").strip().upper()

        if not citizen_name or not phone:
            return jsonify({"error": "Citizen Name and Phone Number are required"}), 400
        if not title:
            return jsonify({"error": "Complaint Title is required"}), 400
        if not category_id:
            return jsonify({"error": "Please select a Category"}), 400
        if not location_id:
            return jsonify({"error": "Please select a Location"}), 400
        if not description:
            return jsonify({"error": "Complaint Description is required"}), 400
        if priority not in ["LOW", "MEDIUM", "HIGH", "URGENT"]:
            priority = "MEDIUM"

        try:
            with db_transaction() as conn:
                cursor = conn.cursor()
                # 1. Check or insert citizen
                cursor.execute("SELECT citizen_id FROM citizens WHERE phone = ?", (phone,))
                existing = cursor.fetchone()
                if existing:
                    citizen_id = existing["citizen_id"]
                    cursor.execute("UPDATE citizens SET citizen_name = ? WHERE citizen_id = ?", (citizen_name, citizen_id))
                else:
                    cursor.execute("INSERT INTO citizens (citizen_name, phone) VALUES (?, ?)", (citizen_name, phone))
                    citizen_id = cursor.lastrowid

                # 2. Insert complaint
                cursor.execute("""
                    INSERT INTO complaints (
                        citizen_id, category_id, location_id, department_id,
                        title, description, priority, status
                    ) VALUES (?, ?, ?, NULL, ?, ?, ?, 'SUBMITTED')
                """, (citizen_id, category_id, location_id, title, description, priority))
                new_id = cursor.lastrowid

                # 3. Add first record to complaint_history
                cursor.execute("""
                    INSERT INTO complaint_history (
                        complaint_id, old_status, new_status, remarks, updated_by
                    ) VALUES (?, NULL, 'SUBMITTED', 'Complaint registered via Citizen Portal', ?)
                """, (new_id, citizen_name))

            display_id = format_display_id(new_id)
            return jsonify({
                "message": "Complaint Submitted Successfully!",
                "complaint_id": new_id,
                "display_id": display_id,
                "status": "SUBMITTED"
            }), 201

        except sqlite3.OperationalError as e:
            err_msg = str(e).lower()
            if "locked" in err_msg or "busy" in err_msg:
                return jsonify({
                    "error": "The SQLite database is locked by DB Browser for SQLite. Please click 'Write Changes' (Ctrl+S) in DB Browser or close it, then submit again."
                }), 503
            return jsonify({"error": str(e)}), 500
        except Exception as e:
            return jsonify({"error": str(e)}), 500

    # GET: fetch complaints for citizen by phone
    phone = (request.args.get("phone") or "").strip()
    if not phone:
        return jsonify([])

    with db_query() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT 
                c.complaint_id,
                c.title,
                cat.category_name,
                l.area as location_area,
                l.address as location_address,
                c.priority,
                c.status,
                c.submitted_at,
                c.resolved_at
            FROM complaints c
            JOIN citizens cz ON c.citizen_id = cz.citizen_id
            JOIN categories cat ON c.category_id = cat.category_id
            JOIN locations l ON c.location_id = l.location_id
            WHERE cz.phone = ?
            ORDER BY c.complaint_id DESC
        """, (phone,))
        complaints = []
        for r in cursor.fetchall():
            item = dict(r)
            item["display_id"] = format_display_id(item["complaint_id"])
            complaints.append(item)

    return jsonify(complaints)


@app.route("/api/user/complaints/<raw_id>", methods=["GET"])
def get_user_complaint_tracking(raw_id):
    """
    Returns complaint tracking details, structured visual timeline, 
    and formal resolution information.
    """
    cid = parse_complaint_id(raw_id)
    if not cid:
        return jsonify({"error": "Invalid Complaint ID"}), 400

    with db_query() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT 
                c.complaint_id,
                c.title,
                c.description,
                c.priority,
                c.status,
                c.submitted_at,
                c.resolved_at,
                cz.citizen_name,
                cz.phone as citizen_phone,
                cat.category_name,
                l.address as location_address,
                l.area as location_area,
                l.city as location_city,
                l.pincode as location_pincode,
                d.department_name,
                r.resolution_description,
                r.resolved_by,
                r.resolved_at as resolution_timestamp
            FROM complaints c
            JOIN citizens cz ON c.citizen_id = cz.citizen_id
            JOIN categories cat ON c.category_id = cat.category_id
            JOIN locations l ON c.location_id = l.location_id
            LEFT JOIN departments d ON c.department_id = d.department_id
            LEFT JOIN resolutions r ON c.complaint_id = r.complaint_id
            WHERE c.complaint_id = ?
        """, (cid,))
        row = cursor.fetchone()

        if not row:
            return jsonify({"error": "Complaint not found"}), 404

        complaint = dict(row)
        complaint["display_id"] = format_display_id(complaint["complaint_id"])

        # Fetch audit history
        cursor.execute("""
            SELECT history_id, old_status, new_status, remarks, updated_by, updated_at
            FROM complaint_history
            WHERE complaint_id = ?
            ORDER BY history_id ASC
        """, (cid,))
        history_records = [dict(h) for h in cursor.fetchall()]
        complaint["history"] = history_records

    # Construct visual timeline stages
    # Lifecycle: SUBMITTED -> ASSIGNED -> IN_PROGRESS -> RESOLVED -> CLOSED
    standard_stages = ["SUBMITTED", "ASSIGNED", "IN_PROGRESS", "RESOLVED", "CLOSED"]
    current_status = complaint["status"]

    # History statuses that have been reached
    reached_statuses = set()
    status_details = {}
    for h in history_records:
        reached_statuses.add(h["new_status"])
        status_details[h["new_status"]] = {
            "timestamp": h["updated_at"],
            "remarks": h["remarks"],
            "updated_by": h["updated_by"]
        }

    timeline = []
    status_order = {st: idx for idx, st in enumerate(standard_stages)}
    curr_idx = status_order.get(current_status, 0)

    for idx, stage in enumerate(standard_stages):
        is_done = False
        is_current = (stage == current_status)
        if current_status == "REJECTED":
            is_done = (stage == "SUBMITTED")
        elif stage in reached_statuses or idx <= curr_idx:
            is_done = True

        stage_info = status_details.get(stage, {})
        timeline.append({
            "stage": stage,
            "label": stage.replace("_", " "),
            "is_done": is_done,
            "is_current": is_current,
            "timestamp": stage_info.get("timestamp"),
            "remarks": stage_info.get("remarks"),
            "updated_by": stage_info.get("updated_by")
        })

    complaint["timeline"] = timeline

    # Resolution object
    if complaint["status"] == "RESOLVED" and (complaint["resolution_description"] or complaint["resolved_by"]):
        complaint["resolution"] = {
            "available": True,
            "description": complaint["resolution_description"],
            "resolved_by": complaint["resolved_by"],
            "resolved_at": complaint["resolution_timestamp"] or complaint["resolved_at"]
        }
    else:
        complaint["resolution"] = {
            "available": False
        }

    return jsonify(complaint)


# ==============================================================================
# API: ADMIN COMPLAINTS MANAGEMENT
# ==============================================================================
@app.route("/api/complaints", methods=["GET"])
def get_all_complaints():
    """Fetch complaints with filtering for the Admin Dashboard."""
    status = request.args.get("status")
    priority = request.args.get("priority")
    category_id = request.args.get("category_id")
    department_id = request.args.get("department_id")
    search = request.args.get("search")

    query = """
        SELECT 
            c.complaint_id,
            c.title,
            c.description,
            c.priority,
            c.status,
            c.submitted_at,
            c.resolved_at,
            cz.citizen_id,
            cz.citizen_name,
            cz.phone as citizen_phone,
            cat.category_id,
            cat.category_name,
            l.location_id,
            l.address as location_address,
            l.area as location_area,
            l.city as location_city,
            l.pincode as location_pincode,
            d.department_id,
            d.department_name,
            r.resolution_description,
            r.resolved_by
        FROM complaints c
        JOIN citizens cz ON c.citizen_id = cz.citizen_id
        JOIN categories cat ON c.category_id = cat.category_id
        JOIN locations l ON c.location_id = l.location_id
        LEFT JOIN departments d ON c.department_id = d.department_id
        LEFT JOIN resolutions r ON c.complaint_id = r.complaint_id
        WHERE 1=1
    """
    params = []

    if status:
        query += " AND c.status = ?"
        params.append(status)
    if priority:
        query += " AND c.priority = ?"
        params.append(priority)
    if category_id:
        query += " AND c.category_id = ?"
        params.append(category_id)
    if department_id:
        query += " AND c.department_id = ?"
        params.append(department_id)
    if search:
        search_pattern = f"%{search}%"
        parsed_id = parse_complaint_id(search)
        query += """ AND (
            c.title LIKE ? OR 
            c.description LIKE ? OR 
            cz.citizen_name LIKE ? OR 
            cz.phone LIKE ? OR 
            l.area LIKE ? OR 
            l.address LIKE ? OR 
            c.complaint_id = ?
        )"""
        params.extend([search_pattern, search_pattern, search_pattern, search_pattern, search_pattern, search_pattern, parsed_id if parsed_id else -1])

    query += " ORDER BY c.complaint_id DESC"

    with db_query() as conn:
        cursor = conn.cursor()
        cursor.execute(query, params)
        complaints = []
        for row in cursor.fetchall():
            item = dict(row)
            item["display_id"] = format_display_id(item["complaint_id"])
            complaints.append(item)

    return jsonify(complaints)


@app.route("/api/complaints/<raw_id>", methods=["GET"])
def get_admin_complaint_detail(raw_id):
    """Fetch single complaint detail for Admin."""
    cid = parse_complaint_id(raw_id)
    if not cid:
        return jsonify({"error": "Invalid Complaint ID"}), 400

    with db_query() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT 
                c.complaint_id,
                c.title,
                c.description,
                c.priority,
                c.status,
                c.submitted_at,
                c.resolved_at,
                cz.citizen_id,
                cz.citizen_name,
                cz.phone as citizen_phone,
                cat.category_id,
                cat.category_name,
                l.location_id,
                l.address as location_address,
                l.area as location_area,
                l.city as location_city,
                l.pincode as location_pincode,
                d.department_id,
                d.department_name,
                r.resolution_id,
                r.resolution_description,
                r.resolved_by,
                r.resolved_at as resolution_timestamp
            FROM complaints c
            JOIN citizens cz ON c.citizen_id = cz.citizen_id
            JOIN categories cat ON c.category_id = cat.category_id
            JOIN locations l ON c.location_id = l.location_id
            LEFT JOIN departments d ON c.department_id = d.department_id
            LEFT JOIN resolutions r ON c.complaint_id = r.complaint_id
            WHERE c.complaint_id = ?
        """, (cid,))
        row = cursor.fetchone()

        if not row:
            return jsonify({"error": "Complaint not found"}), 404

        complaint = dict(row)
        complaint["display_id"] = format_display_id(complaint["complaint_id"])

        # Audit history
        cursor.execute("""
            SELECT history_id, old_status, new_status, remarks, updated_by, updated_at
            FROM complaint_history
            WHERE complaint_id = ?
            ORDER BY history_id ASC
        """, (cid,))
        complaint["history"] = [dict(h) for h in cursor.fetchall()]

    return jsonify(complaint)


@app.route("/api/complaints/<raw_id>/department", methods=["POST"])
def assign_complaint_department(raw_id):
    """Assigns department to a complaint, changes status to ASSIGNED if submitted, logs history."""
    cid = parse_complaint_id(raw_id)
    if not cid:
        return jsonify({"error": "Invalid Complaint ID"}), 400

    data = request.get_json() or {}
    department_id = data.get("department_id")
    remarks = (data.get("remarks") or "Department assigned by municipal administrator").strip()
    updated_by = (data.get("updated_by") or "Municipal Administrator").strip()

    if not department_id:
        return jsonify({"error": "Please select a Department"}), 400

    with db_transaction() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT status, department_id FROM complaints WHERE complaint_id = ?", (cid,))
        current = cursor.fetchone()
        if not current:
            return jsonify({"error": "Complaint not found"}), 404

        old_status = current["status"]
        new_status = "ASSIGNED" if old_status == "SUBMITTED" else old_status

        cursor.execute("SELECT department_name FROM departments WHERE department_id = ?", (department_id,))
        dept_row = cursor.fetchone()
        dept_name = dept_row["department_name"] if dept_row else "Department"

        # Update complaint
        cursor.execute("""
            UPDATE complaints 
            SET department_id = ?, status = ?
            WHERE complaint_id = ?
        """, (department_id, new_status, cid))

        # Log to history
        cursor.execute("""
            INSERT INTO complaint_history (
                complaint_id, old_status, new_status, remarks, updated_by
            ) VALUES (?, ?, ?, ?, ?)
        """, (cid, old_status, new_status, f"Assigned to {dept_name}. {remarks}", updated_by))

    return jsonify({
        "message": f"Assigned to {dept_name} successfully",
        "complaint_id": cid,
        "status": new_status,
        "department_id": department_id
    })


@app.route("/api/complaints/<raw_id>/status", methods=["POST"])
def update_status(raw_id):
    """Updates complaint status and logs audit entry."""
    cid = parse_complaint_id(raw_id)
    if not cid:
        return jsonify({"error": "Invalid Complaint ID"}), 400

    data = request.get_json() or {}
    new_status = (data.get("new_status") or "").strip().upper()
    remarks = (data.get("remarks") or "").strip()
    updated_by = (data.get("updated_by") or "Municipal Officer").strip()

    valid_statuses = ["SUBMITTED", "ASSIGNED", "IN_PROGRESS", "RESOLVED", "CLOSED", "REJECTED"]
    if new_status not in valid_statuses:
        return jsonify({"error": f"Invalid status. Must be one of {valid_statuses}"}), 400

    with db_transaction() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT status FROM complaints WHERE complaint_id = ?", (cid,))
        current = cursor.fetchone()
        if not current:
            return jsonify({"error": "Complaint not found"}), 404

        old_status = current["status"]

        cursor.execute("UPDATE complaints SET status = ? WHERE complaint_id = ?", (new_status, cid))
        cursor.execute("""
            INSERT INTO complaint_history (complaint_id, old_status, new_status, remarks, updated_by)
            VALUES (?, ?, ?, ?, ?)
        """, (cid, old_status, new_status, remarks or f"Status updated to {new_status}", updated_by))

    return jsonify({
        "message": f"Status updated to {new_status}",
        "complaint_id": cid,
        "old_status": old_status,
        "new_status": new_status
    })


@app.route("/api/complaints/<raw_id>/resolution", methods=["POST"])
def add_complaint_resolution(raw_id):
    """Records formal resolution details and marks complaint as RESOLVED."""
    cid = parse_complaint_id(raw_id)
    if not cid:
        return jsonify({"error": "Invalid Complaint ID"}), 400

    data = request.get_json() or {}
    resolution_desc = (data.get("resolution_description") or "").strip()
    resolved_by = (data.get("resolved_by") or "").strip()
    remarks = (data.get("remarks") or "Complaint resolved").strip()

    if not resolution_desc:
        return jsonify({"error": "Resolution description is required"}), 400
    if not resolved_by:
        return jsonify({"error": "Resolved by (officer/department name) is required"}), 400

    with db_transaction() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT status FROM complaints WHERE complaint_id = ?", (cid,))
        current = cursor.fetchone()
        if not current:
            return jsonify({"error": "Complaint not found"}), 404

        old_status = current["status"]

        # 1. Update complaint
        cursor.execute("""
            UPDATE complaints 
            SET status = 'RESOLVED', resolved_at = CURRENT_TIMESTAMP
            WHERE complaint_id = ?
        """, (cid,))

        # 2. Insert or replace in resolutions table
        cursor.execute("""
            INSERT INTO resolutions (complaint_id, resolution_description, resolved_by, resolved_at)
            VALUES (?, ?, ?, CURRENT_TIMESTAMP)
            ON CONFLICT(complaint_id) DO UPDATE SET
                resolution_description = excluded.resolution_description,
                resolved_by = excluded.resolved_by,
                resolved_at = CURRENT_TIMESTAMP
        """, (cid, resolution_desc, resolved_by))

        # 3. Add record to complaint_history
        cursor.execute("""
            INSERT INTO complaint_history (complaint_id, old_status, new_status, remarks, updated_by)
            VALUES (?, ?, 'RESOLVED', ?, ?)
        """, (cid, old_status, remarks, resolved_by))

    return jsonify({
        "message": "Resolution saved and complaint marked as RESOLVED",
        "complaint_id": cid,
        "status": "RESOLVED",
        "resolved_by": resolved_by
    })


# ==============================================================================
# API: MASTER DATA (CATEGORIES, DEPARTMENTS, LOCATIONS, HISTORY)
# ==============================================================================
@app.route("/api/categories", methods=["GET", "POST"])
def handle_categories():
    if request.method == "POST":
        data = request.get_json() or {}
        category_name = (data.get("category_name") or "").strip()
        description = (data.get("description") or "").strip()

        if not category_name:
            return jsonify({"error": "Category name is required"}), 400

        try:
            with db_transaction() as conn:
                cursor = conn.cursor()
                cursor.execute(
                    "INSERT INTO categories (category_name, description) VALUES (?, ?)",
                    (category_name, description)
                )
                new_id = cursor.lastrowid
            return jsonify({"message": "Category added successfully", "category_id": new_id}), 201
        except Exception as e:
            return jsonify({"error": str(e)}), 400

    with db_query() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT c.category_id, c.category_name, c.description, COUNT(cmp.complaint_id) as complaint_count
            FROM categories c
            LEFT JOIN complaints cmp ON c.category_id = cmp.category_id
            GROUP BY c.category_id
            ORDER BY c.category_name ASC
        """)
        categories = [dict(row) for row in cursor.fetchall()]

    return jsonify(categories)


@app.route("/api/categories/<int:category_id>", methods=["DELETE"])
def delete_category(category_id):
    with db_transaction() as conn:
        cursor = conn.cursor()
        # Check if category is in use
        cursor.execute("SELECT COUNT(*) FROM complaints WHERE category_id = ?", (category_id,))
        in_use = cursor.fetchone()[0]
        if in_use > 0:
            return jsonify({"error": f"Cannot delete category: {in_use} complaints are linked to it."}), 400

        cursor.execute("DELETE FROM categories WHERE category_id = ?", (category_id,))

    return jsonify({"message": "Category deleted successfully"})


@app.route("/api/departments", methods=["GET", "POST"])
def handle_departments():
    if request.method == "POST":
        data = request.get_json() or {}
        dept_name = (data.get("department_name") or "").strip()
        email = (data.get("contact_email") or "").strip()
        phone = (data.get("contact_phone") or "").strip()

        if not dept_name:
            return jsonify({"error": "Department name is required"}), 400

        try:
            with db_transaction() as conn:
                cursor = conn.cursor()
                cursor.execute(
                    "INSERT INTO departments (department_name, contact_email, contact_phone) VALUES (?, ?, ?)",
                    (dept_name, email, phone)
                )
                new_id = cursor.lastrowid
            return jsonify({"message": "Department added successfully", "department_id": new_id}), 201
        except Exception as e:
            return jsonify({"error": str(e)}), 400

    with db_query() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT 
                d.department_id, 
                d.department_name, 
                d.contact_email, 
                d.contact_phone,
                COUNT(cmp.complaint_id) as total_assigned,
                SUM(CASE WHEN cmp.status IN ('SUBMITTED', 'ASSIGNED', 'IN_PROGRESS') THEN 1 ELSE 0 END) as active_count
            FROM departments d
            LEFT JOIN complaints cmp ON d.department_id = cmp.department_id
            GROUP BY d.department_id
            ORDER BY d.department_name ASC
        """)
        departments = [dict(row) for row in cursor.fetchall()]

    return jsonify(departments)


@app.route("/api/locations", methods=["GET", "POST"])
def handle_locations():
    if request.method == "POST":
        data = request.get_json() or {}
        address = (data.get("address") or "").strip()
        area = (data.get("area") or "").strip()
        city = (data.get("city") or "").strip()
        pincode = (data.get("pincode") or "").strip()

        if not address or not area or not city:
            return jsonify({"error": "Address, Area, and City are required"}), 400

        try:
            with db_transaction() as conn:
                cursor = conn.cursor()
                cursor.execute(
                    "INSERT INTO locations (address, area, city, pincode) VALUES (?, ?, ?, ?)",
                    (address, area, city, pincode)
                )
                new_id = cursor.lastrowid
            return jsonify({"message": "Location added successfully", "location_id": new_id}), 201
        except Exception as e:
            return jsonify({"error": str(e)}), 400

    with db_query() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT 
                l.location_id, 
                l.address, 
                l.area, 
                l.city, 
                l.pincode,
                COUNT(cmp.complaint_id) as complaint_count
            FROM locations l
            LEFT JOIN complaints cmp ON l.location_id = cmp.location_id
            GROUP BY l.location_id
            ORDER BY l.area ASC
        """)
        locations = [dict(row) for row in cursor.fetchall()]

    return jsonify(locations)


@app.route("/api/history", methods=["GET"])
def get_audit_history():
    """Returns all complaint history or filtered by complaint_id."""
    raw_id = request.args.get("complaint_id")
    cid = parse_complaint_id(raw_id) if raw_id else None

    query = """
        SELECT 
            h.history_id,
            h.complaint_id,
            h.old_status,
            h.new_status,
            h.remarks,
            h.updated_by,
            h.updated_at,
            c.title as complaint_title,
            cz.citizen_name,
            cat.category_name,
            d.department_name
        FROM complaint_history h
        JOIN complaints c ON h.complaint_id = c.complaint_id
        JOIN citizens cz ON c.citizen_id = cz.citizen_id
        JOIN categories cat ON c.category_id = cat.category_id
        LEFT JOIN departments d ON c.department_id = d.department_id
        WHERE 1=1
    """
    params = []
    if cid:
        query += " AND h.complaint_id = ?"
        params.append(cid)

    query += " ORDER BY h.history_id DESC LIMIT 150"

    with db_query() as conn:
        cursor = conn.cursor()
        cursor.execute(query, params)
        history = []
        for row in cursor.fetchall():
            item = dict(row)
            item["display_id"] = format_display_id(item["complaint_id"])
            history.append(item)

    return jsonify(history)


if __name__ == "__main__":
    app.run(debug=True, host="127.0.0.1", port=5000)
