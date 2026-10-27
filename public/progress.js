const progressList = document.getElementById("progressList");

let progressData = [];
let editingId = null; // jis card ko edit kar rahe hain uski id

/* ---------- Helpers ---------- */

// Special characters ko safe banata hai
function esc(value) {
    return String(value ?? "").replace(/[&<>"']/g, (c) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    }[c]));
}

function clampPercent(value) {
    return Math.min(100, Math.max(0, Number(value) || 0));
}

/* ---------- Card views ---------- */

function viewCard(item) {
    const pct = clampPercent(item.completionPercentage);
    const id = esc(item._id);

    return `
        <div data-id="${id}">
            <h3>${esc(item.studentName)}</h3>
            <p>Course: ${esc(item.courseName)}</p>

            <div class="progress-head">
                <span>Progress</span>
                <strong>${pct}%</strong>
            </div>
            <div class="progress-track" role="progressbar"
                 aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100">
                <div class="progress-fill" style="width: ${pct}%"></div>
            </div>

            <p class="updated">Last Updated: ${new Date(item.lastUpdated).toLocaleString()}</p>

            <div class="card-actions">
                <button type="button" class="btn btn-ghost" data-action="edit">Edit</button>
                <button type="button" class="btn btn-danger" data-action="delete">Delete</button>
            </div>
        </div>
    `;
}

function editCard(item) {
    const id = esc(item._id);

    return `
        <div data-id="${id}">
            <label>Student Name</label>
            <input type="text" name="studentName" maxlength="50" value="${esc(item.studentName)}">

            <label>Course Name</label>
            <input type="text" name="courseName" maxlength="80" value="${esc(item.courseName)}">

            <label>Completion Percentage</label>
            <input type="number" name="completionPercentage" min="0" max="100"
                   value="${clampPercent(item.completionPercentage)}">

            <p class="form-error"></p>

            <div class="card-actions">
                <button type="button" class="btn btn-primary" data-action="save">Save</button>
                <button type="button" class="btn btn-ghost" data-action="cancel">Cancel</button>
            </div>
        </div>
    `;
}

function render() {
    if (progressData.length === 0) {
        progressList.innerHTML = `<p class="empty">No progress added yet.</p>`;
        return;
    }

    progressList.innerHTML = progressData
        .map((item) => (item._id === editingId ? editCard(item) : viewCard(item)))
        .join("");
}

/* ---------- READ ---------- */

async function showProgress() {
    try {
        const response = await fetch("/progress");
        if (!response.ok) throw new Error("Server error");
        const data = await response.json();

        // Sabse naya update upar
        progressData = data.sort(
            (a, b) => new Date(b.lastUpdated) - new Date(a.lastUpdated)
        );
        render();
    } catch (error) {
        console.error(error);
        progressList.innerHTML = `<p class="empty">Could not load progress. Please check that the server is running.</p>`;
    }
}

/* ---------- UPDATE ---------- */

async function saveEdit(card, id) {
    const errorEl = card.querySelector(".form-error");
    const saveBtn = card.querySelector('[data-action="save"]');
    errorEl.textContent = "";

    const payload = {
        studentName: card.querySelector('[name="studentName"]').value.trim(),
        courseName: card.querySelector('[name="courseName"]').value.trim(),
        completionPercentage: Number(
            card.querySelector('[name="completionPercentage"]').value
        )
    };

    saveBtn.disabled = true;
    try {
        const response = await fetch(`/progress/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });
        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            errorEl.textContent = data.message || "Could not update progress.";
            return;
        }

        editingId = null;
        await showProgress();
    } catch (error) {
        errorEl.textContent = "Could not reach the server. Please try again.";
    } finally {
        saveBtn.disabled = false;
    }
}

/* ---------- DELETE ---------- */

async function deleteProgress(id) {
    const item = progressData.find((p) => p._id === id);
    const ok = confirm(`Delete progress of "${item ? item.studentName : "this student"}"? This cannot be undone.`);
    if (!ok) return;

    try {
        const response = await fetch(`/progress/${id}`, { method: "DELETE" });
        if (!response.ok) {
            const data = await response.json().catch(() => ({}));
            alert(data.message || "Could not delete progress.");
            return;
        }
        await showProgress();
    } catch (error) {
        alert("Could not reach the server. Please try again.");
    }
}

/* ---------- Card buttons (event delegation) ---------- */

progressList.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-action]");
    if (!btn) return;

    const card = btn.closest("[data-id]");
    const id = card.dataset.id;

    switch (btn.dataset.action) {
        case "edit":
            editingId = id;
            render();
            break;
        case "cancel":
            editingId = null;
            render();
            break;
        case "save":
            saveEdit(card, id);
            break;
        case "delete":
            deleteProgress(id);
            break;
    }
});

// Page load hone par saved data show karega
showProgress();