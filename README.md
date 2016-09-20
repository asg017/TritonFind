# TritonFind 
A Messenger Bot that assists UC San Diego students in getting their lost items back.
Created by Alex Garcia.

To learn more, please visit the [TritonFind website](https://asg017.github.io/Projects/TritonFind/index.html).

<img src="https://asg017.github.io/Projects/TritonFind/pics/tritonfind-scan.png" alt="TritonFind Messenger Scan Code" width="500">



##Table of Contents
*BTW, the Table of Content links below may not work.* 
- [Introduction](#Introduction)
- [Functionality](#Functionality)
- [MySQL Layout](#MySQL Layout)
- [Making a Messenger Bot](#Making a Messenger Bot)
- [Security](#Security)
- [Known Issues](#Known Issues)
- [To-do](#To-do)
- [Future Ideas](#Future Ideas)
- [Why I Made TritonFind](#Why I Made TritonFind)
- [Contributions](#Contributions)
- [Credits](#Credits)



##Introduction

TritonFind is a Messenger Bot, [utilzing the Messenger API](https://messengerplatform.fb.com/).
In general, this is what happens:

1. A users scans the barcode on the back of their UCSD Student ID. TritonFind
registers it as theirs.
2. This person loses their ID. Someone finds it, they scan that same barcode 
on TritonFind. 
3. TritonFind connects these two people into a conversation. They talk it out,
decide how to get the ID back to the person.
4. Person gets their ID back, everyone is happy.

Here is an example of a user scanning an ID with TritonFind, and connecting with the owner:

<img src="https://asg017.github.io/Projects/TritonFind/pics/tritonfind-scan-example-3.gif" alt="TritonFind scanning ID example">

Here is the [Privacy Policy](https://asg017.github.io/Projects/TritonFind/privacy.html), 
[Terms of Service](https://asg017.github.io/Projects/TritonFind/terms.html), 
[FAQ's](https://asg017.github.io/Projects/TritonFind/FAQ.html), and 
[Security Details](https://asg017.github.io/Projects/TritonFind/barcodeSafety.html) for TritonFind. 



##Functionality

This is what TritonFind can do:

* Store your ID barcode information safely.
* Get you in contact with other users who find your items, and vice versa.
* Handle conversation between people, with easy access of sharing pertinent info.
* Admins can send an announcements to all subscribed users of TritonFind.
* Handle reports, from users reporting other users on harassment/abuse
* Keeps some trends on the number of users/items/returned items.



###Source Code

This is how the source code flows:
TODO Add diagrams fo how modules interact with each other
1. Facebook makes a POST request to the TritonFind webhook. (`index.js`)
2. TritonFind grabs the user's data from the MySQL database. (`modules/reply.js` - > `modules/sql.js`)
3. Based on the message context or the user's state, TritonFind will compile an array of messages to send. (`modules`/\* and `modules/handlers/`*)
4. TritonFind sends all those messages. 

###Barcode Scanning

TritonFind scans all pictures sent with the [zxing service](zxing.org). TritonFind uses the request/cheerio npm packages
to get and parse the barcode data. Feel free to use `modules/barcode.js` for your projects. Please be nice and don't 
spam the service, keep limits in mind.



##MySQL Layout

For your convenience, here is some dummy data for the real MySQL tables TritonFind uses:

userKey | userID | state | workingItem | subscribed | convo
--------|--------|-------|-------------|------------|-------|
|mediumint|varchar(32)|char(2)|mediumInt|tinyint(1)|mediumint
|1|100022394124|IC|null|1|3| |
|2|102385832849|??|null|1| |
|3|102383924832|IC|6|null|1| |

itemKey|code|itemName|userKey
---|---|---|---|
mediumInt|varchar(255)|varchar(20)|mediumInt
1|88d02eb7db993dd11038379dc74c9752|my ID|1
2|6d8e30531574002f29c4d1f21b93b865|My Laptop|1
3|631ea09b349386ff685c3afd355ca2c5|My Keys|1
4|0e248248a0fc43b5cf337a35d78c8879|id|2
5|e818da1d21769fe307ef943a2a5e144f|ucsd id|3
6|21257bd6765162f4bfb8483da6f379a6|null|3

reportKey|Reporter|Reportee|TimeStamp|Message|Result
---|---|---|---|---|---|
mediumint|mediumint|mediumint|bigint|varchar(500)|char(1)
1|3|1|12381249123|They asked for personal information.|B



##Making a Messenger Bot

###Getting Started
To start with Messenger Bots, start with [Facebook's Getting Started Page.](https://developers.facebook.com/docs/messenger-platform/quickstart). 
It requires you:

1. Make a Facebook Page (users message this page to interact with the bot)
2. Make a Facebook App
3. Set up a Webhook (where Facebook interacts with your bot, see below)
4. Get Page Access Token
5. Subscribe App to the Page

###Webhooks

TritonFind is ran as a Heroku App. Whenever someone messages TritonFind, Facebook
goes to https://triton-find.herokuapp.com/webhook to give TritonFind the message.
Then, TritonFind will mark the message as "read," send a "typing on" indicator, 
then eventually send that user messages back. 
These are some examples of different messages TritonFind may receive:

####Text Message
----------------
```json
{
   "sender":{
      "id":"123758055456502" 
   },
   "recipient":{
      "id":"2256832601836282"
   },
   "timestamp":147416164587,
   "message":{
      "mid":"mid.1474161748572:01951f2e8887459687",
      "seq":2,
      "text":"hello TritonFind, my name is dog"
   }
}
```

####Picture Message
-------------------
```json
{
   "sender":{
      "id":"123758055456502"
   },
   "recipient":{
      "id":"2256832601836282"
   },
   "timestamp":1474161645123,
   "message":{
      "mid":"mid.1474161748572:01951f2e8887412345",
      "seq":3,
      "attachments":[
         {
            "type":"image",
            "payload":{
               "url":"https://scontent.xx.fbcdn.net/v/t34.0-12/14384099_1121531541225757_1265903516_n.png?_nc_ad=z-m&oh=4e3f305420e496a49c4d5508a2164dec&oe=57E3146B"
            }
         }
      ]
   }
}
```

####Payloads
----------------

#####Button Payload

Everytime a user hits a button (whether it's from a [button message](https://developers.facebook.com/docs/messenger-platform/send-api-reference/button-template),
[generic template](https://developers.facebook.com/docs/messenger-platform/send-api-reference/generic-template),
the ["Persistent Menu"](https://developers.facebook.com/docs/messenger-platform/thread-settings/persistent-menu),
or the ["Get Started" button](https://developers.facebook.com/docs/messenger-platform/thread-settings/get-started-button)).
from a carousel item, 
```json
{
   "recipient":{
      "id":"123758055456502"
   },
   "timestamp":1474161645123,
   "sender":{
      "id":"2256832601836282"
   },
   "postback":{
      "payload":"{\"menu\":{\"viewItems\":1}}"
   }
}
```

#####Quick-Reply Payload

```json
{  
   "sender":{  
      "id":"123758055456502"
   },
   "recipient":{  
      "id":"2256832601836282"
   },
   "timestamp":1474161645123,
   "message":{  
      "quick_reply":{  
         "payload":"{\"cancel\":1}"
      },
      "mid":"mid.1474330332218:e67a0170e3ca267017",
      "seq":5,
      "text":"Cancel"
   }
}
```


##Security

TritonFind stores all of its information in a MySQL database. If a user chooses
to register their barcoded items with TritonFind, that barcode data is stored 
in the database. 

The barcode code is hashed/salted before inserted into the database. This prevents
the TritonFind team from accidentally viewing users' barcode information, and 
would be a hinderance in case of a data breach.

For more information on how TritonFind handles its security, or to look at the research
TritonFind has done specifically for UCSD barcode information, check out the [TritonFind
Security Page](https://asg017.github.io/Projects/TritonFind/barcodeSafety.html).



##Known Issues
* Tests
<br/>
  I have no idea how tests work in nodejs, let alone how to test a Messenger Bot
specifically. If someone has experience with tests in nodejs, or finds some guides
for it, please let me know!

* Error Handling
<br/>
  Some errors don't have replies handled. So, if there is an SQL error or Messenger 
API access error, TritonFind may not respond. This is terrible for bots, so 
more/better error handling should be implemented.



##To-do
* More and better in-file documentation.
* Better code design everywhere, make more folders with handlers (e.g. payloadHandler folder, convoHandler folder, etc.)
* Change in-conversation "Location" payload to updated Location payload in newest Messenger API update.
* Website should include metrics, how many users/items/found items.
* Make sure that TritonFind doesn't "time out" during delay messages, since itneeds to send 200 status code within 20 seconds.
* Split long messages between users in a conversation into small chunks. Right now, cuts off messages at 320 chars (Messenger API limit), instead send all as seperate messages ( (1/3), (2/3), etc.). 
* Do a quick check on "raw" input in scanning ID's, make sure its 14 digits, starts with 21822, etc.



##Future Ideas
Here's an incomplete of different feature/functionalities that I hope TritonFind
will have in the near future:

* __Better Barcode Scanning__
<br>Prompt user of each barcode found in picture, have them decide which one to use.
* __LiveChat__
<br>Request to speak to admin, turn off bot functionality for that specific user until their requests are fulfilled.
* __La Jolla Weather__
<br>Daily updates to La Jolla/UCSD weather, in morning or night.
* __More Conversation__
<br>Use api.ai  or another service to make TritonFind more conversation, opposed to regex.
* __Triton Alert Emergency Notifications__
<br>Be able to send all subscribed users information about Emergency Alerts put out by UCSD.
* __UCSD Textbook Lookup__ 
<br>See what textbooks your specific class requires, see Bookstore/Amazon/TritonTexty prices. 
* __HDH Menus__
<br>Show users what's on the menu for all dining halls on campus, notifcation if certain items are being served.
* __CSO Escort/CAPS/Campus Police__
<br>Ability to call for a CSO escort, CAPS services, or Campus Police, all in Messenger.



##Why I Made TritonFind

I wasn't doing anything this summer (besides some classes), so I wanted to have 
some form of project to work on. I tried teaching myself HTML and CSS, but I got
bored quick. Then, I found out about the Messenger Bot API, so I wanted to try it 
out. So, I first made a Messenger Bot to play Connect Four in Messenger, after 
teaching myself nodejs (which was pretty hard, coming from a Java background).

But then, Messenger changed some of their policy about time limits of sending a 
messenge after 24 hours. I had to change the Connect Four bot around, but it was
a really tedious NS exhausting process. So I looked for another Messenger Bot idea,
since I already was familiar with the API.

So, I looked at my list of project ideas, and saw one that was similar to TritonFind.
The original project idea was pretty dumb, it was an app that UCSD students would
download, and they would get a QR Code sticker to put on their ID. The app would
scan those QR Codes, then get in contact with the owner, with a notification or 
something. This idea was dumb because:
* Required people download an app 
* No idea how to pay for the QR Code stickers (original idea was to donate 
stickers to users free of charge)
* No good way to contact users (besides push notifications that can easily be
ignored, and sharing personal info would be a difficult sell)

So, I modified this idea around a little until TritonFind came to be.

Also, I just like what it solves. Those posts of pictures of random people's ID's
spam Free and For Sale and other UCSD Facebook groups, so TritonFind tries to 
declutter that. It makes finding people a lot easier, and will hopefully
calm down people if they do lose their ID. I just hope that TritonFind will help
people, in the end.

Also, with learning how to build Messenger Bots and making all this for TritonFind,
I learned:
* Basic understanding Javascript and nodejs
* Request/express apps
* npm
* JSON strings and objects
* RegEx
* MySQL, creating database, queries, tables, nodejs MySQL syntax
* Heroku
* HTML/CSS
* Facebook Promotion
* More Practice with git/github
* Markdown


##Contributions

TritonFind is always open for ideas and suggestions, especially with security and 
functionality improvements! Feel free to open an issue
on github, or email me / message me on Facebook.



##Credits

I made/maintain TritonFind, and am the sole admin (for now). Here is a list
of people who helped me test TritonFind:

1. Juan Garcia (dad)
2. Eva Rodriguez (girlfriend)
3. Brian Valadex (friend)
4. Rayan Massoud (friend)
5. Tejas Gopal (friend)
6. Mike Tran (friend)
7. Sai Samudrala (friend)
8. Tad Tiri (no idea who this guy is)
9. About a dozen other people who tested it out during a soft opening
