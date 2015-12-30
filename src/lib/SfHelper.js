/**
 * * SfHelper
 * * @author Satoshi Haga
 * * @date 2015/12/30
 **/

var Promise = require('bluebird');
var jsforce = require('jsforce');
var restler = require('restler');
var _ = require('underscore');
require('dotenv').load();


class SfHelper{

    //jsforce.Connection
    //productionClasses
    //testClasses

    /**
     * * login
     * * login to Salesforce
     * * @return {Promise}
     **/
    login(){
        this.connection = new jsforce.Connection({loginUrl : process.env.SFDC_HOST});

        return Promise.resolve()
        .then(()=>{
            return this.connection.login(
                process.env.SFDC_USERNAME,
                process.env.SFDC_PASSWORD + process.env.SFDC_TOKEN
            );
        });
    }

    /**
     * * retrieveApexClasses
     * * retrieve apex-class information
     * * @return {Promise}
     **/
    retrieveApexClasses(apexClassNames){
        let productionClasses = [];
        let testClasses = [];
        return this.connection.tooling.sobject('ApexClass').find({
            Name:['	XXXXXX','XXXXXTest']
        }).execute()
        .then((apexClasses)=>{
            _.each(apexClasses, (apexClass)=>{
                if (apexClass.Body.indexOf('@isTest') === -1) {
                    productionClasses.push({
                        Id: apexClass.Id,
                        name: apexClass.FullName,
                        coverage: []
                    });
                } else {
                    testClasses.push({
                        Id: apexClass.Id,
                        name: apexClass.FullName
                    });
                }
            });
            this.productionClasses = productionClasses;
            this.testClasses = testClasses;
        });
    }

    /**
     * * submitTestJob
     * * submit test job request
     * * @return {Promise}
     **/
    submitTestJob(){
        let testIds = _.map(this.testClasses, (e)=>{return e.Id;});
        return this.connection.tooling.runTestsAsynchronous(testIds);
    }

    /**
     * * checkTestStatus
     * * @return {Promise}
     * * @private
     **/
    _checkTestStatus(testRunId,promiseResolve,promiseReject){
        console.log('Waiting.....');
        return new Promise((resolve,reject)=>{
            if(promiseResolve) resolve = promiseResolve;
            if(promiseReject) reject = promiseReject;

            return this.connection.query(`select Id, Status, ApexClassId from ApexTestQueueItem where ParentJobId = '${testRunId}'`)
            .then((data)=>{
                let isComplete = true;
                _.each(data.records, (testJob)=>{
                    if (testJob.Status === 'Queued' || testJob.Status === 'Processing') {
                        isComplete = false;
                    }
                });

                if (isComplete) {
                    console.log('isComplete');
                    resolve();
                } else {
                    return this._checkTestStatus(testRunId,resolve,reject);
                }

            });
        });
    }

    /**
     * * summarizeCoverages
     * * @return {Array}
     **/
    summarizeCoverages(){

    }
}

module.exports = SfHelper;