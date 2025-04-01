from base64 import b64encode
from os import getenv, urandom, path
from flask import Flask, redirect, request, session, render_template
from requests import get
from dotenv import load_dotenv

load_dotenv()

# Generate a random 24-byte secret key using os.urandom()
random_secret_key = urandom(24)  # Generates a 24-byte secret key

# Get absolute path to 'src' folder
template_folder_path = path.join(path.abspath(path.dirname(__file__)), 'src')

# Set up Flask app with the generated SECRET_KEY and 'src' as the template folder
app = Flask(__name__, template_folder=template_folder_path)
app.secret_key = random_secret_key  # Use the generated random secret key

"""
Thanks to Chiroyce (https://replit.com/@Chiroyce/auth) for part of the code! Truly the GOAT.
"""

def base64(string):
    return b64encode(string.encode("utf-8")).decode()

def generate_random_code():
    # Generate a 24-byte random code
    random_bytes = urandom(24)
    # Encode it in base64 format
    return b64encode(random_bytes).decode('utf-8')

@app.get("/")
def home():
    return render_template("account.html")

@app.get("/auth")
def auth():
    if "username" not in session:
        # Generate a random code using the generate_random_code function
        random_code = generate_random_code()
        return redirect(f"https://auth.itinerary.eu.org/auth/?redirect={ base64('https://scratch-coding-hut.github.io/auth') }&name=NotFenixio%27s%20ScratchAuth%20Example&code={random_code}")
    else:
        return render_template("auth.html", username=session["username"])

@app.get("/auth")
def authenticate():
    code = request.args.get("privateCode")
    
    if code is None:
        return "Bad Request", 400

    response = get(f"https://auth.itinerary.eu.org/api/auth/verifyToken?privateCode={code}").json()
    if response["redirect"] == "https://scratch-coding-hut.github.io/auth":
        if response["valid"]:
            session["username"] = response["username"]
            return redirect("/auth")
        else:
            return "Authentication failed!"
    else:
        return "Invalid Redirect", 400

if __name__ == "__main__":
    app.run()
