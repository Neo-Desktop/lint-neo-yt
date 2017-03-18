/**
 * Created by neo on 3/6/17.
 */

// can't get browserify-shim to work right
// let's just make it work here
window.$ = window.jQuery = require('jquery');

// include bootstrap css and javascript
require('./app.css');
require('bootstrap');

// use hasher for application page management
var hasher = require('hasher');
hasher.prependHash = '!';
hasher.separator = '/';

// include/configure highlight.js
var hljs = require('highlight.js');
hljs.configure({
    tabReplace: ' '.repeat(4)
});

// use HTML Lint (will display later)
var htmlLint = require('htmllint');

// js-beautify libraries
var beautify_js = require('js-beautify').js;
var beautify_css = require('js-beautify').css;
var beautify_html = require('js-beautify').html;

// xml-beautify library
var beautify_xml = require('xml-beautifier');

// sql-formatter library
var beautify_sql = require('sql-formatter');

// debugging assistance
var debug = (window.doTheDebugDo) ? {
    log: window.console.log.bind(window.console, '%s'),
    type: window.console.log.bind(window.console, '%s: %s'),
    error: window.console.error.bind(window.console, 'error: %s'),
    info: window.console.info.bind(window.console, 'info: %s'),
    warn: window.console.warn.bind(window.console, 'warn: %s')
} : {
    log: function() {},
    type: function() {},
    error: function() {},
    warn: function() {},
    info: function() {}
};

$('window').ready(function () {

    // main I/O
    var input = $('#input');
    var output = $('#output');

    /**
     * JSON linting!
     * @param json
     */
    var jsonLint = function(json) {
        if (typeof json !== 'string') {
            return JSON.stringify(json, undefined, 4);
        } else {
            return jsonLint(JSON.parse(json));
        }
    };

    /**
     * hasher page changer function
     * @param type
     * @param setHash
     */
    var changeType = function(type, setHash)
    {
        setHash = typeof setHash === 'undefined' ? true : setHash;

        var hash = hasher.getHashAsArray();

        var code = hash[1];
        code = typeof code === 'undefined' ? '' : code;

        switch (type) {
            case 'html':
            case 'xml':
            case 'json':
            case 'js':
            case 'css':
            case 'sql':
            case 'urlencode':
            case 'urldecode':
            case 'base64encode':
            case 'base64decode':
                debug.type('changeType()', type);

                $('#navbar').find('.active').removeClass('active');
                var tab = $('#'+type+'_tab');
                tab.addClass('active');

                if (tab.data('extra-highlight') !== '') {
                    $('#'+tab.data('extra-highlight')).addClass('active');
                }

                $('#header').text(tab.data('name'));

                if (setHash) {
                    debug.type('changeType()', 'Calling hasher.sethash with {'+ type +'} : {'+ code +'}');
                    hasher.setHash(type, code);
                } else {
                    debug.type('changeType()', 'Not calling hasher.sethash');
                }
                break;

            default:
                debug.type('changeType()', 'Default Case: Calling hasher.sethash with {html} : {'+ code +'}');
                hasher.setHash('html', code);
        }

    };

    /**
     * Beautify! Call all our syntax beautifiers
     * @param type
     * @param code
     */
    var beautify = function (type, code) {
        code = typeof code === 'undefined' ? '' : code;
        var stringOut = '';
        try {
            switch(type) {
                case 'html':
                    htmlLint(code).then(function (lintOutput) {
                        debug.log(lintOutput);
                    }, function(e) {
                        debug.log(e);
                    }).catch(function (e) {
                        debug.log(e);
                    });
                    stringOut = hljs.highlightAuto(beautify_html(code)).value;
                    break;
                case 'xml':
                    stringOut = hljs.highlightAuto(beautify_xml(code)).value;
                    break;
                case 'json':
                    stringOut = hljs.highlightAuto(jsonLint(code)).value;
                    break;
                case 'js':
                    stringOut = hljs.highlightAuto(beautify_js(code)).value;
                    break;
                case 'css':
                    stringOut = hljs.highlightAuto(beautify_css(code)).value;
                    break;
                case 'sql':
                    stringOut = hljs.highlightAuto(beautify_sql.format(code)).value;
                    break;
                case 'urlencode':
                    stringOut = hljs.highlightAuto(encodeURIComponent(code)).value;
                    break;
                case 'urldecode':
                    stringOut = hljs.highlightAuto(decodeURIComponent(code)).value;
                    break;
                case 'base64encode':
                    stringOut = hljs.highlightAuto(btoa(code)).value;
                    break;
                case 'base64decode':
                    stringOut = hljs.highlightAuto(atob(code)).value;
                    break;
            }
        } catch (e) {
            stringOut = 'Error: Unable to parse ' + type + '<br>' + e;
        }
        output.html(stringOut);
    };

    // hasher setup (now that the function exists)
    hasher.changed.add(function(newVal, oldVal) {
        debug.type('hasher.changed()', 'Old Val: ' + oldVal + ' New Val: ' + newVal);

        var doChangeType = true;

        if (oldVal.split(hasher.separator, 1)[0] === newVal.split(hasher.separator, 1)[0]) {
            doChangeType = false;
        }

        var hash = hasher.getHashAsArray();
        var type = hash[0];
        var code = hash[1];

        changeType(type, doChangeType);

        code = typeof code === 'undefined' ? '' : code;
        code = decodeURIComponent(code);

        debug.type('hasher.changed()', 'Set input value to {'+ code +'}');
        input.val(code);
    });
    hasher.initialized.add(function() {
        debug.type('hasher.initialized()', 'Start');

        var hash = hasher.getHashAsArray();
        var type = hash[0];
        var code = hash[1];

        changeType(type, false);

        code = typeof code === 'undefined' ? '' : code;
        code = decodeURIComponent(code);

        input.val(code);

        debug.type('hasher.initialized()', 'Calling beautify with {'+ type +'} : {'+ code +'}');
        beautify(type, code)
    });
    hasher.init();

    // hook into the navbar tabs and use hasher for them
    var navbar = $('#navbar');
    navbar.find('>ul>li:not(.dropdown)').click(function(e) {
        e.preventDefault();
        changeType(this.id.replace('_tab', ''));
    });
    navbar.find('.dropdown>ul>li').click(function(e) {
        e.preventDefault();
        changeType(this.id.replace('_tab', ''));
    });

    // function main ()
    input.change(function(e) {
        var hash = hasher.getHashAsArray();

        var type = hash[0];
        var code = input.val();
        code = typeof code === 'undefined' ? '' : code;

        debug.type('input.change', 'Calling beautify with {'+ type +'} : {'+ code +'}');

        beautify(type, code);
    });

});
