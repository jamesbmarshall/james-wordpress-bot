/*-----------------------------------------------------------------------------
This template demonstrates how to use an IntentDialog with a LuisRecognizer to add 
natural language support to a bot. 
For a complete walkthrough of creating this type of bot see the article at
https://aka.ms/abs-node-luis
-----------------------------------------------------------------------------*/
"use strict";
//var request = require('request');
var builder = require("botbuilder");
var botbuilder_azure = require("botbuilder-azure");
var path = require('path');


var useEmulator = (process.env.NODE_ENV == 'development');

var connector = useEmulator ? new builder.ChatConnector() : new botbuilder_azure.BotServiceConnector({
    appId: process.env['MicrosoftAppId'],
    appPassword: process.env['MicrosoftAppPassword'],
    stateEndpoint: process.env['BotStateEndpoint'],
    openIdMetadata: process.env['BotOpenIdMetadata']
});

var bot = new builder.UniversalBot(connector);
bot.localePath(path.join(__dirname, './locale'));

// Make sure you add code to validate these fields
var luisAppId = process.env.LuisAppId;
var luisAPIKey = process.env.LuisAPIKey;
var luisAPIHostName = process.env.LuisAPIHostName || 'westus.api.cognitive.microsoft.com';

const LuisModelUrl = 'https://' + luisAPIHostName + '/luis/v1/application?id=' + luisAppId + '&subscription-key=' + luisAPIKey;

// Main dialog with LUIS
var recognizer = new builder.LuisRecognizer(LuisModelUrl);
var intents = new builder.IntentDialog({ recognizers: [recognizer] })
/*
.matches('<yourIntent>')... See details at http://docs.botframework.com/builder/node/guides/understanding-natural-language/
*/
.matches('Tags', (session, args) => {
    session.send('0');

    let searchTerm = args.entities[0].entity;

    session.send('You want to know about ' + searchTerm + '. Here\'s what I found:');
    session.send('1');
   
    let msg = new builder.Message(session);
    session.send('2');
    msg.attachmentLayout(builder.AttachmentLayout.carousel)
session.send('3');
    // make the request to the API
    request('https://jamesbmarshall.com/wp-json/wp/v2/posts?search=' + searchTerm, function (error, response, body) {
        session.send('4');
        let b = [];
        session.send('5');
        b = JSON.parse(body);
        session.send('6');
        session.send(b);

        // create the message
        msg.attachments([
            b.map((post) => {
                return new builder.HeroCard(session)
                    .title(post.title)
                    .text(post.excerpt)
                    .buttons([
                        builder.CardAction.imBack(session, "Read this post", "Read")
                    ]);
            })
        ]);
        session.send(msg);
    });

    
})

.onDefault((session) => {
    session.send('Sorry, I did not understand \'%s\'.', session.message.text);
});

bot.dialog('/', intents);    

if (useEmulator) {
    var restify = require('restify');
    var server = restify.createServer();
    server.listen(3978, function() {
        console.log('test bot endpont at http://localhost:3978/api/messages');
    });
    server.post('/api/messages', connector.listen());    
} else {
    module.exports = { default: connector.listen() }
}

