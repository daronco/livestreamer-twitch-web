if (Meteor.isClient) {
  Accounts.ui.config({
    requestPermissions: {
      twitch: ['user_read', 'user_follows_edit']
    }
  });
}
