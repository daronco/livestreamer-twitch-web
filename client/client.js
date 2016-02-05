if (Meteor.isClient) {

  Meteor.subscribe('channels');
  Meteor.subscribe('streams');
  Meteor.subscribe('onAir');

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

  // When the user selects a stream, change it on air
  Tracker.autorun(function(c) {
    var streamId = Session.get('selectedStream');
    Meteor.call('updateOnAir', streamId);
  });

  // // When the stream on air changes, change it visually for the user
  // Tracker.autorun(function(c) {
  //   var streamId = Meteor.call('streamOnAir');
  //   var selectedStream = Session.get('selectedStream');
  //   if (streamId !== selectedStream) {
  //     Session.set('selectedStream', streamId);
  //   }
  // });

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
      var selectedStream = Session.get("selectedStream");
      if (streamId == selectedStream) {
        return "selected";
      }
      return null;
    }
  });

  Template.streams.events({
    'click .stream': function(){
      var streamId = this._id;
      Session.set('selectedStream', streamId);
    }
  });

  Template.onAir.helpers({
    'stream': function() {
      return OnAir.findOne();
    }
  });
}
