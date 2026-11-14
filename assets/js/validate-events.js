(function () {
  'use strict';
  window.ctTrack = function (eventName, detail) {
    var payload = detail || {};
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push(Object.assign({ event: eventName }, payload));
    try {
      console.info('[checktrail]', eventName, payload);
    } catch (e) {
      /* ignore */
    }
  };
})();
