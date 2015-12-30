var ShHelper = require('./build/lib/SfHelper');

var helper = new ShHelper();
helper.login()
.then(function(res){
    return helper.retrieveApexClasses();
}).then(function(res){
    return helper.submitTestJob();
}).then(function(testRunId){
    return helper._checkTestStatus(testRunId);
}).then(function(){
    console.log('Success!!');

}).catch(function(err){
    console.log('Error!!');
    console.log(err);
});