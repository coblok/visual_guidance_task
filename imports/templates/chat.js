import { Template } from 'meteor/templating';
import { Messages } from '../../database/collections.js';
import './chat.html';

function updateTimeSync() {
    Meteor.call('getServerTime', function(err, res) {
        if(!err) {
            Session.set('serverTimeComp', res);
            Session.set('localTimeComp', (new Date()).getTime());
        }
    });
}
  
function createMessage(text) {
    if(text !== "") {
        var nick = Session.get('nick');
        var chatId = Session.get('gridId');
        var timestamp = (new Date()).getTime() - Session.get('localTimeComp') + Session.get('serverTimeComp');
        var msg = {
            text: text,
            nick: nick,
            chatId: chatId,
            time: timestamp
        }
        Messages.insert(msg);
    }
};

Template.chat.events({
    'click button'(event, instance) {
        createMessage($(instance.firstNode).children('textarea').val());
        $(instance.firstNode).children('textarea').val("");
    },
    'keypress textarea'(event, instance) {
        if((event.keyCode | event.which) === 13) { //Enter key
            event.preventDefault();
            createMessage($(instance.firstNode).children('textarea').val());
            $(instance.firstNode).children('textarea').val("");
        }
    }
});

function animateHeart() {
    var hr = Session.get('heart_rate');
    var icon = $("#heart_icon");
    icon.animate({
        'background-size': "50%"
    }, hr / 2, function() {
        hr = Session.get('heart_rate');
        icon.animate({
            'background-size': "100%"
        }, hr / 2, function() {
            animateHeart();
        });
    
    });
}

Template.chat.onRendered(function() {
    var showHeart = Session.get('showHeart');
    if(showHeart) animateHeart();
});

function pad(num) {
    var res = '' + num;
    if(res.length < 2) {
        res = '0' + res;
    }
    return res;
}

Template.chat.helpers({
    'messages': function() {
        updateTimeSync(); // update time sync for every new message
        var msgs = Messages.find({}, { sort: { time: -1 }, transform: function(msg) {
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
    }
})