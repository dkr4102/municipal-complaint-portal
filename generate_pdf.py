"""
Generate PDF Documentation for Municipal Complaint Management System
Converts a professionally styled HTML report into a publication-ready PDF using Microsoft Edge / Chrome headless.
"""

import os
import subprocess
import sys

OUTPUT_HTML = os.path.join(os.path.dirname(os.path.abspath(__file__)), "dbms_documentation.html")
OUTPUT_PDF = os.path.join(os.path.dirname(os.path.abspath(__file__)), "Municipal_Complaint_Management_System_DBMS_Documentation.pdf")

HTML_CONTENT = """<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Municipal Complaint Management System - DBMS Project Documentation</title>
    <style>
        @page {
            size: A4;
            margin: 13mm 15mm 13mm 15mm;
            @bottom-right {
                content: counter(page);
                font-size: 9pt;
                color: #64748b;
            }
        }

        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            color: #0f172a;
            background: #ffffff;
            line-height: 1.45;
            font-size: 9.5pt;
        }

        /* Header / Cover Banner */
        .doc-header {
            border-bottom: 2.5px solid #1d4ed8;
            padding-bottom: 12px;
            margin-bottom: 16px;
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
        }

        .doc-title-group h1 {
            font-size: 19pt;
            font-weight: 800;
            color: #0f172a;
            letter-spacing: -0.5px;
            margin-bottom: 3px;
        }

        .doc-title-group h2 {
            font-size: 10.5pt;
            font-weight: 600;
            color: #1d4ed8;
            text-transform: uppercase;
            letter-spacing: 0.8px;
        }

        .doc-meta {
            text-align: right;
            font-size: 8pt;
            color: #475569;
            line-height: 1.35;
        }

        .doc-meta strong {
            color: #0f172a;
        }

        /* Section Headings */
        h3.section-heading {
            font-size: 12.5pt;
            font-weight: 700;
            color: #0f172a;
            border-left: 4px solid #1d4ed8;
            padding-left: 9px;
            margin-top: 16px;
            margin-bottom: 10px;
            page-break-after: avoid;
        }

        h4.subsection-heading {
            font-size: 10pt;
            font-weight: 700;
            color: #1e293b;
            margin-top: 10px;
            margin-bottom: 5px;
            page-break-after: avoid;
        }

        p {
            margin-bottom: 6px;
            text-align: justify;
            color: #334155;
            font-size: 9pt;
        }

        ul, ol {
            margin-left: 18px;
            margin-bottom: 8px;
            color: #334155;
            font-size: 9pt;
        }

        li {
            margin-bottom: 3px;
        }

        /* Callout Box */
        .callout {
            background-color: #f8fafc;
            border: 1px solid #cbd5e1;
            border-left: 4px solid #3b82f6;
            border-radius: 4px;
            padding: 8px 12px;
            margin: 8px 0;
            font-size: 8.5pt;
            color: #1e293b;
        }

        .callout strong {
            color: #0f172a;
        }

        /* Data Tables */
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 8px 0 12px 0;
            font-size: 8.5pt;
            page-break-inside: avoid;
        }

        th, td {
            border: 1px solid #cbd5e1;
            padding: 5px 8px;
            text-align: left;
            vertical-align: top;
        }

        th {
            background-color: #f1f5f9;
            color: #0f172a;
            font-weight: 700;
            text-transform: uppercase;
            font-size: 7.5pt;
            letter-spacing: 0.4px;
        }

        tr:nth-child(even) td {
            background-color: #f8fafc;
        }

        /* Badges */
        .badge {
            display: inline-block;
            padding: 2px 6px;
            border-radius: 3px;
            font-size: 7.5pt;
            font-weight: 700;
            font-family: monospace;
        }

        .badge-pk { background: #dbeafe; color: #1e40af; border: 1px solid #bfdbfe; }
        .badge-fk { background: #fef3c7; color: #92400e; border: 1px solid #fde68a; }
        .badge-uniq { background: #e0e7ff; color: #3730a3; border: 1px solid #c7d2fe; }
        .badge-check { background: #dcfce7; color: #166534; border: 1px solid #bbf7d0; }

        .code-inline {
            font-family: Consolas, Monaco, "Courier New", monospace;
            font-size: 8.5pt;
            background: #f1f5f9;
            padding: 1px 4px;
            border-radius: 3px;
            color: #0f172a;
        }

        /* Page Break Utilities */
        .page-break {
            page-break-before: always;
        }
    </style>
</head>
<body>

    <!-- DOCUMENT HEADER -->
    <div class="doc-header">
        <div class="doc-title-group">
            <h1>Municipal Complaint Management System</h1>
            <h2>DBMS Hackathon Project Specification &amp; Database Design</h2>
        </div>
        <div class="doc-meta">
            <div><strong>Database:</strong> municipal_complaints.db</div>
            <div><strong>RDBMS:</strong> SQLite 3 (DB Browser Compatible)</div>
            <div><strong>Architecture:</strong> Python Flask &bull; Relational SQLite</div>
        </div>
    </div>

    <!-- 1. PROBLEM REQUIREMENTS -->
    <h3 class="section-heading">1. Problem Requirements</h3>
    
    <h4 class="subsection-heading">1.1 Background &amp; Problem Statement</h4>
    <p>
        Municipal civic authorities encounter hundreds of citizen grievances daily relating to public amenities, solid waste accumulation, water pipeline leakages, broken asphalt, malfunctioning streetlights, and drainage overflow. Traditional complaint handling is severely plagued by fragmented paper logs, unrecorded status changes, delayed department allocation, lack of resolution accountability, and zero visibility for citizens.
    </p>
    <p>
        The objective of this project is to architect and implement a simple, robust, relational database-backed <strong>Municipal Complaint Management System</strong>. The system provides an end-to-end mechanism to record complaints, allocate responsible engineering divisions, monitor lifecycle state transitions, verify formal engineering resolutions, and preserve an immutable chronological audit trail.
    </p>

    <h4 class="subsection-heading">1.2 Functional Requirements</h4>
    <ol>
        <li><strong>Citizen Registration &amp; Lookup:</strong> Store citizen identifiers (Full Name, Phone Number) without requiring authentication, login passwords, or accounts. Returning citizens are automatically recognized by phone number.</li>
        <li><strong>Standardized Grievance Classification:</strong> Categorize public issues into discrete municipal divisions: <em>Garbage, Water Supply, Road, Street Light, and Drainage</em>.</li>
        <li><strong>Geospatial Ward &amp; Location Tracking:</strong> Capture physical addresses, municipal ward/area designations, city names, and postal pincodes for precise field team dispatch.</li>
        <li><strong>Departmental Workload &amp; Assignment:</strong> Maintain municipal engineering divisions with official nodal contact points (email, phone) and support dynamic complaint assignment.</li>
        <li><strong>Complaint Lifecycle Progression:</strong> Enforce structured status transitions: <span class="code-inline">SUBMITTED &rarr; ASSIGNED &rarr; IN_PROGRESS &rarr; RESOLVED / CLOSED / REJECTED</span>.</li>
        <li><strong>Formal Resolution Certification:</strong> When complaints reach <span class="code-inline">RESOLVED</span> status, mandate documentation of remedial action taken, certifying officer name, and resolution timestamp into a dedicated resolutions ledger.</li>
        <li><strong>Comprehensive Audit Trail:</strong> Automatically record every state transition into a historical log capturing old status, new status, administrative remarks, updating official, and exact timestamp.</li>
        <li><strong>Real-time KPI Dashboard:</strong> Present summary statistics (Total Complaints, Submitted, In Progress, Resolved) and department workload metrics to municipal desk officers.</li>
    </ol>

    <h4 class="subsection-heading">1.3 Non-Functional &amp; Scope Constraints</h4>
    <ul>
        <li><strong>Zero Authentication Overhead:</strong> Strictly excludes logins, sessions, passwords, roles, payment gateways, complex GIS/maps, or chat systems to keep focus purely on core DBMS principles.</li>
        <li><strong>Relational Integrity:</strong> Strict enforcement of SQLite foreign keys (<span class="code-inline">PRAGMA foreign_keys = ON;</span>) and check constraints.</li>
        <li><strong>DB Browser Compatibility:</strong> Native compatibility with <strong>DB Browser for SQLite</strong> for direct database inspection and SQL evaluations.</li>
    </ul>

    <!-- 2. ENTITIES -->
    <h3 class="section-heading">2. Entities</h3>
    <p>
        The database schema is structured into <strong>7 distinct relational entities</strong>, modeling both master data and transactional grievance lifecycles:
    </p>
    <table>
        <thead>
            <tr>
                <th style="width: 22%;">Entity Name</th>
                <th style="width: 20%;">Table Name</th>
                <th style="width: 18%;">Role / Classification</th>
                <th style="width: 40%;">Description &amp; Purpose</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td><strong>Citizen</strong></td>
                <td><span class="code-inline">citizens</span></td>
                <td>Master Entity</td>
                <td>Represents the resident lodging the grievance; identified by mobile number and name.</td>
            </tr>
            <tr>
                <td><strong>Category</strong></td>
                <td><span class="code-inline">categories</span></td>
                <td>Master Entity</td>
                <td>Standard municipal domain classification (Garbage, Water Supply, Road, Street Light, Drainage).</td>
            </tr>
            <tr>
                <td><strong>Location</strong></td>
                <td><span class="code-inline">locations</span></td>
                <td>Master Entity</td>
                <td>Geographic physical site of grievance including street address, ward/area, city, and pincode.</td>
            </tr>
            <tr>
                <td><strong>Department</strong></td>
                <td><span class="code-inline">departments</span></td>
                <td>Master Entity</td>
                <td>Municipal administrative division responsible for remediating the complaint (e.g. Sanitation, Electrical).</td>
            </tr>
            <tr>
                <td><strong>Complaint</strong></td>
                <td><span class="code-inline">complaints</span></td>
                <td>Core Transaction Entity</td>
                <td>Central grievance record linking citizen, category, location, and department with priority and status.</td>
            </tr>
            <tr>
                <td><strong>Complaint History</strong></td>
                <td><span class="code-inline">complaint_history</span></td>
                <td>Historical / Audit Entity</td>
                <td>Immutable chronological log capturing all status transitions, remarks, officers, and timestamps.</td>
            </tr>
            <tr>
                <td><strong>Resolution</strong></td>
                <td><span class="code-inline">resolutions</span></td>
                <td>Transaction / Certification</td>
                <td>Detailed engineering rectification record, certifying officer, and completion timestamp for resolved issues.</td>
            </tr>
        </tbody>
    </table>

    <!-- 3. ATTRIBUTES -->
    <div class="page-break"></div>
    <h3 class="section-heading">3. Attributes &amp; Data Dictionary</h3>
    <p>
        The attribute specifications, data types, nullabilities, default values, and semantic roles for all 7 tables are detailed below:
    </p>

    <h4 class="subsection-heading">3.1 Table: citizens</h4>
    <table>
        <thead>
            <tr>
                <th>Attribute</th>
                <th>Data Type</th>
                <th>Constraints</th>
                <th>Description</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td><span class="code-inline">citizen_id</span></td>
                <td>INTEGER</td>
                <td><span class="badge badge-pk">PK</span> AUTOINCREMENT</td>
                <td>Surrogate primary key uniquely identifying a citizen.</td>
            </tr>
            <tr>
                <td><span class="code-inline">citizen_name</span></td>
                <td>TEXT</td>
                <td>NOT NULL</td>
                <td>Full legal name of the reporting citizen.</td>
            </tr>
            <tr>
                <td><span class="code-inline">phone</span></td>
                <td>TEXT</td>
                <td>NOT NULL</td>
                <td>Citizen contact phone number used for complaint tracking and citizen reuse.</td>
            </tr>
        </tbody>
    </table>

    <h4 class="subsection-heading">3.2 Table: categories</h4>
    <table>
        <thead>
            <tr>
                <th>Attribute</th>
                <th>Data Type</th>
                <th>Constraints</th>
                <th>Description</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td><span class="code-inline">category_id</span></td>
                <td>INTEGER</td>
                <td><span class="badge badge-pk">PK</span> AUTOINCREMENT</td>
                <td>Surrogate primary key for the category.</td>
            </tr>
            <tr>
                <td><span class="code-inline">category_name</span></td>
                <td>TEXT</td>
                <td>NOT NULL, <span class="badge badge-uniq">UNIQUE</span></td>
                <td>Category name (e.g. Garbage, Water Supply, Road, Street Light, Drainage).</td>
            </tr>
            <tr>
                <td><span class="code-inline">description</span></td>
                <td>TEXT</td>
                <td>NULL</td>
                <td>Summary scope of municipal grievances falling under this category.</td>
            </tr>
        </tbody>
    </table>

    <h4 class="subsection-heading">3.3 Table: locations</h4>
    <table>
        <thead>
            <tr>
                <th>Attribute</th>
                <th>Data Type</th>
                <th>Constraints</th>
                <th>Description</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td><span class="code-inline">location_id</span></td>
                <td>INTEGER</td>
                <td><span class="badge badge-pk">PK</span> AUTOINCREMENT</td>
                <td>Surrogate primary key for the coverage location.</td>
            </tr>
            <tr>
                <td><span class="code-inline">address</span></td>
                <td>TEXT</td>
                <td>NOT NULL</td>
                <td>Street name, crossroad, landmark, or house/plot number.</td>
            </tr>
            <tr>
                <td><span class="code-inline">area</span></td>
                <td>TEXT</td>
                <td>NOT NULL</td>
                <td>Municipal ward or neighborhood area name (e.g. Indiranagar, Jayanagar).</td>
            </tr>
            <tr>
                <td><span class="code-inline">city</span></td>
                <td>TEXT</td>
                <td>NOT NULL</td>
                <td>City jurisdiction (e.g. Bengaluru).</td>
            </tr>
            <tr>
                <td><span class="code-inline">pincode</span></td>
                <td>TEXT</td>
                <td>NULL</td>
                <td>6-digit postal index number.</td>
            </tr>
        </tbody>
    </table>

    <h4 class="subsection-heading">3.4 Table: departments</h4>
    <table>
        <thead>
            <tr>
                <th>Attribute</th>
                <th>Data Type</th>
                <th>Constraints</th>
                <th>Description</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td><span class="code-inline">department_id</span></td>
                <td>INTEGER</td>
                <td><span class="badge badge-pk">PK</span> AUTOINCREMENT</td>
                <td>Surrogate primary key for the municipal department.</td>
            </tr>
            <tr>
                <td><span class="code-inline">department_name</span></td>
                <td>TEXT</td>
                <td>NOT NULL, <span class="badge badge-uniq">UNIQUE</span></td>
                <td>Official title of the municipal engineering/administrative department.</td>
            </tr>
            <tr>
                <td><span class="code-inline">contact_email</span></td>
                <td>TEXT</td>
                <td>NULL</td>
                <td>Departmental official grievance email address.</td>
            </tr>
            <tr>
                <td><span class="code-inline">contact_phone</span></td>
                <td>TEXT</td>
                <td>NULL</td>
                <td>Nodal officer helpline phone number.</td>
            </tr>
        </tbody>
    </table>

    <h4 class="subsection-heading">3.5 Table: complaints</h4>
    <table>
        <thead>
            <tr>
                <th>Attribute</th>
                <th>Data Type</th>
                <th>Constraints</th>
                <th>Description</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td><span class="code-inline">complaint_id</span></td>
                <td>INTEGER</td>
                <td><span class="badge badge-pk">PK</span> AUTOINCREMENT</td>
                <td>Unique complaint registration number.</td>
            </tr>
            <tr>
                <td><span class="code-inline">citizen_id</span></td>
                <td>INTEGER</td>
                <td>NOT NULL, <span class="badge badge-fk">FK</span></td>
                <td>References <span class="code-inline">citizens(citizen_id)</span>.</td>
            </tr>
            <tr>
                <td><span class="code-inline">category_id</span></td>
                <td>INTEGER</td>
                <td>NOT NULL, <span class="badge badge-fk">FK</span></td>
                <td>References <span class="code-inline">categories(category_id)</span>.</td>
            </tr>
            <tr>
                <td><span class="code-inline">location_id</span></td>
                <td>INTEGER</td>
                <td>NOT NULL, <span class="badge badge-fk">FK</span></td>
                <td>References <span class="code-inline">locations(location_id)</span>.</td>
            </tr>
            <tr>
                <td><span class="code-inline">department_id</span></td>
                <td>INTEGER</td>
                <td>NULL, <span class="badge badge-fk">FK</span></td>
                <td>References <span class="code-inline">departments(department_id)</span>; assigned upon allocation.</td>
            </tr>
            <tr>
                <td><span class="code-inline">title</span></td>
                <td>TEXT</td>
                <td>NOT NULL</td>
                <td>Summary subject of the civic grievance.</td>
            </tr>
            <tr>
                <td><span class="code-inline">description</span></td>
                <td>TEXT</td>
                <td>NOT NULL</td>
                <td>Elaborated description of the problem, severity, and duration.</td>
            </tr>
            <tr>
                <td><span class="code-inline">priority</span></td>
                <td>TEXT</td>
                <td>NOT NULL, <span class="badge badge-check">CHECK</span>, DEFAULT 'MEDIUM'</td>
                <td>Must be in ('LOW', 'MEDIUM', 'HIGH', 'URGENT').</td>
            </tr>
            <tr>
                <td><span class="code-inline">status</span></td>
                <td>TEXT</td>
                <td>NOT NULL, <span class="badge badge-check">CHECK</span>, DEFAULT 'SUBMITTED'</td>
                <td>Must be in ('SUBMITTED', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'REJECTED').</td>
            </tr>
            <tr>
                <td><span class="code-inline">submitted_at</span></td>
                <td>DATETIME</td>
                <td>DEFAULT CURRENT_TIMESTAMP</td>
                <td>Automatic timestamp when the complaint is lodged.</td>
            </tr>
            <tr>
                <td><span class="code-inline">resolved_at</span></td>
                <td>DATETIME</td>
                <td>NULL</td>
                <td>Timestamp populated when status is updated to 'RESOLVED'.</td>
            </tr>
        </tbody>
    </table>

    <div class="page-break"></div>
    <h4 class="subsection-heading">3.6 Table: complaint_history</h4>
    <table>
        <thead>
            <tr>
                <th>Attribute</th>
                <th>Data Type</th>
                <th>Constraints</th>
                <th>Description</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td><span class="code-inline">history_id</span></td>
                <td>INTEGER</td>
                <td><span class="badge badge-pk">PK</span> AUTOINCREMENT</td>
                <td>Surrogate primary key for the audit record.</td>
            </tr>
            <tr>
                <td><span class="code-inline">complaint_id</span></td>
                <td>INTEGER</td>
                <td>NOT NULL, <span class="badge badge-fk">FK</span></td>
                <td>References <span class="code-inline">complaints(complaint_id)</span>.</td>
            </tr>
            <tr>
                <td><span class="code-inline">old_status</span></td>
                <td>TEXT</td>
                <td>NULL</td>
                <td>Previous status (NULL when initially lodged as SUBMITTED).</td>
            </tr>
            <tr>
                <td><span class="code-inline">new_status</span></td>
                <td>TEXT</td>
                <td>NOT NULL</td>
                <td>New status resulting from the administrative update.</td>
            </tr>
            <tr>
                <td><span class="code-inline">remarks</span></td>
                <td>TEXT</td>
                <td>NULL</td>
                <td>Official notes, reason for transition, or inspection observations.</td>
            </tr>
            <tr>
                <td><span class="code-inline">updated_by</span></td>
                <td>TEXT</td>
                <td>NULL</td>
                <td>Name or official role of the person recording the update.</td>
            </tr>
            <tr>
                <td><span class="code-inline">updated_at</span></td>
                <td>DATETIME</td>
                <td>DEFAULT CURRENT_TIMESTAMP</td>
                <td>Exact timestamp when the status modification occurred.</td>
            </tr>
        </tbody>
    </table>

    <h4 class="subsection-heading">3.7 Table: resolutions</h4>
    <table>
        <thead>
            <tr>
                <th>Attribute</th>
                <th>Data Type</th>
                <th>Constraints</th>
                <th>Description</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td><span class="code-inline">resolution_id</span></td>
                <td>INTEGER</td>
                <td><span class="badge badge-pk">PK</span> AUTOINCREMENT</td>
                <td>Surrogate primary key for the resolution certificate.</td>
            </tr>
            <tr>
                <td><span class="code-inline">complaint_id</span></td>
                <td>INTEGER</td>
                <td>NOT NULL, <span class="badge badge-uniq">UNIQUE</span>, <span class="badge badge-fk">FK</span></td>
                <td>References <span class="code-inline">complaints(complaint_id)</span>; enforces strict 1:1 cardinality.</td>
            </tr>
            <tr>
                <td><span class="code-inline">resolution_description</span></td>
                <td>TEXT</td>
                <td>NOT NULL</td>
                <td>Detailed description of engineering actions taken to remediate the complaint.</td>
            </tr>
            <tr>
                <td><span class="code-inline">resolved_by</span></td>
                <td>TEXT</td>
                <td>NOT NULL</td>
                <td>Name, title, or designation of the certifying field engineer/inspector.</td>
            </tr>
            <tr>
                <td><span class="code-inline">resolved_at</span></td>
                <td>DATETIME</td>
                <td>DEFAULT CURRENT_TIMESTAMP</td>
                <td>Official date and time when the resolution was certified.</td>
            </tr>
        </tbody>
    </table>

    <!-- 4. KEYS -->
    <h3 class="section-heading">4. Keys &amp; Relational Schema</h3>
    <p>
        The integrity of the relational model is enforced through primary keys, alternate/unique keys, foreign keys, and referential constraints:
    </p>

    <h4 class="subsection-heading">4.1 Primary Keys (PK)</h4>
    <ul>
        <li><span class="code-inline">citizens.citizen_id</span>: Uniquely identifies citizen profiles.</li>
        <li><span class="code-inline">categories.category_id</span>: Uniquely identifies grievance categories.</li>
        <li><span class="code-inline">locations.location_id</span>: Uniquely identifies municipal physical locations.</li>
        <li><span class="code-inline">departments.department_id</span>: Uniquely identifies municipal departments.</li>
        <li><span class="code-inline">complaints.complaint_id</span>: Uniquely identifies complaint transactions.</li>
        <li><span class="code-inline">complaint_history.history_id</span>: Uniquely identifies individual audit events.</li>
        <li><span class="code-inline">resolutions.resolution_id</span>: Uniquely identifies formal resolution records.</li>
    </ul>

    <h4 class="subsection-heading">4.2 Candidate &amp; Unique Keys (AK)</h4>
    <ul>
        <li><span class="code-inline">categories.category_name</span> (<span class="badge badge-uniq">UNIQUE</span>): Prevents duplicate category definitions.</li>
        <li><span class="code-inline">departments.department_name</span> (<span class="badge badge-uniq">UNIQUE</span>): Enforces distinct municipal department entities.</li>
        <li><span class="code-inline">resolutions.complaint_id</span> (<span class="badge badge-uniq">UNIQUE</span>): Ensures exactly <strong>one</strong> formal resolution record per complaint.</li>
        <li><span class="code-inline">citizens.phone</span>: Natural candidate key utilized by application logic to link repeated complaints by the same citizen.</li>
    </ul>

    <h4 class="subsection-heading">4.3 Foreign Keys (FK) &amp; Cardinalities</h4>
    <table>
        <thead>
            <tr>
                <th>Foreign Key</th>
                <th>Referenced Table &amp; Column</th>
                <th>Cardinality</th>
                <th>Business Semantics</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td><span class="code-inline">complaints(citizen_id)</span></td>
                <td><span class="code-inline">citizens(citizen_id)</span></td>
                <td>1 : N</td>
                <td>One citizen can register many complaints; every complaint must link to a valid citizen.</td>
            </tr>
            <tr>
                <td><span class="code-inline">complaints(category_id)</span></td>
                <td><span class="code-inline">categories(category_id)</span></td>
                <td>1 : N</td>
                <td>Each complaint belongs to exactly one category; a category classifies multiple complaints.</td>
            </tr>
            <tr>
                <td><span class="code-inline">complaints(location_id)</span></td>
                <td><span class="code-inline">locations(location_id)</span></td>
                <td>1 : N</td>
                <td>One physical location can accumulate multiple grievances over time.</td>
            </tr>
            <tr>
                <td><span class="code-inline">complaints(department_id)</span></td>
                <td><span class="code-inline">departments(department_id)</span></td>
                <td>1 : N (Optional)</td>
                <td>Nullable initially; assigned when allocated to a department for field remediation.</td>
            </tr>
            <tr>
                <td><span class="code-inline">complaint_history(complaint_id)</span></td>
                <td><span class="code-inline">complaints(complaint_id)</span></td>
                <td>1 : N</td>
                <td>One complaint produces an append-only chronological chain of audit records.</td>
            </tr>
            <tr>
                <td><span class="code-inline">resolutions(complaint_id)</span></td>
                <td><span class="code-inline">complaints(complaint_id)</span></td>
                <td>1 : 1</td>
                <td>A complaint has at most one formal engineering resolution certificate.</td>
            </tr>
        </tbody>
    </table>

    <!-- 5. BUSINESS RULES -->
    <div class="page-break"></div>
    <h3 class="section-heading">5. Business Rules</h3>
    <p>
        The municipal system enforces explicit business logic across database constraints and backend API controllers:
    </p>

    <h4 class="subsection-heading">Rule 1: Domain Integrity via CHECK Constraints</h4>
    <ul>
        <li><strong>Priority Domain Constraint:</strong> Priority values are strictly restricted to 4 enumerated levels:
            <br><span class="code-inline">CHECK(priority IN ('LOW', 'MEDIUM', 'HIGH', 'URGENT'))</span>
        </li>
        <li><strong>Status Domain Constraint:</strong> The lifecycle status must strictly belong to the defined states:
            <br><span class="code-inline">CHECK(status IN ('SUBMITTED', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'REJECTED'))</span>
        </li>
    </ul>

    <h4 class="subsection-heading">Rule 2: Default Initialization &amp; Timestamps</h4>
    <ul>
        <li>Every newly lodged grievance automatically defaults to <span class="code-inline">status = 'SUBMITTED'</span>.</li>
        <li>If no priority is chosen by the citizen, it automatically defaults to <span class="code-inline">priority = 'MEDIUM'</span>.</li>
        <li>Creation timestamps (<span class="code-inline">submitted_at</span>, <span class="code-inline">updated_at</span>, <span class="code-inline">resolved_at</span>) are generated server-side using <span class="code-inline">CURRENT_TIMESTAMP</span>.</li>
    </ul>

    <h4 class="subsection-heading">Rule 3: Mandatory Citizen &amp; Classification Data</h4>
    <ul>
        <li>A complaint cannot be filed anonymously. Citizen Full Name, Phone Number, Category ID, Location ID, Title, and Description are non-nullable (<span class="code-inline">NOT NULL</span>).</li>
        <li>No login credentials (passwords, emails) are enforced, enabling frictionless public reporting.</li>
    </ul>

    <h4 class="subsection-heading">Rule 4: Department Assignment &amp; Progression Lifecycle</h4>
    <ul>
        <li>Grievances enter the system as <span class="code-inline">SUBMITTED</span> without mandatory departmental allocation.</li>
        <li>Progressing a grievance to <span class="code-inline">ASSIGNED</span> or <span class="code-inline">IN_PROGRESS</span> requires designating an active municipal department (<span class="code-inline">department_id</span>).</li>
    </ul>

    <h4 class="subsection-heading">Rule 5: Mandatory Resolution Certification Rule</h4>
    <div class="callout">
        <strong>Resolution Enforcement:</strong> A complaint CANNOT be transitioned to <span class="code-inline">RESOLVED</span> status without simultaneously supplying a descriptive resolution summary (<span class="code-inline">resolution_description</span>) and certifying officer's name (<span class="code-inline">resolved_by</span>).
    </div>
    <ul>
        <li>When marked <span class="code-inline">RESOLVED</span>, the database updates <span class="code-inline">complaints.resolved_at = CURRENT_TIMESTAMP</span>.</li>
        <li>Concurrently, an entry is inserted into the <span class="code-inline">resolutions</span> table with foreign key linkage to the complaint.</li>
        <li>The <span class="code-inline">UNIQUE</span> constraint on <span class="code-inline">resolutions.complaint_id</span> guarantees that duplicate or competing resolution certificates cannot exist.</li>
    </ul>

    <h4 class="subsection-heading">Rule 6: Immutable Status Audit Trail</h4>
    <ul>
        <li>Every single status change—from initial submission to resolution or closure—automatically generates a new record in <span class="code-inline">complaint_history</span>.</li>
        <li>The record permanently preserves the <span class="code-inline">old_status</span>, <span class="code-inline">new_status</span>, administrative remarks, authoring officer, and update timestamp.</li>
        <li>History records are append-only and cannot be altered or deleted, ensuring full auditability.</li>
    </ul>

    <h4 class="subsection-heading">Rule 7: Foreign Key Enforcement &amp; DB Browser Compatibility</h4>
    <ul>
        <li>Every SQLite database connection must explicitly execute:
            <br><span class="code-inline">PRAGMA foreign_keys = ON;</span>
            <br>This guarantees that no orphaned complaints can be created for non-existent citizens, categories, locations, or departments.
        </li>
        <li>The database file <span class="code-inline">municipal_complaints.db</span> maintains complete binary compatibility with standard SQLite tooling, specifically <strong>DB Browser for SQLite</strong>, allowing live table inspection, visual schema diagramming, and direct SQL querying during hackathon judging.</li>
    </ul>

    <div style="margin-top: 28px; padding-top: 14px; border-top: 1px solid #cbd5e1; font-size: 8pt; color: #64748b; text-align: center;">
        Municipal Complaint Management System &bull; DBMS Hackathon Mini Project &bull; SQLite Relational Database Documentation
    </div>

</body>
</html>
"""

