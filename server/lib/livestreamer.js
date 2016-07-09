var spawn = Npm.require('child_process').spawn;
var psTree = Meteor.npmRequire('ps-tree');

Livestreamer = {};
Livestreamer.liveInfo = {};
Livestreamer.defaultQuality = "high";
Livestreamer.bin = "livestreamer";
Livestreamer.args = [
  // "--player-no-close",
  // "--player", "vlc --qt-minimal-view --fullscreen",
  // "-l", "debug",
  "--ringbuffer-size", "100M",
  "--hls-live-edge", "12",
  "-np", "omxplayer -o hdmi",
  "--no-version-check",
  "--verbose-player"
];

Livestreamer.play = function(streamId, onStatusChange, quality=null) {
  var stream = StreamList.findOne(streamId);
  var selectedQuality = quality ? quality : Livestreamer.defaultQuality;
  console.log("Livestreamer: will play", stream._id, "on", selectedQuality, "quality");

  // kill the previous child, if any
  if (this.liveInfo.child) {
    Livestreamer.kill(this.liveInfo.child);
    this.liveInfo.child = null;
  }

  var onData = Meteor.bindEnvironment(function(data) {
    process.stdout.write(`Livestreamer: [output to std] ${data}`);
    // TODO: detect failures starting the player?
    // match("Failed to start player")
    data = data ? data.toString() : "";
    if (data.match(/Starting player/)) {
      Livestreamer.setInfo({ playerOpen: true });
      var children = Livestreamer.childrenPids(child);
      console.log("Livestreamer: spawned children", children);

    } else if  (data.match(/Player closed/)) {
      Livestreamer.setInfo({ playerOpen: false });

    } else if  (data.match(/Stream ended/)) {
      Livestreamer.setInfo({ ended: true });
    }
  });

  // TODO: if this is called while we are already stopping the processes, it shouldn't
  // do anything, could just wait/abort
  var ended = function(data) {
    Livestreamer.stop();
  };

  // spawn a new child and store reference
  var args = Livestreamer.args.concat([
    "twitch.tv/" + stream.channel.name,
    selectedQuality
  ]);
  console.log("Livestreamer: spawning livestreamer with args:", args.join(" "));
  var child = spawn(Livestreamer.bin, args);

  child.stdout.on('data', onData);
  child.stderr.on('data', onData);
  child.on('close', Meteor.bindEnvironment(function(code) {
    console.log(`Livestreamer: child process exited with code ${code}`);
    // TODO: don't need to stop the processes here
    ended();
  }));
  child.on('error', Meteor.bindEnvironment(function(err) {
    console.log(`Livestreamer: failed to start child process ${err}`);
    // TODO: don't need to stop the processes here
    ended();
  }));

  var liveInfo = {
    child: child,
    stream: stream,
    onStatusChange: onStatusChange,
    started: true,     // started to play
    ended: false,      // didn't end yet
    playerOpen: false, // player not open yet
    quality: selectedQuality
  };
  this.liveInfo = liveInfo;
  console.log("Livestreamer: spawned child [" + child.pid + "] for stream", liveInfo.stream._id);
};

Livestreamer.stop = function() {
  console.log("Livestreamer: stopping livestreamer");
  if (this.liveInfo.child) {
    Livestreamer.kill(this.liveInfo.child);
    this.liveInfo.child = null;
  }
  Livestreamer.setInfo({ ended: true });
};

Livestreamer.kill = function(child) {
  var pid = child.pid;
  var children = Livestreamer.childrenPids(child);
  console.log("Livestreamer: killing the processes", [pid].concat(children));

  try {
    // could use use "SIGKILL" to make it faster
    _.each(children.concat(child.pid), function(c) { if (c) { process.kill(c, "SIGKILL"); } });
  } catch(err) {
    console.log("Livestreamer: error trying to kill a process", err);
  }

  function waitKill(child, callback) {
    if (Livestreamer.isAnyRunning([pid].concat(children))) {
      setTimeout(function() {
        console.log("Livestreamer: waiting process to end...");
        waitKill(child, callback);
      }, 100);
      // TODO: force kill if waited too long (e.g. vlc was paused)
    } else {
      callback();
    }
  };

  var waitKillSync = Meteor.wrapAsync(waitKill);
  waitKillSync(child);

  console.log("Livestreamer: process killed [" + [pid].concat(children) + "]");
};

Livestreamer.isRunning = function(pid) {
  if (!pid) {
    console.log("Livestreamer: process", pid, "is not running");
    return false;
  }
  try {
    process.kill(pid, 0);
    console.log("Livestreamer: process", pid, "is still running");
    return true;
  } catch(err) {
    console.log("Livestreamer: process", pid, "is not running");
    return false;
  }
};

Livestreamer.isAnyRunning = function(pids) {
  console.log("Livestreamer: checking if any is running", pids);
  return _.any(pids, function(pid) {
    return Livestreamer.isRunning(pid);
  });
};

Livestreamer.setInfo = function(attrs) {
  _.extend(this.liveInfo, attrs);
  // TODO: only trigger it if anything changed
  if (_.isFunction(this.liveInfo.onStatusChange)) {
    this.liveInfo.onStatusChange(this.liveInfo);
  }
};

Livestreamer.childrenPids = function(child) {
  var psTreeSync = Meteor.wrapAsync(psTree);
  var children = psTreeSync(child.pid);
  return _.map(children, function(c) { return parseInt(c['PID']); });
};
