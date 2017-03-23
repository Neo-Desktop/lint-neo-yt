/**
 * Created by apanesar on 3/17/17.
 */

// debugging code
(function () {
    if (typeof window.debug !== 'object') {
        window.debug = {
            log: window.console.log.bind(window.console, '%s'),
            type: window.console.log.bind(window.console, '%s: %s'),
            error: window.console.error.bind(window.console, 'error: %s'),
            info: window.console.info.bind(window.console, 'info: %s'),
            warn: window.console.warn.bind(window.console, 'warn: %s')
        };
    }
})();