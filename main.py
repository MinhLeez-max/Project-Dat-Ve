import os
import subprocess
from flask import Flask, redirect

app = Flask(__name__)
app.secret_key = os.environ.get("SESSION_SECRET", "vexeresecretsession")

@app.route('/')
def index():
    # Redirect to Node.js app
    return redirect('http://0.0.0.0:5000')

@app.route('/<path:path>')
def catch_all(path):
    # Redirect all routes to Node.js app
    return redirect(f'http://0.0.0.0:5000/{path}')

if __name__ == '__main__':
    # Try to start the Node.js app
    try:
        subprocess.Popen(["node", "app.js"])
        print("Starting Node.js application...")
    except Exception as e:
        print(f"Failed to start Node.js app: {e}")
    
    # Then start the Flask app, which will redirect to Node.js
    app.run(host='0.0.0.0', port=5001)