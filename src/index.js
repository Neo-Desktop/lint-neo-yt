/**
 * Created by neo on 3/6/17.
 */

// debug shim
(function () {
    if (typeof window.debug !== 'object') {
        window.debug = {
            log: function () {
            },
            type: function () {
            },
            error: function () {
            },
            warn: function () {
            },
            info: function () {
            }
        };
    }
})();

// can't get browserify-shim to work right
// let's just make it work here
window.$ = window.jQuery = require('jquery');

// include bootstrap css and javascript
require('./index.css');
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

// crypto-js library
var CryptoJS = require('crypto-js');

// bcrypt-js library
var bcrypt = require('bcryptjs');

var crypto = {
    MD5: function() {
        return CryptoJS.MD5.apply(this, arguments).toString(CryptoJS.enc.Hex);
    },
    SHA1: function() {
        return CryptoJS.SHA1.apply(this, arguments).toString(CryptoJS.enc.Hex);
    },
    SHA256: function() {
        return CryptoJS.SHA256.apply(this, arguments).toString(CryptoJS.enc.Hex);
    },
    SHA224: function() {
        return CryptoJS.SHA224.apply(this, arguments).toString(CryptoJS.enc.Hex);
    },
    SHA512: function() {
        return CryptoJS.SHA512.apply(this, arguments).toString(CryptoJS.enc.Hex);
    },
    SHA384: function() {
        return CryptoJS.SHA384.apply(this, arguments).toString(CryptoJS.enc.Hex);
    },
    SHA3: function() {
        return CryptoJS.SHA3.apply(this, arguments).toString(CryptoJS.enc.Hex);
    },
    RIPEMD160: function() {
        return CryptoJS.RIPEMD160.apply(this, arguments).toString(CryptoJS.enc.Hex);
    },
    bcrypt: function(stringIn) {
        return bcrypt.hashSync(stringIn, 10);
    }
};

/**
 * JSON linting!
 * @param json
 */
var jsonLint = function (json) {
    return typeof json !== 'string' ? JSON.stringify(json, undefined, 4) : jsonLint(JSON.parse(json));
};

var hashShim = {
    /**
     * Returns hash, code, and type based on hashIn and separator
     * @param hashIn
     * @param separator
     * @return {{type: string, code: string, hash: string}}
     */
    getHash: function (hashIn, separator) {
        hashIn = typeof hashIn !== 'string' ? hasher.getHash() : hashIn;
        separator = typeof separator !== 'string' ? hasher.separator : separator;

        var split = hashIn.split(separator, 3);

        return {
            'type': typeof split[0] === 'string' ? split[0] : '',
            'code': typeof split[1] === 'string' ? atob(split[1]) : '',
            'hash': typeof split[2] === 'string' ? atob(split[2]) : ''
        };
    },

    /**
     * Compares the first substring of separator with one and two
     * @param one
     * @param two
     * @param separator
     * @returns {boolean}
     */
    hashTypeCompare: function (one, two, separator) {
        separator = typeof separator !== 'string' ? hasher.separator : separator;

        var oneS = one.split(separator, 1)[0];
        var twoS = two.split(separator, 1)[0];

        debug.type("hashTypeCompare", "one: {" + oneS + "} two: {" + twoS + "} === " + (oneS === twoS ? 'true' : 'false'));

        return oneS === twoS;
    },

    /**
     * Calls hasher.setHash()
     */
    setHash: function (path) {
        debug.type("setHash() in", arguments);

        // arguments[0]; // = type
        arguments[1] = btoa(arguments[1]); // = code
        arguments[2] = typeof arguments[2] !== 'undefined' ? btoa(arguments[2]) : arguments[2]; // hash

        debug.type("setHash() out", arguments);

        hasher.setHash.apply(this, arguments);
    },

    /**
     * Calls hasher.replaceHash()
     */
    replaceHash: function (path) {
        debug.type("replaceHash() in", arguments);

        // arguments[0]; // = type
        arguments[1] = btoa(arguments[1]); // = code
        arguments[2] = typeof arguments[2] !== 'undefined' ? btoa(arguments[2]) : arguments[2]; // hash

        debug.type("replaceHash() out", arguments);

        hasher.replaceHash.apply(this, arguments);
    }

};

