//this is the client main application, taking care of the application state
//it runs on the browser for each client

import { Template } from 'meteor/templating';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { BlazeLayout } from 'meteor/kadira:blaze-layout';

//importing necessary database collections
import { Grids, Levels, Heartrates, GridNumber, LevelId, LevelNumber} from '../database/collections.js';

import '../imports/templates/piece.js';
import '../imports/templates/chat.js';
import '../imports/templates/rpp.js';
import {shrinkGrid} from '../imports/helpers/shrinkgrid.js'

import './main.html';
//import '../imports/templates/rpp.html';

import { blocks } from '../imports/blocks/blocks.js';
import { levels } from '../imports/levels/levels.js';
import { levels_2 } from '../imports/levels/levels.js';
import { questions, questions2 } from '../imports/levels/questions.js';
//set default nick (this is typically overridden in the router)
Session.set('nick', 'mr. bamboo');

//set default heart rate
Session.set('heart_rate', 1000); //milliseconds

//remove the chat box in edit mode
Template.main_body.helpers({
  'nochat': function() {
    //return Session.get('editMode');
    return true;
  }
});


//here we choose whitch of the level.lists we want to use
var levels_to_use;
Tracker.autorun(function() {
  var level_list_choice = Session.get('use_levels'); 
  console.log('Here we choose level list ' + level_list_choice)
  if(level_list_choice ==2){
    levels_to_use = levels_2;
    Session.set('questions', questions2);
  }
  else {
     levels_to_use = levels;
     Session.set('questions',questions);
   }
});


console.log('main is running');
//autorun functions run always when collections or session variables within them update

//keep track of the current level index active on the grid (expert view)
Tracker.autorun(function() {
  var level_index = LevelNumber.findOne(); //Session.get('level_index');
  if(level_index !== undefined) {
      level_index = level_index.number;
      var gridId = Session.get('gridId');
      if(clientMode && !Session.get('editMode')) {
        if(level_index !== -1 && levels_to_use.length > level_index) Grids.update(gridId, { $set: { level: levels_to_use[level_index] } } ); // here we have levels to use variable. Old one was levels-
        else Grids.update(gridId, { $set: { level: "empty" } } );
      }
  }
});

//keep track of the current level //Triggers twice. WHY?
Tracker.autorun(function() {
  var grid = Grids.findOne();
  console.log('AAAAA')
  console.log(grid)
  if(grid !== undefined && grid.gridData !== undefined) {
    Session.set('grid', grid.gridData);
    console.log(grid.level);
    Session.set('levelId', grid.level);
  }
});


//Start the counter at 0
Tracker.autorun(function() {
    var gridId=Session.get('gridId')
    console.log('test numbering of grid at start')
    GridNumber.update(gridId, {$set: {'count' : 0} } );



    Session.set('Counter',0) //tarvitaanko
    
});


//keep track of the grid (room) id
Tracker.autorun(function() {
  var gridId = Session.get('gridId');
  Meteor.subscribe('gridById', gridId);
  Meteor.subscribe('messagesByChatId', gridId);
  Meteor.subscribe('gridNumberById',gridId);
  Meteor.subscribe('levelNumberById',gridId);
  Meteor.subscribe('levelIdById',gridId);
});

//level change -> expert initializes the change and client responds by initializing an empty grid
Tracker.autorun(function() {
  var level = Levels.findOne();

  //level exists (and we're not in edit mode)
  if(!Session.get('editMode') && level !== undefined && level.grid !== undefined) {
    //begin level

    //init currently selected block
    Session.set('block_index', 0);

    //minimize the square grid space based on the level configuration
    var grid = shrinkGrid(level.grid);

    //set the solution (expert view)
    Session.set('level', grid);

    //set the blocks which are used in the level (client view)
    Session.set('pieces', level.pieces);

    //initialize the empty grid to be the same size as the solution
    if(Session.get('clientMode')) {
      var row = [];
      for(var i=0; i < grid[0].length; i++) {
        row.push(false);
      }
      var emptyGrid = [];
      for(var j=0; j < grid.length; j++) {
        emptyGrid.push(row);
      }
      updateGrid(emptyGrid);
    }
  }
});


//update heart rate
Tracker.autorun(function() {
  var heartrate = Heartrates.findOne();
  if(heartrate !== undefined) {
    Session.set('heart_rate', heartrate.hr * 1000);
  }
})


//update the state of the levels database query based on the current level id
var levelSubscription;
Tracker.autorun(function() {
  var levelId = Session.get('levelId');
  if(levelSubscription) levelSubscription.stop();
  levelSubscription = Meteor.subscribe('levelById', levelId);
});

