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
var bsn = require('bootstrap.native');

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

// bcrypt-js library
var bcrypt = require('bcryptjs');

// forge library
var forge = require('node-forge');

// gencryption
var gencryption = require("gencryption");

// whirlpool
var whirlpool = require("whirlpool");

var cryptoShim = {
    shim: {
        out: function (md) {
            return md.digest().toHex();
        }
    },
    /**
     * MD(4|5) support
     * @param type
     * @param textIn
     * @return {*}
     * @constructor
     */
    MD: function (type, textIn) {
        switch (type) {
            case 4:
                type = "md4";
                return gencryption.md4.getHashOfTextSync.apply(this, [textIn]);
                break;
            case 5:
                type = "md5";
                return gencryption.md5.getHashOfTextSync.apply(this, [textIn]);
            default:
                throw new Error("Unable to parse MD " + type);
        }
    },
    /**
     * SHA(1|2|3|KE) support
     * @param type
     * @param bits
     * @param textIn
     * @param outputBitLength
     * @return {*}
     * @constructor
     */
    SHA: function (type, bits, textIn, outputBitLength) {
        switch (type) {
            case 1:
                return gencryption.sha1.getHashOfTextSync.apply(this, [textIn]);
                break;
            case 2:
                return gencryption.sha2.getHashOfTextSync.apply(this, [bits, textIn]);
                break;
            case 3:
                return gencryption.sha3.getHashOfTextSync.apply(this, [bits, textIn]);
                break;
            case "ke":
                return gencryption.shake.getHashOfTextSync.apply(this, [bits, outputBitLength, textIn]);
                break;
            default:
                throw new Error("Unable to parse SHA " + type);
        }
    },
    /**
     * Keccak support
     * @param bitSize [224, 256, 384, 512]
     * @param stringIn
     * @return {*}
     */
    keccak: function (bitSize, stringIn) {
        return gencryption.keccak.getHashOfTextSync.apply(this, [bitSize, stringIn]);
    },
    /**
     * Whirlpool support
     * @param stringIn
     * @return {*}
     */
    whirlpool: function (stringIn) {
        return whirlpool.apply(this, [stringIn]);
    },
    /**
     * RIPEMD[160] support
     * @param length
     * @param stringIn
     * @constructor
     */
    RIPEMD: function (length, stringIn) {
        if (length === 160) {
            return gencryption.ripemd160.getHashOfTextSync.apply(this, [stringIn]);
        } else {
            return gencryption.ripemd.getHashOfTextSync.apply(this, [stringIn]);
        }
    },
    /**
     * DSS1 support
     * @param stringIn
     * @return {*}
     * @constructor
     */
    DSS1: function (stringIn) {
        return gencryption.dss1.getHashOfTextSync.apply(this, [stringIn])
    },
    /**
     * MDC2 support
     * @param stringIn
     * @return {*}
     * @constructor
     */
    MDC2: function (stringIn) {
        return gencryption.mdc2.getHashOfTextSync.apply(this, [stringIn]);
    },
    /**
     * BCrypt support
     * @param stringIn
     * @return {string|?string}
     */
    bcrypt: function (stringIn) {
        return bcrypt.hashSync.apply(this, [stringIn, 10]);
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
        debug.type("setHash() in", JSON.stringify(arguments));

        // arguments[0]; // = type
        arguments[1] = btoa(arguments[1]); // = code
        arguments[2] = typeof arguments[2] !== 'undefined' ? btoa(arguments[2]) : arguments[2]; // hash

        debug.type("setHash() out", JSON.stringify(arguments));

        hasher.setHash.apply(this, arguments);
    },

    /**
     * Calls hasher.replaceHash()
     */
    replaceHash: function (path) {
        debug.type("replaceHash() in", JSON.stringify(arguments));

        // arguments[0]; // = type
        arguments[1] = btoa(arguments[1]); // = code
        arguments[2] = typeof arguments[2] !== 'undefined' ? btoa(arguments[2]) : arguments[2]; // hash

        debug.type("replaceHash() out", JSON.stringify(arguments));

        hasher.replaceHash.apply(this, arguments);
    }

};

var config = {
    _valid_tabs: [],
    html: {
        name: "HTML Linter",
        text: "HTML"
    },
    json: {
        name: "JSON Linter",
        text: "JSON"
    },
    xml: {
        name: "XML Linter",
        text: "XML"
    },
    css: {
        name: "CSS Linter",
        text: "CSS"
    },
    js: {
        name: "JS Linter",
        text: "JS"
    },
    sql: {
        name: "SQL Linter",
        text: "SQL"
    },
    encode_decode: {
        name: "Encode/Decode",
        text: "Encode/Decode",
        tabs: {
            urlencode: {
                name: "URL Encoder",
                text: "URLEncode"
            },
            urldecode: {
                name: "URL Decoder",
                text: "URLDecode"
            },
            base64encode: {
                name: "Base64 Encoder",
                text: "Base64Encode"
            },
            base64decode: {
                name: "Base64 Decoder",
                text: "Base64Decode"
            }
        }
    },
    hash_tools: {
        name: "Hash Tools",
        text: "Hash Tools",
        tabs: {
            md_hash: {
                name: "MD Hasher",
                text: "MD"
            },
            sha_hash: {
                name: "SHA Hasher",
                text: "SHA"
            },
            ripemd_hash: {
                name: "RIPEMD Hasher",
                text: "RIPEMD"
            },
            bcrypt_hash: {
                name: "BCrypt Hasher",
                text: "BCrypt"
            },
            keccak_hash: {
                name: "Keccak Hasher",
                text: "Keccak"
            },
            whirlpool_hash: {
                name: "Whirlpool Hasher",
                text: "Whirlpool"
            },
            dss1_hash: {
                name: "DSS1 Hasher",
                text: "DSS1"
            },
            mdc2_hash: {
                name: "MDC2 Hasher",
                text: "MDC2"
            }
        }
    },
    encryption_tools: {
        name: "Encryption Tools",
        text: "Encryption",
        tabs: {
            aes_enc: {
                name: "AES Encryption",
                text: "AES"
            },
            "3des_enc": {
                name: "Triple DES Encryption",
                text: "3-DES"
            },
            rc4_enc: {
                name: "RC-4 Encryption",
                text: "RC4"
            },
            rabbit_enc: {
                name: "Rabbit Encryption",
                text: "Rabbit"
            },
            evpkdf_enc: {
                name: "Evpkdf Encryption",
                text: "Evpkdf"
            }
        }
    }
};

