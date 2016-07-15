if (Meteor.isClient) {

  Meteor.subscribe('channels');
  Meteor.subscribe('streams');
  Meteor.subscribe('onAir');

  var userSelectedStream = function(streamId) {
    Meteor.call('setOnAir', streamId);
  };

  // When the logged user changes, fetch updated information
  // from Twitch
  Tracker.autorun(function(c) {
    if (Meteor.userId()) {
      console.log("Updating followed streams");
      Meteor.call('updateFollowedStreams');
    }
  });

  Template.navbar.onRendered(function() {
    $(".button-collapse").sideNav();
  });

  Template.navbar.helpers({
    'hasStreamOnAir': hasStreamOnAir
  });

  Template.navbar.events({
    'click #logout-btn': function() {
      Meteor.logout(function(err) {
        // TODO: clear followed streams or something
      });
    },
    'click #login-btn': function() {
      // var scope = ['user_read', 'channel_read', 'user_blocks_read', 'user_subscriptions'];
      var scope = ['user_read'];
      Meteor.loginWithTwitch({requestPermissions: scope}, function (err) {
        if (err) console.log('login failed: ' + err);
      });
    }
  });

  Template.onAir.helpers({
    'streamOnAir': function() {
      return OnAir.findOne().stream;
    },
    'loadingClass': function() {
      var liveInfo = OnAir.findOne();
      if (liveInfo && liveInfo.playerOpen) {
        return null;
      } else {
        return "loading";
      }
    }
  });

  Template.streams.helpers({
    'followedStream': function() {
      var userId = Meteor.userId();
      return StreamList.find(
        { category: "followed", followedBy: userId },
        { sort: { "data.viewers": -1, name: 1 } }
      );
    },
    'selectedClass': function() {
      var streamId = this._id;
      if (streamId == streamOnAir(true)) {
        return "active";
      }
      return null;
    }
  });

  Template.streams.events({
    'click .stream-select': function() {
      userSelectedStream(this._id);
    }
  });
}
