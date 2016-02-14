/**
 * Returns the streamId of the stream currently on air
 */
streamOnAir = function(idOnly=false) {
  var stream = OnAir.findOne() ? OnAir.findOne().stream : null;
  if (stream && idOnly) {
    stream = stream._id;
  }
  return stream;
};

/**
 * Sets the stream on air
 */
setOnAir = function(streamId) {
  // prevent useless work if the stream is already playing
  if (streamId == streamOnAir(true)) {
    return;
  }

  // remove the current stream set as OnAir
  OnAir.remove({});

  // get the stream selected and set on air
  if (streamId) {
    var stream = StreamList.findOne(streamId);

    if (stream) {
      OnAir.insert({
        stream: stream,
        playerOpen: false
      });

      // play it
      Livestreamer.play(stream._id, onStatusChange);
    }
  }
};

// Fetches the streams the current user follows in Twitch and update
// the database
// TODO: use Meteor.defer and/or this.unblock
updateFollowedStreams = function() {
  if (this.userId) {
    var userId = this.userId;
    var user = Meteor.users.findOne(userId);
    var accessToken = userTwitchInfo(user).accessToken;
    var response = TwitchAccounts.apiCall("GET", "/streams/followed", {}, accessToken);

    // set all streams as not live anymore so we can remove them later
    StreamList.update({
      category: "followed",
      followedBy: userId
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

        // save the stream, indexed by channel name
        delete stream.channel;
        StreamList.upsert({
          name: channel.name
        }, {
          $set: {
            name: channel.name,
            channel: channel,
            live: true,
            category: "followed",
            followedBy: userId,
            data: stream
          }
        });
      });
    }

    // remove all streams not live anymore
    StreamList.remove({ category: "followed", followedBy: userId, live: false });

    return true;
  }
  return false;
};

onStatusChange = function(liveInfo) {
  var streamId = liveInfo.stream._id;

  if (liveInfo.ended) {
    // we only remove it from air if the stream that ended was the one that
    // is on air, otherwise it was an old stream that ended
    if (streamOnAir(true) == streamId) {
      OnAir.remove({});
    }
  } else {
    var attrs = { playerOpen: liveInfo.playerOpen };
    OnAir.update({}, { "$set": attrs });
  }
};

userTwitchInfo = function(user) {
  if (user !== null) {
    return user.services.twitch;
  } else {
    return null;
  }
};
