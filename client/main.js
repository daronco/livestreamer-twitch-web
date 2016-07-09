if (Meteor.isClient) {

  Meteor.subscribe('channels');
  Meteor.subscribe('streams');
  Meteor.subscribe('onAir');

  var userSelectedStream = function(streamId, quality) {
    Meteor.call('setOnAir', streamId, quality);
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
    },
    'isQualityOnAir': function(quality) {
      return OnAir.findOne().quality == quality;
    }
  });

  Template.onAir.onRendered(function() {
    $('.btn-options').dropdown({
      inDuration: 300,
      outDuration: 225,
      constrain_width: false, // Does not change width of dropdown to that of the activator
      hover: false, // Activate on hover
      gutter: 0, // Spacing from edge
      belowOrigin: false, // Displays dropdown below the button
      alignment: 'right' // Displays dropdown with edge aligned to the left of button
    });
  });

  Template.onAir.events({
    'click .stream-stop': function() {
      Meteor.call('removeOnAir');
    },
    'click .stream-play': function(e) {
      var quality = $(event.target).data('stream-quality');
      var one = OnAir.findOne();
      if (one && one.stream) {
        userSelectedStream(one.stream._id, quality);
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
    'click .stream-play': function() {
      userSelectedStream(this._id);
    }
  });
}
