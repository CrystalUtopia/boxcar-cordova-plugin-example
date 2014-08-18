var app = {
    initialize: function() {
        this.bindEvents();
    },

    bindEvents: function() {
        document.addEventListener('deviceready', this.onDeviceReady, false);
    },

    onDeviceReady: function() {
        log("onDeviceReady");

        if (device.platform == "iOS" && parseInt(device.version) >= 7) {
            $(document.body).addClass("iosfix");
        }

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
        });

        $("#tag-selected").click(function() {
            var tags;
            var tags = $("#tags-list input:checked").map(function(){return $(this).val()}).toArray();
            localStorage.SelectedTags = tags.join("\n");
            app.register(tags);
        });

        if (localStorage.SelectedTags == null) {
            app.showTags();
        } else {
            app.register(localStorage.SelectedTags.split(/\n/));
        }
    },

    showTags: function() {
        $.mobile.changePage("#tags");
        $.mobile.loading("show", {
            text: "Retrieving tags",
            textVisible: true
        });
        Boxcar.getTags({
                           onsuccess: function(tags) {
                               $.mobile.loading("hide", {});
                               var c = $("#tags-list");

                               c.empty();

                               for (var i = 0; i < tags.length; i++) {
                                   c.append("<input type='checkbox' name='tag"+i+"' value='"+tags[i]+"' id='tag"+i+"' class='custom'/>"+
                                            "<label for='tag"+i+"'>"+tags[i]+"</label>");
                               }
                               c.find("input").checkboxradio();

                               c.controlgroup("refresh");
                           },
                           onerror: errorHandler
                       });
    },

    register: function(tags) {
        $.mobile.changePage("#list");
        $.mobile.loading("show", {
            text: "Registering device",
            textVisible: true
        });
        Boxcar.registerDevice({
                                  mode: "development",
                                  tags: tags,
                                  onsuccess: function() {
                                      $.mobile.loading("hide", {});
                                      Boxcar.getReceivedMessages({
                                                                     onsuccess: function(msgs) {
                                                                         for (var i = msgs.length-1; i >= 0; i--) {
                                                                             app.alert(msgs[i]);
                                                                         }
                                                                     },
                                                                     onerror: errorHandler
                                                                 })
                                  },
                                  onerror: errorHandler,
                                  onalert: app.alert
                              })
    },

    messages: {},

    onMsgClick: function(el) {
        var msg = app.messages[$(el).data("id")];
        $("#msgdate").text(app.readableTimestamp(new Date(msg.time)));
        $("#msgbody").text(msg.body);
        $.mobile.changePage("#message");
        Boxcar.markAsReceived({id: msg.id, onsuccess: function() {}, onerror: function(){}});
        $("a[data-id="+msg.id+"] > span").removeClass("msgnew");
        if (msg.richPush) {
            $.mobile.loading("show", {
                text: "Retrieving rich content",
                textVisible: true
            });
            console.info("Fetching rich: "+msg.url);
            app.richFetch = $.ajax(msg.url).done(function(data) {
                $.mobile.loading("hide", {});
                $("#msgbody").html(data);
                app.richFetch = null;
            }).fail(function() {
                $.mobile.loading("hide", {});
                app.richFetch = null;
            });
        }
    },

    backToList: function() {
        if (this.richFetch)
            this.richFetch.abort();
        $.mobile.loading("hide", {});
        $.mobile.changePage("#list");
    },

    alert: function(msg) {
        app.messages[msg.id] = msg;
        var c = $("#list-content");
        c.prepend("<li><a href='#' onclick='app.onMsgClick(this)' data-id='"+msg.id+"'>"+
                  "<span class='msgtitle "+(msg.seen?"":"msgnew")+"'>"+msg.body+"</span>"+
                  "<p class='ui-li-aside'>"+app.readableTimestamp(new Date(msg.time))+"</p></a></li>");
        c.listview("refresh");
    },

    readableTimestamp: function(date) {
            var dayMap = ["Sunday", "Monday", "Tuesday", "Wednesday",
                          "Thursday", "Friday", "Saturday"];

            var now = new Date();
            var d1 = new Date(now), d2 = new Date(date);

            d1.setHours(0); d1.setMinutes(0); d1.setSeconds(0); d1.setMilliseconds(0);
            d2.setHours(0); d2.setMinutes(0); d2.setSeconds(0); d2.setMilliseconds(0);

            var days = (d1-d2)/24/60/60/1000;
            var time = (100+date.getHours()).toString().substr(1) + ":" +
                (100+date.getMinutes()).toString().substr(1) + ":" +
                (100+date.getSeconds()).toString().substr(1);

            if (days == 0)
                return time;
            if (days == 1)
                return "Yesterday "+time;
            if (days > 1 && days < 6)
                return dayMap[date.getDay()]+" "+time;

            return date.getFullYear() + "-" +
                (101+date.getMonth()).toString().substr(1) + "-" +
                (100+date.getDate()).toString().substr(1) + " " + time;
        }
};

function log(msg) {
    console.log(msg);
    return;

    var el = document.getElementById("log");
    var logE = document.createElement("div");
    logE.textContent = msg;
    el.appendChild(logE);
}

function successHandler(a) {
    log("Got success: "+a);
}

function errorHandler(a) {
    log("Got error: "+a);
}
