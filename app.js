const SCHOOL = "BMD Convent School";

const seed = () => ({
  users: [
    { user: "admin", pass: "admin123", role: "Admin", name: "Principal Sharma" },
    { user: "teacher", pass: "teach123", role: "Teacher", name: "Anita Verma" }
  ],
  students: [
    { id: "S001", name: "Aarav Mehta", class: "8-A", phone: "9876500001", fee: 4500 },
    { id: "S002", name: "Diya Kapoor", class: "8-A", phone: "9876500002", fee: 4500 },
    { id: "S003", name: "Kabir Singh", class: "9-B", phone: "9876500003", fee: 5200 },
    { id: "S004", name: "Isha Nair", class: "6-C", phone: "9876500004", fee: 3800 },
    { id: "S005", name: "Rohan Gupta", class: "10-A", phone: "9876500005", fee: 6000 }
  ],
  teachers: [
    { id: "T001", name: "Anita Verma", subject: "Maths", phone: "9811100001", salary: 42000 },
    { id: "T002", name: "Rakesh Yadav", subject: "Science", phone: "9811100002", salary: 40000 },
    { id: "T003", name: "Neha Joshi", subject: "English", phone: "9811100003", salary: 38000 }
  ],
  attendance: {},
  salaries: [
    { id: "SAL001", teacherId: "T001", month: "2026-09", amount: 42000, status: "Paid" },
    { id: "SAL002", teacherId: "T002", month: "2026-09", amount: 40000, status: "Due" }
  ],
  bills: [
    { id: "BILL001", studentId: "S001", title: "Quarter Fee Jul-Sep", amount: 4500, status: "Paid", date: "2026-09-05" },
    { id: "BILL002", studentId: "S003", title: "Quarter Fee Jul-Sep", amount: 5200, status: "Due", date: "2026-09-05" },
    { id: "BILL003", studentId: "S005", title: "Lab + Exam Fee", amount: 1800, status: "Due", date: "2026-09-12" }
  ],
  books: [
    { id: "BK01", title: "NCERT Maths 8", copies: 24, issued: 6 },
    { id: "BK02", title: "Science Explorer 9", copies: 18, issued: 4 },
    { id: "BK03", title: "English Honeydew", copies: 30, issued: 11 }
  ],
  issues: [
    { id: "IS01", bookId: "BK01", studentId: "S001", date: "2026-09-10", returned: false }
  ]
});

function load() {
  const raw = localStorage.getItem(KEY);
  if (!raw) {
    const d = seed();
    localStorage.setItem(KEY, JSON.stringify(d));
    return d;
  }
  return JSON.parse(raw);
}
function save(data) {
  db = data || db;
  apiSave(db);
}

let db = load();
let session = JSON.parse(localStorage.getItem("schoolos_session") || "null");
let page = "dashboard";

const $ = id => document.getElementById(id);

function today() {
  return new Date().toISOString().slice(0, 10);
}

async function login() {
  const u = $("user").value.trim();
  const p = $("pass").value.trim();
  const res = await apiLogin(u, p);
  if (!res.ok) {
    $("loginErr").textContent = res.error || "ID ya password match nahi hua.";
    return;
  }
  session = { name: res.name, role: res.role, user: res.user };
  localStorage.setItem("schoolos_session", JSON.stringify(session));
  startApp();
}

function logout() {
  session = null;
  localStorage.removeItem("schoolos_session");
  $("app").classList.add("hidden");
  $("loginScreen").classList.remove("hidden");
}

function startApp() {
  $("loginScreen").classList.add("hidden");
  $("app").classList.remove("hidden");
  $("who").textContent = `${session.name} · ${session.role}`;
  go("dashboard");
}

function go(name) {
  page = name;
  document.querySelectorAll(".nav-btn").forEach(b => b.classList.toggle("active", b.dataset.page === name));
  $("title").textContent = {
    dashboard: "Office board",
    students: "Vidyarthi register",
    teachers: "Adhyapak register",
    attendance: "Haazri kitab",
    salary: "Vetan khata",
    bills: "Fees / Bill",
    books: "Pustakalaya",
    reports: "Khata summary"
  }[name];
  render();
}

function studentName(id) { return db.students.find(s => s.id === id)?.name || id; }
function teacherName(id) { return db.teachers.find(t => t.id === id)?.name || id; }
function bookTitle(id) { return db.books.find(b => b.id === id)?.title || id; }

function attFor(date, type) {
  db.attendance[date] ||= { students: {}, teachers: {} };
  return db.attendance[date][type];
}

