//this is the code for the chat box

import { Template } from 'meteor/templating';
import { Messages, Answers } from '../../database/collections.js';

import { questions, questions2 } from '../../imports/levels/questions.js';

//import './chat.html';
//import './templates.html';
//import '../../client/main.html';
import './rpp.html';





function updateTimeSync() {
    Meteor.call('getServerTime', function(err, res) {
        if(!err) {
            Session.set('serverTimeComp', res);
            Session.set('localTimeComp', (new Date()).getTime());
        }
    });
}



function createAnswer(instance, answer) {
    var textArea = $(instance.firstNode).children('.area');
    var text = textArea.val();
    var answer = instance.data.answer;
    if(text && text !== "") {

        var nick = Session.get('nick');
        var chatId = Session.get('gridId');
        var answerButton = answer;
        var timestamp = (new Date()).getTime() - Session.get('localTimeComp') + Session.get('serverTimeComp');
        var msg = {
            text: text,
            nick: nick,
            answer: answerButton,
            chatId: chatId,
            time: timestamp
        }
        Messages.insert(msg);  //insert answers here

        textAreas.val("");
    }
};


/*Template.rpp_view.
(function (){
    var x =this.firstNode;
    console.log(x);
});
*/


Template.rpp_question.events({
    'click #saveAnswer'(event, instance) {
        createAnswer(instance);  
    },
    'keypress textarea'(event, instance) {
        if((event.keyCode | event.which) === 13) { //Enter key
            event.preventDefault();
            createAnswer(instance);
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

Template.rpp_question.helpers({
    'answers': function() {
        updateTimeSync(); // update time sync for every new message
        var answer = Template.instance().data.answer;
        var msgs = Messages.find({answer: answer}, { sort: { time: -1 }, transform: function(msg) {
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
    }

})
