# Using this example code

To do that you need to create cordova project like this:

    # cordova create TestProject

tell cordova what platforms should be used:

    # cd TestProject
    # cordova platform add ios
    # cordova platform add android

and add plugin required for accessing push services on device

    # cordova plugin add http://github.com/boxcar-cordova-plugin

after that copying content of example app directly to `www` folder and replacing
values used in `Boxcar.init()` part of js/index.js with those assigned to your
service in Boxcar console would give project ready to build.

# Initialization of Boxcar API

Before any other operation can be performed, you need to initialize it
by calling `Boxcar.init()` function. This will setup initernal state
and create database used for storing received messages. It's best to
do that directly from `deviceready` event handler.

Calling this function shoulds like simmilar to this:

    Boxcar.init({
      android: {
        clientKey: "AS420flz12Elu0N9V7t1_mdJAYQpdntzepfy_DKk1GVH3Y71p3wPK7l5VYj85C",
        secret: "Qi7AylvFwMDGCxdBpReRitsJAHfnXq_KuJ2CjZ78bUQxfvf2x8ScoLY0U6LdjRUK"
      },
      ios: {
        clientKey: "9Jk-xs3vcPrXq_m-S2kPRXXmO89g7048pu2_r4mAZElMQwzlCOMim9D6VYeeAA",
        secret: "2CjZylvFwMDGCxdBfnXq3GuJ2rrQi7ACjZ78bUQxfvf2x8ScoLYpReRitsJAH1K"
      },
      server: "https://boxcar-api.io",
      richUrlBase: "https://boxcar-api.io",
      androidSenderID: "488839494944"
    })

Fields in `android` and `ios` sections should be filed with values shown
as "Access Key" and "Secret Key" in Boxcar web console for respective
platforms. Value show ander "Host" should be used in  `server` and
`richUrlBase`. Field `androidSenderID` should be filled with id of
project assigned to your application in Google API projects listing.

After doing this next step you should perform is:

# Registering device in push service

To do this you need to call `Boxcar.registerDevice`. This will
retrieve token from your phone and deliver it to Boxcar server, so it
may deliver push messages later.

Call to this function may look like this:

    Boxcar.registerDevice({
      mode: "development",
      tags: ["Cats", "Dogs"],
      onsuccess: function() {
        showMainUI();
      },
      onerror: function(code, message) {
        showErrorMessage("register-device", message);
      },
      onalert: function(msg) {
        processPush(msg);
      },
      onnotificationclick: function(msg) {
        processUserClick(msg);
      }
    }

`mode` fields (it can have value "development" or "production" should
be used to indicates if application use development on production
certificate on iOS.

List of tags passed in `tags` can be used to limit delivered
pushes. List of available tags can be fetched by calling
`Boxcar.getTags()` anytime after initialization step:

    Boxcar.getTags({
      onsuccess: function(tags) {
        for (var i = 0; i < tags.length; i++)
          addTag(tags[i]);
      },
      onerror: function(code, message) {
        showErrorMessage("get-tags", message);
      }
    }

After completing this operation one of callbacks `onsuccess` or
`onerror` is called depending on status of operation.

Callback functions from `onalert` and `onnotificationclick` will
be called for:

# New push messages processing

Your application would be informed about incoming notification through
`onalert` callback, additionally for each notification user clicked in
notification center `onnotificationclick` would be called as well. You
don't need to provide both of those callbacks, but you need to have at
least one.

Each call to those callbacks with have single argument hash object
with content like this:

    {
      id: 3811,
      time: 1408361394364,
      sound: "default",
      badge: 2,
      body: "Your new message",
      richPush: true,
      url: "https://boxcar-api.io/push-3811",
      seen: false
    }

Field `id` is an unique id assigned to this push message, `time` is
set to timestamp when message was received, it can be used to create
JavaScript date object with `new Date(msg.time)`. `sound` field
contains name of sound sample assigned to push and `badge` holds
count of unread messages shown in notification. Content of push is
delivered in `body` field, and `url` contains location of HTML version
of this push but only when `richPush` is set to `true`. Value of
`seen` shows if user seen this message previously, in this callback
it's always set to `false`.

Please be aware that not all push messages would be delivered this
way, for example in iOS if application is not active when push is
delivered, displaying of notification would be handled by system, and
application would only get info about notification when user click on
notification ui.

You can stop receiving push notifications by:

# Unregistering device from push service

This is done by calling `Boxcar.unregisterDevice()` like in this:

    Boxcar.unregisterDevice({
      onsuccess: function() {
        log("Device unregistered")
      },
      onerror: function(code, message) {
        showErrorMessage("unregister-device", message);
      }
    }

You can re-enable push messages delivery by calling
`Boxcar.registerDevice()` again later.

# Push messages manipulation functions

Boxcar API also contains couple more functions that can be used to
update state of push messages.

First we have call that can be used to inform push service that
message was delivered and shown to user. This can be done by calling
`Boxcar.markAsReceived()` function like in this example:

    Boxcar.markAsReceived({
      id: msg.id
      onsuccess: function() {
        log("Message marked")
      },
      onerror: function(code, message) {
        showErrorMessage("mark-as-received", message);
      }
    }

You should use id field from retrieved push message as value of `id`,
and both `onsuccess` and `onerror` callback would be handled like in
previous examples. Calling this function also updates `seen` attribute
of message.

You can also tell server to reset counter of unread messages in
application badge to 0 by using:

    Boxcar.resetBadge({
      onsuccess: function() {
        log("Badge reset")
      },
      onerror: function(code, message) {
        showErrorMessage("reset-badge", message);
      }
    })

This should be usually done after application get activated.

You can also retrieve list of received push messages by executing
`Boxcar.getReceivedMessages()`:

    Boxcar.getReceivedMessages({
      limit: 20,
      before: 1408361394364,
      onsuccess: functions(msgs) {
        for (var i = 0; i < msgs.length; i++)
          displayMessage(msgs[i]);
      },
      onerror: function(code, message) {
        showErrorMessage("get-received-message", message);
      }
    }

where `limit` sets maximum number of returned messages and `before`
limits messages to only those with timestamp older that that.
