let map;
let userMarker;
let destination;
let bounds;
let building;
let isNear = false;
let destinationMarker;
let classroomMarkers = [5];
toggle =[5]


function start() {
    sessionStorage.clear();
    createEventListeners();
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

    //Validate rooms to ensure they are numbers and at least one exists
    if(!validateRoomNumbers(building, classNumbers)) {
        window.alert("One of your classrooms doesn't exist");
        return;
    }

    //Store classroom numbers in session storage for later use
    storeClassrooms(building, JSON.stringify(classNumbers));

    //Set up the map destination, userPosition, and updateMap
    mapSetup(building);


    //Run updateMap on an interval
    setInterval(updateMap, 500)
}

function assignToggleHandlers(){
    for (let i = 0; i <=5; i++){
        if (classroomMarkers[i]) {
            console.log("hide" + i);
            toggle[i] = document.getElementById("hide" + i);
            toggle[i].addEventListener("change", toggleMarker)
        }
        else return;
    }
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
            for(let i = 0; i < coordinates.length; i++) {
                latLngArray.push(new google.maps.LatLng((coordinates[i])[0],(coordinates[i])[1]))
                //latLngArray.push({lat: (coordinates[i])[0], lng: (coordinates[i])[1]})
            }
            //console.log("Outline coordinates: " + latLngArray)

            poly1 = new google.maps.Polygon( 
                {
                paths: latLngArray,
                map: map,
                fillColor: "red",
                strokeColor: "black",
                strokeWidth: "0px"
            });

        })

}

//Fetch building/room coordinates from coordinates.json
async function getRoomCoordinates(building, roomNumber) {
    let key = new String(building + "-class")
    return fetch("./coordinates.json")
        .then(response => {return response.json()}) //Get json from coordinates.json
        .then(data => {return data[key]})      //Get json from building selected
        .then(buildingJson => {return buildingJson[String(roomNumber)]})   //Narrow to roomNumber (0 for bulding itself)
        .catch(error => console.log("Error retrieving building coordinates"))
}

//Fetch building outline coordinates
async function getOutlineCoordinates(building) {
    let key = new String(building + "-outline")
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


//Perform map functions once the destination is validated
async function mapSetup(building) {
    await getRoomCoordinates(building, "0")
        .then(destArray => {
            console.log("destArray: " + destArray)
            destination = new google.maps.LatLng(destArray[0], destArray[1]) //Create LatLng with building coordinates
            placeDestinationOnMap(); //Place a marker on the map for destination
            placeUserOnMap(); //Zoom the map to show and fit both markers
            outlineBuilding(building); //Place a polygon overlay on the map
            updateMap();
        })
        .catch(error => console.log("Error with mapSetup"))
}


function initMap() {

    map = new google.maps.Map(document.getElementById("map"), {
    center: { lat: 38.75851500233256, lng: -93.7386496286563 }, // Example: Warrensburg
    zoom: 18,
    gestureHandling: "none",
    mapTypeId: "satellite",
    streetViewControl: false,
    mapTypeControl: false,
    cameraControl: false,
    keyboardShortcuts: false,
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
window.initMap = initMap; // Ensure global scope


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
                           icon: "pin.png"
                       });
                    }
                }
            }
        )
    }
}

function updateBounds() {
    if (!userMarker){
        console.log("userMarker not defined");
        return;
    }

    if(!destination) {
        console.log("destination not defined");
        return;
    }

    let userPos = userMarker.getPosition();
    let destPos = destination; // Needs to be a LatLng object


    // Midpoint logic
    let midLat = (userPos.lat() + destPos.lat()) / 2;
    let midLng = (userPos.lng() + destPos.lng()) / 2;
    let midpoint = { lat: midLat, lng: midLng };
    userMarker.setPosition(midpoint);  //FOR TESTING


    let newBounds = new google.maps.LatLngBounds();
    newBounds.extend(userPos);
    newBounds.extend(destPos);

    map.fitBounds(newBounds);
    map.setCenter(midpoint);
}

function placeDestinationOnMap() {
    destinationMarker = new google.maps.Marker({
        position: destination,
        map: map,
        title: "Destination",
        icon: "small-mule.png",
    });
}


function updateMap(){
    //placeUserOnMap(); //Comment for midpoint testing
    
    //Once user is close enough, stop adjusting checking distance and updating bounds of the map
    if(!isNear)
        checkDistance();
    if(!isNear)
        updateBounds();
    
    console.log("updateMap(). Center moved to:", map.getCenter().toJSON());
    console.log(classroomMarkers[1-1])
    console.log(classroomMarkers[2-1])
    console.log(classroomMarkers[3-1])
    console.log(classroomMarkers[4-1])
    console.log(classroomMarkers[5-1])
}


function checkDistance() {

    //check and make sure required values are declared and assigned
    if (!userMarker || !destination) {
        console.log("User or destination not defined");
        return;
    }

    //Check distance from user to destination/center of building
    let userPos = userMarker.getPosition();
    let destPos = destination;
    let latDiff = Math.abs(userPos.lat() - destPos.lat());
    let lngDiff = Math.abs(userPos.lng() - destPos.lng());

    if (latDiff <= 0.0015 && lngDiff <= 0.0015) {
        console.log("They getting closer, engage classroom marker mode");
        isNear = true
        map.setCenter(destination);
        addClassroomMarkers();
    }
}

async function addClassroomMarkers() {
    //Delete building map marker
    destinationMarker.setMap(null);

    //Pull class numbers from session storage
    classrooms = JSON.parse(sessionStorage.getItem("classrooms"));
    console.log("classrooms: " + classrooms)

    //Pull coordinates of each classroom, then add a map marker for each
    for(let i = 0; i < classrooms.length; i++) {
        let latLng
        console.log("classroom[i]: " + classrooms[i])
        await getRoomCoordinates(building, new String(classrooms[i]))
            .then(data => {
                floorNum = parseInt(new String(classrooms[i])[0])
                console.log("Data: " + data)
                latLng = {lat: data[0], lng: data[1]}
                classroomMarkers[i] = new google.maps.Marker({
                    position: latLng,
                    map: map,
                    title: "Room " + classrooms[i],
                    icon: "" + floorNum + ".png"
                              })
            })
    }
    assignToggleHandlers();
}

function toggleMarker(event) {
        let checkbox = event.target;
        let index = checkbox.id.replace("hide", "");
        console.log("INDEX:" + index);

        if (classroomMarkers[index].map != null) {
            classroomMarkers[index].setMap(null);
        }
        else {
            classroomMarkers[index].setMap(map);
        }
}




window.addEventListener("load", start);