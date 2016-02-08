if (Meteor.isClient) {

  Meteor.subscribe('channels');
  Meteor.subscribe('streams');
  Meteor.subscribe('onAir');

  var userSelectedStream = function(streamId) {
    Meteor.call('setOnAir', streamId);
  };

  var streamOnAir = function(idOnly=false) {
    var stream = OnAir.findOne() ? OnAir.findOne().stream : null;
    if (stream && idOnly) {
      stream = stream._id;
    }
    return stream;
  };

  var navbarHeightChanged = function() {
    var height = $("#navbar").outerHeight() + 10;
    $("body").css("padding-top", height + "px");
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

  Template.navbar.onRendered(function () {
    Meteor.setTimeout(function(){
      navbarHeightChanged();
    }, 100);
  });

  Template.navbar.helpers({
    'hasStreamOnAir': function() {
      return !!(OnAir.findOne());
    }
  });

  Template.navbar.events({
    'click #logout-btn': function() {
      Meteor.logout(function(err) {
        // TODO: clear followed streams or something
      });
    }
  });

  Template.onAir.onRendered(function() {
    Meteor.setTimeout(function(){
      navbarHeightChanged();
    }, 100);
  });

  Template.onAir.onDestroyed(function() {
    Meteor.setTimeout(function(){
      navbarHeightChanged();
    }, 100);
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
}
