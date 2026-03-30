let currentData = window.serverData || { preference: 'None', allergies: [] };
let originalData = JSON.stringify(currentData);

// DOM elements
const dietSelect = document.getElementById('select-dietary-preferences');
const chosenText = document.getElementById('show-preference');
const allergyInput = document.getElementById('allergy-input');
const addAllergyBtn = document.getElementById('add-allergy-button');
const allergyList = document.getElementById('allergy-list');
const saveBtn = document.getElementById('save-profile-button');
const saveStatus = document.getElementById('save-status');

saveBtn.disabled = true;

// Init
function init() {
  dietSelect.value = currentData.preference;
  chosenText.textContent = currentData.preference;
  renderAllergies();
}

// Render allergies
function renderAllergies() {
  const header = allergyList.querySelector('h3');
  allergyList.innerHTML = '';
  if (header) allergyList.appendChild(header);

  currentData.allergies.forEach((allergy, index) => {
    const row = document.createElement('div');
    row.className = 'allergy-item';

    const text = document.createElement('span');
    text.textContent = allergy;

    const delBtn = document.createElement('button');
    delBtn.textContent = 'Delete';
    delBtn.className = 'current-allergy-button';

    delBtn.onclick = () => {
      currentData.allergies.splice(index, 1);
      renderAllergies();
      updateSaveButton();
    };

    row.appendChild(text);
    row.appendChild(delBtn);
    allergyList.appendChild(row);
  });
}

// Change detection
function hasChanges() {
  return JSON.stringify(currentData) !== originalData;
}

function updateSaveButton() {
  saveBtn.disabled = !hasChanges();
}

// Events
dietSelect.addEventListener('change', (e) => {
  currentData.preference = e.target.value;
  chosenText.textContent = e.target.value;
  updateSaveButton();
});

addAllergyBtn.addEventListener('click', () => {
  const val = allergyInput.value.trim();
  if (!val) return;

  currentData.allergies.push(val);
  allergyInput.value = '';
  renderAllergies();
  updateSaveButton();
});

saveBtn.addEventListener('click', () => {
  saveStatus.textContent = 'Saving...';
  saveBtn.disabled = true;

  fetch('/api/save-profile', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(currentData)
  })
    .then(res => res.json())
    .then(() => {
      originalData = JSON.stringify(currentData);
      saveStatus.textContent = 'Saved successfully ✓';
      updateSaveButton();
      setTimeout(() => saveStatus.textContent = '', 2000);
    })
    .catch(() => {
      saveStatus.textContent = 'Error saving';
    });
});

init();