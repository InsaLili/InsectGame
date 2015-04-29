// Variables =============================================================
var locationNumber;
var groupNumber = 1;
var playerNumber = 2;
var db = new PouchDB('http://127.0.0.1:5984/locationlist');
var socket = io.connect('http://127.0.0.1:8000');

// DOM Ready =============================================================
$(document).ready(function($){

    // receive location indicator from app.js
    socket.on('chooselocation', function (data) {
        var player = data.player;
        locationNumber = data.location;
        if(player == playerNumber){
            showInfoOnTable();
            attachNote();
            attachVote()
        }
    });

    $('#submitNote').on('click', addNote);

    $("#submitVote").on('click', addVote);
});

// Functions =============================================================

// show location information on personal device
function showInfoOnTable(){
    var elements = $('#locationDetail').find('span');

//    update location number
    $('#dataLocation').text(locationNumber);

//    show information of each location
    db.allDocs({
        include_docs: true,
        attachements: true,
        startkey: 'measure',
        endkey: 'measure\uffff'
    }).then(function(locationData){
        var group = 0;
        for(var i = 0; i < locationData.rows.length; i++){
            var number = locationData.rows[i].doc.location;
            if(number == locationNumber){
                var oneLocationData = locationData.rows[i].doc;
                $(elements[group]).text(oneLocationData.PH);
                $(elements[group+5]).text(oneLocationData.Temperature);
                $(elements[group+10]).text(oneLocationData.Wind);
                $(elements[group+15]).text(oneLocationData.Light);
                $(elements[group+20]).text(oneLocationData.Humidity);
                group++;
            }
        }
    });
}

function attachNote(){
    $("#showNotes span").empty();
//     show notes of each player
    var startKey = 'note_'+groupNumber+'_'+locationNumber+'_'+playerNumber;
    db.allDocs({
        include_docs: true,
        attachements: true,
        startkey: startKey,
        endkey: startKey+'\uffff'
    }).then(function(notes){
        var noteContent = '';
        for(var i=0; i < notes.rows.length; i++){
            var note = notes.rows[i].doc;
            noteContent += '<div class = "noteOfPlayer">';
            noteContent += '<p>'+note.content+'</p>';
            noteContent += '<button id="'+note._id+'" onclick="deleteNote(this.id)" >'+'Delete'+'</button>';
            noteContent += '</div>';
        }
        $('#showNotes span').html(noteContent);
    });
}

function attachVote(){

    var startKey = 'vote_'+groupNumber+'_'+locationNumber+'_'+playerNumber;
    var input = $('#input');

    db.allDocs({
        include_docs: true,
        attachements: true,
        startkey: startKey,
        endkey: startKey+'\uffff'
    }).then(function(vote){
        if(vote.rows.length !== 0){
            var voteValue = vote.rows[0].doc.vote;
            input.rating('update', voteValue);
            input.rating('refresh', {disabled: true});
            $('#submitVote').prop('disabled', true);
        }else{
            input.rating('update', 0);
            input.rating('refresh', {disabled: false});
            $('#submitVote').removeAttr('disabled')
        }
    });
}
function addNote(event){
    event.preventDefault();

    if(!locationNumber){
        alert('Choose a location first!');
        return;
    }
//    if textarea is empty, return false
    var textarea = $('textarea');
    var text = textarea.val();
    if(!text){
        alert('Write your notes before submit.');
        return;
    }

    var startKey = 'note_'+groupNumber+'_'+locationNumber+'_'+playerNumber;
    var noteNumber;
    db.allDocs({
        include_docs: true,
        attachements: true,
        startkey: startKey,
        endkey: startKey+'\uffff'
    }).then(function(notes){
//        如果之前已经有note，则noteNumber为之前最后一条note的number加1
//        如果没有，则noteNumber为1
        if(notes.rows.length !== 0){
            noteNumber = notes.rows[notes.rows.length-1].doc.number+1;
        }else{
            noteNumber = 1;
        }
//        the new id for new note
        var id = 'note_'+groupNumber+'_'+locationNumber+'_'+playerNumber+'_'+noteNumber;
        db.put({
            _id: id,
            "type": "note",
            "group": groupNumber,
            "location": locationNumber,
            "author": playerNumber,
            "number": noteNumber,
            'content':text
        }).then(function(){
            $('#showNotes span').append('<div class="noteOfPlayer">'+'<p>'+text+'</p>'+'<button id='+id+' onclick="deleteNote(this.id)">Delete</button>'+'</div>');
            socket.emit('addnote', {id: id, content: text, location: locationNumber, player: playerNumber});
        });
    });

//    clear textarea
    textarea.val('');
}

function deleteNote(id){
    db.get(id).then(function(doc){
        return db.remove(doc);
    }).then(function(){
        $('#'+id).parent().remove();
        socket.emit('deletenote', {id: id});
    });
}

function addVote(){
    var input = $("#input");

    if(!locationNumber){
        alert('Choose a location first!');
        input.rating("update", 0);
        return;
    }

    var value = input.val();
    var r = confirm("Do you want to vote for this location?");
    if(r == true){
        input.rating("refresh", {disabled: true, showClear: false});
        var id='vote_'+groupNumber+'_'+locationNumber+'_'+playerNumber;
        db.put({
            _id: id,
            "type": "vote",
            "group": groupNumber,
            "location": locationNumber,
            "player": playerNumber,
            "vote": value
        });
        $(this).prop('disabled', true);
        socket.emit('vote',{location: locationNumber, group: groupNumber});
    }else{
        input.rating('reset');
    }
}