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
  generateTimeOptions("startTimeSelect");
  generateTimeOptions("endTimeSelect");

  // Default values
  document.getElementById("startTimeSelect").value = "00:00";
  document.getElementById("endTimeSelect").value = "01:00";
});

// Auto-update end time when start time changes
document.getElementById("startTimeSelect").addEventListener("change", (e) => {
  if (!e.target.value.includes(":")) return;

  const [h, m] = e.target.value.split(":").map(Number);

  if (isNaN(h) || isNaN(m)) return;

  let total = h * 60 + m + 60;

  const newH = String(Math.floor(total / 60)).padStart(2, "0");
  const newM = String(total % 60).padStart(2, "0");

  document.getElementById("endTimeSelect").value = `${newH}:${newM}`;
});

// Handle meal-block clicks to open modal
document.addEventListener('click', (e) => {
  if (e.target.closest('.meal-block')) {
    const block = e.target.closest('.meal-block');
    const name = block.dataset.name;
    const date = block.dataset.date;
    const start = block.dataset.startTime;
    const end = block.dataset.endTime;
    openMealModal(name, date, start, end);
  }
});

function openMealModal(name, date, start, end) {
  // Find the recipe
  const recipe = recipes.find(r => r.name === name);
  if (!recipe) {
    console.error('Recipe not found');
    return;
  }

  // Populate the modal
  document.getElementById('mealModalName').textContent = name;
  
  // Populate ingredients as list
  const ingredientsList = document.getElementById('mealModalIngredients');
  ingredientsList.innerHTML = '';
  recipe.ingredients.forEach(ingredient => {
    const li = document.createElement('li');
    li.textContent = ingredient;
    ingredientsList.appendChild(li);
  });
  
  document.getElementById('mealModalTime').textContent = `${start} - ${end}`;

  // Set delete form fields
  document.getElementById('deleteMealName').value = name;
  document.getElementById('deleteMealDate').value = date;
  document.getElementById('deleteMealStartTime').value = start;
  document.getElementById('deleteMealEndTime').value = end;

  // Store data for edit
  document.getElementById('editMealBtn').onclick = () => {
    openEditMealOverlay(name, date, start, end);
  };

  // Show the modal
  document.getElementById('mealModal').classList.remove('hidden');
}

// Close modal when clicking close button
document.getElementById('closeMealModal').addEventListener('click', () => {
  document.getElementById('mealModal').classList.add('hidden');
});

// Close modal when clicking outside
window.addEventListener('click', (e) => {
  const modal = document.getElementById('mealModal');
  if (e.target === modal) {
    modal.classList.add('hidden');
  }
});

function openEditMealOverlay(name, date, start, end) {
  // Close the meal modal
  document.getElementById('mealModal').classList.add('hidden');

  // Populate the form
  document.getElementById('recipeSelect').value = name;
  document.getElementById('dateInput').value = date;
  document.getElementById('startTimeSelect').value = start;
  document.getElementById('endTimeSelect').value = end;

  // Set hidden fields for original data
  document.getElementById('originalName').value = name;
  document.getElementById('originalDate').value = date;
  document.getElementById('originalStartTime').value = start;
  document.getElementById('originalEndTime').value = end;

  // Change action to edit
  document.getElementById('mealPlanForm').action = '/mealPlanner/edit';

  // Update title and button
  document.getElementById('modalTitle').textContent = 'Edit Meal Plan';
  document.getElementById('submitBtn').textContent = 'Update Meal';

  // Open the overlay
  toggleAddMealPlanOverlay('open');
}

// Reset form when opening for add
document.getElementById('add-meal-plan-btn').addEventListener('click', () => {
  document.getElementById('mealPlanForm').reset();
  document.getElementById('methodField').value = 'POST';
  document.getElementById('originalName').value = '';
  document.getElementById('originalDate').value = '';
  document.getElementById('originalStartTime').value = '';
  document.getElementById('originalEndTime').value = '';
  document.getElementById('modalTitle').textContent = 'Add Recipes to Schedule';
  document.getElementById('submitBtn').textContent = 'Add to Schedule';
});

// Delete confirmation for meal
window.addEventListener('load', () => {
  const mealDeleteForm = document.querySelector('form[action="/mealPlanner/delete"]');
  if (mealDeleteForm) {
    const deleteBtn = mealDeleteForm.querySelector('button[type="submit"]');
    if (deleteBtn) {
      deleteBtn.addEventListener('click', (e) => {
        const confirmDelete = confirm("Are you sure you want to remove this meal?");
        if (!confirmDelete) {
          e.preventDefault();
        }
      });
    }
  }

  // Auto-dismiss flash messages
  const flashMessage = document.querySelector('.flash-message');
  const flashError = document.querySelector('.flash-error');

  const dismissFlash = (element) => {
    if (element) {
      setTimeout(() => {
        element.style.transition = "opacity 0.4s ease";
        element.style.opacity = "0";
        setTimeout(() => {
          element.remove();
        }, 400);
      }, 3000);
    }
  };

  dismissFlash(flashMessage);
  dismissFlash(flashError);
});
