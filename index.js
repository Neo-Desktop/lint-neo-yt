/**
 * Created by neo on 3/6/17.
 * @function require
 */

// can't get browserify-shim to work right
// let's just make it work here
window.$ = window.jQuery = require('jquery');

// include bootstrap css and javascript
require('./app.css');
require('bootstrap');


$('window').ready(function () {
    // use hasher for application page management
    var hasher = require('hasher');

    // include highlight.js for display purposes
    var hljs = require('highlight.js');
    hljs.configure({
        tabReplace: '    '
    });

    // use HTML Lint (will display later)
    var htmlLint = require('htmllint');

    // JSON linting!
    var jsonLint = function (json) {
        if (typeof json != 'string') {
            return JSON.stringify(json, undefined, 4);
        } else {
            return jsonLint(JSON.parse(json));
        }
    };

    // (x|ht)ml beautifying!
    // function stolen from https://gist.github.com/sente/1083506
    var xmlBeautify = function(xml) {
        var formatted = '';
        var reg = /(>)(<)(\/*)/g;
        var pad = 0;

        xml.replace("\t", '    ');
        xml = xml.replace(reg, '$1\r\n$2$3');

        $.each(xml.split('\r\n'), function(index, node) {
            var indent = 0;
            if (node.match( /.+<\/\w[^>]*>$/ )) {
                indent = 0;
            } else if (node.match( /^<\/\w/ )) {
                if (pad != 0) {
                    pad -= 1;
                }
            } else if (node.match( /^<\w([^>]*[^\/])?>.*$/ )) {
                indent = 1;
            } else {
                indent = 0;
            }

            var padding = '';
            for (var i = 0; i < pad; i++) {
                padding += '    ';
            }

            formatted += padding + node + '\r\n';
            pad += indent;
        });

        return formatted;
    };

    // hasher page changer function
    var changeType = function(type) {
        if (type == '') {
            hasher.setHash('html');
        }
        switch (type) {
            case "html":
            case "xml":
            case "json":
                $("#navbar").find(">ul>li.active").removeClass("active");
                $("#"+type+"_tab").addClass('active');

                $("#header").text(type.toUpperCase() + ' Linter');

                hasher.setHash(type);
                break;
        }
    };

    // hasher setup (now that the functions exist)
    hasher.prependHash = "!";
    hasher.changed.add(changeType);
    hasher.initialized.add(changeType);
    hasher.init();

    // hook into the navbar tabs and use hasher for them
    $("#navbar").find(">ul>li").click(function(e) {
        e.preventDefault();
        changeType(this.id.replace('_tab', ''));
    });


    // main I/O
    var input = $('#input');
    var output = $('#output');

    // function main ()
    input.change(function() {
        switch(hasher.getHash()) {
            case "html":
            case "xml":
                try {
                    output.html(hljs.highlightAuto(xmlBeautify(input.val())).value);
                } catch (e) {
                    output.html("Error: Unable to parse " + hasher.getHash() + " <br>" + e);
                }
                htmlLint(input.val()).then(function (out) {
                    console.log(out);
                }, function(error) {
                    console.log(error);
                }).catch(function (error) {
                    console.log(error);
                });
                break;
            case "json":
                try {
                    output.html(hljs.highlightAuto(jsonLint(input.val())).value);
                } catch (e) {
                    output.html("Error: Unable to parse JSON <br>" + e);
                }
                break;
        }
    });

});
