// Scroll adjustments to prevent the page from scrolling when the "onAir" template
// is rendered or destroyed.
// There's a small "hack" to prevent issues with full reload, the only case when
// the template "onAir" is rendered but we don't need to adjust the scroll.

Template.navbar.onRendered(function () {
  Session.set("onAirRendered_fullRefresh", true);
});

Template.onAir.onRendered(function () {
  if (!Session.get("onAirRendered") && !Session.get("onAirRendered_fullRefresh")) {
    var current = $('html, body').scrollTop();
    var diff = $('#navbar-on-air').outerHeight() + $('#navbar-progress-on-air').outerHeight();
    $('html, body').scrollTop(current + diff);
  }
  Session.set("onAirRendered", true);
  Session.set("onAirRendered_fullRefresh", false);
});

Template.onAir.onDestroyed(function () {
  if (Session.get("onAirRendered")) {
    var current = $('html, body').scrollTop();
    var diff = $('#navbar-on-air').outerHeight() + $('#navbar-progress-on-air').outerHeight();
    $('html, body').scrollTop(current - diff);
  }
  Session.set("onAirRendered", false);
});

Template.streams.events({
  'click .stream-select': function() {
    Session.set("onAirRendered_fullRefresh", false);
  }
});
