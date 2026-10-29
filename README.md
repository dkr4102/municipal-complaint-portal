# Municipal Complaint Management System

A complete, simple, and professional **Municipal Complaint Management System** developed as a **DBMS Hackathon Mini Project**.

🌐 **Live GitHub Pages URL**: [https://dkr4102.github.io/municipal-complaint-portal/](https://dkr4102.github.io/municipal-complaint-portal/)

### 🔑 Default Credentials
- **Admin**: `admin@gmail.com` / `admin@123`
- **Student**: `student@gmail.com` / `student@123`

---

- **Frontend**: HTML5, CSS3, Vanilla JavaScript (Modern custom CSS, responsive dashboard design, zero heavy frontend frameworks)
- **Backend**: Python 3.x, Flask
- **Database**: SQLite (`municipal_complaints.db`), 100% compatible with **DB Browser for SQLite**
- **Schema & Seed Files**: `schema.sql` and `seed.sql` included

---

## 🏛️ Project Architecture: Two Separate Dashboards

The application starts with a clean landing page where the user chooses which dashboard to open:

```text
                    HOME (/)
                     │
             ┌───────┴────────┐
             ▼                ▼
      USER DASHBOARD    ADMIN DASHBOARD
         (/user)           (/admin)
             │                │
       ┌─────┴─────┐    ┌─────┴──────────┐
       ▼           ▼    ▼                ▼
    Submit       Track Complaints    Categories
   Complaint    Complaint   │        Departments
       │                    │        Locations
       ▼                    ▼        History
   My Complaints       Assign Dept
                            │
                            ▼
                       Update Status
                            │
                            ▼
                         Resolve
```

### 1. User Dashboard (`/user`)
- **Submit Complaint**: Frictionless lodging form (Citizen Name, Phone, Title, Category, Description, Location, Priority). Generates a complaint ID (e.g. `CMP-1001`).
- **My Complaints**: Phone-based lookup (`Enter Phone Number [_____] [ Search ]`) showing all complaints filed by that citizen using SQL `JOIN`s.
- **Track Complaint**: Direct search by ID (`CMP-1001`). Renders a dynamic visual timeline:
  ```text
  ✓ SUBMITTED  ──►  ✓ ASSIGNED  ──►  ✓ IN PROGRESS  ──►  ○ RESOLVED  ──►  ○ CLOSED
  ```
- **Resolution Details**: Displays certified resolution action, certifying officer, and timestamp when resolved, or `"Resolution is not available yet."`
- **Back to Home**: One-click navigation back to landing page.

### 2. Admin Dashboard (`/admin`)
- **Live Statistics**: Dynamic SQL aggregate counters (`Total Complaints`, `Submitted`, `Assigned`, `In Progress`, `Resolved`, `Closed`).
- **Complaint Management**: Filter by search text, status, priority, and category.
- **Department Assignment**: Assign complaints to municipal departments, automatically transitioning status to `ASSIGNED` and logging to `complaint_history`.
- **Status Updates**: Update status to `IN_PROGRESS`, `RESOLVED`, `CLOSED`, or `REJECTED` with official remarks and officer name.
- **Add Resolution**: Mandates resolution description and resolved-by officer name, sets status to `RESOLVED`, records `resolved_at`, inserts into `resolutions` table, and logs to `complaint_history`.
- **Master Data**: Manage Categories (add/delete), Departments (add), and Locations (add).
- **Complaint History**: Full chronological audit trail table with complaint ID filter.
- **Back to Home**: One-click navigation back to landing page.

---

## 🗄️ Relational Database Schema (7 Tables)

Database file: `municipal_complaints.db`

1. **`citizens`**: `citizen_id` (PK), `citizen_name`, `phone`
2. **`categories`**: `category_id` (PK), `category_name` (UNIQUE), `description`
3. **`locations`**: `location_id` (PK), `address`, `area`, `city`, `pincode`
4. **`departments`**: `department_id` (PK), `department_name` (UNIQUE), `contact_email`, `contact_phone`
5. **`complaints`**: `complaint_id` (PK), `citizen_id` (FK), `category_id` (FK), `location_id` (FK), `department_id` (FK), `title`, `description`, `priority` (CHECK), `status` (CHECK), `submitted_at`, `resolved_at`
6. **`complaint_history`**: `history_id` (PK), `complaint_id` (FK), `old_status`, `new_status`, `remarks`, `updated_by`, `updated_at`
7. **`resolutions`**: `resolution_id` (PK), `complaint_id` (FK, UNIQUE), `resolution_description`, `resolved_by`, `resolved_at`

---

## 🚀 How to Run the Project

### Prerequisites
- Python 3.8+ installed

### Step 1: Install Dependencies
```bash
pip install -r requirements.txt
```

### Step 2: Start the Application
```bash
python run.py
```
or
```bash
python app.py
```

### Step 3: Open in Browser
Visit:
```
http://127.0.0.1:5000/
```
From the home page, click **Open Dashboard** under **USER DASHBOARD** or **ADMIN DASHBOARD**.

---

## 🎯 Hackathon Demonstration Flow

### 1. User Side Flow
1. Open `http://127.0.0.1:5000/` &rarr; Click **User Dashboard**.
2. Go to **Submit Complaint**:
   - Name: `Ramesh Kumar`
   - Phone: `9845012345`
   - Title: `Overflowing street garbage bin`
   - Category: `Garbage`
   - Priority: `HIGH`
   - Location: `Indiranagar`
   - Description: `Community garbage container has been overflowing for 2 days.`
   - Click **Submit Complaint**.
3. Observe generated Complaint ID: e.g. `CMP-1008`.
4. Click **Track This Complaint**:
   - Observe visual timeline showing `✓ SUBMITTED`.
   - Observe resolution note: `"Resolution is not available yet."`
5. Go to **My Complaints**:
   - Search phone `9845012345` &rarr; view all complaints filed by this citizen.

### 2. Admin Side Flow
1. Click **Back to Home** &rarr; Click **Admin Dashboard**.
2. On **Dashboard**: observe live aggregate counters updated from SQLite.
3. Go to **Complaints**:
   - Find complaint `CMP-1008`.
   - Click **Assign**: Choose `Sanitation Department` &rarr; Status becomes `ASSIGNED`.
   - Click **Status**: Change status to `IN_PROGRESS` with remarks `"Sanitation vehicle dispatched"`.
   - Click **Resolve**: Enter resolution description `"Garbage cleared and container washed"` and officer name `"Supervisor Rao"` &rarr; Status becomes `RESOLVED`.
   - Click **History**: Observe complete chronological audit trail.
4. Go to **Complaint History** tab: observe global audit log.

### 3. Verify in DB Browser for SQLite
1. Open **DB Browser for SQLite**.
2. Open `municipal_complaints.db`.
3. In **Browse Data**, verify that the records were properly inserted into:
   - `citizens`
   - `complaints`
   - `complaint_history`
   - `resolutions`
