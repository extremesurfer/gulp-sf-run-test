/**
 * * SfHelper
 * * @author Satoshi Haga
 * * @date 2015/12/30
 **/

var Promise = require('bluebird');
var jsforce = require('jsforce');
var _ = require('underscore');
require('dotenv').load();
var sleep = require('sleep');


class SfHelper{

    /**
     * * login
     * * login to Salesforce
     * * @return {Promise}
     **/
    login(){
        this.count = 0;
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
            Name: apexClassNames
        }).execute()
        .then((apexClasses)=>{
            _.each(apexClasses, (apexClass)=>{
                if (apexClass.Body.indexOf('@isTest') === -1) {
                    productionClasses.push({
                        Id: apexClass.Id,
                        fullName: apexClass.FullName,
                        coverage: []
                    });
                } else {
                    testClasses.push({
                        Id: apexClass.Id,
                        fullName: apexClass.FullName
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
    checkTestStatus(testRunId, _resolve, _reject){
        console.log(`Waiting until all test is finished ${this.count++}s.....`);

        return new Promise((resolve,reject)=>{
            if(_resolve && _reject){
                resolve = _resolve;
                reject = _reject;
            }
            sleep.sleep(1);
            return this.connection.query(`select Id, Status, ApexClassId from ApexTestQueueItem where ParentJobId = '${testRunId}'`)
            .then((data)=>{
                let isComplete = true;
                _.each(data.records, (testJob)=>{
                    if (testJob.Status === 'Queued' || testJob.Status === 'Processing') {
                        isComplete = false;
                    }
                });

                if (isComplete) {
                    console.log('All test is finished.');
                    resolve();
                } else {
                    return this.checkTestStatus(testRunId,resolve,reject);
                }
            }).fail((err)=>{
                reject(err);
            });
        });
    }

    /**
     * * summarizeCoverages
     * * @return {Array}
     **/
    summarizeCoverages(){
        return this.connection.tooling.sobject('ApexCodeCoverage').find({})
        .then((coverages)=>{
            let targetClasses = _.map(this.productionClasses, (apex)=>{
                return {
                    Id: apex.Id,
                    className: apex.fullName,
                    uncoveredLineCount:0,
                    coveredLineCount:0,
                    sourceLines:{}
                }
            });

            _.each(coverages, (coverage)=>{
                let targetClass = _.find(targetClasses, (apex)=>{ return (apex.Id === coverage.ApexClassOrTriggerId);});
                if(!targetClass) return;

                _.each(coverage.Coverage.uncoveredLines, (uncoveredLineNumber)=>{
                    if(targetClass.sourceLines[uncoveredLineNumber] !== 'covered'){
                        targetClass.sourceLines[uncoveredLineNumber] = 'uncovered';
                    }
                });
                _.each(coverage.Coverage.coveredLines, (coveredLineNumber)=>{
                    targetClass.sourceLines[coveredLineNumber] = 'covered';
                });
            });

            _.each(targetClasses, (targetClass)=>{
                let classCoverageCountBy = _.countBy(targetClass.sourceLines, (value)=>{return value;});

                targetClass.uncoveredLineCount = classCoverageCountBy['uncovered'] ? classCoverageCountBy['uncovered'] : 0 ;
                targetClass.coveredLineCount = classCoverageCountBy['covered'] ? classCoverageCountBy['covered'] : 0 ;
                targetClass.allLineCount = targetClass.uncoveredLineCount + targetClass.coveredLineCount;
                targetClass.coveredRate = targetClass.allLineCount === 0 ? 0 : Math.floor((targetClass.coveredLineCount / targetClass.allLineCount) * 100);
            });

            return targetClasses;
        });
    }
}

module.exports = SfHelper;