const form = document.getElementById("progressForm");

form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const studentName = document.getElementById("studentName").value.trim();
    const courseName = document.getElementById("courseName").value.trim();
    const completionPercentage = Number(
        document.getElementById("completionPercentage").value
    );

    try {
        const response = await fetch("/progress", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ studentName, courseName, completionPercentage })
        });
        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            alert(data.message || `Could not add progress (status ${response.status}).`);
            return;
        }

        // Save hone ke baad list wale page par bhejo
        window.location.href = "progress.html";
    } catch (error) {
        alert("Could not reach the server. Please try again.");
    }
});