ChannelList = new Mongo.Collection('channels');
StreamList = new Mongo.Collection('streams', {
  transform: function(doc) {
    doc.channel = ChannelList.findOne({ _id: doc.channelId });
    return doc;
  }
});

if (Meteor.isClient) {

  Meteor.subscribe('channels');
  Meteor.subscribe('streams');

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
    }
  });
}

if (Meteor.isServer) {
  Meteor.startup(function () {
    // code to run on server at startup
  });

  Meteor.publish('channels', function(){
    return ChannelList.find();
  });

  Meteor.publish('streams', function(){
    var currentUserId = this.userId;
    return StreamList.find({ createdBy: currentUserId });
  });

  Meteor.methods({
    updateFollowedStreams: function () {
      if (this.userId) {
        var userId = this.userId;
        var user = Meteor.users.findOne(userId);
        var accessToken = userTwitchInfo(user).accessToken;
        var response = TwitchAccounts.apiCall("GET", "/streams/followed", {}, accessToken);

        if (response.data && response.data.streams) {
          streams = response.data.streams;
          streams.forEach(function(stream) {

            // we have information about the channels in the response,
            // so use it to update the list of channels
            ChannelList.upsert({
              name: stream.channel.name
            }, {
              $set: {
                name: stream.channel.name,
                data: stream.channel
              }
            });
            // console.log("== saving channel", {
            //   name: stream.channel.name,
            //   data: stream.channel
            // });
            var channel = ChannelList.findOne({ name: stream.channel.name });

            // save the stream, indexed by channel id
            delete stream.channel;
            StreamList.upsert({
              channelId: channel._id,
              createdBy: userId
            }, {
              $set: {
                channelId: channel._id,
                createdBy: userId,
                data: stream
              }
            });
            // console.log("== saving stream", {
            //   channelId: channel._id,
            //   createdBy: userId,
            //   data: stream
            // });
          });
        }

        return true;
      }
      return false;
    }
  });

}

var userTwitchInfo = function(user) {
  if (user !== null) {
    return user.services.twitch;
  } else {
    return null;
  }
};
