/**
 * * SfHelper
 * * @author Satoshi Haga
 * * @date 2015/12/30
 **/

'use strict';

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var Promise = require('bluebird');
var jsforce = require('jsforce');
var _ = require('underscore');
require('dotenv').load();
var sleep = require('sleep');

var SfHelper = (function () {
    function SfHelper() {
        _classCallCheck(this, SfHelper);
    }

    _createClass(SfHelper, [{
        key: 'login',

        /**
         * * login
         * * login to Salesforce
         * * @return {Promise}
         **/
        value: function login() {
            var _this = this;

            this.count = 0;
            this.connection = new jsforce.Connection({ loginUrl: process.env.SFDC_HOST });

            return Promise.resolve().then(function () {
                return _this.connection.login(process.env.SFDC_USERNAME, process.env.SFDC_PASSWORD + process.env.SFDC_TOKEN);
            });
        }

        /**
         * * retrieveApexClasses
         * * retrieve apex-class information
         * * @return {Promise}
         **/
    }, {
        key: 'retrieveApexClasses',
        value: function retrieveApexClasses(apexClassNames) {
            var _this2 = this;

            var productionClasses = [];
            var testClasses = [];
            return this.connection.tooling.sobject('ApexClass').find({
                Name: apexClassNames
            }).execute().then(function (apexClasses) {
                _.each(apexClasses, function (apexClass) {
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
                _this2.productionClasses = productionClasses;
                _this2.testClasses = testClasses;
            });
        }

        /**
         * * submitTestJob
         * * submit test job request
         * * @return {Promise}
         **/
    }, {
        key: 'submitTestJob',
        value: function submitTestJob() {
            var testIds = _.map(this.testClasses, function (e) {
                return e.Id;
            });
            return this.connection.tooling.runTestsAsynchronous(testIds);
        }

        /**
         * * checkTestStatus
         * * @return {Promise}
         * * @private
         **/
    }, {
        key: 'checkTestStatus',
        value: function checkTestStatus(testRunId, _resolve, _reject) {
            var _this3 = this;

            console.log('Waiting until all test is finished ' + this.count++ + 's.....');

            return new Promise(function (resolve, reject) {
                if (_resolve && _reject) {
                    resolve = _resolve;
                    reject = _reject;
                }
                sleep.sleep(1);
                return _this3.connection.query('select Id, Status, ApexClassId from ApexTestQueueItem where ParentJobId = \'' + testRunId + '\'').then(function (data) {
                    var isComplete = true;
                    _.each(data.records, function (testJob) {
                        if (testJob.Status === 'Queued' || testJob.Status === 'Processing') {
                            isComplete = false;
                        }
                    });

                    if (isComplete) {
                        console.log('All test is finished.');
                        resolve();
                    } else {
                        return _this3.checkTestStatus(testRunId, resolve, reject);
                    }
                }).fail(function (err) {
                    reject(err);
                });
            });
        }

        /**
         * * summarizeCoverages
         * * @return {Array}
         **/
    }, {
        key: 'summarizeCoverages',
        value: function summarizeCoverages() {
            var _this4 = this;

            return this.connection.tooling.sobject('ApexCodeCoverage').find({}).then(function (coverages) {
                var targetClasses = _.map(_this4.productionClasses, function (apex) {
                    return {
                        Id: apex.Id,
                        className: apex.fullName,
                        uncoveredLineCount: 0,
                        coveredLineCount: 0,
                        sourceLines: {}
                    };
                });

                _.each(coverages, function (coverage) {
                    var targetClass = _.find(targetClasses, function (apex) {
                        return apex.Id === coverage.ApexClassOrTriggerId;
                    });
                    if (!targetClass) return;

                    _.each(coverage.Coverage.uncoveredLines, function (uncoveredLineNumber) {
                        if (targetClass.sourceLines[uncoveredLineNumber] !== 'covered') {
                            targetClass.sourceLines[uncoveredLineNumber] = 'uncovered';
                        }
                    });
                    _.each(coverage.Coverage.coveredLines, function (coveredLineNumber) {
                        targetClass.sourceLines[coveredLineNumber] = 'covered';
                    });
                });

                _.each(targetClasses, function (targetClass) {
                    var classCoverageCountBy = _.countBy(targetClass.sourceLines, function (value) {
                        return value;
                    });

                    targetClass.uncoveredLineCount = classCoverageCountBy['uncovered'] ? classCoverageCountBy['uncovered'] : 0;
                    targetClass.coveredLineCount = classCoverageCountBy['covered'] ? classCoverageCountBy['covered'] : 0;
                    targetClass.allLineCount = targetClass.uncoveredLineCount + targetClass.coveredLineCount;
                    targetClass.coveredRate = targetClass.allLineCount === 0 ? 0 : Math.floor(targetClass.coveredLineCount / targetClass.allLineCount * 100);
                });

                return targetClasses;
            });
        }
    }]);

    return SfHelper;
})();

module.exports = SfHelper;