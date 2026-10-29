"""
Test Suite for Municipal Complaint Management System
Verifies Landing Page, User Dashboard APIs, Admin Dashboard APIs, 
Department Assignment, Status Transitions, Resolution Certification, and Visual Timeline.
"""

from app import app
from database import get_db_connection

def run_tests():
    client = app.test_client()

    print("--- 1. Testing Page Routes (No Login Required) ---")
    res_home = client.get("/")
    assert res_home.status_code == 200, f"Home failed: {res_home.status_code}"
    assert b"Municipal Complaint Management System" in res_home.data
    assert b"USER DASHBOARD" in res_home.data
    assert b"ADMIN DASHBOARD" in res_home.data

    res_user = client.get("/user")
    assert res_user.status_code == 200, f"User Dashboard failed: {res_user.status_code}"
    assert b"USER DASHBOARD" in res_user.data
    assert b"Track Complaint" in res_user.data

    res_admin = client.get("/admin")
    assert res_admin.status_code == 200, f"Admin Dashboard failed: {res_admin.status_code}"
    assert b"ADMIN DASHBOARD" in res_admin.data
    print("✓ All 3 page routes (/, /user, /admin) returned HTTP 200 successfully")

    print("\n--- 2. Testing Admin Dashboard Aggregates (/api/dashboard) ---")
    res_dash = client.get("/api/dashboard")
    assert res_dash.status_code == 200
    dash_data = res_dash.get_json()
    assert "total_complaints" in dash_data
    assert "submitted" in dash_data
    assert "assigned" in dash_data
    assert "in_progress" in dash_data
    assert "resolved" in dash_data
    assert "closed" in dash_data
    print(f"✓ Live Admin Aggregates: Total: {dash_data['total_complaints']}, Submitted: {dash_data['submitted']}, Assigned: {dash_data['assigned']}, Resolved: {dash_data['resolved']}")

    print("\n--- 3. Testing User Complaint Submission (/api/user/complaints) ---")
    phone = "9845887766"
    submit_payload = {
        "citizen_name": "Kavita Rao",
        "phone": phone,
        "title": "Severe road pothole near bus terminal",
        "category_id": 3,  # Road
        "location_id": 2,  # Jayanagar
        "priority": "HIGH",
        "description": "Deep pothole causing two-wheeler accidents during evening peak hours."
    }
    res_submit = client.post("/api/user/complaints", json=submit_payload)
    assert res_submit.status_code == 201, f"Submit failed: {res_submit.data}"
    comp_res = res_submit.get_json()
    cid = comp_res["complaint_id"]
    disp_id = comp_res["display_id"]
    assert comp_res["status"] == "SUBMITTED"
    print(f"✓ Complaint lodged via User Portal: DB ID #{cid}, Display ID: {disp_id}")

    print("\n--- 4. Testing User Phone Lookup (/api/user/stats & /api/user/complaints) ---")
    res_ustats = client.get(f"/api/user/stats?phone={phone}")
    assert res_ustats.status_code == 200
    ustats = res_ustats.get_json()
    assert ustats["citizen_name"] == "Kavita Rao"
    assert ustats["my_complaints"] >= 1
    assert ustats["submitted"] >= 1
    print(f"✓ Citizen {ustats['citizen_name']} identified with {ustats['my_complaints']} complaints without login")

    res_ucomp = client.get(f"/api/user/complaints?phone={phone}")
    assert res_ucomp.status_code == 200
    my_list = res_ucomp.get_json()
    assert len(my_list) >= 1
    assert my_list[0]["category_name"] == "Road"
    print(f"✓ My Complaints returned {len(my_list)} records with category and location joins")

    print("\n--- 5. Testing Track Complaint with Visual Timeline (/api/user/complaints/<id>) ---")
    res_track = client.get(f"/api/user/complaints/{disp_id}")
    assert res_track.status_code == 200
    track_data = res_track.get_json()
    assert track_data["display_id"] == disp_id
    assert track_data["status"] == "SUBMITTED"
    assert track_data["resolution"]["available"] is False
    assert len(track_data["timeline"]) == 5
    # First stage SUBMITTED should be done
    assert track_data["timeline"][0]["stage"] == "SUBMITTED"
    assert track_data["timeline"][0]["is_done"] is True
    print("✓ Visual Timeline verified for SUBMITTED stage; Resolution is correctly unavailable yet")

    print("\n--- 6. Testing Admin Department Assignment (/api/complaints/<id>/department) ---")
    res_assign = client.post(f"/api/complaints/{cid}/department", json={
        "department_id": 3,  # Road Department
        "remarks": "Dispatched to Road Maintenance Wing"
    })
    assert res_assign.status_code == 200
    assign_res = res_assign.get_json()
    assert assign_res["status"] == "ASSIGNED"
    print("✓ Complaint assigned to Road Department; Status automatically transitioned to ASSIGNED")

    print("\n--- 7. Testing Admin Status Update to IN_PROGRESS (/api/complaints/<id>/status) ---")
    res_prog = client.post(f"/api/complaints/{cid}/status", json={
        "new_status": "IN_PROGRESS",
        "remarks": "Road patching crew on site with bitumen asphalt mix",
        "updated_by": "Assistant Executive Engineer Sharma"
    })
    assert res_prog.status_code == 200
    print("✓ Status updated to IN_PROGRESS with officer remarks logged in complaint_history")

    print("\n--- 8. Testing Admin Add Resolution (/api/complaints/<id>/resolution) ---")
    res_resolve = client.post(f"/api/complaints/{cid}/resolution", json={
        "resolution_description": "Pothole filled with heavy-duty cold asphalt patch and roller compacted. Road cleared.",
        "resolved_by": "Road Maintenance Wing (Supervisor K. Nair)"
    })
    assert res_resolve.status_code == 200
    assert res_resolve.get_json()["status"] == "RESOLVED"
    print("✓ Formal resolution stored in resolutions table; Complaint marked as RESOLVED")

    print("\n--- 9. Verifying User Track Complaint Reflects Resolution & Timeline ---")
    res_track_after = client.get(f"/api/user/complaints/{disp_id}")
    assert res_track_after.status_code == 200
    track_after = res_track_after.get_json()
    assert track_after["status"] == "RESOLVED"
    assert track_after["resolution"]["available"] is True
    assert "heavy-duty cold asphalt patch" in track_after["resolution"]["description"]
    assert track_after["resolution"]["resolved_by"] == "Road Maintenance Wing (Supervisor K. Nair)"

    # Verify timeline shows RESOLVED done
    resolved_stage = [st for st in track_after["timeline"] if st["stage"] == "RESOLVED"][0]
    assert resolved_stage["is_done"] is True
    print(f"✓ Citizen tracking verified: Visual timeline shows RESOLVED stage completed!")
    print(f"✓ Resolution certificate confirmed: {track_after['resolution']['description'][:50]}...")

    print("\n--- 10. Testing Admin Master Management (Categories, Departments, Locations, History) ---")
    # Add new category
    cat_add = client.post("/api/categories", json={"category_name": "Park & Garden Maintenance", "description": "Public parks"})
    assert cat_add.status_code == 201
    new_cat_id = cat_add.get_json()["category_id"]

    # Delete category
    cat_del = client.delete(f"/api/categories/{new_cat_id}")
    assert cat_del.status_code == 200
    print("✓ Category add and delete verified")

    # Verify history endpoint
    res_hist = client.get(f"/api/history?complaint_id={cid}")
    assert res_hist.status_code == 200
    hist_list = res_hist.get_json()
    assert len(hist_list) >= 4
    print(f"✓ Complete history audit trail verified ({len(hist_list)} lifecycle events for complaint #{cid})")

    print("\n========================================================")
    print("ALL TESTS PASSED SUCCESSFULLY! DUAL DASHBOARDS OPERATIONAL.")
    print("========================================================")

if __name__ == "__main__":
    run_tests()
