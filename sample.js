var fs = require('fs-extra');
var ShHelper = require('./build/lib/SfHelper');
var XMLHelper = require('./build/lib/XMLHelper');
var _ = require('underscore');

var helper = new ShHelper();
var xmlHelper = new XMLHelper();

helper.login()
.then(function(){
    var readStream = fs.createReadStream('./package.xml');
    return xmlHelper.parsePackageXML(readStream);
}).then(function(apexClassNames){
    return helper.retrieveApexClasses(apexClassNames);
}).then(function(){
    return helper.submitTestJob();
}).then(function(testRunId){
    return helper.checkTestStatus(testRunId);
}).then(function(){
    return helper.summarizeCoverages();
}).then(function(allCoverages){
    console.log('Success!!');
    var result = _.map(allCoverages, function(e){return {className:e.className, coveredRate: e.coveredRate}});
    console.log(result);
}).catch(function(err){
    console.log('Error!!');
    console.log(err);
});