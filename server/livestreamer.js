var spawn = Npm.require('child_process').spawn;

Livestreamer = {};

var LS_CMD = "livestreamer";

if (Meteor.isServer) {

  Livestreamer.play = function(streamId) {
    stream = StreamList.findOne(streamId);

    args = [
      "--player-no-close",
      "--ringbuffer-size", "100M",
      "--hls-live-edge", "12",
      "--player", "vlc --qt-minimal-view --one-instance --fullscreen",
      "--no-version-check",
      "twitch.tv/" + stream.channel().name,
      "medium"
    ];
    this.child = spawn(LS_CMD, args, {
      detached: true
    });

    this.child.stdout.on('data', (data) => {
      console.log(`stdout: ${data}`);
    });

    this.child.stderr.on('data', (data) => {
      console.log(`stderr: ${data}`);
    });

    this.child.on('close', Meteor.bindEnvironment((code) => {
      console.log(`child process exited with code ${code}`);
      this.child = null;
      Livestreamer.stop();
    }));

    this.child.on('error', Meteor.bindEnvironment((err) => {
      console.log(`failed to start child process ${err}`);
      this.child = null;
      Livestreamer.stop();
    }));
  };

  Livestreamer.stop = function() {
    if (this.child) {
      this.child.kill('SIGTERM');
      // will end up triggering the "close" event in the child
    }
    Meteor.call('updateOnAir', null);
  };
}
