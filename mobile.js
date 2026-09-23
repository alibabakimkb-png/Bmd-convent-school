const SCHOOL = "BMD Convent School";
let db = { students: [], teachers: [], bills: [], salaries: [], books: [], issues: [], attendance: {}, notices: [] };
let session = null;
let tab = "home";
const $ = id => document.getElementById(id);
const sName = id => db.students.find(s => s.id === id)?.name || id;
const today = () => new Date().toISOString().slice(0, 10);

async function boot() {
  db = await apiLoad({
    students: [], teachers: [], bills: [], salaries: [], books: [], issues: [], attendance: {}, notices: []
  });
  db.attendance ||= {};
}

async function persist() { await apiSave(db); }

async function login() {
  const res = await apiLogin($("user").value.trim(), $("pass").value.trim());
  if (!res.ok) {
    $("err").textContent = res.error || "Invalid staff ID or password.";
    return;
  }
  session = res;
  $("login").classList.add("hidden");
  $("app").classList.remove("hidden");
  $("who").textContent = res.name + " · " + res.role;
  go("home");
}

function go(name) {
  tab = name;
  document.querySelectorAll(".tab").forEach(t => t.classList.toggle("active", t.dataset.tab === name));
  render();
}

function render() {
  const root = $("screen");
  if (tab === "home") {
    const due = (db.bills || []).filter(b => b.status === "Due").length;
    const notice = (db.notices && db.notices[0] && db.notices[0].text) ||
      "Parent–Teacher Meeting will be held on Saturday at 10:00 a.m. Students must attend in uniform.";
    root.innerHTML = `
      <div class="notice"><b>Notice</b><br>${notice}</div>
      <div class="grid">
        <div class="tile"><span>Students</span><b>${db.students.length}</b></div>
        <div class="tile"><span>Faculty</span><b>${db.teachers.length}</b></div>
        <div class="tile"><span>Fees outstanding</span><b>${due}</b></div>
        <div class="tile"><span>Books issued</span><b>${(db.issues||[]).filter(i=>!i.returned).length}</b></div>
      </div>
      <div class="list" style="margin-top:12px">
        <div class="item" onclick="go('attend')"><div><h4>Mark attendance</h4><p>${today()}</p></div><span>›</span></div>
        <div class="item" onclick="go('fees')"><div><h4>Fee collection</h4><p>Record payments and dues</p></div><span>›</span></div>
        <div class="item" onclick="go('staff')"><div><h4>Staff salaries</h4><p>Paid and pending</p></div><span>›</span></div>
      </div>`;
    return;
  }
  if (tab === "attend") {
    const date = today();
    db.attendance[date] ||= { students: {} };
    root.innerHTML = `
      <p class="section-title">Attendance register</p>
      <p class="hint" style="text-align:left;margin-bottom:8px">${date} · P Present · A Absent</p>
      <div class="list">${db.students.map(s => {
        const st = db.attendance[date].students[s.id] || "";
        return `<div class="item">
          <div><h4>${s.name}</h4><p>Class ${s.class} · ${s.id}</p></div>
          <div class="rowbtns" style="width:auto;margin:0">
            <button class="btn" style="width:44px;background:${st==="P"?"#215c38":"#bbb"}" onclick="mark('${s.id}','P')">P</button>
            <button class="btn" style="width:44px;background:${st==="A"?"#6b1c28":"#bbb"}" onclick="mark('${s.id}','A')">A</button>
          </div>
        </div>`;
      }).join("")}</div>`;
    return;
  }
  if (tab === "fees") {
    root.innerHTML = `
      <p class="section-title">Fee ledger</p>
      <button class="btn" style="margin-bottom:10px" onclick="addBill()">+ New invoice</button>
      <div class="list">${(db.bills||[]).map(b => `
        <div class="item">
          <div><h4>${sName(b.studentId)}</h4><p>${b.title} · ₹${b.amount}</p></div>
          <button class="btn" style="width:auto;padding:8px 10px;background:${b.status==="Paid"?"#215c38":"#8a4a12"}"
            onclick="toggleBill('${b.id}')">${b.status}</button>
        </div>`).join("")}</div>`;
    return;
  }
  if (tab === "staff") {
    root.innerHTML = `
      <p class="section-title">Salary register</p>
      <div class="list">${(db.teachers||[]).map(t => {
      const sal = (db.salaries||[]).find(s => s.teacherId === t.id);
      return `<div class="item">
        <div><h4>${t.name}</h4><p>${t.subject} · ₹${t.salary}</p></div>
        <button class="btn" style="width:auto;padding:8px 10px;background:${sal&&sal.status==="Paid"?"#215c38":"#8a4a12"}"
          onclick="toggleSal('${t.id}')">${(sal && sal.status) || "Due"}</button>
      </div>`;
    }).join("")}</div>`;
    return;
  }
  if (tab === "more") {
    root.innerHTML = `
      <p class="section-title">Library and office</p>
      <div class="list">
        ${(db.books||[]).map(b => `<div class="item"><div><h4>${b.title}</h4><p>${(b.copies||0)-(b.issued||0)} copies available</p></div></div>`).join("")}
        <div class="item"><div><h4>School address</h4><p>Sanjay Colony, Sector-23, 33 Feet Road, Near KD Jewellers</p></div></div>
        <button class="btn ghost" onclick="location.href='/office'">Open desktop register</button>
        <button class="btn" style="margin-top:8px" onclick="addStudent()">+ Add student</button>
        <button class="btn ghost" style="margin-top:8px" onclick="location.reload()">Sign out</button>
      </div>`;
  }
}

async function mark(id, val) {
  const date = today();
  db.attendance[date] ||= { students: {}, teachers: {} };
  db.attendance[date].students[id] = val;
  await persist();
  render();
}
async function toggleBill(id) {
  const b = db.bills.find(x => x.id === id);
  if (!b) return;
  b.status = b.status === "Paid" ? "Due" : "Paid";
  await persist();
  render();
}
async function toggleSal(tid) {
  db.salaries ||= [];
  let s = db.salaries.find(x => x.teacherId === tid);
  if (!s) {
    const t = db.teachers.find(x => x.id === tid);
    s = { id: "SAL" + Date.now(), teacherId: tid, month: "2026-09", amount: t ? t.salary : 0, status: "Due" };
    db.salaries.push(s);
  }
  s.status = s.status === "Paid" ? "Due" : "Paid";
  await persist();
  render();
}
async function addStudent() {
  const name = prompt("Student name");
  if (!name) return;
  const klass = prompt("Class (for example 8-A)") || "—";
  db.students.push({
    id: "S" + String(100 + db.students.length + 1).slice(-3),
    name, class: klass, phone: "", fee: 0
  });
  await persist();
  alert("Student record saved.");
  go("home");
}
async function addBill() {
  if (!db.students.length) return alert("Please add a student first.");
  const list = db.students.map((s, i) => (i + 1) + ". " + s.name).join("\n");
  const n = Number(prompt("Select student number:\n" + list)) - 1;
  const st = db.students[n];
  if (!st) return;
  const title = prompt("Particulars", "Quarterly fee") || "Fee";
  const amount = Number(prompt("Amount (INR)", String(st.fee || 0)) || 0);
  db.bills.push({ id: "BILL" + Date.now(), studentId: st.id, title, amount, status: "Due", date: today() });
  await persist();
  render();
}
boot();
