import { Meteor } from 'meteor/meteor';
import '../database/collections.js';
import { Grids, Levels, Messages, Heartrates, Solutions, GridSteps } from '../database/collections.js';

Meteor.startup(() => {
  // code to run on server at startup
});


Meteor.publish('gridById', function (gridId) {
  return Grids.find({_id: gridId});
});

Meteor.publish('levelById', function (levelId) {
  return Levels.find({_id: levelId});
});

Meteor.publish('messagesByChatId', function (chatId) {
  return Messages.find({chatId: chatId}); //, { sort: { time: -1 } } );
});

Meteor.publish('heartrateById', function(id) {
  return Heartrates.find({_id: id});
});

Meteor.methods({
  'isValidGridId': function(gridId) {
    return Grids.findOne({_id: gridId}) !== undefined;
  },
  'getServerTime': function() {
    return (new Date()).getTime();
  },
  'heartrateWithId': function(hr, id) {
    Heartrates.upsert({_id: id}, {hr: hr});
    return;
  }
})

Levels.allow({
  insert: function() {
    return true;
  }
});

Messages.allow({
  insert: function() {
    return true;
  }
});

Solutions.allow({
  insert: function() {
    return true;
  }
});

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