 let currentData = window.serverData || { preference: 'none', allergies: [] }; // Get the saved data that the server passed to us (define 'serverData' in the EJS file)

// Select DOM Elements
const dietSelect = document.getElementById('select-dietary-preferences');
const chosenText = document.getElementById('show-preference');
const allergyInput = document.getElementById('allergy-input');
const addAllergyBtn = document.getElementById('add-allergy-button');
const allergyList = document.getElementById('allergy-list');

// Load the saved data onto the screen
function init() {
    // Set the dropdown to the saved value
    dietSelect.value = currentData.preference;
    chosenText.textContent = currentData.preference;

    // Build the allergy list
    renderAllergies();
}

// Draw the list of allergies
function renderAllergies() {

    // Clear the current list (except the header)
    const header = allergyList.querySelector('h3');
    allergyList.innerHTML = ''; // Clear everything
    if (header) allergyList.appendChild(header); // Put the header back exactly as it was

    currentData.allergies.forEach((allergy, index) => {
        const container = document.createElement('div');
        container.style.display = "flex";
        container.style.alignItems = "center";
        container.style.marginBottom = "5px";

        // The text
        const text = document.createElement('p');
        text.className = 'current-allergy'; // Matches teammate's class
        text.textContent = allergy;
        text.style.marginRight = "10px";

        // The Delete Button
        const delBtn = document.createElement('button');
        delBtn.textContent = "Delete";
        
        // --- CRITICAL FIX: MATCHING TEAMMATE'S CLASS ---
        delBtn.className = 'current-allergy-button'; 
        // -----------------------------------------------
        
        delBtn.onclick = () => {
            currentData.allergies.splice(index, 1); 
            renderAllergies(); 
            saveData(); 
        };

        container.appendChild(text);
        container.appendChild(delBtn);
        allergyList.appendChild(container);
    });
}

// Send data to the Server
function saveData() {
    fetch('/api/save-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(currentData)
    }).then(response => console.log("Saved to JSON!"));
}


// --- EVENT LISTENERS ---

// Handle Dropdown Change
dietSelect.addEventListener('change', (e) => {
    currentData.preference = e.target.value;
    chosenText.textContent = e.target.value; // Update text immediately
    saveData(); // Save to JSON
});

// Handle Add Allergy Button
addAllergyBtn.addEventListener('click', () => {
    const val = allergyInput.value.trim();
    if (val) {
        currentData.allergies.push(val); // Add to array
        allergyInput.value = ""; // Clear input
        renderAllergies(); // Re-draw list
        saveData(); // Save to JSON
    }
});

// Start the engine
init();