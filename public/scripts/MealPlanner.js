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

function generateTimeOptions(selectId) {
  const select = document.getElementById(selectId);

  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 15) {
      const hh = String(h).padStart(2, "0");
      const mm = String(m).padStart(2, "0");

      const value = `${hh}:${mm}`;

      // Optional display in AM/PM
      let displayHour = h % 12 || 12;
      let ampm = h < 12 ? "AM" : "PM";
      let display = `${displayHour}:${mm} ${ampm}`;

      const option = document.createElement("option");
      option.value = value;
      option.textContent = display;

      select.appendChild(option);
    }
  }
}

window.addEventListener("load", () => {
  generateTimeOptions("startTime");
  generateTimeOptions("endTime");

  // Default values
  document.getElementById("startTime").value = "00:00";
  document.getElementById("endTime").value = "01:00";
});

// Auto-update end time when start time changes
document.getElementById("startTime").addEventListener("change", (e) => {
  if (!e.target.value.includes(":")) return;

  const [h, m] = e.target.value.split(":").map(Number);

  if (isNaN(h) || isNaN(m)) return;

  let total = h * 60 + m + 60;

  const newH = String(Math.floor(total / 60)).padStart(2, "0");
  const newM = String(total % 60).padStart(2, "0");

  document.getElementById("endTime").value = `${newH}:${newM}`;
});