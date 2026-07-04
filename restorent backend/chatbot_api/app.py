from flask import Flask, jsonify
from flask_cors import CORS
from extensions import limiter
from routes import chatbot_bp

app = Flask(__name__)
CORS(app)

# Bind the limiter to the app (must happen before first request)
limiter.init_app(app)

# Register the blueprint
app.register_blueprint(chatbot_bp, url_prefix='/api/chatbot')

if __name__ == '__main__':
    print("Starting Standalone Chatbot Server on port 6035...")
    app.run(debug=True, port=6035)