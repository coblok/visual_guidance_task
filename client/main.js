//this is the client main application, taking care of the application state
//it runs on the browser for each client

import { Template } from 'meteor/templating';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { BlazeLayout } from 'meteor/kadira:blaze-layout';

//importing necessary database collections
import { Grids, Levels, Heartrates } from '../database/collections.js';

import '../imports/templates/piece.js';
import '../imports/templates/chat.js';
import {shrinkGrid} from '../imports/helpers/shrinkgrid.js'

import './main.html';
import { blocks } from '../imports/blocks/blocks.js';
import { levels } from '../imports/levels/levels.js';

//set default nick (this is typically overridden in the router)
Session.set('nick', 'mr. bamboo');

//set default heart rate
Session.set('heart_rate', 1000); //milliseconds

//remove the chat box in edit mode
Template.main_body.helpers({
  'nochat': function() {
    return Session.get('editMode');
  }
});


//autorun functions run always when collections or session variables within them update

//keep track of the current level index active on the grid (expert view)
Tracker.autorun(function() {
  var level_index = Session.get('level_index');
  var gridId = Session.get('gridId');
  if(!Session.get('clientMode') && !Session.get('editMode')) {
    if(level_index !== undefined && levels[level_index]) Grids.update(gridId, { $set: { level: levels[level_index] } } );
    else Grids.update(gridId, { $set: { level: "empty" } } );
  }
});

//keep track of the current level
Tracker.autorun(function() {
  var grid = Grids.findOne();
  if(grid !== undefined && grid.gridData !== undefined) {
    Session.set('grid', grid.gridData);
    Session.set('levelId', grid.level);
  }
});

//keep track of the grid (room) id
Tracker.autorun(function() {
  var gridId = Session.get('gridId');
  Meteor.subscribe('gridById', gridId);
  Meteor.subscribe('messagesByChatId', gridId);
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



//the router defines the url schema

//query 'nick' sets the users nick in chat (?nick=xxx after the url)

//render expert view for the /expert route
FlowRouter.route('/expert/:gridId', {
  name: 'Expert.view',
  action(params, queryParams) {
    if(queryParams.nick) Session.set('nick', queryParams.nick);
    //setting default nick for "expert"
    else Session.set('nick', 'Service Advisor'); 

    Meteor.call('isValidGridId', params.gridId, function(err, res) {
      if(res) {
        BlazeLayout.render('main_body', {main: 'expert_view'});
        Session.set('gridId', params.gridId);
        if(queryParams.level) {
          Session.set('levelId', queryParams.level);
        }
      }
      else {
        BlazeLayout.render('main_body', {main: 'error'});
      }
    });
  }
});

//render client view for the /client route
FlowRouter.route('/client/:gridId', {
  name: 'Client.view',
  action(params, queryParams) {
    Session.set('showHeart', true);
    if(queryParams.nick) Session.set('nick', queryParams.nick);
    //setting default nick for the "client"
    else Session.set('nick', 'Customer');

    Meteor.call('isValidGridId', params.gridId, function(err, res) {
      if(res) {
        BlazeLayout.render('main_body', {main: 'client_view'});
        Session.set('gridId', params.gridId);
        Session.set('clientMode', true);
        Meteor.subscribe('heartrateById', params.gridId);
        if(queryParams.level) {
          Session.set('levelId', queryParams.level);
        }
      }
      else {
        BlazeLayout.render('main_body', {main: 'error'});
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

