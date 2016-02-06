if (Meteor.isServer) {

  // Fetches the streams the current user follows in Twitch and update
  // the database
  // TODO: use Meteor.defer and/or this.unblock
  var updateFollowedStreams = function() {
    if (this.userId) {
      var userId = this.userId;
      var user = Meteor.users.findOne(userId);
      var accessToken = userTwitchInfo(user).accessToken;
      var response = TwitchAccounts.apiCall("GET", "/streams/followed", {}, accessToken);

      // set all streams as not live anymore so we can remove them later
      StreamList.update({
        createdBy: userId
      }, {
        $set: { live: false }
      }, {
        multi: true
      });

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
              live: true,
              data: stream
            }
          });
        });
      }

      // remove all streams not live anymore
      StreamList.remove({ createdBy: userId, live: false });

      return true;
    }
    return false;
  };

  // Sets the stream on air
  var setOnAir = function(streamId) {
    // prevent useless work if the stream is already playing
    if (streamId == streamOnAir()) {
      return;
    }

    // remove the current stream set as OnAir
    OnAir.remove({});

    // get the stream selected and set on air
    if (streamId) {
      stream = StreamList.findOne(streamId);
      OnAir.insert(stream);

      // play it
      Livestreamer.play(stream._id, onStreamEnded);
    }
  };

  var onStreamEnded = function(streamId) {
    // we only remove it from air if the stream that ended was the one that
    // is on air, otherwise it was an old stream that ended
    if (streamOnAir() == streamId) {
      OnAir.remove({});
    }
  };

  /**
   * Returns the streamId of the stream currently on air
   */
  var streamOnAir = function() {
    var streamId = OnAir.findOne() ? OnAir.findOne()._id : null;
    return streamId;
  };

  Meteor.startup(function () {
    // remove whatever was on air before, if anything
    setOnAir(null);
  });

  Meteor.publish('channels', function() {
    return ChannelList.find();
  });

  Meteor.publish('streams', function() {
    var currentUserId = this.userId;
    return StreamList.find({ createdBy: currentUserId });
  });

  Meteor.publish('onAir', function() {
    return OnAir.find();
  });

  Meteor.methods({
    updateFollowedStreams: updateFollowedStreams,
    setOnAir: setOnAir,
    streamOnAir: streamOnAir
  });
}

var userTwitchInfo = function(user) {
  if (user !== null) {
    return user.services.twitch;
  } else {
    return null;
  }
};
