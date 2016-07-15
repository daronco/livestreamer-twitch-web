hasStreamOnAir = function() {
  return !!(OnAir.findOne());
};

streamOnAir = function(idOnly=false) {
  var stream = OnAir.findOne() ? OnAir.findOne().stream : null;
  if (stream && idOnly) {
    stream = stream._id;
  }
  return stream;
};
