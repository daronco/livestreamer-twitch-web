if (Meteor.isClient) {

  Meteor.subscribe('channels');
  Meteor.subscribe('streams');
  Meteor.subscribe('onAir');

  var userSelectedStream = function(streamId) {
    Meteor.call('setOnAir', streamId);
  };

  var streamOnAir = function() {
    var streamId = OnAir.findOne() ? OnAir.findOne().stream._id : null;
    return streamId;
  };

  // When the logged user changes, fetch updated information
  // from Twitch
  Tracker.autorun(function(c) {
    if (c.firstRun) {
      // console.log("-- first time");
      if (Meteor.userId()) {
        Meteor.call('updateFollowedStreams');
      }
    } else {
      // console.log("-- not first time");
    }
  });

  Template.streams.helpers({
    'stream': function() {
      var userId = Meteor.userId();
      // console.log("-- searching streams", {createdBy: userId});
      return StreamList.find(
        { createdBy: userId },
        { sort: { "data.viewers": -1, name: 1 } }
      );
    },
    'selectedClass': function() {
      var streamId = this._id;
      var selectedStream = streamOnAir();
      if (streamId == selectedStream) {
        return "selected";
      }
      return null;
    }
  });

  Template.streams.events({
    'click .stream': function() {
      userSelectedStream(this._id);
    }
  });

  Template.onAir.helpers({
    'hasStreamOnAir': function() {
      return !!(OnAir.findOne());
    },
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

}
