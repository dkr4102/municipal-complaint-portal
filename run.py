"""
Municipal Complaint Management System
Startup Runner Script
"""

from app import app
from database import init_db, seed_data

if __name__ == "__main__":
    print("=" * 60)
    print("MUNICIPAL COMPLAINT MANAGEMENT SYSTEM")
    print("DBMS Hackathon Mini Project")
    print("Database: municipal_complaints.db (SQLite)")
    print("=" * 60)
    print("Initializing Database & Seed Records...")
    init_db()
    seed_data()
    print("Starting Flask Web Application...")
    print("Open http://127.0.0.1:5000 in your browser.")
    print("=" * 60)
    app.run(host="127.0.0.1", port=5000, debug=True)
