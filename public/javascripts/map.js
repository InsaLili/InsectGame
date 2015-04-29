/**
 * Created by Lili on 08/04/15.
 */
//var socket = io.connect('http://localhost:8000');
var socket = io.connect('http://127.0.0.1:8000');
var db = new PouchDB('http://localhost:5984/locationlist');
//var db = new PouchDB('http://127.0.0.1:5984/locationlist');

// DOM Ready =============================================================
$(document).ready(function() {
    initMap();
    attachNotes();
    attachVotes();
});

function initMap() {

//    three locations' coordinates
    var locations = [[45.777403,4.855214], [45.782123, 4.854925], [45.7766648,4.8491044]];

//        info in the pop-up window
    var contentString1 = '<div>'+'<button type="button" class="btn player1" value="1,1" onclick="chooseLocation(this)">Explorer</button> '+' <button type="button" class="btn player2" value="1,2" onclick="chooseLocation(this)">Reporter</button> '+' <button type="button" class="btn player3" value="1,3" onclick="chooseLocation(this)">Photographer</button>'+'</div>';

    var contentString2 = '<div>'+'<button type="button" class="btn player1" value="2,1" onclick="chooseLocation(this)">Explorer</button> '+' <button type="button" class="btn player2" value="2,2" onclick="chooseLocation(this)">Reporter</button> '+' <button type="button" class="btn player3" value="2,3" onclick="chooseLocation(this)">Photographer</button>'+'</div>';

    var contentString3 = '<div>'+'<button type="button" class="btn player1" value="3,1" onclick="chooseLocation(this)">Explorer</button> '+' <button type="button" class="btn player2" value="3,2" onclick="chooseLocation(this)">Reporter</button> '+' <button type="button" class="btn player3" value="3,3" onclick="chooseLocation(this)">Photographer</button>'+'</div>';

    var message = [contentString1, contentString2, contentString3];

    var markers = [];

//    propoties of the map
    var mapProp = {
        center: new google.maps.LatLng(45.7788516,4.8523338),
        zoom: 16,
        mapTypeId: google.maps.MapTypeId.HYBRID
    };

//    draw the map on DOM, which id is "googleMap"
    var map = new google.maps.Map(document.getElementById("googleMap"),mapProp);

//      draw markers
    for (var i = 0; i < locations.length; i++){
        var latitude = parseFloat(locations[i][0]);
        var longitude = parseFloat(locations[i][1]);
        var location = new google.maps.LatLng(latitude, longitude);
        var marker = new google.maps.Marker({
            position: location,
            icon: './images/flag.png'
        });
        marker.setMap(map);
        var locationNum = i+1;
        marker.metadata = {id:"location"+locationNum};
//        marker.metadata.id = "location1";
        marker.setTitle((i + 1).toString());
        markers.push(marker);
        attachMessage(marker, i, message);
    }
}

function attachMessage(marker, num, message) {
    var infowindow = new google.maps.InfoWindow({
        content: message[num],
        maxWidth: 280
    });

    google.maps.event.addListener(marker, 'click', function() {
        infowindow.open(marker.get('map'), marker);
    });
}

function attachNotes(){
    $('.location p').remove();
    db.allDocs({
        include_docs: true,
        attachements: true,
        startkey: 'note_1',
        endkey: 'note_1\uffff'
    }).then(function(locationData){
        for(var i = 0; i < locationData.rows.length; i++){
            var location = locationData.rows[i].doc.location;
            var player = locationData.rows[i].doc.author;
            var content = locationData.rows[i].doc.content;
            var id = locationData.rows[i].doc._id;
            switch (location){
                case 1:
                    $('#note1').append('<p id='+id+'>'+content+'</p>');
                    break;
                case 2:
                    $('#note2').append('<p id='+id+'>'+content+'</p>');
                    break;
                case 3:
                    $('#note3').append('<p id='+id+'>'+content+'</p>');
                    break;
                case 4:
                    $('#note4').append('<p id='+id+'>'+content+'</p>');
                    break;
            }
            switch (player){
                case 1:
                    $('#'+id).css('background-color', "#fc8c84");
                    break;
                case 2:
                    $('#'+id).css('background-color', "#f5e79e");
                    break;
                case 3:
                    $('#'+id).css('background-color', "#c1e2b3");
                    break;
            }
        }
    });
}