//helper function to update grid both for the current session and to the database
function updateGrid(grid) {
  Session.set('grid', grid);
  var gridId = Session.get('gridId');
  Grids.update(gridId, { $set: { gridData: grid } } );
}




// Creates the global variable for switching between client modes
var clientMode;
Tracker.autorun(function() {
    clientMode = Session.get('clientMode')
});

// Autorun function in which we switch the view between participant views every time when GridNumber is updated
Tracker.autorun(function() {

  var count=GridNumber.findOne();
    if (!Session.get('editMode') && count !== undefined && Session.get('rpp_mode') !== true ){
      var counter = count.count;  //is this even needed? 
      console.log('here we see counter');
      console.log(counter);
      console.log('do we switch?')
      console.log(counter % 2) //need to be a proper logic think this again
      console.log('are we in client mode ' + clientMode);
      //if (counter % 2) {
          console.log('reloading')
          Session.set('counter',counter);
          if (clientMode ) {

            Session.set('clientMode', false);
            BlazeLayout.render('main_body', {main: 'expert_view'});
          }
          else{
            Session.set('clientMode', true);
            BlazeLayout.render('main_body', {main: 'client_view'});
          }
          }
     //}
});



//the router defines the url schema

//query 'nick' sets the users nick in chat (?nick=xxx after the url)

//render expert view for the /expert route
FlowRouter.route('/expert/visual/:gridId/:use_levels', {
 
  name: 'Expert.view',
    action(params, queryParams) {
    console.log('test')
    if(queryParams.nick) Session.set('nick', queryParams.nick);
    //setting default nick for "expert"
    else Session.set('nick', 'pari1'); 

    if (params.use_levels){
      var block= Number(params.use_levels);
      Session.set('use_levels',block); 
	} ;

    Meteor.call('isValidGridId', params.gridId, function(err, res) {

      if(res) {

          console.log('expert is expert')
          BlazeLayout.render('main_body', {main: 'expert_view'});
          Session.set('gridId', params.gridId);
          Session.set('clientMode', false);
          LevelNumber.update(Session.get('gridId'), { $set: {number: -1} } );

          if(queryParams.level) {
            Session.set('levelId', queryParams.level);
            //LevelId.update(params.gridId, $set: queryParams.level);
          }

       
      }
      else {
        BlazeLayout.render('main_body', {main: 'error'});
      }
    });
  }
});

//render client view for the /client route
FlowRouter.route('/client/visual/:gridId/:use_levels', {
  name: 'Client.view',
  action(params, queryParams) {
    Session.set('showHeart', false);
    if(queryParams.nick) Session.set('nick', queryParams.nick);
    //setting default nick for the "client"
    else Session.set('nick', 'Pari2');

    if (params.use_levels){
      var block= Number(params.use_levels);
      Session.set('use_levels',block); 
	} ;

    Meteor.call('isValidGridId', params.gridId, function(err, res) {

      
      if(res) {
          console.log('client is client')
          BlazeLayout.render('main_body', {main: 'client_view'});
          Session.set('gridId', params.gridId);
          Session.set('clientMode', true);
          Meteor.subscribe('heartrateById', params.gridId);
          if(queryParams.level) {
            Session.set('levelId', queryParams.level);
		  }
		//}
      }
      else {
        BlazeLayout.render('main_body', {main: 'error'});
      }
    });
  }
});

//Renders the RPP-questions page
FlowRouter.route('/expert/questions/:gridId/:use_levels', {
 
  name: 'Questions.view',
    action(params, queryParams) {
    console.log('questions')
    if(queryParams.nick) Session.set('nick', queryParams.nick);
    //setting default nick for "expert"
    else Session.set('nick', 'pari1'); 

    if (params.use_levels){
      var block= Number(params.use_levels);
      Session.set('use_levels',block); 
	} ;

    Meteor.call('isValidGridId', params.gridId, function(err, res) {

      if(res) {

        
         
          BlazeLayout.render('rpp_view', {main: 'rpp_view'});
          Session.set('gridId', params.gridId);
          Session.set('rpp_mode', true);
          //Session.set('clientMode', false);
          //LevelNumber.update(Session.get('gridId'), { $set: {number: -1} } );

          // Here we choose which is the level list we read (should be 1 or 2)

        //}
       
      }
      else {
       // BlazeLayout.render('main_body', {main: 'error'});
      }
    });
  }
});

