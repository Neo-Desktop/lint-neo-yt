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


$('window').ready(function () {

    // JSON linting!
    var jsonLint = function (json) {
        if (typeof json !== 'string') {
            return JSON.stringify(json, undefined, 4);
        } else {
            return jsonLint(JSON.parse(json));
        }
    };

    // hasher page changer function
    var changeType = function(type) {
        switch (type) {
            case 'html':
            case 'xml':
            case 'json':
            case 'js':
            case 'css':
            case 'sql':
                $('#navbar').find('>ul>li.active').removeClass('active');
                $('#'+type+'_tab').addClass('active');

                $('#header').text(type.toUpperCase() + ' Linter');

                hasher.setHash(type);
                break;

            default:
                hasher.setHash('html');
        }
    };

    // hasher setup (now that the function exists)
    hasher.changed.add(changeType);
    hasher.initialized.add(changeType);
    hasher.init();

    var beautify = function (type) {
        var stringIn = input.val();
        var stringOut = '';
        try {
            switch(type) {
                case 'html':
                    htmlLint(stringIn).then(function (lintOutput) {
                        console.log(lintOutput);
                    }, function(e) {
                        console.log(e);
                    }).catch(function (e) {
                        console.log(e);
                    });
                    stringOut = hljs.highlightAuto(beautify_html(stringIn)).value;
                    break;
                case 'xml':
                    stringOut = hljs.highlightAuto(beautify_xml(stringIn)).value;
                    break;
                case 'json':
                    stringOut = hljs.highlightAuto(jsonLint(stringIn)).value;
                    break;
                case 'js':
                    stringOut = hljs.highlightAuto(beautify_js(stringIn)).value;
                    break;
                case 'css':
                    stringOut = hljs.highlightAuto(beautify_css(stringIn)).value;
                    break;
                case 'sql':
                    stringOut = hljs.highlightAuto(beautify_sql.format(stringIn)).value;
            }
        } catch (e) {
            stringOut = 'Error: Unable to parse ' + type + '<br>' + e;
        }
        output.html(stringOut);
    };

    // hook into the navbar tabs and use hasher for them
    $('#navbar').find('>ul>li').click(function(e) {
        e.preventDefault();
        changeType(this.id.replace('_tab', ''));
    });


    // main I/O
    var input = $('#input');
    var output = $('#output');

    // function main ()
    input.change(function() {
        beautify(hasher.getHash())
    });

});
