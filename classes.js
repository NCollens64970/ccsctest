

let map;
let userMarker;
let destination;
let destinationMarker;
let building = "campus";
let bounds;


function start() {
    sessionStorage.clear();
    createEventListeners();
    destination = new google.maps.LatLng(38.75887529868099, -93.7383900155052);
    updateMap();
    setDefaultBounds();
    placeDestinationOnMap();
    setInterval(updateMap, 3000)


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
    outlineBuilding(building);
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

//Draw an outline of the building on the map
async function outlineBuilding(building) {
    latLngArray = Array();
    const {Polygon} = await google.maps.importLibrary("maps")
    

    await getOutlineCoordinates(building)
        .then(coordinates => {
            console.log("Coords: " + coordinates)
            for(let i = 0; i < coordinates.length; i++) {
                latLngArray.push(new google.maps.LatLng((coordinates[i])[0],(coordinates[i])[1]))
            }

            polygon = new Polygon(coordinates)
            polygon.setMap(map)
            polygon.setOptions([fillColor = "red"])
            polygon.setVisible(true)

            console.log("Map Center: " + map.getCenter())

            console.log(polygon)

        })

}

//Fetch building/room coordinates from coordinates.json
async function getRoomCoordiantes(building, roomNumber) {
    key = String(building + "-class")
    return fetch("./coordinates.json")
        .then(response => {return response.json()}) //Get json from coordinates.json
        .then(data => {return data[key]})      //Get json from building selected
        .then(buildingJson => {return buildingJson[String(roomNumber)]})   //Narrow to roomNumber (0 for bulding itself)
        .catch(error => console.log("Error retrieving building coordinates"))
}

//Fetch building outline coordinates
async function getOutlineCoordinates(building) {
    key = String(building + "-outline")
    return fetch("./coordinates.json")
        .then(response => {return response.json()})
        .then(data => {return data[key]})
        .catch(error => console.log("Error getting outline coordinates"))
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
    styles: [{
        featureType: "poi", // Disables points of interest (default markers)
        elementType: "labels",
        stylers: [{ visibility: "off" }]},{
        featureType: "transit", // Disables transit markers
        elementType: "labels",
        stylers: [{ visibility: "off" }]},
        {toggleStreetView : false}
    ]});
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
                    //map.setCenter(userLocation);

                    // Add a marker at the users location
                   if (userMarker != null){
                       userMarker.setPosition(userLocation);
                   }
                   else{
                       userMarker = new google.maps.Marker({
                           position: userLocation,
                           map: map,
                           title: "You are here",
                           icon: "Person-pin.png"
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

function updateBounds() {
    if (!userMarker || !destination){
        console.log("Either userMarker or destination not defined");
        return;
    }

    let userPos = userMarker.getPosition();
    let destPos = destination; // Needs to be a LatLng object


    // Midpoint logic
    let midLat = (userPos.lat() + destPos.lat()) / 2;
    let midLng = (userPos.lng() + destPos.lng()) / 2;
    let midpoint = { lat: midLat, lng: midLng };

    console.log("Midpoint: " + midpoint.lat + ", " + midpoint.lng);

    let newBounds = new google.maps.LatLngBounds();
    newBounds.extend(userPos);
    newBounds.extend(destPos);

    map.fitBounds(newBounds);
    map.setCenter(midpoint);
}

function placeDestinationOnMap() {
    if (destinationMarker != null) {
        destinationMarker = destinationMarker.setPosition(destination);
    } else {
        destinationMarker = new google.maps.Marker({
            position: destination,
            map: map,
            title: "Destination",
            icon: "small-mule.png",
            scaledSize: { "width": 40, "height": 40 },
            anchor: { "x": 20, "y": 40 }
        });
    }
}


function updateMap(){
        console.log("updateMap()")
    placeUserOnMap();
    updateBounds();

}





window.addEventListener("load", start);