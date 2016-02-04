ChannelList = new Mongo.Collection('channels');

StreamList = new Mongo.Collection('streams', {
  transform: function(doc) {
    doc.channel = ChannelList.findOne({ _id: doc.channelId });
    return doc;
  }
});
