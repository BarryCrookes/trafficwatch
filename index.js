'use strict';

// Required by Alexa
var Alexa = require('alexa-sdk');
var APP_ID = 'amzn1.ask.skill.7316737c-9b5c-4d88-850f-c1f249a5de1e';

// Used by the PFC Alexa Skill
var sanitizeHtml = require('sanitize-html');

// RSS parser
var FeedMe = require('feedme');

var http = require('http');
var rssFeed = 'http://rss.trafficwatchni.com/trafficwatchni_incidents_rss.xml';

// Define the langauge strings to be used
var languageStrings = {
    "en": {
        "translation": {
            "SKILL_NAME" : "Traffic Watch",
            "GET_NEWS_MESSAGE" : "Here is the latest traffic news",
            "HELP_MESSAGE" : "You can say what is the traffic, or, you can say exit... What can I help you with?",
            "HELP_REPROMPT" : "What can I help you with?",
            "STOP_MESSAGE" : "Goodbye!",
            "NO_NEWS_AVAILABLE" : "Sorry, there is no news available"
        }
    }
};

// Export the handler to make it available
exports.handler = function(event, context, callback) {
    var alexa = Alexa.handler(event, context);
    alexa.APP_ID = APP_ID;
    // To enable string internationalization (i18n) features, set a resources object.
    alexa.resources = languageStrings;
    alexa.registerHandlers(handlers);
    alexa.execute();
};

// Define the handler and include the intents you want to work with
var handlers = {
    'LaunchRequest': function () {
        this.emit('GetNews');
    },
    'GetNewsIntent': function () {
        this.emit('GetNews');
    },
    'GetNews': function () {
        // Make sure you copy this to that or you will lose reference to this on the callback
        var that = this;

        http.get(rssFeed, function(res) {
          var parser = new FeedMe(true);

          res.pipe(parser);

          parser.on('end', function() {
            var payload = parser.done();
            var sayThis = "Traffic Watch N. I. Incidents. ";

            switch(payload.items.length){
              case 0:
                sayThis += "There are no ongoing incidents. ";
                break;
              case 1:
                sayThis += "There is one ongoing incident. ";
                break;
              default:
                sayThis += "There are " + payload.items.length + " ongoing incidents. ";
                break;
            }

            payload.items.forEach((item, index)=>{
              sayThis += "Incident " + (index+1) + ": " + item.title.trim() + ". ";
              sayThis += item.description.trim() + ". ";
            });

            that.emit(':tellWithCard', sanitizeHtml(sayThis), that.t("SKILL_NAME"), sanitizeHtml(sayThis))
          });

        });
    },
    'AMAZON.HelpIntent': function () {
        var speechOutput = this.t("HELP_MESSAGE");
        var reprompt = this.t("HELP_MESSAGE");
        this.emit(':ask', speechOutput, reprompt);
    },
    'AMAZON.CancelIntent': function () {
        this.emit(':tell', this.t("STOP_MESSAGE"));
    },
    'AMAZON.StopIntent': function () {
        this.emit(':tell', this.t("STOP_MESSAGE"));
    }
};
