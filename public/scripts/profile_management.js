let currentData = window.serverData || { preference: 'none', allergies: [] }; // Get the saved data that the server passed

// Select DOM Elements
const dietSelect = document.getElementById('select-dietary-preferences');
const chosenText = document.getElementById('show-preference');
const allergyInput = document.getElementById('allergy-input');
const addAllergyBtn = document.getElementById('add-allergy-button');
const allergyList = document.getElementById('allergy-list');

// Load the saved data onto the screen
function init() {
    dietSelect.value = currentData.preference;// Set the dropdown to the saved value
    chosenText.textContent = currentData.preference;
   
    renderAllergies(); // Build the allergy list
}

// Draw the list of allergies
function renderAllergies() {

    
    const header = allergyList.querySelector('h3');
    allergyList.innerHTML = ''; 
    if (header) allergyList.appendChild(header); // Put the header back exactly as it was

    currentData.allergies.forEach((allergy, index) => {
        const container = document.createElement('div');
        container.style.display = "flex";
        container.style.alignItems = "center";
        container.style.marginBottom = "5px";

        const text = document.createElement('p');
        text.className = 'current-allergy'; 
        text.textContent = allergy;
        text.style.marginRight = "10px";
       
        const delBtn = document.createElement('button'); // The Delete Button
        delBtn.textContent = "Delete";
        
        delBtn.className = 'current-allergy-button'; 
        
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


// Handle Dropdown Change
dietSelect.addEventListener('change', (e) => {
    currentData.preference = e.target.value;
    chosenText.textContent = e.target.value; // Update text immediately
    saveData(); 
});

// Handle Add Allergy Button
addAllergyBtn.addEventListener('click', () => {
    const val = allergyInput.value.trim();
    if (val) {
        currentData.allergies.push(val); 
        allergyInput.value = ""; 
        renderAllergies(); 
        saveData(); 
    }
});

init();