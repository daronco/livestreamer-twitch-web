ChannelList = new Mongo.Collection('channels');

// var streamListMethods = {
//   channel: function() {
//     return ChannelList.findOne({ _id: this.channelId });
//   }
// };
StreamList = new Mongo.Collection('streams');// , {
//   transform: function(doc) {
//     return _.defaults(doc, streamListMethods);
//   }
// });

OnAir = new Mongo.Collection('onAir');
