/**
 * * run-sf-test.js
 * * gulp task for running apex-tests
 * * @author Satoshi Haga
 * * @date 2015/12/30
 **/

var gutil = require('gulp-util');
var through = require('through2');
var _ = require('underscore');
require('./lib/underscore-mixin');

var SfHelper = require('./lib/SfHelper');
var XMLHelper = require('./lib/XMLHelper');

var plugin = function(outputFileName){

    var packageXml;

    /** implementation of 'transform' */
    function transform(file, encoding, callback) {

        //file is not specified.
        if(file.isNull()) {
            this.push(file);
            return callback();
        }

        //streaming in not supported.
        if(file.isStream()) {
            this.emit('error', new gutil.PluginError('gulp-run-sf-test', 'Streaming not supported'));
            return callback();
        }

        //file is saved.
        if(!packageXml){
            packageXml = file;
        }else{
            //only 1 file is supported.
            this.emit('error', new gutil.PluginError('gulp-run-sf-test', 'only 1 file is supported.'));
        }

        callback();
    }

    /** implementation of 'flush' */
    function flush(callback) {
        if(!packageXml){
            this.emit('error', new gutil.PluginError('gulp-run-sf-test', 'package.xml is not specified correctly.'));
        }

        var sfHelper = new ShHelper();
        var xmlHelper = new XMLHelper();

        //start main logic
        Promise.props({
            result: sfHelper.login(),   //Login to Salesforce
            apexClassNames: xmlHelper.parsePackageXML(packageXml.contents.toString('utf8')) //parse package.xml
        }).then(({result, apexClassNames})=>{

            //retrieve apex information from Salesforce
            return sfHelper.retrieveApexClasses(apexClassNames);

        }).then(()=>{

            //submit test job including previous apex test-classes
            return sfHelper.submitTestJob();

        }).then((testRunId)=>{

            //wait until all test job is finished
            return sfHelper.checkTestStatus(testRunId);

        }).then(()=>{

            //retrieve and summarize the test coverages.
            return sfHelper.summarizeCoverages();

        }).then((allCoverages)=>{

            //filter result data.
            let result = _.map(allCoverages, (e)=>{return {className:e.className, coveredRate: e.coveredRate}});
            //convert as csv-format
            let csvResult = _.formatAsCsv(result);

            //create output file information
            let output = new gutil.File({
                cwd: packageXml.cwd,
                base: packageXml.base,
                path: packageXml.base + outputFileName
            });
            output.contents = new Buffer(csvResult);

            this.push(output);
            callback();

        }).catch((err)=>{
            console.log('Error!!');
            console.log(err);
        });

    }

    return through.obj(transform, flush);
};

module.exports = plugin;