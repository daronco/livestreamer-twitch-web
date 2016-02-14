Meteor.startup(function () {
  // clear what was on air before, if anything
  // TODO: if the livestreamer process is stull running, should use it as OnAir
  OnAir.remove({});
  setOnAir(null);
});
