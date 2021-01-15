import { Mongo } from 'meteor/mongo';
 
export const Grids = new Mongo.Collection('grids');

export const Solutions = new Mongo.Collection('solutions');

export const GridSteps = new Mongo.Collection('gridsteps');

export const Levels = new Mongo.Collection('levels');

export const Messages = new Mongo.Collection('messages');

export const Heartrates = new Mongo.Collection('heartrates');

