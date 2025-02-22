
let map;
let userMarker;
let building = "default";
let bounds;
function start() {
    //Clear possible previous session storage and create event listeners
    sessionStorage.clear();
    createEventListeners();
    //placeUserOnMap();
    //setInterval(placeUserOnMap, 10000)
    setDefaultBounds();
    setInterval(updateMap,5000);

}

function createEventListeners() {
    button = document.getElementById('button');
    button.addEventListener("click", buttonHandler);
}

async function buttonHandler() {

    //Get the building and check for an entry
    building = document.getElementById('building').value;
    console.log("Building: " + building);
    if(building == "campus") {
        window.alert("Please Select a Building.");
        return;
    }

    //Get the class fields and add them to an array
    fields = document.getElementsByClassName('field');
    let classNumbers = Array();
    for(let i = 0, k = 0; i < fields.length; i++) {
        if(fields[i].value != '') {
            classNumbers.push(parseInt(fields[i].value));

            //Check for non integers answers
            if(Number.isNaN(classNumbers[k])) {
                window.alert("Please Enter Numbers");
                return;
            }
            if(classNumbers[k] > 99999) {
                window.alert("Room Numbers Must be 5 Digits or Less");
                return;
            }
            k++;
        }

    }


    if(classNumbers.length == 0) {
        alert("Please Enter at Least One Classroom Number");
        return;
    }

    //Trim rooms to ensure they follow correct typing
    if(!validateRoomNumbers(building, classNumbers))
        return;
    buildingCoordiantes = await getCoordiantes(building, 0);
    console.log("Coordinates: " + buildingCoordiantes)
    storeClassrooms(building, classNumbers);
}

//Check through classrooms.json to ensure every entered classroom is a real classroom
async function validateRoomNumbers(building, enteredClassrooms) {
    await retrieveClassrooms(building)
        .then(classes => {
            for(let i = 0; i < enteredClassrooms.length; i++) {
                missing = true;
                for(let j = 0; j < classes.length; j++) {
                    if(classes[j] == enteredClassrooms[i]) {
                        missing = false;
                        break;
                    }
                }
                if(missing) {
                    window.alert("One of your classrooms doesn't exist");
                    return false;
                }
            }
        })
    return true;
}

async function retrieveClassrooms(building) {
    return fetch("./classrooms.json")
        .then(response => {return response.json()}) //take json portion of fetch
        .then(data => {return data[building]}) //return building key of json
        .catch(error => console.error("Error retrieving classrooms"))
}

//Fetch building/room coordinates from coordinates.json
async function getCoordiantes(building, roomNumber) {
    return fetch("./coordinates.json")
        .then(response => {return response.json()}) //Get json from coordinates.json
        .then(data => {return data[building]})      //Get json from building selected
        .then(buildingJson => {return buildingJson[String(roomNumber)]})   //Narrow to roomNumber (0 for bulding itself)
        .catch(error => console.log("Error retrieving building coordinates"))
}


//Save classrooms in local storage
function storeClassrooms(building, classrooms) {
    sessionStorage.setItem("building", building);
    sessionStorage.setItem("classrooms", classrooms);
}


    function initMap() {

    map = new google.maps.Map(document.getElementById("map"), {
    center: { lat: 38.75851500233256, lng: -93.7386496286563 }, // Example: Warrensburg
    zoom: 18,
        styles: [
            {
                featureType: "poi", // Disables points of interest (default markers)
                elementType: "labels",
                stylers: [{ visibility: "off" }]
            },
            {
                featureType: "transit", // Disables transit markers
                elementType: "labels",
                stylers: [{ visibility: "off" }]
            },
            {toggleStreetView : false}
        ]
});
}
    window.initMap = initMap; // ✅ Ensure global scope


function placeUserOnMap() {
    if(navigator.geolocation){
        let userLocation;
        navigator.geolocation.getCurrentPosition( (position) =>
            {
                userLocation = {
                    lat : position.coords.latitude,
                    lng : position.coords.longitude
                };
                if (map) {
                    map.setCenter(userLocation);

                    // Add a marker at the users location
                   if (userMarker != null){
                       userMarker.setPosition(userLocation);
                   }
                   else{
                       userMarker = new google.maps.Marker({
                           position: userLocation,
                           map: map,
                           title: "You are here",
                       });

                    console.log("Map center moved to:", map.getCenter().toJSON());
                }
                }
            }
        )
    }
}

function setDefaultBounds() {
//     SW: 38.75584609299071, -93.74314581659915
//     NE: 38.760581485120454, -93.73409265378699

    const sw = new google.maps.LatLng(38.75584609299071, -93.74314581659915);
    const ne = new google.maps.LatLng(38.760581485120454, -93.73409265378699);

    bounds = new google.maps.LatLngBounds(sw,ne);
    map.fitBounds(bounds);

}

function updateBounds(){
    lat = 39.08813678102937
    lon = -92.18579472908672

    temp = new google.maps.LatLng(lat,lon);
    bounds = bounds.extend(temp);
    map.fitBounds(bounds);
}

function frameOnUserAndBuilding(){
    //     Used to update bounds when user and building coords are populated
    //     This ensure that the map is always showing the users position and their destination
}

function updateMap(){

    frameOnUserAndBuilding();
    updateBounds();

}





window.addEventListener("load", start);