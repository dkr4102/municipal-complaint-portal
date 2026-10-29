"""
Municipal Complaint Management System - Database Configuration & Initialization
File: database.py
Compatible with DB Browser for SQLite.
Database: municipal_complaints.db
"""

import os
import sqlite3
from datetime import datetime

from contextlib import contextmanager
import shutil
import time

DB_NAME = "municipal_complaints.db"
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
BUNDLED_DB = os.path.join(BASE_DIR, DB_NAME)

if os.environ.get("VERCEL"):
    DB_PATH = "/tmp/municipal_complaints.db"
    if not os.path.exists(DB_PATH) and os.path.exists(BUNDLED_DB):
        shutil.copy2(BUNDLED_DB, DB_PATH)
else:
    DB_PATH = BUNDLED_DB


def get_db_connection():
    """Returns a SQLite connection with 30s busy timeout and foreign keys enabled."""
    if os.environ.get("VERCEL") and not os.path.exists(DB_PATH) and os.path.exists(BUNDLED_DB):
        shutil.copy2(BUNDLED_DB, DB_PATH)
    conn = sqlite3.connect(DB_PATH, timeout=30.0)
    conn.execute("PRAGMA busy_timeout = 30000;")
    conn.execute("PRAGMA synchronous = NORMAL;")
    conn.execute("PRAGMA foreign_keys = ON;")
    conn.row_factory = sqlite3.Row
    return conn


@contextmanager
def db_transaction(retries=5, delay=0.4):
    """
    Context manager for database write operations using BEGIN IMMEDIATE.
    Guarantees proper lock acquisition, retries on busy/locked conditions,
    and ensures the connection is always closed.
    """
    last_error = None
    for attempt in range(retries):
        conn = None
        try:
            conn = get_db_connection()
            conn.execute("BEGIN IMMEDIATE")
            yield conn
            conn.commit()
            return
        except sqlite3.OperationalError as e:
            last_error = e
            if conn:
                try:
                    conn.rollback()
                except Exception:
                    pass
            err_msg = str(e).lower()
            if "locked" in err_msg or "busy" in err_msg:
                if attempt < retries - 1:
                    time.sleep(delay)
                    continue
            raise
        except Exception:
            if conn:
                try:
                    conn.rollback()
                except Exception:
                    pass
            raise
        finally:
            if conn:
                try:
                    conn.close()
                except Exception:
                    pass
    if last_error:
        raise last_error


@contextmanager
def db_query():
    """Context manager for read-only queries. Ensures connection is always closed."""
    conn = get_db_connection()
    try:
        yield conn
    finally:
        try:
            conn.close()
        except Exception:
            pass


def init_db():
    """Creates the 7 database tables with constraints if they do not exist."""
    conn = get_db_connection()
    conn.execute("PRAGMA journal_mode = WAL;")
    cursor = conn.cursor()

    # Table 1: citizens
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS citizens (
        citizen_id INTEGER PRIMARY KEY AUTOINCREMENT,
        citizen_name TEXT NOT NULL,
        phone TEXT NOT NULL
    );
    """)

    # Table 2: categories
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS categories (
        category_id INTEGER PRIMARY KEY AUTOINCREMENT,
        category_name TEXT NOT NULL UNIQUE,
        description TEXT
    );
    """)

    # Table 3: locations
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS locations (
        location_id INTEGER PRIMARY KEY AUTOINCREMENT,
        address TEXT NOT NULL,
        area TEXT NOT NULL,
        city TEXT NOT NULL,
        pincode TEXT
    );
    """)

    # Table 4: departments
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS departments (
        department_id INTEGER PRIMARY KEY AUTOINCREMENT,
        department_name TEXT NOT NULL UNIQUE,
        contact_email TEXT,
        contact_phone TEXT
    );
    """)

    # Table 5: complaints
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS complaints (
        complaint_id INTEGER PRIMARY KEY AUTOINCREMENT,
        citizen_id INTEGER NOT NULL,
        category_id INTEGER NOT NULL,
        location_id INTEGER NOT NULL,
        department_id INTEGER,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        priority TEXT NOT NULL DEFAULT 'MEDIUM',
        status TEXT NOT NULL DEFAULT 'SUBMITTED',
        submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        resolved_at DATETIME,
        FOREIGN KEY (citizen_id) REFERENCES citizens(citizen_id),
        FOREIGN KEY (category_id) REFERENCES categories(category_id),
        FOREIGN KEY (location_id) REFERENCES locations(location_id),
        FOREIGN KEY (department_id) REFERENCES departments(department_id),
        CHECK(priority IN ('LOW', 'MEDIUM', 'HIGH', 'URGENT')),
        CHECK(status IN ('SUBMITTED', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'REJECTED'))
    );
    """)

    # Table 6: complaint_history
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS complaint_history (
        history_id INTEGER PRIMARY KEY AUTOINCREMENT,
        complaint_id INTEGER NOT NULL,
        old_status TEXT,
        new_status TEXT NOT NULL,
        remarks TEXT,
        updated_by TEXT,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (complaint_id) REFERENCES complaints(complaint_id)
    );
    """)

    # Table 7: resolutions
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS resolutions (
        resolution_id INTEGER PRIMARY KEY AUTOINCREMENT,
        complaint_id INTEGER NOT NULL UNIQUE,
        resolution_description TEXT NOT NULL,
        resolved_by TEXT NOT NULL,
        resolved_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (complaint_id) REFERENCES complaints(complaint_id)
    );
    """)

    # Table 8: users (Authentication)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS users (
        user_id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'student',
        phone TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        CHECK(role IN ('admin', 'student', 'user'))
    );
    """)

    conn.commit()
    conn.close()
    print("Database tables verified/created successfully.")