function presentCount(type) {
  const rec = attFor(today(), type);
  return Object.values(rec).filter(v => v === "P").length;
}

function render() {
  const root = $("content");
  if (page === "dashboard") {
    const dueBills = db.bills.filter(b => b.status === "Due").reduce((a, b) => a + b.amount, 0);
    const dueSal = db.salaries.filter(b => b.status === "Due").reduce((a, b) => a + b.amount, 0);
    root.innerHTML = `
      <div class="cards">
        <div class="card"><h3>Students</h3><div class="num">${db.students.length}</div></div>
        <div class="card"><h3>Teachers</h3><div class="num">${db.teachers.length}</div></div>
        <div class="card"><h3>Aaj Student Present</h3><div class="num">${presentCount("students")}</div></div>
        <div class="card"><h3>Aaj Teacher Present</h3><div class="num">${presentCount("teachers")}</div></div>
        <div class="card"><h3>Pending Fees</h3><div class="num">₹${dueBills}</div></div>
        <div class="card"><h3>Pending Salary</h3><div class="num">₹${dueSal}</div></div>
        <div class="card"><h3>Library Books</h3><div class="num">${db.books.reduce((a,b)=>a+b.copies,0)}</div></div>
        <div class="card"><h3>Issued Books</h3><div class="num">${db.issues.filter(i=>!i.returned).length}</div></div>
      </div>
      <div class="card" style="margin-top:16px">
        <h3>School</h3>
        <p style="margin-top:8px">${SCHOOL}</p>
        <p class="office-note">Prepared in school office · Session 2026–27 · Not for public notice board</p>
      </div>`;
    return;
  }

  if (page === "students") {
    root.innerHTML = listPage("Student add karein", studentRows(), "openStudentModal()");
    return;
  }
  if (page === "teachers") {
    root.innerHTML = listPage("Teacher add karein", teacherRows(), "openTeacherModal()");
    return;
  }
  if (page === "attendance") {
    root.innerHTML = `
      <div class="toolbar">
        <div class="row">
          <input class="search" type="date" id="attDate" value="${today()}" onchange="render()">
          <select class="search" id="attType" onchange="render()">
            <option value="students">Students</option>
            <option value="teachers">Teachers</option>
          </select>
        </div>
        <button class="btn small" onclick="markAll('P')">Sab Present</button>
      </div>
      <div class="card table-wrap"><table>${attRows()}</table></div>`;
    return;
  }
  if (page === "salary") {
    root.innerHTML = `
      <div class="toolbar">
        <input class="search" id="q" placeholder="Search..." oninput="render()">
        <button class="btn" onclick="openSalaryModal()">+ Salary entry</button>
      </div>
      <div class="card table-wrap"><table>
        <tr><th>ID</th><th>Teacher</th><th>Month</th><th>Amount</th><th>Status</th><th></th></tr>
        ${db.salaries.map(s => `
          <tr>
            <td>${s.id}</td><td>${teacherName(s.teacherId)}</td><td>${s.month}</td>
            <td>₹${s.amount}</td>
            <td><span class="badge ${s.status==="Paid"?"paid":"due"}">${s.status}</span></td>
            <td>
              <button class="btn small ghost" onclick="toggleSal('${s.id}')">${s.status==="Paid"?"Mark Due":"Mark Paid"}</button>
              <button class="btn small ghost" onclick="printSalary('${s.id}')">Slip</button>
            </td>
          </tr>`).join("")}
      </table></div>
      <div id="slipBox"></div>`;
    return;
  }
  if (page === "bills") {
    root.innerHTML = `
      <div class="toolbar">
        <input class="search" placeholder="Search student / bill" id="q" oninput="filterTable()">
        <button class="btn" onclick="openBillModal()">+ New bill</button>
      </div>
      <div class="card table-wrap"><table>
        <tr><th>Bill</th><th>Student</th><th>Title</th><th>Amount</th><th>Date</th><th>Status</th><th></th></tr>
        ${db.bills.map(b => `
          <tr>
            <td>${b.id}</td><td>${studentName(b.studentId)}</td><td>${b.title}</td>
            <td>₹${b.amount}</td><td>${b.date}</td>
            <td><span class="badge ${b.status==="Paid"?"paid":"due"}">${b.status}</span></td>
            <td>
              <button class="btn small ghost" onclick="toggleBill('${b.id}')">${b.status==="Paid"?"Mark Due":"Mark Paid"}</button>
              <button class="btn small ghost" onclick="printBill('${b.id}')">Print</button>
            </td>
          </tr>`).join("")}
      </table></div>
      <div id="slipBox"></div>`;
    return;
  }
  if (page === "books") {
    root.innerHTML = `
      <div class="toolbar">
        <button class="btn" onclick="openBookModal()">+ Book</button>
        <button class="btn ghost" onclick="openIssueModal()">Issue book</button>
      </div>
      <div class="cards">
        ${db.books.map(b => `<div class="card"><h3>${b.title}</h3><div class="num">${b.copies - b.issued} available</div><p class="hint">${b.issued} issued / ${b.copies} total</p></div>`).join("")}
      </div>
      <div class="card table-wrap" style="margin-top:14px">
        <h3>Issue register</h3>
        <table>
          <tr><th>ID</th><th>Book</th><th>Student</th><th>Date</th><th>Status</th><th></th></tr>
          ${db.issues.map(i => `
            <tr>
              <td>${i.id}</td><td>${bookTitle(i.bookId)}</td><td>${studentName(i.studentId)}</td>
              <td>${i.date}</td><td>${i.returned ? "Returned" : "Issued"}</td>
              <td>${i.returned ? "" : `<button class="btn small" onclick="returnBook('${i.id}')">Return</button>`}</td>
            </tr>`).join("")}
        </table>
      </div>`;
    return;
  }
  if (page === "reports") {
    const paidFees = db.bills.filter(b => b.status === "Paid").reduce((a,b)=>a+b.amount,0);
    const dueFees = db.bills.filter(b => b.status === "Due").reduce((a,b)=>a+b.amount,0);
    root.innerHTML = `
      <div class="cards">
        <div class="card"><h3>Collected Fees</h3><div class="num">₹${paidFees}</div></div>
        <div class="card"><h3>Outstanding Fees</h3><div class="num">₹${dueFees}</div></div>
        <div class="card"><h3>Salary Paid</h3><div class="num">₹${db.salaries.filter(s=>s.status==="Paid").reduce((a,b)=>a+b.amount,0)}</div></div>
      </div>
      <div class="card" style="margin-top:16px">
        <h3>Export</h3>
        <p class="hint">Data browser mein save ho raha hai. Reset bhi kar sakte ho.</p>
        <div class="row" style="margin-top:10px">
          <button class="btn ghost" onclick="exportJSON()">Download JSON backup</button>
          <button class="btn danger" onclick="resetDemo()">Reset demo data</button>
        </div>
      </div>`;
  }
}

