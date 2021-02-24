//this file contains most of the game logic

import { Grids, Solutions } from '../../database/collections.js';
import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import './templates.html';


//initialized current selected block index
Session.set('block_index', 0);

//update state of current pieces for client and edit views
Template.client_view.helpers({
  pieces() {
    return Session.get('pieces');
  }
});
Template.edit_view.helpers({
  pieces() {
    return Session.get('pieces');
  }
});

//let expert view know if we are in the "empty" level which comes inbetween levels
Template.expert_view.helpers({
  empty() {
    return Session.get('levelId') === 'empty';
  }
});

//handle level progression in the expert view
Template.expert_view.events({
  'click #levelDone': function() {
    var level_index = Session.get('level_index');
    var level = Session.get('levelId');

    //if current level is "empty", begin the next level
    if(level === 'empty') {
      Session.set('beginTaskTimestamp', (new Date()).getTime());
      if(level_index !== undefined) {
        Session.set('level_index', level_index + 1);
      }
      else Session.set('level_index', 0);
    }

    //if there was a level going on, store the solution and move onto the the "empty" level
    else {
      var gridId = Session.get('gridId')
      var grid = Grids.findOne();
      var solution = {};
      solution.gridData = grid.gridData;
      solution.level = grid.level;
      solution.gridId = grid._id;
      solution.timestamp = (new Date()).getTime();
      solution.begintimestamp = Session.get('beginTaskTimestamp');
      Solutions.insert(solution);

      Grids.update(gridId, { $set: { level: "empty" } } );
    }
  }
});

//this code handles the individual pieces
Template.piece.onCreated(function() {

  //set piece index
  var blocks = Session.get('pieces');
  var block_index = Session.get('block_index');

  this.piece = new ReactiveVar(blocks[block_index % blocks.length]);
  this.index = block_index;

  //update index for the next piece
  block_index++;
  Session.set('block_index', block_index);

  //set the location of the piece on screen
  this.offset = new ReactiveVar([0, 0]);

  //set the position on grid for the piece
  this.grid_coordinates = new ReactiveVar([-1, -1]);
});

//set the initial locations of the pieces
Template.piece.helpers({
  top() {
    return 20 + Math.floor(Template.instance().index % 4) * 140;
  },
  left() {
    var width = $("body").width();
    return Math.max(400, width - 600) + Math.floor(Template.instance().index / 4) * 140;
  }
});

//handle mouse down event on the piece
function pieceMouseDown(event, instance) {
  var dragged_piece = $(event.currentTarget)[0].id;
  Session.set("dragged_piece", dragged_piece);

  var offset = $(event.currentTarget).offset();
  instance.offset.set([offset.left, offset.top]);
  $(event.currentTarget).data("prev_x", event.pageX);
  $(event.currentTarget).data("prev_y", event.pageY);
  var z_index = Session.get("z_index");
  z_index = z_index === undefined ? 0 : z_index;
  z_index++;
  Session.set("z_index", z_index)
  $(event.currentTarget).css('z-index', z_index);
}