def generate():
    # 1. Write HTML file
    with open(OUTPUT_HTML, "w", encoding="utf-8") as f:
        f.write(HTML_CONTENT)
    print(f"HTML documentation generated: {OUTPUT_HTML}")

    # 2. Convert to PDF using Edge / Chrome headless
    browsers = [
        r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
        r"C:\Program Files\Microsoft\Edge\Application\msedge.exe",
        r"C:\Program Files\Google\Chrome\Application\chrome.exe"
    ]

    browser_bin = None
    for b in browsers:
        if os.path.exists(b):
            browser_bin = b
            break

    if not browser_bin:
        print("Error: Neither Edge nor Chrome found on system to generate PDF.")
        sys.exit(1)

    print(f"Using browser executable: {browser_bin}")
    cmd = [
        browser_bin,
        "--headless",
        "--disable-gpu",
        "--run-all-compositor-stages-before-draw",
        "--no-pdf-header-footer",
        f"--print-to-pdf={OUTPUT_PDF}",
        f"file:///{OUTPUT_HTML.replace(os.sep, '/')}"
    ]

    print("Running headless PDF conversion...")
    res = subprocess.run(cmd, capture_output=True, text=True)
    if os.path.exists(OUTPUT_PDF) and os.path.getsize(OUTPUT_PDF) > 0:
        print("=" * 60)
        print("SUCCESSFULLY GENERATED PDF DOCUMENTATION!")
        print(f"File Path: {OUTPUT_PDF}")
        print(f"File Size: {os.path.getsize(OUTPUT_PDF):,} bytes")
        print("=" * 60)
    else:
        print(f"PDF generation failed. Return code: {res.returncode}")
        print("Stdout:", res.stdout)
        print("Stderr:", res.stderr)
        sys.exit(1)

if __name__ == "__main__":
    generate()
