from base64 import b64encode
from os import getenv
from flask import Flask, redirect, request, session, render_template
from requests import get
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__, template_folder="src")  # Change template folder to "src"
app.secret_key = "\x0e*.UT\x85+rJ\xd3\x97\xa0g\xce4\xf0\xab\xc5\xcf\xc0*2\x1e}"

"""
Thanks to Chiroyce (https://replit.com/@Chiroyce/auth) for part of the code! Truly the GOAT.
"""

def base64(string):
    return b64encode(string.encode("utf-8")).decode()

@app.get("/")
def home():
    return render_template("account.html")

@app.get("/auth")
def auth():
    if "username" not in session:
        return redirect(f"https://auth.itinerary.eu.org/auth/?redirect={ base64('https://scratch-coding-hut.github.io/account.html') }&name=Scratch%20Coding%20Hut")
    else:q
        return render_template("auth.html", username=session["username"])

@app.get("/authenticate")
def authenticate():
    code = request.args.get("privateCode")
    
    if code is None:
        return "Bad Request", 400

    response = get(f"https://auth.itinerary.eu.org/api/auth/verifyToken?privateCode={code}").json()
    if response["redirect"] == "https://scratch-coding-hut.github.io/account.html":
        if response["valid"]:
            session["username"] = response["username"]
            return redirect("/auth")
        else:
            return "Authentication failed!"
    else:
        return "Invalid Redirect", 400

if __name__ == "__main__":
    app.run()
