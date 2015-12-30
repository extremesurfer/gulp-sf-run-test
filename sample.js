var ShHelper = require('./build/lib/SfHelper');

var helper = new ShHelper();
helper.login()
.then(function(res){
    return helper.retrieveApexClasses();
}).then(function(res){
    return helper.submitTestJob();
}).then(function(testRunId){
    return helper.checkTestStatus(testRunId);
}).then(function(){
    return helper.summarizeCoverages();
}).then(function(allCoverages){
    console.log('Success!!');
    console.log(allCoverages);
}).catch(function(err){
    console.log('Error!!');
    console.log(err);
});