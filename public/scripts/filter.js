


//reloader();

//this function will load the filter values
const filterForm = document.querySelector(".FilterForm");
let filterList = JSON.parse(localStorage.getItem("filterList")) || defaultfilterList;
const defaultfilterList={
    time: "none",
    cost: "none",
    difficulty: "none",
    dietary: "none",
};

function reloader(){
    
    filterForm.elements['time'].value = serverFilter.time;
    filterForm.elements['cost'].value = serverFilter.cost;
    filterForm.elements['difficulty'].value = serverFilter.difficulty;
    filterForm.elements['dietary'].value = serverFilter.dietary; 
}

function saveFilterValues(){
    // Save filter values to localStorage
    const filterValues = {
        time: filterForm.elements['time'].value,
        cost: filterForm.elements['cost'].value,
        difficulty: filterForm.elements['difficulty'].value,
        dietary: filterForm.elements['dietary'].value
    };
    localStorage.setItem("filterList", JSON.stringify(filterValues));
}

/* 



/// ---------------KEPLER'S WORK--------------

//find the form to get its elements
const filterForm = document.querySelector(".FilterForm");
const filterButton = filterForm.getElementsByClassName("FilterBtn");

// default json object if its not found
const defaultfilterList={
    time: "none",
    cost: "none",
    difficulty: "none",
    dietary: "none",
    filterStatus: false,
    innerText : "Apply Filter"
};

//instead of json i need to pull filtering list from server
//get the values from the json object NOT DOING THAT ANYMORE
let filterList = JSON.parse(localStorage.getItem("filterList")) || defaultfilterList;
// the filter activates when clicking apply filter it will try to get 
let filterOn = filterList.filterStatus || false; 

/// ---------------KEPLER'S WORK--------------

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
    filterList.time = filterForm.elements['time'].value;
    filterList.cost = filterForm.elements['cost'].value;
    filterList.difficulty = filterForm.elements['difficulty'].value;
    filterList.dietary = filterForm.elements['dietary'].value;
    filterList.filterStatus = filterOn;
    filterForm.elements['filterOn'].value = false;
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
    filterForm.elements['filterOn'].value = true;
    //next filterOn will turn it off
   }
   localStorage.setItem("filterList", JSON.stringify(filterList));
  
}



/*
//recipes is an object should return true or false 
function filterRecipes(recipes){

    if(!filterOn) return true; //if filter is not on say the recipe passes
    let decision = true;
    // time filter
    if(filterList.time =="none"){
        decision = decision && true;
    }else{
        decision = decision && (recipes.time <= parseInt(filterList.time));//wont enter if List.time is none
    }
    // cost filter
    //truncate the $ at the front of the cost

    let recipeCost = recipes.cost.substring(1); // Remove the $ sign
    if(filterList.cost =="none"){
        decision = decision && true;
    } else if(filterList.cost =="low"){
        decision = decision && (recipeCost<= 25);
    }else if(filterList.cost =="medium"){
        decision = decision && (recipeCost > 25 && recipeCost <= 75);}
        else if(filterList.cost =="high"){
            decision = decision && (recipeCost > 75);}

    // difficulty filter
    //if(filterList.difficulty =="none"){
     //   decision = decision && true;
    //}else{
      //  decision = decision && (recipes.difficulty === filterList.difficulty);
    //}

    // dietary filter
    //if(filterList.dietary =="none"){
     //   decision = decision && true;
    //}else{
      //  decision = decision && (recipes.dietary === filterList.dietary);
    //}
    return decision;
}

*/