var shim = {
    /**
     * Shim for d.gEBI();
     * @param id
     * @return {Element}
     */
    element: function(id) {
        if (id.substring(0, 1) === '#') {
            id = id.substring(1);
        }
        return document.getElementById(id);
    }
};

$('window').ready(function () {

    // main I/O
    var input = $('#input');
    var output = $('#output');
    var navbar = $('#navbar').find('.nav');

    Object.keys(config).forEach(function (key) {
        if (key[0] === '_') {
            return;
        }

        var listItemID = key + '_tab';
        var linkID = key + '_link';

        var listItem = $('<li />')
            .attr('id', listItemID)
            .attr('data-name', config[key].name)
            .attr('data-function', key);

        var link = $('<a />')
            .attr('id', linkID)
            .attr('href', '#')
            .html(config[key].text)
            .appendTo(listItem);

        navbar.append(listItem);

        if (config[key].hasOwnProperty('tabs')) {

            var tabs = config[key].tabs;

            listItem.addClass('dropdown');

            link.addClass('dropdown-toggle')
                .attr('role', 'button')
                .attr('aria-expanded', 'false')
                .attr('data-toggle', 'dropdown');

            $('<span />')
                .addClass('caret')
                .appendTo(link);

            var ul = $('<ul />')
                .addClass('dropdown-menu')
                .attr('role', 'menu');

            Object.keys(tabs).forEach(function (k2) {
                var id2 = k2 + '_tab';

                var li = $('<li />')
                    .attr('id', id2)
                    .attr('data-extra-highlight', listItemID)
                    .attr('data-name', tabs[k2].name)
                    .attr('data-function', k2)
                    .appendTo(ul);

                $('<a />')
                    .attr('href', '#')
                    .html(tabs[k2].text)
                    .appendTo(li);

            });
            listItem.append(ul);

            new bsn.Dropdown(shim.element(linkID), {persist: true});
        }

    });

    /**
     * hasher page changer function
     * @param type
     * @param setHash
     */
    var changeType = function (type, setHash) {
        setHash = typeof setHash !== 'boolean' ? true : setHash;
        debug.type('changeType()', 'Start: ' + type + ' | setHash: ' + (setHash ? 'true' : 'false'));

        var hash = hashShim.getHash();

        var exists = false;

        for (var key in config) {
            if (config.hasOwnProperty(type)) {
                exists = true;
                break;
            }
            else if (config[key].hasOwnProperty('tabs') && config[key].tabs.hasOwnProperty(type)) {
                exists = true;
                break;
            }
        }
        if (!exists) {
            debug.type('changeType()', 'Default Case: Calling hasher.sethash with {html} : {' + hash.code + '}');
            hashShim.setHash('html', hash.code);
            debug.type('changeType()', '----------End----------');
            return;
        }

        debug.type('changeType()', 'type: ' + type);

        // de-highlight currently highlighted tab
        navbar.find('.active').removeClass('active');

        // add highlighting to active tab
        var tab = $('#' + type + '_tab');
        tab.addClass('active');

        // if it's a sub tab this will be populated
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

        debug.type('changeType()', '----------End----------');
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

                case 'md_hash':
                    stringOut = hljs.highlight('yaml', cryptoShim.MD(5, code), true).value;
                    break;
                case 'sha_hash':
                    stringOut = hljs.highlight('yaml', cryptoShim.SHA(1, null, code, null), true).value;
                    break;
                case 'ripemd_hash':
                    stringOut = hljs.highlight('yaml', cryptoShim.RIPEMD(160, code), true).value;
                    break;
                case 'keccak_hash':
                    stringOut = hljs.highlight('yaml', cryptoShim.keccak(512, code), true).value;
                    break;
                case 'whirlpool_hash':
                    stringOut = hljs.highlight('yaml', cryptoShim.whirlpool(code), true).value;
                    break;
                case 'dss1_hash':
                    stringOut = hljs.highlight('yaml', cryptoShim.DSS1(code), true).value;
                    break;
                case 'mdc2_hash':
                    stringOut = hljs.highlight('yaml', cryptoShim.MDC2(code), true).value;
                    break;
                case 'bcrypt_hash':
                    stringOut = hljs.highlight('yaml', cryptoShim.bcrypt(code), true).value;
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
    navbar.find('li:not(.dropdown)').click(function (e) {
        e.preventDefault();
        var t = $(this);
        var func = t.data('function');
        var dbinfo = {
            id: t.attr('id'),
            func: t.data('function')
        };
        debug.type('navbar.find()', 'fired! ' + JSON.stringify(dbinfo));
        changeType(func);
    });

    $(".navbar-brand").click(function (e) {
        e.preventDefault();
        changeType('html');
    });

    // function main ()
    input.on('input', function (e) {
        var hash = hashShim.getHash();
        var code = e.target.value;

        hashShim.setHash(hash.type, code);
    });

});
