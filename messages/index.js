/*-----------------------------------------------------------------------------
This template demonstrates how to use an IntentDialog with a LuisRecognizer to add 
natural language support to a bot. 
For a complete walkthrough of creating this type of bot see the article at
https://aka.ms/abs-node-luis
-----------------------------------------------------------------------------*/
"use strict";
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
    let searchTerm = args.entities[0].entity;

    session.send('You want to know about ' + searchTerm);
    
    let msg = new builder.Message(session);
    msg.attachmentLayout(builder.AttachmentLayout.carousel)

    // make the request to the API
    request('https://jamesbmarshall.com/wp-json/wp/v2/posts?search=' + searchTerm, function (error, response, body) {
        
        let b = [];
     
        // create the message
        msg.attachments([
            b.map((post) => {
                return new builder.HeroCard(session)
                    .title(post.title)
                    //.subtitle("A blog post about your chosen topic.")
                    .text(post.excerpt)
                    //.images([builder.CardImage.create(session, 'https://jamesbmarshall.com/wp-json/wp/v2/media' + post.featured_media)])
                    .buttons([
                        builder.CardAction.imBack(session, "buy classic white t-shirt", "Buy")
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

