//this server component is mainly concerned with database access from client

import { Meteor } from 'meteor/meteor';

//importing the collections used in the app
import { Grids, Levels, Messages, Heartrates, Solutions, GridSteps, GridNumber, LevelNumber, LevelId, Answers } from '../database/collections.js';
//import '../database/collections.js';
import {default_levels} from '../imports/levels/default_levels.js'

Meteor.startup(() => {
  // code to run on server at startup

  //insert default levels to database if they are not there
  for(var i=0; i<default_levels.length; i++) {
    level = default_levels[i];
    existing = Levels.findOne({_id: level._id});
    if(existing === undefined) {
      Levels.insert(level);
    }
  }

  //insert test grid to database if it's not there yet
  var test_grid = Grids.findOne({_id: 'test'});
  if(test_grid === undefined) {
    Grids.insert({_id: 'test', level: 'empty', gridData : [ [ false, false, false ], [ false, false, false ] ]});
  }
});

//publish grid, chat messages and heart rates based on the current room id

Meteor.publish('gridNumberById', function(id) {
  return GridNumber.find({_id: id});
});

Meteor.publish('answersByChatId', function(chatId) {
  return Answers.find({_id: chatId});
});


Meteor.publish('gridById', function (gridId) {
  return Grids.find({_id: gridId});
});


Meteor.publish('messagesByChatId', function (chatId) {
  return Messages.find({chatId: chatId}); //, { sort: { time: -1 } } );
});


Meteor.publish('heartrateById', function(id) {
  return Heartrates.find({_id: id});
});


//publish single levels based on level identifier
Meteor.publish('levelById', function (levelId) {
  return Levels.find({_id: levelId});
});

//publish single levels based on level identifier
Meteor.publish('levelIdById', function (levelId) {
  return LevelId.find({_id: levelId});
});

//publish single levels based on level identifier
Meteor.publish('levelNumberById', function (levelId) {
  return LevelNumber.find({_id: levelId});
});


//helper methods
Meteor.methods({
  //check if desired grid exists
  'isValidGridId': function(gridId) {
    return Grids.findOne({_id: gridId}) !== undefined;
  },
  //return server's time to client
  'getServerTime': function() {
    return (new Date()).getTime();
  },
  //let client update the current heart rate based on the room id
  'heartrateWithId': function(hr, id) {
    Heartrates.upsert({_id: id}, {hr: hr});
    return;
  }
})

//allow inserting new levels, messages and solutions to the database
Levels.allow({
  insert: function() {
    return true;
  }
});

GridNumber.allow({
  update: function() {
    return true;
   }
});

LevelNumber.allow({
  update: function() {
    return true;
   }
});

LevelId.allow({
  update: function() {
    return true;
   }
});

Messages.allow({
  insert: function() {
    return true;
  }
});

Answers.allow({
  insert: function() {
    return true;
  }
});

Solutions.allow({
  insert: function() {
    return true;
  }
});

Grids.allow({
  update: function() {
    return true;
  }
})

GridNumber.allow({
  update() {
    return true;
  }
});
//observe all grids for changes and save all events to the database with timestamp
//this makes it possible to get step-by-step play data
var grids = Grids.find();

grids.observe({
  changed: function(newDocument, oldDocument) {
    var gridStep = {};
    gridStep.gridData = newDocument.gridData;
    gridStep.level = newDocument.level;
    gridStep.gridId = newDocument._id;
    gridStep.timestamp = (new Date()).getTime();

    GridSteps.insert(gridStep);    
  }
});