$('window').ready(function () {

    // main I/O
    var input = $('#input');
    var output = $('#output');

    /**
     * hasher page changer function
     * @param type
     * @param setHash
     */
    var changeType = function (type, setHash) {
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
            case 'md5_hash':
            case 'sha1_hash':
            case 'sha256_hash':
            case 'sha224_hash':
            case 'sha512_hash':
            case 'sha384_hash':
            case 'sha3_hash':
            case 'ripemd160_hash':
            case 'bcrypt_hash':
                debug.type('changeType()', 'type: ' + type);

                $('#navbar').find('.active').removeClass('active');
                var tab = $('#' + type + '_tab');
                tab.addClass('active');

                if (tab.data('extra-highlight') !== '') {
                    $('#' + tab.data('extra-highlight')).addClass('active');
                }

                $('#header').text(tab.data('name'));

                if (setHash) {
                    debug.type('changeType()', 'Calling hasher.sethash with {' + type + '} : {' + hash.code + '}');
                    hashShim.setHash(type, hash.code);
                } else {
                    debug.type('changeType()', 'Not calling hasher.sethash');
                }
                break;

            default:
                debug.type('changeType()', 'Default Case: Calling hasher.sethash with {html} : {' + hash.code + '}');
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
            switch (type) {
                case 'html':
                    htmlLint(code).then(function (lintOutput) {
                        debug.log(lintOutput);
                    }, function (e) {
                        debug.log(e);
                    }).catch(function (e) {
                        debug.log(e);
                    });
                    stringOut = hljs.highlight('html', beautify_html(code), true).value;
                    break;
                case 'xml':
                    stringOut = hljs.highlight('xml', beautify_xml(code), true).value;
                    break;
                case 'json':
                    stringOut = hljs.highlight('json', jsonLint(code), true).value;
                    break;
                case 'js':
                    stringOut = hljs.highlight('js', beautify_js(code), true).value;
                    break;
                case 'css':
                    stringOut = hljs.highlight('css', beautify_css(code), true).value;
                    break;
                case 'sql':
                    stringOut = hljs.highlight('sql', beautify_sql.format(code), true).value;
                    break;
                case 'urlencode':
                    stringOut = hljs.highlight('yaml', encodeURIComponent(code), true).value;
                    break;
                case 'urldecode':
                    stringOut = hljs.highlight('yaml', decodeURIComponent(code), true).value;
                    break;
                case 'base64encode':
                    stringOut = hljs.highlight('yaml', btoa(code), true).value;
                    break;
                case 'base64decode':
                    stringOut = hljs.highlight('yaml', atob(code), true).value;
                    break;
                case 'md5_hash':
                    stringOut = hljs.highlight('yaml', crypto.MD5(code), true).value;
                    break;
                case 'sha1_hash':
                    stringOut = hljs.highlight('yaml', crypto.SHA1(code), true).value;
                    break;
                case 'sha256_hash':
                    stringOut = hljs.highlight('yaml', crypto.SHA256(code), true).value;
                    break;
                case 'sha224_hash':
                    stringOut = hljs.highlight('yaml', crypto.SHA224(code), true).value;
                    break;
                case 'sha512_hash':
                    stringOut = hljs.highlight('yaml', crypto.SHA512(code), true).value;
                    break;
                case 'sha384_hash':
                    stringOut = hljs.highlight('yaml', crypto.SHA384(code), true).value;
                    break;
                case 'sha3_hash':
                    stringOut = hljs.highlight('yaml', crypto.SHA3(code), true).value;
                    break;
                case 'ripemd160_hash':
                    stringOut = hljs.highlight('yaml', crypto.RIPEMD160(code), true).value;
                    break;
                case 'bcrypt_hash':
                    stringOut = hljs.highlight('yaml', crypto.bcrypt(code), true).value;
                    break;
            }
        } catch (e) {
            stringOut = 'Error: Unable to parse ' + type + '<br>' + e;
        }
        output.html(stringOut);
    };

    // hasher setup (now that the function exists)
    hasher.changed.add(function (newVal, oldVal) {
        debug.type('hasher.changed()', 'Old Val: ' + oldVal + ' New Val: ' + newVal);

        var hash = hashShim.getHash();
        var doChangeType = !hashShim.hashTypeCompare(newVal, oldVal);

        changeType(hash.type, doChangeType);

        debug.type('hasher.changed()', 'Set input value to {' + hash.code + '}');
        input.val(hash.code);

        debug.type('hasher.changed()', 'Calling beautify with {' + hash.type + '} : {' + hash.code + '}');
        beautify(hash.type, hash.code);
    });
    hasher.initialized.add(function () {
        debug.type('hasher.initialized()', 'Start');

        var hash = hashShim.getHash();
        changeType(hash.type, false);

        debug.type('hasher.initialized()', 'Set input value to {' + hash.code + '}');
        input.val(hash.code);

        debug.type('hasher.initialized()', 'Calling beautify with {' + hash.type + '} : {' + hash.code + '}');
        beautify(hash.type, hash.code)
    });
    hasher.init();

    // hook into the navbar tabs and use hasher for them
    var navbar = $('#navbar');
    navbar.find('>ul>li:not(.dropdown)').click(function (e) {
        e.preventDefault();
        changeType(this.id.replace('_tab', ''));
    });
    navbar.find('.dropdown>ul>li').click(function (e) {
        e.preventDefault();
        changeType(this.id.replace('_tab', ''));
    });

    // function main ()
    input.on('input', function (e) {
        var hash = hashShim.getHash();
        var code = e.target.value;

        hashShim.setHash(hash.type, code);
    });

});