function listPage(btn, rows, fn) {
  return `
    <div class="toolbar">
      <input class="search" id="q" placeholder="Search..." oninput="filterTable()">
      <button class="btn" onclick="${fn}">+ ${btn}</button>
    </div>
    <div class="card table-wrap"><table>${rows}</table></div>`;
}

function studentRows() {
  return `<tr><th>ID</th><th>Name</th><th>Class</th><th>Phone</th><th>Fee</th><th></th></tr>` +
    db.students.map(s => `<tr>
      <td>${s.id}</td><td>${s.name}</td><td>${s.class}</td><td>${s.phone}</td><td>₹${s.fee}</td>
      <td><button class="btn small danger" onclick="delStudent('${s.id}')">Delete</button></td>
    </tr>`).join("");
}
function teacherRows() {
  return `<tr><th>ID</th><th>Name</th><th>Subject</th><th>Phone</th><th>Salary</th><th></th></tr>` +
    db.teachers.map(t => `<tr>
      <td>${t.id}</td><td>${t.name}</td><td>${t.subject}</td><td>${t.phone}</td><td>₹${t.salary}</td>
      <td><button class="btn small danger" onclick="delTeacher('${t.id}')">Delete</button></td>
    </tr>`).join("");
}

function attRows() {
  const date = $("attDate") ? $("attDate").value : today();
  const type = $("attType") ? $("attType").value : "students";
  const list = type === "students" ? db.students : db.teachers;
  const rec = attFor(date, type);
  return `<tr><th>ID</th><th>Name</th><th>Status</th></tr>` + list.map(p => {
    const st = rec[p.id] || "A";
    return `<tr>
      <td>${p.id}</td><td>${p.name}${p.class ? " · " + p.class : ""}</td>
      <td>
        <button class="btn small ${st==="P"?"":"ghost"}" onclick="setAtt('${date}','${type}','${p.id}','P')">Present</button>
        <button class="btn small ${st==="A"?"danger":"ghost"}" onclick="setAtt('${date}','${type}','${p.id}','A')">Absent</button>
      </td>
    </tr>`;
  }).join("");
}

