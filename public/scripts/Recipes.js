

/* This script handles the opening and closing of the filter overlay on the recipes page. */
const FilterOverlay = document.getElementById("FilterOverlay");
const btn = document.getElementById("OpenFilter");
const close = document.querySelector(".CloseBtn");

/// ---------------KEPLER'S WORK--------------

//find the form to get its elements
const filterForm = document.querySelector(".FilterForm");
const filterButton = filterForm.getElementsByClassName("FilterBtn");

// default json object if its not found
const defaultfilterList={
    time: "",
    cost: "",
    difficulty: "none",
    dietary: "none",
    filterStatus: false,
    innerText : "Apply Filter"
};

//get the values from the json object
let filterList = JSON.parse(localStorage.getItem("filterList")) || defaultfilterList;
// the filter activates when clicking apply filter it will try to get 
let filterOn = filterList.filterStatus || false; 

console.log(filterList);

reloader();
/// ---------------KEPLER'S WORK--------------

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



//filterForm.addEventListener('submit', function (event) {
  //  event.preventDefault(); // Prevents the page reload for now
//});

// on click function for the apply filter button
function applyFilter(){
 FilterOverlay.style.display = "none";
    //obviously we'll want to change this so we have both an option to reapply
    // a filter or remove filter
   if(filterOn) {
    filterOn = false;
    filterButton.innerText = "Apply Filter";

    
    //default filterList
    filterList = defaultfilterList;  
   }else{   
    filterOn = true;
    filterButton.innerText = "Close Filter";
      //save in JSON the new filterList
    filterList.time = filterForm.elements['time'].value;
    filterList.cost = filterForm.elements['cost'].value;
    filterList.difficulty = filterForm.elements['difficulty'].value;
    filterList.dietary = filterForm.elements['dietary'].value;
    filterList.filterStatus = filterOn;
     // filter will be applied next
    filterList.innerText = "Close Filter";  
   }
   localStorage.setItem("filterList", JSON.stringify(filterList));
  
}


function reloader(){
    filterButton.textContent=filterList.innerText;
    filterForm.elements['time'].value = filterList.time;
    filterForm.elements['cost'].value = filterList.cost;
    filterForm.elements['difficulty'].value = filterList.difficulty;
    filterForm.elements['dietary'].value = filterList.dietary;
    filterOn = filterList.filterStatus;

}