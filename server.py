#!/usr/bin/env python3
"""BMD Convent School — local working server."""
import json
import os
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlparse

ROOT = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(ROOT, "data.json")

SEED = {
    "users": [
        {"user": "admin", "pass": "admin123", "role": "Admin", "name": "Office Admin"},
        {"user": "teacher", "pass": "teach123", "role": "Teacher", "name": "Anita Verma"},
    ],
    "students": [
        {"id": "S001", "name": "Aarav Mehta", "class": "8-A", "phone": "9876500001", "fee": 4500},
        {"id": "S002", "name": "Diya Kapoor", "class": "8-A", "phone": "9876500002", "fee": 4500},
        {"id": "S003", "name": "Kabir Singh", "class": "9-B", "phone": "9876500003", "fee": 5200},
        {"id": "S004", "name": "Isha Nair", "class": "6-C", "phone": "9876500004", "fee": 3800},
        {"id": "S005", "name": "Rohan Gupta", "class": "10-A", "phone": "9876500005", "fee": 6000},
    ],
    "teachers": [
        {"id": "T001", "name": "Anita Verma", "subject": "Maths", "phone": "9811100001", "salary": 42000},
        {"id": "T002", "name": "Rakesh Yadav", "subject": "Science", "phone": "9811100002", "salary": 40000},
        {"id": "T003", "name": "Neha Joshi", "subject": "English", "phone": "9811100003", "salary": 38000},
    ],
    "attendance": {},
    "salaries": [
        {"id": "SAL001", "teacherId": "T001", "month": "2026-09", "amount": 42000, "status": "Paid"},
        {"id": "SAL002", "teacherId": "T002", "month": "2026-09", "amount": 40000, "status": "Due"},
    ],
    "bills": [
        {"id": "BILL001", "studentId": "S001", "title": "Quarter Fee Jul-Sep", "amount": 4500, "status": "Paid", "date": "2026-09-05"},
        {"id": "BILL002", "studentId": "S003", "title": "Quarter Fee Jul-Sep", "amount": 5200, "status": "Due", "date": "2026-09-05"},
        {"id": "BILL003", "studentId": "S005", "title": "Lab + Exam Fee", "amount": 1800, "status": "Due", "date": "2026-09-12"},
    ],
    "books": [
        {"id": "BK01", "title": "NCERT Maths 8", "copies": 24, "issued": 6},
        {"id": "BK02", "title": "Science Explorer 9", "copies": 18, "issued": 4},
        {"id": "BK03", "title": "English Honeydew", "copies": 30, "issued": 11},
    ],
    "issues": [
        {"id": "IS01", "bookId": "BK01", "studentId": "S001", "date": "2026-09-10", "returned": False}
    ],
    "notices": [
        {"id": "N1", "text": "PTM Saturday 10 baje. Uniform ke saath aana hai."}
    ],
}


def load_db():
    if not os.path.exists(DB_PATH):
        save_db(SEED)
        return json.loads(json.dumps(SEED))
    with open(DB_PATH, "r", encoding="utf-8") as f:
        return json.load(f)


def save_db(db):
    with open(DB_PATH, "w", encoding="utf-8") as f:
        json.dump(db, f, indent=2, ensure_ascii=False)


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ROOT, **kwargs)

    def _json(self, code, obj):
        raw = json.dumps(obj, ensure_ascii=False).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(raw)))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(raw)

    def _body(self):
        n = int(self.headers.get("Content-Length", 0))
        if not n:
            return {}
        return json.loads(self.rfile.read(n).decode("utf-8"))

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def do_GET(self):
        path = urlparse(self.path).path
        if path in ("/", "/app"):
            self.path = "/mobile.html"
            return super().do_GET()
        if path == "/office":
            self.path = "/index.html"
            return super().do_GET()
        if path == "/api/data":
            return self._json(200, load_db())
        return super().do_GET()

    def do_POST(self):
        path = urlparse(self.path).path
        db = load_db()
        body = self._body()

        if path == "/api/login":
            u = next((x for x in db["users"] if x["user"] == body.get("user") and x["pass"] == body.get("pass")), None)
            if not u:
                return self._json(401, {"ok": False, "error": "Galat ID / password"})
            return self._json(200, {"ok": True, "name": u["name"], "role": u["role"], "user": u["user"]})

        if path == "/api/data":
            save_db(body)
            return self._json(200, {"ok": True})

        if path == "/api/reset":
            save_db(SEED)
            return self._json(200, load_db())

        return self._json(404, {"error": "not found"})

    def log_message(self, fmt, *args):
        print("[%s] %s" % (self.log_date_time_string(), fmt % args))


if __name__ == "__main__":
    port = int(os.environ.get("PORT", "8080"))
    load_db()
    print("BMD Convent School")
    print("Mobile app : http://127.0.0.1:%s/" % port)
    print("Office desk: http://127.0.0.1:%s/office" % port)
    ThreadingHTTPServer(("0.0.0.0", port), Handler).serve_forever()
