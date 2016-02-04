ChannelList = new Mongo.Collection('channels');

var streamListMethods = {
  channel: function() {
    return ChannelList.findOne({ _id: this.channelId });
  }
};
StreamList = new Mongo.Collection('streams', {
  transform: function(doc) {
    return _.defaults(doc, streamListMethods);
  }
});

var onAirMethods = {
  channel: function() {
    return ChannelList.findOne({ _id: this.channelId });
  }
};
OnAir = new Mongo.Collection('onAir', {
  transform: function(doc) {
    return _.defaults(doc, onAirMethods);
  }
});
