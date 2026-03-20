function toggleAddMealPlanOverlay(action) {
    const addMealPlanForm = document.querySelector(".addMealPlanOverlay");

    if (!addMealPlanForm) {
        console.error("Overlay not found");
        return;
    }

    if (action === "open") {
        addMealPlanForm.style.display = "flex";
    } else if (action === "close") {
        addMealPlanForm.style.display = "none";
    }
}

window.addEventListener("click", (e) => {
    const overlay = document.getElementById("AddMealPlanOverlay");

    if (!overlay) return;

    // If user clicks directly on the overlay (outside modal content)
    if (e.target === overlay) {
        overlay.style.display = "none";
    }
});

window.addEventListener("load", () => {
    const grid = document.getElementById("calendarGrid");

    if (!grid) return;

    const rowHeight = 60; // MUST match .cell height
    const startHour = 8;

    grid.scrollTop = (rowHeight * startHour);
});

window.addEventListener("load", () => {
    if (window.lucide) {
        lucide.createIcons();
    }
});

const flash = document.getElementById("flash-error-message");

if (flash) {
    flash.style.transition = "opacity 0.5s ease";

    setTimeout(() => {
        flash.style.opacity = "0";
    }, 2500);

    setTimeout(() => {
        flash.remove();
    }, 3000);
}