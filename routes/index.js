/**
 * Created by mac on 09/04/15.
 */
/* GET Userlist page. */

var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res) {
    res.render('index', { title: 'Map' });
});

router.get('/player1', function(req, res){
    res.render('player1', {});
});

router.get('/player2', function(req, res){
    res.render('player2', {});
});

router.get('/player3', function(req, res){
    res.render('player3', {});
});

router.get('/locationlist', function(req, res) {
    var db = req.db;
    var collection = db.get('locationlist');
    collection.find({},{},function(e,docs){
        res.render('locatoinlist', {
            "locationlist" : docs
        });
    });
});

module.exports = router;



//exports.index = function(req, res){
//    res.render('index', {});
//};
//
//exports.player1 = function(req, res){
//    res.render('player1', {});
//};
//
//exports.player2 = function(req, res){
//    res.render('player2', {});
//};