//Renders the RPP-questions page
FlowRouter.route('/client/questions/:gridId/:use_levels', {
 
  name: 'Questions.view',
    action(params, queryParams) {
    console.log('questions')
    if(queryParams.nick) Session.set('nick', queryParams.nick);
    //setting default nick for "expert"
    else Session.set('nick', 'pari2'); 

    if (params.use_levels){
      var block= Number(params.use_levels);
      Session.set('use_levels',block); 
	} ;

    Meteor.call('isValidGridId', params.gridId, function(err, res) {

      if(res) {

        
         
          BlazeLayout.render('rpp_view', {main: 'rpp_view'});
          Session.set('gridId', params.gridId);
          Session.set('rpp_mode', true);
          //Session.set('clientMode', false);
          //LevelNumber.update(Session.get('gridId'), { $set: {number: -1} } );

          // Here we choose which is the level list we read (should be 1 or 2)

        //}
       
      }
      else {
       // BlazeLayout.render('main_body', {main: 'error'});
      }
    });
  }
});


//render edit view for the /edit route
FlowRouter.route('/edit/:gridId', {
  name: 'Edit.view',
  action(params) {
    Meteor.call('isValidGridId', params.gridId, function(err, res) {
      if(res) {
        BlazeLayout.render('main_body', {main: 'edit_view'});
        Session.set('editMode', true);
        Session.set('gridId', params.gridId);
        Session.set('pieces', blocks);
        clearGrid();
      }
      else {
        BlazeLayout.render('main_body', {main: 'error'});
      }
    });
  }
});

//handle all other routes with an error
FlowRouter.route('/*', {
  name: 'Error.view',
  action() {
    BlazeLayout.render('main_body', {main: 'error'});
  }
});
FlowRouter.route('/', {
  name: 'Error.view',
  action() {
    BlazeLayout.render('main_body', {main: 'error'});
  }
});


//ui elements for templates

//clear grid with a max size empty grid (edit mode)
function clearGrid() {
  updateGrid([ // first column of grid and piece is always false because of weirdness
    [false, false, false, false, false, false, false, false, false],
    [false, false, false, false, false, false, false, false, false],
    [false, false, false, false, false, false, false, false, false],
    [false, false, false, false, false, false, false, false, false],
    [false, false, false, false, false, false, false, false, false],
    [false, false, false, false, false, false, false, false, false],
    [false, false, false, false, false, false, false, false, false],
    [false, false, false, false, false, false, false, false, false],
  ]);
}

//keep track of currently clicked piece
Session.set("dragged_piece", undefined);

//update z_index so the stacking order of pieces on screen stays consistent
Session.set('z_index', 0);

//Template.grid.onCreated(function() {
//});


//the correct solution grid (expert view)
Template.level.helpers({
  grid() {
    return Session.get('level');
  }
});

//the game grid (both expert and client)
Template.grid.helpers({
  grid() {
    return Session.get('grid');
  }
});

//edit view actions
Template.edit_view.events({
  //save the level to the database
  'click button#save': function() {
    var pieces = [];
    $(".piece").each(function(index, value) {
      var instance = Blaze.getView(value)._templateInstance;
      var coordinates = instance.grid_coordinates.get();
      if(coordinates[0] !== -1) {
        // piece is on grid
        var piece = instance.piece.get();
        pieces.push(piece);
      }
    });
    var grid = Session.get("grid");
    var grid_id = Session.get("gridId");

    //description of level: solution and required pieces
    var level = {
      grid_id: grid_id,
      grid: grid,
      pieces: pieces
    }
    Levels.insert(level, function(error, result) {
      if(result !== undefined) {
        //alert the user with the level id (a bit bad idea because some browsers don't allow selecting and copying alert text)
        alert("Save successful\nLevel id: " + result);
      }
    });
  }
})

//handle cursor move
function mouseMove(event) {
  //find out whether a piece is currently being dragged
  var target = Session.get("dragged_piece");

  //if it is, update the location of that piece
  if(target !== undefined) {
    target = "#" + target;

    var offset = $(target).offset();

    if($(target).data("prev_x") !== undefined) {
      var dx = event.pageX - $(target).data("prev_x");
      var dy = event.pageY - $(target).data("prev_y");
      $(target).data("prev_x", event.pageX);
      $(target).data("prev_y", event.pageY);

      //move the piece based on the drag distance
      $(target).offset({top: offset.top + dy, left: offset.left + dx});
    }
  }
}

//associate mouse events
$(document).mousemove(function(event) {
  mouseMove(event);
});

//associate touch events
document.addEventListener('touchmove', function(event) {
  mouseMove(event.touches.item(0));
  event.preventDefault();
});

