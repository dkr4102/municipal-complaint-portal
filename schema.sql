-- =============================================================================
-- MUNICIPAL COMPLAINT MANAGEMENT SYSTEM - DATABASE SCHEMA (DDL)
-- Database: municipal_complaints.db (SQLite 3)
-- Compatible with DB Browser for SQLite
-- =============================================================================

PRAGMA foreign_keys = ON;

-- Table 1: citizens
CREATE TABLE IF NOT EXISTS citizens (
    citizen_id INTEGER PRIMARY KEY AUTOINCREMENT,
    citizen_name TEXT NOT NULL,
    phone TEXT NOT NULL
);

-- Table 2: categories
CREATE TABLE IF NOT EXISTS categories (
    category_id INTEGER PRIMARY KEY AUTOINCREMENT,
    category_name TEXT NOT NULL UNIQUE,
    description TEXT
);

-- Table 3: locations
CREATE TABLE IF NOT EXISTS locations (
    location_id INTEGER PRIMARY KEY AUTOINCREMENT,
    address TEXT NOT NULL,
    area TEXT NOT NULL,
    city TEXT NOT NULL,
    pincode TEXT
);

-- Table 4: departments
CREATE TABLE IF NOT EXISTS departments (
    department_id INTEGER PRIMARY KEY AUTOINCREMENT,
    department_name TEXT NOT NULL UNIQUE,
    contact_email TEXT,
    contact_phone TEXT
);

-- Table 5: complaints
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

-- Table 6: complaint_history
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

-- Table 7: resolutions
CREATE TABLE IF NOT EXISTS resolutions (
    resolution_id INTEGER PRIMARY KEY AUTOINCREMENT,
    complaint_id INTEGER NOT NULL UNIQUE,
    resolution_description TEXT NOT NULL,
    resolved_by TEXT NOT NULL,
    resolved_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (complaint_id) REFERENCES complaints(complaint_id)
);

-- Table 8: users (Authentication: Admin & Student/Citizen)
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