def seed_data():
    """Populates the database with initial sample data if tables are empty."""
    conn = get_db_connection()
    cursor = conn.cursor()

    # Check if categories already seeded
    cursor.execute("SELECT COUNT(*) FROM categories")
    if cursor.fetchone()[0] == 0:
        # Seed categories
        categories = [
            ("Garbage", "Solid waste collection, litter clearing, and dustbin maintenance"),
            ("Water Supply", "Pipeline leaks, water pressure problems, contamination, and tanker supply"),
            ("Road", "Potholes, road resurfacing, illegal road cutting, and footpath repairs"),
            ("Street Light", "Faulty lamp posts, flickering street lights, and dark junction spots"),
            ("Drainage", "Blocked storm drains, sewage overflow, and open manholes")
        ]
        cursor.executemany("INSERT INTO categories (category_name, description) VALUES (?, ?)", categories)

    # Check if departments already seeded
    cursor.execute("SELECT COUNT(*) FROM departments")
    if cursor.fetchone()[0] == 0:
        # Seed departments
        departments = [
            ("Sanitation Department", "sanitation@municipal.gov.in", "+91 98765 43210"),
            ("Water Supply Department", "watersupply@municipal.gov.in", "+91 98765 43211"),
            ("Road Department", "roads@municipal.gov.in", "+91 98765 43212"),
            ("Electrical Department", "electrical@municipal.gov.in", "+91 98765 43213"),
            ("Drainage Department", "drainage@municipal.gov.in", "+91 98765 43214")
        ]
        cursor.executemany(
            "INSERT INTO departments (department_name, contact_email, contact_phone) VALUES (?, ?, ?)",
            departments
        )

    # Check if locations already seeded
    cursor.execute("SELECT COUNT(*) FROM locations")
    if cursor.fetchone()[0] == 0:
        # Seed at least 5 locations
        locations = [
            ("Near Metro Pillar 42, Outer Ring Road", "Indiranagar", "Bengaluru", "560038"),
            ("Opposite City Hospital, 4th Main", "Jayanagar", "Bengaluru", "560011"),
            ("Crossroad 7, Market Yard", "Koramangala", "Bengaluru", "560034"),
            ("Plot 15, Lake View Road", "Whitefield", "Bengaluru", "560066"),
            ("Near Government School, Ward 12", "Malleshwaram", "Bengaluru", "560003"),
            ("Railway Station Approach Road", "Shivajinagar", "Bengaluru", "560051")
        ]
        cursor.executemany(
            "INSERT INTO locations (address, area, city, pincode) VALUES (?, ?, ?, ?)",
            locations
        )

    # Check if citizens already seeded
    cursor.execute("SELECT COUNT(*) FROM citizens")
    if cursor.fetchone()[0] == 0:
        citizens = [
            ("Rajesh Kumar", "9845012345"),
            ("Priya Sharma", "9845123456"),
            ("Anand Verma", "9845234567"),
            ("Sunita Patil", "9845345678"),
            ("Mohammed Farhan", "9845456789")
        ]
        cursor.executemany("INSERT INTO citizens (citizen_name, phone) VALUES (?, ?)", citizens)

    # Check if complaints already seeded
    cursor.execute("SELECT COUNT(*) FROM complaints")
    if cursor.fetchone()[0] == 0:
        sample_complaints = [
            (
                1, 1, 1, 1,
                "Overflowing community garbage container",
                "The municipal garbage bin on the corner has not been emptied for 3 days and waste is spilling onto the street.",
                "HIGH", "ASSIGNED", "2026-09-15 09:30:00", None
            ),
            (
                2, 2, 2, 2,
                "Underground main pipeline leak causing water logging",
                "A clean drinking water pipeline burst in front of City Hospital leading to gallons of water wasted.",
                "URGENT", "IN_PROGRESS", "2026-09-16 11:15:00", None
            ),
            (
                3, 3, 3, 3,
                "Dangerous deep pothole near junction",
                "Large pothole in the middle of Crossroad 7 causing frequent traffic jams and two-wheeler skids.",
                "MEDIUM", "SUBMITTED", "2026-09-17 14:00:00", None
            ),
            (
                4, 4, 4, 4,
                "Street lights non-operational for entire lane",
                "Six consecutive street light poles on Lake View Road are not turning on at night, causing safety concerns.",
                "HIGH", "RESOLVED", "2026-09-14 19:45:00", "2026-09-16 16:30:00"
            ),
            (
                5, 5, 5, 5,
                "Blocked stormwater drain ahead of monsoon",
                "Silt and plastic waste clogging stormwater drain causing overflow near the government school.",
                "MEDIUM", "IN_PROGRESS", "2026-09-15 16:20:00", None
            )
        ]

        cursor.executemany("""
            INSERT INTO complaints (
                citizen_id, category_id, location_id, department_id,
                title, description, priority, status, submitted_at, resolved_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, sample_complaints)

        # Seed Complaint History
        history_records = [
            (1, None, "SUBMITTED", "Complaint logged by citizen via portal", "System", "2026-09-15 09:30:00"),
            (1, "SUBMITTED", "ASSIGNED", "Assigned to Sanitation Department Ward 4 Team", "Municipal Admin", "2026-09-15 10:15:00"),

            (2, None, "SUBMITTED", "Emergency water leakage reported", "System", "2026-09-16 11:15:00"),
            (2, "SUBMITTED", "ASSIGNED", "Assigned to Water Emergency Response Squad", "Helpdesk Officer", "2026-09-16 11:45:00"),
            (2, "ASSIGNED", "IN_PROGRESS", "Excavation and pipe replacement underway", "Field Engineer Rao", "2026-09-16 13:00:00"),

            (3, None, "SUBMITTED", "Pothole complaint registered", "System", "2026-09-17 14:00:00"),

            (4, None, "SUBMITTED", "Street light outage registered", "System", "2026-09-14 19:45:00"),
            (4, "SUBMITTED", "ASSIGNED", "Assigned to Electrical Maintenance Team", "Admin Officer", "2026-09-15 08:30:00"),
            (4, "ASSIGNED", "IN_PROGRESS", "Technician dispatched with replacement LED fixtures", "EE Prakash", "2026-09-15 11:00:00"),
            (4, "IN_PROGRESS", "RESOLVED", "All six sodium vapor fixtures replaced with 90W LED lamps. Circuit restored.", "Inspector Ramesh", "2026-09-16 16:30:00"),

            (5, None, "SUBMITTED", "Drain blockage complaint logged", "System", "2026-09-15 16:20:00"),
            (5, "SUBMITTED", "ASSIGNED", "Assigned to Drainage Clearance Squad", "Helpdesk Officer", "2026-09-16 09:00:00"),
            (5, "ASSIGNED", "IN_PROGRESS", "Suction vehicle and manual desilting in progress", "Sanitary Inspector Dev", "2026-09-17 10:00:00")
        ]

        cursor.executemany("""
            INSERT INTO complaint_history (
                complaint_id, old_status, new_status, remarks, updated_by, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?)
        """, history_records)

        # Seed Resolution for complaint #4
        cursor.execute("""
            INSERT INTO resolutions (
                complaint_id, resolution_description, resolved_by, resolved_at
            ) VALUES (?, ?, ?, ?)
        """, (
            4,
            "Replaced 6 faulty fixtures with high-efficiency 90W LED lamps and replaced damaged underground cable segment. Tested and working normally.",
            "Junior Engineer K. Suresh (Electrical Division)",
            "2026-09-16 16:30:00"
        ))

    # Check and seed admin user
    cursor.execute("SELECT COUNT(*) FROM users WHERE email = 'admin@gmail.com'")
    if cursor.fetchone()[0] == 0:
        cursor.execute("""
            INSERT INTO users (name, email, password, role, phone)
            VALUES (?, ?, ?, ?, ?)
        """, ("System Administrator", "admin@gmail.com", "admin@123", "admin", "9876543210"))
        print("Admin user seeded: admin@gmail.com")

    # Check and seed default student user
    cursor.execute("SELECT COUNT(*) FROM users WHERE email = 'student@gmail.com'")
    if cursor.fetchone()[0] == 0:
        cursor.execute("""
            INSERT INTO users (name, email, password, role, phone)
            VALUES (?, ?, ?, ?, ?)
        """, ("Ramesh Kumar (Student)", "student@gmail.com", "student@123", "student", "9845012345"))
        print("Default student user seeded: student@gmail.com")

    conn.commit()
    conn.close()
    print("Seed data verification completed.")


if __name__ == "__main__":
    init_db()
    seed_data()
