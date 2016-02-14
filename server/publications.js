Meteor.publish('channels', function() {
  return ChannelList.find();
});

Meteor.publish('streams', function() {
  return StreamList.find();
});

Meteor.publish('onAir', function() {
  return OnAir.find();
});
