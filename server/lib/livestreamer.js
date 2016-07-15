var spawn = Npm.require('child_process').spawn;

var LS_CMD = "livestreamer";

Livestreamer = {};

Livestreamer.liveInfo = {};

Livestreamer.play = function(streamId, onStatusChange) {
  var stream = StreamList.findOne(streamId);

  var args = [
    // "--player-no-close",
    "--ringbuffer-size", "100M",
    "--hls-live-edge", "12",
    // "--player", "vlc --qt-minimal-view --fullscreen",
    "-np", "omxplayer -o hdmi",
    "--no-version-check",
    // "-l", "debug",
    "twitch.tv/" + stream.channel.name,
    "high"
  ];

  // kill the previous child, if any
  if (this.liveInfo.child) {
    Livestreamer.kill(this.liveInfo.child.pid);
    this.liveInfo.child = null;
  }

  // spawn a new child and store reference
  var child = spawn(LS_CMD, args);
  var liveInfo = {
    child: child,
    stream: stream,
    onStatusChange: onStatusChange,
    started: true,     // started to play
    ended: false,      // didn't end yet
    playerOpen: false  // player not open yet
  };
  this.liveInfo = liveInfo;
  console.log("Spawned child [" + child.pid + "] for", liveInfo.stream._id);

  var onData = Meteor.bindEnvironment(function(data) {
    console.log(`std: ${data}`);
    // TODO: detect failures starting the player?
    // match("Failed to start player")
    data = data ? data.toString() : "";
    if (data.match(/Starting player/)) {
      Livestreamer.setInfo({ playerOpen: true });
    } else if  (data.match(/Player closed/)) {
      Livestreamer.setInfo({ playerOpen: false });
    } else if  (data.match(/Stream ended/)) {
      Livestreamer.setInfo({ ended: true });
    }
  });

  var ended = function(data) {
    Livestreamer.stop();
  };

  child.stdout.on('data', onData);
  child.stderr.on('data', onData);

  child.on('close', Meteor.bindEnvironment(function(code) {
    console.log(`Child process exited with code ${code}`);
    ended();
  }));

  child.on('error', Meteor.bindEnvironment(function(err) {
    console.log(`Failed to start child process ${err}`);
    ended();
  }));
};

Livestreamer.stop = function() {
  console.log("Stopping livestreamer");
  if (this.liveInfo.child) {
    Livestreamer.kill(this.liveInfo.child.pid);
    this.liveInfo.child = null;
  }
  Livestreamer.setInfo({ ended: true });
};

Livestreamer.kill = function(pid) {
  console.log("Killing the process [" + pid + "]");

  try {
    // TODO: maybe using "SIGKILL" and killing vlc is faster
    process.kill(pid);
  } catch(err) {
    console.log("Error trying to kill process", err);
  }

  function waitKill(p, callback) {
    if (Livestreamer.isRunning(p)) {
      setTimeout(function() {
        console.log("Waiting process to end...");
        waitKill(p, callback);
      }, 100);
      // TODO: force kill if waited too long (e.g. vlc was paused)
    } else {
      callback();
    }
  };

  var waitKillSync = Meteor.wrapAsync(waitKill);
  waitKillSync(pid);

  console.log("Process killed [" + pid + "]");
};

Livestreamer.isRunning = function(pid) {
  if (!pid) {
    return false;
  }
  try {
    process.kill(pid, 0);
    return true;
  } catch(err) {
    return false;
  }
};

Livestreamer.setInfo = function(attrs) {
  _.extend(this.liveInfo, attrs);
  // TODO: only trigger it if anything changed
  if (_.isFunction(this.liveInfo.onStatusChange)) {
    this.liveInfo.onStatusChange(this.liveInfo);
  }
};