//handle mouse up event on the piece
function pieceMouseUp(event, instance) {
  var dragged_piece = undefined;
  Session.set("dragged_piece", dragged_piece);

  var offset = $(event.currentTarget).offset();
  $(event.currentTarget).removeData(["prev_x", "prev_y"]);

  var gridoffset = $(".grid").offset();

  var grid = Session.get("grid");
  var piece = instance.data.piece; //instance.piece.get();
  var square_width = $($(".grid .square")[0]).width();
  
  //check if piece is inside the grid and place it
  if( offset.left > gridoffset.left - square_width * 0.5 && 
      offset.left + $(event.currentTarget).width() < gridoffset.left + $(".grid").width() + square_width * 0.5 &&
      offset.top > gridoffset.top - square_width * 0.5 &&
      offset.top + $(event.currentTarget).height() < gridoffset.top + $(".grid").height() + square_width * 0.5 ) {          

    var new_left = offset.left;
    var new_top = offset.top;

    //find closest point within the grid for top left corner
    var x = 0, y = 0;


    for(var left = gridoffset.left; left < gridoffset.left + $(".grid").width(); left += square_width + 1) {
      if(Math.abs(left - offset.left) < square_width * 0.5 + 1) {
        new_left = left;
        break;
      }
      x++;
    }
    for(var top = gridoffset.top; top < gridoffset.top + $(".grid").height(); top += square_width + 1) {
      if(Math.abs(top - offset.top) < square_width * 0.5 + 1) {
        new_top = top;
        break;
      }
      y++;
    }

    var grid_after_move = removePieceFromGrid(instance);
    if(isEmptySpaceUnder(piece, grid_after_move, x, y)) {
      Session.set("grid", grid_after_move);
      updateGrid(setPieceOnGrid(instance, x, y));
      instance.grid_coordinates.set([x, y]);
      $(event.currentTarget).offset({left: new_left, top: new_top});
      instance.offset.set([new_left, new_top]);
    }
    else {
      var offsetArr = instance.offset.get();
      $(event.currentTarget).offset({left: offsetArr[0], top: offsetArr[1]});
    }
  }
  //if piece is outside the grid
  else {
    updateGrid(removePieceFromGrid(instance));
    instance.grid_coordinates.set([-1, -1]);
  }
}

//associate the mouse down, up and touch functions
Template.piece.events({
  'mousedown .piece'(event, instance) {
    pieceMouseDown(event, instance);
  },
  'mouseup .piece'(event, instance) {
    pieceMouseUp(event, instance);
  },
  'touchstart .piece'(event, instance) {
    event.pageX = event.originalEvent.touches.item(0).pageX;
    event.pageY = event.originalEvent.touches.item(0).pageY;
    //alert(event.originalEvent.touches.item(0) + " " + event.currentTarget);
    pieceMouseDown(event, instance);
  },
  'touchend .piece'(event, instance) {
    pieceMouseUp(event, instance);
  }
});

//determine whether the location on the grid where the piece is being placed is empty
function isEmptySpaceUnder(piece, grid, x, y) {
  for(var i=0; i < piece[0].length; i++) {
    for(var j=0; j < piece.length; j++) {
      if(isActiveSquare(piece, i, j) && isActiveSquare(grid, x + i, y + j)) {
        return false;
      }
    }
  }
  return true;
}

//place piece on grid
function setPieceOnGrid(instance, x, y) {
  var piece = instance.data.piece;
  var grid = Session.get("grid");

  for(var i=0; i < piece[0].length; i++) {
    for(var j=0; j < piece.length; j++) {
      if(isActiveSquare(piece, i, j)) {
        grid = setActiveSquare(grid, x + i, y + j);
      }
    }
  }
  return grid;
}

//remove piece from grid
function removePieceFromGrid(instance) {
  var piece_xy = instance.grid_coordinates.get();
  var x = piece_xy[0], y = piece_xy[1];
  var grid = Session.get("grid");

  if(x != -1 && y != -1) {
    var piece = instance.data.piece; //instance.piece.get();

    for(var i=0; i < piece[0].length; i++) {
      for(var j=0; j < piece.length; j++) {
        if(isActiveSquare(piece, i, j)) {
          grid = setInactiveSquare(grid, x + i, y + j);
        }
      }
    }
  }

  return grid;
}

//helpers to manipulate the grid
function isActiveSquare(piece, x, y) {
  return piece[y][x];
}

function setActiveSquare(piece, x, y) {
  piece[y][x] = true;
  return piece;
}
function setInactiveSquare(piece, x, y) {
  piece[y][x] = false;
  return piece;
}

//update grid state for session and database
function updateGrid(grid) {
  Session.set('grid', grid);
  var gridId = Session.get('gridId');
  Grids.update(gridId, { $set: { gridData: grid } } );
}