function attachVotes(){

    db.allDocs({
        include_docs: true,
        attachements: true,
        startkey: 'vote_1',
        endkey: 'vote_1\uffff'
    }).then(function(votes){
        var currentLocation;
        for(var i = 0; i < votes.rows.length; i++) {
            if(votes.rows[i].doc.location == votes.rows[i+1].doc.location && votes.rows[i].doc.location == votes.rows[i+2].doc.location){
                var allVotes = 0, voteAvg = 0;
                var location = votes.rows[i].doc.location;
                allVotes += parseInt(votes.rows[i].doc.vote);
                allVotes += parseInt(votes.rows[i+1].doc.vote);
                allVotes += parseInt(votes.rows[i+2].doc.vote);
                voteAvg = Math.round(allVotes/3);
                switch(location){
                    case 1:
                        $('#input1').rating('update', voteAvg);
                        break;
                    case 2:
                        $('#input2').rating('update', voteAvg);
                        break;
                    case 3:
                        $('#input3').rating('update', voteAvg);
                        break;
                    case 4:
                        $('#input4').rating('update', voteAvg);
                        break;
                }
                i += 2;
            }
        }
    });
}

function chooseLocation(element){
    var buttonValue = element.value.split(',');
    console.log(buttonValue);
    var location = parseInt(buttonValue[0]);
    var player = parseInt(buttonValue[1]);
    var socket = io.connect('http://localhost:8000');
    socket.emit('chooselocation', { location: location, player: player});

    var className = element.className;
    var elements = document.getElementsByClassName(className);
    $(elements).css('background-color', '#5bc0de');
    $(element).css('background-color', '#f0ad4e');
}

socket.on('addnote', function (data) {
    console.log(data);
    var id = data.id;
    var content = data.content;
    var player = data.player;
    var location = data.location;
    var color;
    switch (location){
        case 1:
            $('#note1').append('<p id='+id+'>'+content+'</p>');
            break;
        case 2:
            $('#note2').append('<p id='+id+'>'+content+'</p>');
            break;
        case 3:
            $('#note3').append('<p id='+id+'>'+content+'</p>');
            break;
        case 4:
            $('#note4').append('<p id='+id+'>'+content+'</p>');
            break;
    }
    switch (player){
        case 1:
            $('#'+id).css('background-color', "#fc8c84");
            break;
        case 2:
            $('#'+id).css('background-color', "#f5e79e");
            break;
        case 3:
            $('#'+id).css('background-color', "#c1e2b3");
            break;
    }
});

socket.on('deletenote', function (data) {
    console.log(data);
    var id = data.id;
    $('#'+id).remove();
});

socket.on('vote', function (data) {
    var group = data.group;
    var location = data.location;
    var startKey = 'vote_'+group+'_'+location;

    db.allDocs({
        include_docs: true,
        attachements: true,
        startkey: startKey,
        endkey: startKey+'\uffff'
    }).then(function(votes){
        if(votes.rows.length !== 3) return;
        var allVotes = 0, voteAvg = 0;
        for(var i = 0; i < votes.rows.length; i++) {
            allVotes += parseInt(votes.rows[i].doc.vote);
        }
        voteAvg = Math.round(allVotes/3);
        switch(location){
            case 1:
                $('#input1').rating('update', voteAvg);
                break;
            case 2:
                $('#input2').rating('update', voteAvg);
                break;
            case 3:
                $('#input3').rating('update', voteAvg);
                break;
            case 4:
                $('#input4').rating('update', voteAvg);
                break;
        }
    });
});


