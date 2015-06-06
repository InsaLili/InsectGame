// Variables =============================================================
var locationNumber;
var groupNumber = 0;
var playerNumber = 1;
var allNotes = 0;
var db = new PouchDB('http://localhost:5984/locationlist');
// var socket = io.connect('http://192.168.145.39:8000');
var socket = io.connect('http://localhost:8000');

// DOM Ready =============================================================
$(document).ready(function($){
    //------------------hide arguments part
    $('#showAgu').hide();
    $('#addAgu').hide();


//------------------dialog initiation
    $( '#chooseLocationDlg' ).dialog({
        autoOpen: false,
        height:200,
        modal: true,
        buttons:{
            "OK": function(){
                $(this).dialog("close");
            }
        }
    });
    $( '#writeNoteDlg' ).dialog({
        autoOpen: false,
        height:200,
        modal: true,
        buttons:{
            "OK": function(){
                $(this).dialog("close");
            }
        }
    });
    $( "#voteConfirm" ).dialog({
        autoOpen: false,
        height:200,
        modal: true,
        buttons: {
            "Oui": function() {
                confirmVote();
                $( this ).dialog( "close" );
            },
            "Non": function() {
                $( this ).dialog( "close" );
            }
        }
    });

//------------------click events for validation btns
    $('#submitNote').on('click', addNote);
    $('#submitAgu').on('click', addAgu);
    $("#submitVote").on('click', addVote);

//------------------communication via server
    socket.on('choosegroup', function(data){
        console.log(data);
        groupNumber = data.group;
        getNoteNumber();
    });
    socket.on('chooselocation', function (data) {
        var player = data.player;
        locationNumber = data.location;
        if(player == playerNumber){
            showInfoOnTable();
            attachNote();
            attachVote()
        }
    });
    socket.on('confirmlocation', function (data) {
        locationNumber = parseInt(data.location);
        showInfoOnTable();
        $('#showAgu').show();
        $('#addAgu').show();
        $('#showNotes').hide();
        $('#addNotes').hide();
    });
});

// Functions =============================================================
// count the number of notes
function getNoteNumber(){
    var startKey = 'note_'+groupNumber;
    db.allDocs({
        include_docs: true,
        attachements: true,
        startkey: startKey,
        endkey: startKey+'\uffff'
    }).then(function(notes){
        for(var i=0; i < notes.rows.length; i++){
            if(notes.rows[i].doc.author == playerNumber){
                allNotes++;
            }
        }
    });
}
// show location information on personal device
function showInfoOnTable(){
    var elements = $('#locationDetail').find('span');

//    update location name
    var locationName;
    switch (locationNumber){
        case 1:
            locationName = "Balcon sur la cascade";
            break;
        case 2:
            locationName = "Sous les embruns";
            break;
        case 3:
            locationName = "Au détour du sentier";
            break;
        case 4:
            locationName = "La clairière";
            break;
        case 5:
            locationName = "Lycée N°4";
            break;
        case 6:
            locationName = "Lycée N°1";
            break;
        case 7:
            locationName = "Lycée N°2";
            break;
        case 8:
            locationName = "Lycée N°3";
            break;
    }
    $('#dataLocation').text(locationName);

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
                $(elements[group]).text(oneLocationData.Light);
                $(elements[group+5]).text(oneLocationData.Wind);
                $(elements[group+10]).text(oneLocationData.Temperature);
                $(elements[group+15]).text(oneLocationData.PH);
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
            noteContent += '<button id="'+note._id+'" onclick="deleteNote(this.id)" class="btn btn-default btn-xs">'+'Effacer'+'</button>';
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
            $('#submitVote').removeAttr('disabled');
        }
    });
}
function addNote(event){
    event.preventDefault();

    if(!locationNumber){
        $('#chooseLocationDlg').dialog('open');
        return;
    }
//    if textarea is empty, return false
    var textarea = $('#myNote textarea');
    var text = textarea.val();
    if(!text){
        $('#writeNoteDlg').dialog('open');
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
            $('#showNotes span').append('<div class="noteOfPlayer">'+'<p>'+text+'</p>'+'<button id='+id+'  class="btn btn-default btn-xs"onclick="deleteNote(this.id)">Effacer</button>'+'</div>');
            allNotes++;
            socket.emit('addnote', {id: id, content: text, location: locationNumber, player: playerNumber, notes: allNotes});
        });
    });

//    clear textarea
    textarea.val('');
}

function addAgu(event){
    event.preventDefault();

    if(!locationNumber){
        $('#chooseLocationDlg').dialog('open');
        return;
    }
//    if textarea is empty, return false
    var textarea = $('#myAgu textarea');
    var text = textarea.val();
    if(!text){
        $('#writeNoteDlg').dialog('open');
        return;
    }

    var startKey = 'agu_'+groupNumber+'_'+locationNumber+'_'+playerNumber;
    var aguNumber;
    db.allDocs({
        include_docs: true,
        attachements: true,
        startkey: startKey,
        endkey: startKey+'\uffff'
    }).then(function(agus){
//        如果之前已经有note，则noteNumber为之前最后一条note的number加1
//        如果没有，则noteNumber为1
        if(agus.rows.length !== 0){
            aguNumber = agus.rows[agus.rows.length-1].doc.number+1;
        }else{
            aguNumber = 1;
        }
//        the new id for new note
        var id = 'agu_'+groupNumber+'_'+locationNumber+'_'+playerNumber+'_'+aguNumber;
        db.put({
            _id: id,
            "type": "agu",
            "group": groupNumber,
            "location": locationNumber,
            "author": playerNumber,
            "number": aguNumber,
            'content':text
        }).then(function(){
            $('#showAgu span').append('<div class="aguOfPlayer">'+'<p>'+text+'</p>'+'<button id='+id+'  class="btn btn-default btn-xs" onclick="deleteAgu(this.id)">Effacer</button>'+'</div>');
            socket.emit('addagu', {id: id, content: text, location: locationNumber, player: playerNumber});
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
        allNotes--;
        socket.emit('deletenote', {id: id, location: locationNumber, player: playerNumber, notes: allNotes});
    });
}
function deleteAgu(id){
    db.get(id).then(function(doc){
        return db.remove(doc);
    }).then(function(){
        $('#'+id).parent().remove();
        socket.emit('deleteagu', {id: id, location: locationNumber, player: playerNumber});
    });
}

function addVote(){

    if(!locationNumber){
        $('#chooseLocationDlg').dialog('open');
        input.rating("update", 0);
        return;
    }
    $( "#voteConfirm" ).dialog( "open");
}

function confirmVote(){
    $('#submitVote').prop("disabled",true);
    var input = $("#input");
    var value = input.val();

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
    //                $(this).prop('disabled', true);
    socket.emit('vote',{location: locationNumber, group: groupNumber, player: playerNumber});
}