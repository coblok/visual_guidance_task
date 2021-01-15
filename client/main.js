import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { BlazeLayout } from 'meteor/kadira:blaze-layout';

import { Grids, Levels, Heartrates } from '../database/collections.js';
import '../imports/templates/piece.js';
import '../imports/templates/chat.js';

import './main.html';
import { blocks } from '../imports/blocks/blocks.js';
import { levels } from '../imports/levels/levels.js';

Session.set('nick', 'mr. bamboo');

Session.set('heart_rate', 1000); //milliseconds

Template.main_body.helpers({
  'nochat': function() {
    return Session.get('editMode');
  }
});

Tracker.autorun(function() {
  var level_index = Session.get('level_index');
  var gridId = Session.get('gridId');
  if(!Session.get('clientMode') && !Session.get('editMode')) {
    if(level_index !== undefined && levels[level_index]) Grids.update(gridId, { $set: { level: levels[level_index] } } );
    else Grids.update(gridId, { $set: { level: "empty" } } );
  }
});

Tracker.autorun(function() {
  var grid = Grids.findOne();
  if(grid !== undefined && grid.gridData !== undefined) {
    Session.set('grid', grid.gridData);
    Session.set('levelId', grid.level);
  }
});

Tracker.autorun(function() {
  var gridId = Session.get('gridId');
  Meteor.subscribe('gridById', gridId);
  Meteor.subscribe('messagesByChatId', gridId);
});

Tracker.autorun(function() {
  var level = Levels.findOne();
  if(!Session.get('editMode') && level !== undefined && level.grid !== undefined) {
    Session.set('block_index', 0);
    var grid = shrinkGrid(level.grid);
    Session.set('level', grid);
    Session.set('pieces', level.pieces);
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

function shrinkGrid(grid) {
  // find out how big part of the grid is being used

  var start_row = -1;
  var end_row = -1;
  var start_column = 99;
  var end_column = 0;
  for(var i=0; i<grid.length; i++) {
    var some = false;
    for(var j=0; j<grid[i].length; j++) some = some | grid[i][j];
    if(some) {
      if(start_row == -1) start_row = i;
      end_row = i;
    }
    for(var j=1; j<grid[i].length; j++) {
      if(grid[i][j]) {
        if(j < start_column) start_column = j;
        if(j > end_column) end_column = j;      
      }
    }
  }

  //make the resulting area into square shape
  var height = end_row - start_row + 1;
  var width = end_column - start_column + 1;

  while(height < width ) {
    end_row = Math.min(end_row + 1, grid.length);
    height = end_row - start_row + 1;
    if(height < width) start_row = Math.max(start_row - 1, 0);
    height = end_row - start_row + 1;
  }
  while(width < height) {
    end_column = Math.min(end_column + 1, grid[0].length);
    width = end_column - start_column + 1;
    if(width < height) start_column = Math.max(start_column - 1, 0);
    width = end_column - start_column + 1;
  }
  
  var shrinked = [];
  for(var i=start_row; i<=end_row; i++) {
    var row = grid[i].slice(start_column, end_column + 1);
    row.unshift(false);
    shrinked.push(row);
  }

  return shrinked;
}

Tracker.autorun(function() {
  var heartrate = Heartrates.findOne();
  if(heartrate !== undefined) {
    Session.set('heart_rate', heartrate.hr * 1000);
  }
})


var levelSubscription;

Tracker.autorun(function() {
  var levelId = Session.get('levelId');
  if(levelSubscription) levelSubscription.stop();
  levelSubscription = Meteor.subscribe('levelById', levelId);
});


FlowRouter.route('/expert/:gridId', {
  name: 'Expert.view',
  action(params, queryParams) {
    if(queryParams.nick) Session.set('nick', queryParams.nick);
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

FlowRouter.route('/client/:gridId', {
  name: 'Client.view',
  action(params, queryParams) {
    Session.set('showHeart', true);
    if(queryParams.nick) Session.set('nick', queryParams.nick);
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
        //clearGrid();
      }
      else {
        BlazeLayout.render('main_body', {main: 'error'});
      }
    });
  }
});

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

Session.set("dragged_piece", undefined);
Session.set('z_index', 0);

Template.grid.onCreated(function() {
});


Template.level.helpers({
  grid() {
    return Session.get('level');
  }
});


Template.grid.helpers({
  grid() {
    return Session.get('grid');
  }
});

Template.edit_view.events({
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
    var level = {
      grid_id: grid_id,
      grid: grid,
      pieces: pieces
    }
    Levels.insert(level, function(error, result) {
      if(result !== undefined) {
        alert("Save successful\nLevel id: " + result);
      }
    });
  }
})


function mouseMove(event) {
  var target = Session.get("dragged_piece");

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

$(document).mousemove(function(event) {
  mouseMove(event);
});

document.addEventListener('touchmove', function(event) {
  //alert(event.touches.item(0).pageX + " " + event.touches.item(0).pageY);
  mouseMove(event.touches.item(0));
  event.preventDefault();
});


function updateGrid(grid) {
  Session.set('grid', grid);
  var gridId = Session.get('gridId');
  Grids.update(gridId, { $set: { gridData: grid } } );
}

