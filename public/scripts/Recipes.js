

/* This script handles the opening and closing of the filter overlay on the recipes page. */
const FilterOverlay = document.getElementById("FilterOverlay");
const btn = document.getElementById("OpenFilter");
const close = document.querySelector(".CloseBtn");


/// ----MARTIN'S WORK----
// Open FilterOverlay
btn.onclick = () => {
    FilterOverlay.style.display = "flex";
}

// Close FilterOverlay
close.onclick = () => {
    FilterOverlay.style.display = "none";  
}

// Close if click outside FilterOverlay content
window.onclick = (e) => {
    if (e.target === FilterOverlay) {
        FilterOverlay.style.display = "none";
    }
}

/// ----MARTIN'S WORK----

