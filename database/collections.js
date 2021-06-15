import { Mongo } from 'meteor/mongo';
 
export const Grids = new Mongo.Collection('grids');

export const Solutions = new Mongo.Collection('solutions');

export const GridSteps = new Mongo.Collection('gridsteps');

export const Levels = new Mongo.Collection('levels');

export const Messages = new Mongo.Collection('messages');

export const Heartrates = new Mongo.Collection('heartrates');

export const GridNumber = new Mongo.Collection('GridNumber');

export const LevelId = new Mongo.Collection('level_ids');

export const LevelNumber = new Mongo.Collection('level_numbers');

export const Answers = new Mongo.Collection('answers');