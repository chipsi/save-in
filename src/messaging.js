/* eslint-disable no-case-declarations */

const Messaging = {
  // Fires off and does not expect a return value
  emit: {
    downloaded: state => {
      browser.runtime.sendMessage({
        type: MESSAGE_TYPES.DOWNLOADED,
        body: { state }
      });
    }
  },

  // Returns a Promise
  send: {
    fetchViaContent: state =>
      new Promise((resolve, reject) => {
        browser.tabs
          .query({
            currentWindow: true,
            active: true
          })
          .then(tabs => {
            browser.tabs
              .sendMessage(tabs[0].id, {
                type: MESSAGE_TYPES.FETCH_VIA_CONTENT,
                body: { state }
              })
              .then(resolve)
              .catch(err => {
                if (window.SI_DEBUG) {
                  console.log(err); // eslint-disable-line
                }
                reject(err);
              });
          });
      })
  },

  /**
   * This is an unofficial, unsupported method for use with external extensions.
   * Please use this at your own risk and without any warranty. PRs are welcome.
   *
   * See: https://github.com/gyng/save-in/wiki/Use-with-Foxy-Gestures
   *
   * In Foxy Gestures:
   *
   * const source = data.element.mediaInfo && data.element.mediaInfo.source;
   *
   * if (source) {
   *   const payload = {
   *     type: "DOWNLOAD",
   *       body: {
   *         url: source,
   *         // You can use `comment` for targeting in routing rules
   *         info: { pageUrl: `${window.location}`, srcUrl: source, comment: "foo" }
   *       }
   *   };
   *
   *   // ID obtained from manifest.json
   *   browser.runtime.sendMessage("{72d92df5-2aa0-4b06-b807-aa21767545cd}", payload);
   * }
   */
  handleDownloadMessage: (request, sender, sendResponse) => {
    const { url, info, comment } = request.body;
    const last = window.lastDownloadState || {
      path: new Path.Path("."),
      scratch: {},
      info: {}
    };

    const opts = {
      currentTab, // Global
      now: new Date(),
      pageUrl: info.pageUrl,
      selectionText: info.selectionText,
      sourceUrl: info.srcUrl,
      url,
      context: DOWNLOAD_TYPES.CLICK
    };

    // Useful for passing in from external extensions
    if (comment) {
      opts.comment = comment;
    }

    const clickState = {
      path: last.path || new Path.Path("."),
      scratch: last.scratch,
      route: last.route,
      info: Object.assign({}, last.info, opts, info)
    };

    requestedDownloadFlag = true;
    Download.renameAndDownload(clickState);

    sendResponse({
      type: MESSAGE_TYPES.DOWNLOAD,
      body: { status: MESSAGE_TYPES.OK }
    });
  }
};

browser.runtime.onMessageExternal.addListener(
  (request, sender, sendResponse) => {
    switch (request.type) {
      case MESSAGE_TYPES.DOWNLOAD:
        Messaging.handleDownloadMessage(request, sender, sendResponse);
        break;
      default:
        // noop
        break;
    }
  }
);

browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
  switch (request.type) {
    case MESSAGE_TYPES.OPTIONS:
      sendResponse({
        type: MESSAGE_TYPES.OPTIONS,
        body: options
      });
      break;
    case MESSAGE_TYPES.OPTIONS_SCHEMA:
      sendResponse({
        type: MESSAGE_TYPES.OPTIONS_SCHEMA,
        body: {
          keys: OptionsManagement.OPTION_KEYS,
          types: OptionsManagement.OPTION_TYPES
        }
      });
      break;
    case MESSAGE_TYPES.GET_KEYWORDS:
      sendResponse({
        type: MESSAGE_TYPES.KEYWORD_LIST,
        body: {
          matchers: Object.keys(Router.matcherFunctions),
          variables: Object.keys(Variable.transformers)
        }
      });
      break;
    case MESSAGE_TYPES.CHECK_ROUTES:
      const lastState =
        (request.body && request.body.state) ||
        (window.lastDownloadState != null && window.lastDownloadState);

      const interpolatedVariables = lastState
        ? Object.keys(Variable.transformers).reduce(
            (acc, val) =>
              Object.assign(acc, {
                [val]: Variable.applyVariables(
                  new Path.Path(val),
                  lastState.info
                ).finalize()
              }),
            {}
          )
        : null;

      sendResponse({
        type: MESSAGE_TYPES.CHECK_ROUTES_RESPONSE,
        body: {
          optionErrors: window.optionErrors,
          routeInfo: OptionsManagement.checkRoutes(lastState),
          lastDownload: window.lastDownloadState,
          interpolatedVariables
        }
      });
      break;
    case MESSAGE_TYPES.DOWNLOAD:
      Messaging.handleDownloadMessage(request, sender, sendResponse);
      break;
    default:
      break; // noop
  }
});

// Export for testing
if (typeof module !== "undefined") {
  module.exports = Messaging;
}
