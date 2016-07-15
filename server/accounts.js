// TODO: review permissions asked from twitch
// Register at: http://www.twitch.tv/kraken/oauth2/clients/new
// Or go to https://www.twitch.tv/settings/connections and "Register your application"
// Make the callback to e.g. http://192.168.0.100:3000/_oauth/twitch?close
ServiceConfiguration.configurations.remove({
  service: "twitch"
});

ServiceConfiguration.configurations.insert({
  service: "twitch",
  clientId: Meteor.settings.twitch_client_id,
  redirectUri: Meteor.absoluteUrl() + "_oauth/twitch?close",
  secret: Meteor.settings.twitch_client_secret
});