function setAtt(date, type, id, val) {
  attFor(date, type)[id] = val;
  save(db); render();
}
function markAll(val) {
  const date = $("attDate").value;
  const type = $("attType").value;
  const list = type === "students" ? db.students : db.teachers;
  list.forEach(p => attFor(date, type)[p.id] = val);
  save(db); render();
}

function modal(html) {
  const wrap = document.createElement("div");
  wrap.className = "modal-bg";
  wrap.id = "modal";
  wrap.innerHTML = `<div class="modal">${html}</div>`;
  document.body.appendChild(wrap);
}
function closeModal() { $("modal")?.remove(); }

function openStudentModal() {
  modal(`<h3>New Student</h3>
    <div class="grid2" style="margin-top:12px">
      <div class="field"><label>Name</label><input id="m_name"></div>
      <div class="field"><label>Class</label><input id="m_class" placeholder="8-A"></div>
      <div class="field"><label>Phone</label><input id="m_phone"></div>
      <div class="field"><label>Monthly Fee</label><input id="m_fee" type="number"></div>
    </div>
    <div class="row"><button class="btn" onclick="addStudent()">Save</button><button class="btn ghost" onclick="closeModal()">Cancel</button></div>`);
}
function addStudent() {
  const id = "S" + String(db.students.length + 101).slice(-3);
  db.students.push({
    id, name: $("m_name").value, class: $("m_class").value,
    phone: $("m_phone").value, fee: Number($("m_fee").value || 0)
  });
  save(db); closeModal(); render();
}
function delStudent(id) { db.students = db.students.filter(s => s.id !== id); save(db); render(); }

function openTeacherModal() {
  modal(`<h3>New Teacher</h3>
    <div class="grid2" style="margin-top:12px">
      <div class="field"><label>Name</label><input id="m_name"></div>
      <div class="field"><label>Subject</label><input id="m_sub"></div>
      <div class="field"><label>Phone</label><input id="m_phone"></div>
      <div class="field"><label>Salary</label><input id="m_sal" type="number"></div>
    </div>
    <div class="row"><button class="btn" onclick="addTeacher()">Save</button><button class="btn ghost" onclick="closeModal()">Cancel</button></div>`);
}
function addTeacher() {
  const id = "T" + String(db.teachers.length + 101).slice(-3);
  db.teachers.push({
    id, name: $("m_name").value, subject: $("m_sub").value,
    phone: $("m_phone").value, salary: Number($("m_sal").value || 0)
  });
  save(db); closeModal(); render();
}
function delTeacher(id) { db.teachers = db.teachers.filter(t => t.id !== id); save(db); render(); }

function openSalaryModal() {
  modal(`<h3>Salary Entry</h3>
    <div class="field"><label>Teacher</label>
      <select id="m_tid">${db.teachers.map(t=>`<option value="${t.id}">${t.name}</option>`).join("")}</select>
    </div>
    <div class="grid2">
      <div class="field"><label>Month</label><input id="m_month" type="month" value="2026-09"></div>
      <div class="field"><label>Amount</label><input id="m_amt" type="number"></div>
    </div>
    <div class="row"><button class="btn" onclick="addSalary()">Save</button><button class="btn ghost" onclick="closeModal()">Cancel</button></div>`);
}
function addSalary() {
  db.salaries.push({
    id: "SAL" + String(db.salaries.length + 101).slice(-3),
    teacherId: $("m_tid").value, month: $("m_month").value,
    amount: Number($("m_amt").value || 0), status: "Due"
  });
  save(db); closeModal(); render();
}
function toggleSal(id) {
  const s = db.salaries.find(x => x.id === id);
  s.status = s.status === "Paid" ? "Due" : "Paid";
  save(db); render();
}

function openBillModal() {
  modal(`<h3>New Bill</h3>
    <div class="field"><label>Student</label>
      <select id="m_sid">${db.students.map(s=>`<option value="${s.id}">${s.name}</option>`).join("")}</select>
    </div>
    <div class="field"><label>Title</label><input id="m_title" value="Quarter Fee"></div>
    <div class="grid2">
      <div class="field"><label>Amount</label><input id="m_amt" type="number"></div>
      <div class="field"><label>Date</label><input id="m_date" type="date" value="${today()}"></div>
    </div>
    <div class="row"><button class="btn" onclick="addBill()">Save</button><button class="btn ghost" onclick="closeModal()">Cancel</button></div>`);
}
function addBill() {
  db.bills.push({
    id: "BILL" + String(db.bills.length + 101).slice(-3),
    studentId: $("m_sid").value, title: $("m_title").value,
    amount: Number($("m_amt").value || 0), status: "Due", date: $("m_date").value
  });
  save(db); closeModal(); render();
}
function toggleBill(id) {
  const b = db.bills.find(x => x.id === id);
  b.status = b.status === "Paid" ? "Due" : "Paid";
  save(db); render();
}

