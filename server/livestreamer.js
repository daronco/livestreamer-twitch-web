child_process = Npm.require('child_process');

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
    this.child = child_process.spawn(LS_CMD, args);

    this.child.stdout.on('data', (data) => {
      console.log(`stdout: ${data}`);
    });

    this.child.stderr.on('data', (data) => {
      console.log(`stderr: ${data}`);
    });

    this.child.on('close', (code) => {
      console.log(`child process exited with code ${code}`);
    });
  };

}
