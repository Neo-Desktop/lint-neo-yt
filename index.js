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


// debug shim
window.debug = {
    log:    function() {},
    type:   function() {},
    error:  function() {},
    warn:   function() {},
    info:   function() {}
};


var hashShim = {
    /**
     * Returns hash, code, and type based on hashIn and separator
     * @param hashIn
     * @param separator
     * @param doHash
     * @return {{type: string, code: string, hash: string}}
     */
    getHash: function (hashIn, separator, doHash) {
        hashIn      = typeof hashIn     !== 'string'    ? hasher.getHash()  : hashIn;
        separator   = typeof separator  !== 'string'    ? hasher.separator  : separator;
        doHash      = typeof doHash     !== 'boolean'   ? false             : doHash;

        var out = {
            'type': '',
            'code': '',
            'hash': ''
        };
        var split = hashIn.split(separator, 2);
        out.type = split[0];

        if (doHash) {
            split = hashIn.split(separator, 3);
            out.hash = split[1];
            out.code = split[2];
        } else {
            out.code = split[1];
        }

        if (typeof out.code === 'string') {
            out.code = atob(out.code);
        } else {
            out.code = '';
        }

        return out;
    },

    /**
     * Compares the first substring of separator with one and two
     * @param one
     * @param two
     * @param separator
     * @returns {boolean}
     */
    hashTypeCompare: function(one, two, separator) {
        separator   = typeof separator !== 'string' ? hasher.separator : separator;

        var oneS = one.split(separator, 1)[0];
        var twoS = two.split(separator, 1)[0];

        debug.type("hashTypeCompare", "one: {" + oneS + "} two: {" + twoS + "} === " + (oneS === twoS ? 'true' : 'false'));

        return oneS === twoS;
    },

    /**
     * Calls hasher.setHash()
     */
    setHash: function(path) {
        debug.type("setHash() in", arguments);

        // arguments[0]; // = type
        arguments[1] = btoa(arguments[1]); // = code/hash
        if (typeof arguments[2] !== 'undefined') {
            arguments[2] = btoa(arguments[2]); // code
        }

        debug.type("setHash() out", arguments);

        hasher.setHash.apply(this, arguments);
    },

    /**
     * Calls hasher.replaceHash()
     */
    replaceHash: function(path) {
        debug.type("replaceHash() in", arguments);

        // arguments[0]; // = type
        arguments[1] = btoa(arguments[1]); // = code/hash
        if (typeof arguments[2] !== 'undefined') {
            arguments[2] = btoa(arguments[2]); // code
        }

        debug.type("replaceHash() out", arguments);

        hasher.replaceHash.apply(this, arguments);
    }

};

$('window').ready(function () {

    // main I/O
    var input   = $('#input');
    var output  = $('#output');

    /**
     * hasher page changer function
     * @param type
     * @param setHash
     */
    var changeType = function(type, setHash)
    {
        setHash = typeof setHash !== 'boolean' ? true : setHash;
        debug.type('changeType()', 'setHash: ' + (setHash ? 'true' : 'false'));

        var hash = hashShim.getHash();

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
                debug.type('changeType()', 'type: ' + type);

                $('#navbar').find('.active').removeClass('active');
                var tab = $('#'+type+'_tab');
                tab.addClass('active');

                if (tab.data('extra-highlight') !== '') {
                    $('#'+tab.data('extra-highlight')).addClass('active');
                }

                $('#header').text(tab.data('name'));

                if (setHash) {
                    debug.type('changeType()', 'Calling hasher.sethash with {'+ type +'} : {'+ hash.code +'}');
                    hashShim.setHash(type, hash.code);
                } else {
                    debug.type('changeType()', 'Not calling hasher.sethash');
                }
                break;

            default:
                debug.type('changeType()', 'Default Case: Calling hasher.sethash with {html} : {'+ hash.code +'}');
                hashShim.setHash('html', hash.code);
        }

    };

    /**
     * Beautify! Call all our syntax beautifiers
     * @param type
     * @param code
     */
    var beautify = function (type, code) {
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

        var hash            = hashShim.getHash();
        var doChangeType    = !hashShim.hashTypeCompare(newVal, oldVal);

        changeType(hash.type, doChangeType);

        debug.type('hasher.changed()', 'Set input value to {'+ hash.code +'}');
        input.val(hash.code);

        debug.type('hasher.changed()', 'Calling beautify with {'+ hash.type +'} : {'+ hash.code +'}');
        beautify(hash.type, hash.code);
    });
    hasher.initialized.add(function() {
        debug.type('hasher.initialized()', 'Start');

        var hash = hashShim.getHash();
        changeType(hash.type, false);

        debug.type('hasher.initialized()', 'Set input value to {'+ hash.code +'}');
        input.val(hash.code);

        debug.type('hasher.initialized()', 'Calling beautify with {'+ hash.type +'} : {'+ hash.code +'}');
        beautify(hash.type, hash.code)
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
    input.on('input', function(e) {
        var hash = hashShim.getHash();
        var code = e.target.value;

        hashShim.setHash(hash.type, code);
    });

});
