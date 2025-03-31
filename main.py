import os
from flask import Flask, render_template, redirect, url_for, flash, request

app = Flask(__name__)
app.secret_key = os.environ.get("SESSION_SECRET", "vexeresecretsession")

@app.route('/')
def index():
    return """
    <html>
        <head>
            <title>Bus Ticket Booking System</title>
            <link href="https://cdn.replit.com/agent/bootstrap-agent-dark-theme.min.css" rel="stylesheet">
        </head>
        <body class="bg-dark text-light">
            <div class="container py-5">
                <div class="row justify-content-center">
                    <div class="col-md-8 text-center">
                        <h1 class="display-4 mb-4">Bus Ticket Booking System</h1>
                        <p class="lead mb-4">The application is currently using Express.js (Node.js) framework with MongoDB. To run it, we need to use Node.js instead of Python.</p>
                        <div class="alert alert-info">
                            <p><strong>System Information:</strong></p>
                            <p>This application uses:</p>
                            <ul class="text-start">
                                <li>Express.js as web framework</li>
                                <li>MongoDB as database</li>
                                <li>EJS for templating</li>
                                <li>Authentication with sessions</li>
                            </ul>
                        </div>
                        <div class="mt-4">
                            <a href="#" class="btn btn-primary">Switch to Node.js Workflow</a>
                        </div>
                    </div>
                </div>
            </div>
        </body>
    </html>
    """

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)