function openBookModal() {
  modal(`<h3>Add Book</h3>
    <div class="field"><label>Title</label><input id="m_title"></div>
    <div class="field"><label>Copies</label><input id="m_copies" type="number"></div>
    <div class="row"><button class="btn" onclick="addBook()">Save</button><button class="btn ghost" onclick="closeModal()">Cancel</button></div>`);
}
function addBook() {
  db.books.push({
    id: "BK" + String(db.books.length + 10),
    title: $("m_title").value, copies: Number($("m_copies").value || 1), issued: 0
  });
  save(db); closeModal(); render();
}
function openIssueModal() {
  modal(`<h3>Issue Book</h3>
    <div class="field"><label>Book</label>
      <select id="m_bid">${db.books.map(b=>`<option value="${b.id}">${b.title}</option>`).join("")}</select>
    </div>
    <div class="field"><label>Student</label>
      <select id="m_sid">${db.students.map(s=>`<option value="${s.id}">${s.name}</option>`).join("")}</select>
    </div>
    <div class="row"><button class="btn" onclick="issueBook()">Issue</button><button class="btn ghost" onclick="closeModal()">Cancel</button></div>`);
}
function issueBook() {
  const book = db.books.find(b => b.id === $("m_bid").value);
  if (book.issued >= book.copies) { alert("Copies available nahi hain"); return; }
  book.issued += 1;
  db.issues.push({
    id: "IS" + String(db.issues.length + 10),
    bookId: book.id, studentId: $("m_sid").value, date: today(), returned: false
  });
  save(db); closeModal(); render();
}
function returnBook(id) {
  const iss = db.issues.find(i => i.id === id);
  iss.returned = true;
  const book = db.books.find(b => b.id === iss.bookId);
  if (book && book.issued > 0) book.issued -= 1;
  save(db); render();
}

function printBill(id) {
  const b = db.bills.find(x => x.id === id);
  $("slipBox").innerHTML = `<div class="print-slip" id="printArea">
    <div style="display:flex;gap:10px;align-items:center">
      <img src="./icons/crest.svg" width="48" alt="crest">
      <div><h2>${SCHOOL}</h2><p>Fee Receipt / Bill · Session 2026–27</p></div>
    </div>
    <hr>
    <p><b>Bill:</b> ${b.id}</p>
    <p><b>Student:</b> ${studentName(b.studentId)}</p>
    <p><b>Particulars:</b> ${b.title}</p>
    <p><b>Amount:</b> ₹${b.amount}</p>
    <p><b>Status:</b> ${b.status}</p>
    <p><b>Date:</b> ${b.date}</p>
  </div>
  <button class="btn" style="margin-top:8px" onclick="window.print()">Print</button>`;
}
function printSalary(id) {
  const s = db.salaries.find(x => x.id === id);
  $("slipBox").innerHTML = `<div class="print-slip" id="printArea">
    <div style="display:flex;gap:10px;align-items:center">
      <img src="./icons/crest.svg" width="48" alt="crest">
      <div><h2>${SCHOOL}</h2><p>Salary Slip · Session 2026–27</p></div>
    </div>
    <hr>
    <p><b>Teacher:</b> ${teacherName(s.teacherId)}</p>
    <p><b>Month:</b> ${s.month}</p>
    <p><b>Amount:</b> ₹${s.amount}</p>
    <p><b>Status:</b> ${s.status}</p>
  </div>
  <button class="btn" style="margin-top:8px" onclick="window.print()">Print</button>`;
}

function filterTable() {
  const q = ($("q")?.value || "").toLowerCase();
  document.querySelectorAll("table tr").forEach((tr, i) => {
    if (!i) return;
    tr.style.display = tr.innerText.toLowerCase().includes(q) ? "" : "none";
  });
}
function exportJSON() {
  const blob = new Blob([JSON.stringify(db, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "schoolos-backup.json";
  a.click();
}
function resetDemo() {
  if (!confirm("Demo data reset ho jayega?")) return;
  db = seed(); save(db); render();
}

window.addEventListener("load", async () => {
  db = await apiLoad(seed);
  if (session) startApp();
  if ("serviceWorker" in navigator) navigator.serviceWorker.register("./sw.js").catch(() => {});
});
