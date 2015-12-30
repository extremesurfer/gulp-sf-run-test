/**
 * * run-sf-test.js
 * * gulp task for running apex-tests
 * * @author Satoshi Haga
 * * @date 2015/12/30
 **/

'use strict';

var gutil = require('gulp-util');
var through = require('through2');
var _ = require('underscore');
require('./lib/undersocre-mixin');
var Promise = require('bluebird');
var SfHelper = require('./lib/SfHelper');
var XMLHelper = require('./lib/XMLHelper');
require('date-utils');

module.exports = function (outputFileName) {
    return through.obj(function (file, enc, callback) {
        var self = this;

        if (file.isStream()) {
            return self.emit('error', new PluginError(PLUGIN_NAME, 'Streaming not supported'));
        }

        if (file.isBuffer()) {
            var sfHelper = new SfHelper();
            var xmlHelper = new XMLHelper();

            //start main logic
            return Promise.props({
                result: sfHelper.login(), //Login to Salesforce
                apexClassNames: xmlHelper.parsePackageXML(file.contents.toString('utf8')) //parse package.xml
            }).then(function (_ref) {
                var result = _ref.result;
                var apexClassNames = _ref.apexClassNames;

                //retrieve apex information from Salesforce
                return sfHelper.retrieveApexClasses(apexClassNames);
            }).then(function () {

                //submit test job including previous apex test-classes
                return sfHelper.submitTestJob();
            }).then(function (testRunId) {

                //wait until all test job is finished
                return sfHelper.checkTestStatus(testRunId);
            }).then(function () {

                //retrieve and summarize the test coverages.
                return sfHelper.summarizeCoverages();
            }).then(function (allCoverages) {

                //filter result data.
                var result = _.map(allCoverages, function (e) {
                    return { className: e.className, coveredRate: e.coveredRate };
                });
                //convert as csv-format
                var csvResult = _.formatAsCsv(result);

                //output to gulp.dest
                var output = new gutil.File({
                    cwd: file.cwd,
                    base: file.base,
                    path: file.base + 'result-' + new Date().toFormat('YYYYMMDDHH24MISS') + '.csv'
                });
                output.contents = new Buffer(csvResult);

                self.push(output);
                callback();
            })['catch'](function (err) {
                console.log('Error!!');
                console.log(err);
            });
        }
    });
};