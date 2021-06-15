//this is the code for the chat box

import { Template } from 'meteor/templating';
import { Messages, Answers } from '../../database/collections.js';

import { questions, questions2 } from '../../imports/levels/questions.js';

//import './chat.html';
//import './templates.html';
//import '../../client/main.html';
import '../templates/rpp.html';





function updateTimeSync() {
    Meteor.call('getServerTime', function(err, res) {
        if(!err) {
            Session.set('serverTimeComp', res);
            Session.set('localTimeComp', (new Date()).getTime());
        }
    });
}



function createAnswer(text) {
    if(text !== "") {
    
        var nick = Session.get('nick');
        var chatId = Session.get('gridId');
        var answerButton = Session.get('answerButton');
        var timestamp = (new Date()).getTime() - Session.get('localTimeComp') + Session.get('serverTimeComp');
        var msg = {
            text: text,
            nick: nick,
            answer: answerButton,
            chatId: chatId,
            time: timestamp
        }
        Messages.insert(msg);  //insert answers here
    }
};


Template.rpp_view.
(function (){
    var x =this.firstNode;
    console.log(x);
});



Template.rpp_view.events({
    'click #saveAnswer'(event, instance) {
        console.log('I try');
        
        console.log($(instance.firstNode).children('#area1').val());
        Session.set('answerButton', 1);
        createAnswer($(instance.firstNode).children('#area1').val());  
        $(instance.firstNode).children('#area1').val("");             
        console.log('two times');
    },
    'keypress textarea'(event, instance) {
        if((event.keyCode | event.which) === 13) { //Enter key
            event.preventDefault();
            Session.set('answerButton', 1);
            createAnswer($(instance.firstNode).children('#area1').val());
            $(instance.firstNode).children('#area1').val("");
        }
    }
});



function pad(num) {
    var res = '' + num;
    if(res.length < 2) {
        res = '0' + res;
    }
    return res;
}

Template.rpp_view.helpers({
    'answers': function() {
        updateTimeSync(); // update time sync for every new message
        var msgs = Messages.find({answer: 1}, { sort: { time: -1 }, transform: function(msg) {
            var time = new Date(msg.time);
            msg.time = time.getHours() + ':' + pad(time.getMinutes()) + ':' + pad(time.getSeconds());
            msg.nick = msg.nick === Session.get('nick') ? 'You' : msg.nick;
            return msg;
        } }).fetch();

        // don't repeat nick header if messages are from same nick
        for(var i=msgs.length-2; i--; i>=0) {
            if(!msgs[i]) break;
            if(msgs[i].nick === msgs[i+1].nick) {
                msgs[i].hide_header = true;
            }
        }

        return msgs;
    },
    'showHeart': function() {
        return Session.get('showHeart');
    },



})
