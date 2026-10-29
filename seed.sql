-- =============================================================================
-- MUNICIPAL COMPLAINT MANAGEMENT SYSTEM - SAMPLE SEED DATA (DML)
-- Database: municipal_complaints.db (SQLite 3)
-- Compatible with DB Browser for SQLite
-- =============================================================================

PRAGMA foreign_keys = ON;

-- 1. Sample Citizens
INSERT OR IGNORE INTO citizens (citizen_id, citizen_name, phone) VALUES
(1, 'Rajesh Kumar', '9845012345'),
(2, 'Priya Sharma', '9845123456'),
(3, 'Anand Verma', '9845234567'),
(4, 'Sunita Patil', '9845345678'),
(5, 'Mohammed Farhan', '9845456789');

-- 2. Sample Categories
INSERT OR IGNORE INTO categories (category_id, category_name, description) VALUES
(1, 'Garbage', 'Solid waste collection, litter clearing, and dustbin maintenance'),
(2, 'Water Supply', 'Pipeline leaks, water pressure problems, contamination, and tanker supply'),
(3, 'Road', 'Potholes, road resurfacing, illegal road cutting, and footpath repairs'),
(4, 'Street Light', 'Faulty lamp posts, flickering street lights, and dark junction spots'),
(5, 'Drainage', 'Blocked storm drains, sewage overflow, and open manholes');

-- 3. Sample Locations
INSERT OR IGNORE INTO locations (location_id, address, area, city, pincode) VALUES
(1, 'Near Metro Pillar 42, Outer Ring Road', 'Indiranagar', 'Bengaluru', '560038'),
(2, 'Opposite City Hospital, 4th Main', 'Jayanagar', 'Bengaluru', '560011'),
(3, 'Crossroad 7, Market Yard', 'Koramangala', 'Bengaluru', '560034'),
(4, 'Plot 15, Lake View Road', 'Whitefield', 'Bengaluru', '560066'),
(5, 'Near Government School, Ward 12', 'Malleshwaram', 'Bengaluru', '560003'),
(6, 'Railway Station Approach Road', 'Shivajinagar', 'Bengaluru', '560051');

-- 4. Sample Departments
INSERT OR IGNORE INTO departments (department_id, department_name, contact_email, contact_phone) VALUES
(1, 'Sanitation Department', 'sanitation@municipal.gov.in', '+91 98765 43210'),
(2, 'Water Supply Department', 'watersupply@municipal.gov.in', '+91 98765 43211'),
(3, 'Road Department', 'roads@municipal.gov.in', '+91 98765 43212'),
(4, 'Electrical Department', 'electrical@municipal.gov.in', '+91 98765 43213'),
(5, 'Drainage Department', 'drainage@municipal.gov.in', '+91 98765 43214');

-- 5. Sample Complaints
INSERT OR IGNORE INTO complaints (complaint_id, citizen_id, category_id, location_id, department_id, title, description, priority, status, submitted_at, resolved_at) VALUES
(1, 1, 1, 1, 1, 'Overflowing community garbage container', 'The municipal garbage bin on the corner has not been emptied for 3 days and waste is spilling onto the street.', 'HIGH', 'ASSIGNED', '2026-09-15 09:30:00', NULL),
(2, 2, 2, 2, 2, 'Underground main pipeline leak causing water logging', 'A clean drinking water pipeline burst in front of City Hospital leading to gallons of water wasted.', 'URGENT', 'IN_PROGRESS', '2026-09-16 11:15:00', NULL),
(3, 3, 3, 3, 3, 'Dangerous deep pothole near junction', 'Large pothole in the middle of Crossroad 7 causing frequent traffic jams and two-wheeler skids.', 'MEDIUM', 'SUBMITTED', '2026-09-17 14:00:00', NULL),
(4, 4, 4, 4, 4, 'Street lights non-operational for entire lane', 'Six consecutive street light poles on Lake View Road are not turning on at night, causing safety concerns.', 'HIGH', 'RESOLVED', '2026-09-14 19:45:00', '2026-09-16 16:30:00'),
(5, 5, 5, 5, 5, 'Blocked stormwater drain ahead of monsoon', 'Silt and plastic waste clogging stormwater drain causing overflow near the government school.', 'MEDIUM', 'IN_PROGRESS', '2026-09-15 16:20:00', NULL);

-- 6. Sample Complaint History Logs
INSERT OR IGNORE INTO complaint_history (history_id, complaint_id, old_status, new_status, remarks, updated_by, updated_at) VALUES
(1, 1, NULL, 'SUBMITTED', 'Complaint logged by citizen via portal', 'Rajesh Kumar', '2026-09-15 09:30:00'),
(2, 1, 'SUBMITTED', 'ASSIGNED', 'Assigned to Sanitation Department Ward 4 Team', 'Municipal Admin', '2026-09-15 10:15:00'),
(3, 2, NULL, 'SUBMITTED', 'Emergency water leakage reported', 'Priya Sharma', '2026-09-16 11:15:00'),
(4, 2, 'SUBMITTED', 'ASSIGNED', 'Assigned to Water Emergency Response Squad', 'Helpdesk Officer', '2026-09-16 11:45:00'),
(5, 2, 'ASSIGNED', 'IN_PROGRESS', 'Excavation and pipe replacement underway', 'Field Engineer Rao', '2026-09-16 13:00:00'),
(6, 3, NULL, 'SUBMITTED', 'Pothole complaint registered', 'Anand Verma', '2026-09-17 14:00:00'),
(7, 4, NULL, 'SUBMITTED', 'Street light outage registered', 'Sunita Patil', '2026-09-14 19:45:00'),
(8, 4, 'SUBMITTED', 'ASSIGNED', 'Assigned to Electrical Maintenance Team', 'Admin Officer', '2026-09-15 08:30:00'),
(9, 4, 'ASSIGNED', 'IN_PROGRESS', 'Technician dispatched with replacement LED fixtures', 'EE Prakash', '2026-09-15 11:00:00'),
(10, 4, 'IN_PROGRESS', 'RESOLVED', 'All six sodium vapor fixtures replaced with 90W LED lamps. Circuit restored.', 'Inspector Ramesh', '2026-09-16 16:30:00'),
(11, 5, NULL, 'SUBMITTED', 'Drain blockage complaint logged', 'Mohammed Farhan', '2026-09-15 16:20:00'),
(12, 5, 'SUBMITTED', 'ASSIGNED', 'Assigned to Drainage Clearance Squad', 'Helpdesk Officer', '2026-09-16 09:00:00'),
(13, 5, 'ASSIGNED', 'IN_PROGRESS', 'Suction vehicle and manual desilting in progress', 'Sanitary Inspector Dev', '2026-09-17 10:00:00');

-- 7. Sample Resolution for Complaint #4
INSERT OR IGNORE INTO resolutions (resolution_id, complaint_id, resolution_description, resolved_by, resolved_at) VALUES
(1, 4, 'Replaced 6 faulty fixtures with high-efficiency 90W LED lamps and replaced damaged underground cable segment. Tested and working normally.', 'Junior Engineer K. Suresh (Electrical Division)', '2026-09-16 16:30:00');
