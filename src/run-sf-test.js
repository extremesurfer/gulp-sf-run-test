/**
 * * run-sf-test.js
 * * gulp task for running apex-tests
 * * @author Satoshi Haga
 * * @date 2015/12/30
 **/

var gutil    = require('gulp-util');
var through  = require('through2');

var SfHelper = require('/lib/SfHelper');
var XMLHelper = require('/lib/XMLHelper');


var plugin = function(outputFileName){


    function transform(file, encoding, callback) {

    }

    function flush(callback) {

    }

    return through.obj(transform, flush);
};

module.exports = plugin;