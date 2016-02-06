var spawn = Npm.require('child_process').spawn;

Livestreamer = {};

var LS_CMD = "livestreamer";

if (Meteor.isServer) {

  Livestreamer.play = function(streamId, onStreamEnded) {
    var stream = StreamList.findOne(streamId);

    var args = [
      // "--player-no-close",
      // "--ringbuffer-size", "100M",
      // "--hls-live-edge", "12",
      "--player", "vlc --qt-minimal-view --fullscreen",
      "--no-version-check",
      // "-l", "debug",
      "twitch.tv/" + stream.channel().name,
      "low"
    ];

    // kill the previous child, if any
    if (this.child) {
      Livestreamer.kill(this.child.pid);
    }

    // spawn a new child and store reference
    var child = spawn(LS_CMD, args);
    child.stream = stream;
    this.child = child;
    console.log("Spawned child [" + child.pid + "] for", child.stream._id);

    var onData = Meteor.bindEnvironment(function(data) {
      console.log(`std: ${data}`);
      // TODO: detect failures starting the player?
      // match("Failed to start player")
    });

    var ended = function(data) {
      Livestreamer.stop();
      if (_.isFunction(onStreamEnded)) {
        onStreamEnded(child.stream._id);
      }
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
    if (this.child) {
      Livestreamer.kill(this.child.pid);
      this.child = null;
    }
  };

  Livestreamer.currentChild = function() {
    return this.child;
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
}
