# Livestreamer Twitch Web

A web application to select Twitch.tv streams via web and play them using
[Livestreamer](http://docs.livestreamer.io/). Install it in a Raspberry Pi, plug it in your TV and
use your mobile browser to select streams to play.

## Why

I used to watch streams on a Chromecast but got tired of not-so-good quality and the random issues
that used to make it useless every couple of months. However, the fact that you can use a mobile
phone to select streams to play on it was always my favorite feature. So I made something to mimic it.

This is a [meteor](https://www.meteor.com/) application that you install in a machine (I use a
[Raspberry Pi](https://www.raspberrypi.org/) 3) plugged to your television/monitor and that you can access via a web browser
to select streams to play. Once the stream is selected, the server launches a Livestreamer process
in the server to play that stream in a player available in the server (for Pi, it uses `omxplayer`).

I've made this mostly for personal use and also to learn some of the technologies used to
develop it. The application itself is still very rough and I implement things as I need them.
Nevertheless, it would be great to have other people using it and possibly contributing to it
as well. Create an issue, a pull request, or just ping me if you having anything to ask or
contribute!


# Server

Get a Raspberry Pi and install [Raspbian Jessi](https://www.raspberrypi.org/downloads/raspbian/) on
it. I tried a Raspberry Pi 2 and it ran ok, but not that well. I'm currently using a Raspberry Pi 3
and it runs pretty well. Meteor still takes some time to start/reload, but all the rest is pretty
smooth.

You could use any other operating system you want, as long as you can install Meteor and
Livestreamer on it.

# Running on a Raspberry Pi

Use the OS [Raspbian Jessi](https://www.raspberrypi.org/downloads/raspbian/).

Ssh into your server before proceeding.

## Installing Livestreamer

```bash
sudo apt-get install livestreamer
```


## Installing Meteor

Make sure the system is up-to-date first:

```bash
sudo apt-get update
sudo apt-get dist-upgrade
sudo apt-get install build-essential debian-keyring autoconf automake libtool flex bison scons
sudo apt-get autoremove --purge
sudo apt-get clean
```

Get a version of Meteor that works on ARM processors:

```bash
cd ~
git clone --depth 1 https://github.com/4commerce-technologies-AG/meteor.git

# download and setup for the first time, should take a while
meteor/meteor --version
# if an SSL error happens, edit `meteor/meteor` and add `-k` to all `curl` commands
# more at https://github.com/4commerce-technologies-AG/meteor/issues/37
```

You will have Meteor installed at `~/meteor`. That's what will be assumed from now on.


## Installing the application

Clone the application:

```bash
cd ~
git clone https://github.com/daronco/livestreamer-twitch-web.git
cd livestreamer-twitch-web
```

Before running it:

* Create a domain name or at least set a fixed IP for your server
* Setup the application on Twitch at: http://www.twitch.tv/kraken/oauth2/clients/new
* Set the configurations for your application in `server/accounts.js`

Install some dependencies and run Meteor for the first time (we're assuming your IP is `192.168.0.104`):

```bash
../meteor/dev_bundle/bin/npm install -g meteorite
../meteor/dev_bundle/bin/mrt install
../meteor/meteor run -p 192.168.0.104:3000 --verbose
```

You'll now be able to access `192.168.0.104:3000` on any browser in your network, sign in
to your Twitch account and select streams to play.

# TODO

* Shouldn't lose what's playing after a restart
* Disaster recovery: force kill livestreamer and player, restart server
* Stream quality options based on what's available, not fixed quality options as we have today
* Reliability (error recovery) when starting/stopping streams
* Browse all streams
* Stream search / start stream by name
* Browser streams by game
* Follow/unfollow streams
* Set player and player options
* Run as daemon, start with the server, restart after crashes
* Multi-user
* Auto-play when streamer is online
* Pick a random stream to play
* Mobile app? Web view?
