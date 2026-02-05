import os
import sys

# Add the project root and ml-models directory to the python path
current_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.dirname(current_dir)
sys.path.append(project_root)
sys.path.append(os.path.join(project_root, 'ml-models'))

# Import the Flask app from the existing API file
# We use standard import because we added the paths above
from api import app

# Vercel expects 'app' to be available for WSGI
# It is already available from the import above
