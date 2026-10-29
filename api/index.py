import sys
import os

# Ensure the root directory is available for importing app and database
root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if root_dir not in sys.path:
    sys.path.insert(0, root_dir)

from app import app

# Vercel WSGI entry point
app.debug = False
