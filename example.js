var Q = require('q');
var fs = require('fs');
var lo = require('lodash');
var jsforce = require('jsforce');
var restler = require('restler');
var _ = require('underscore');

require('dotenv').load();

/** The salesforce client */
var sfdc_client = new jsforce.Connection({loginUrl : process.env.SFDC_HOST});

/** A map of class Ids to class information */
var id_to_class_map = {};

var summaryCoverage = {};

/** A map of test class Ids to class information */
var test_class_map = {};

/**
 * Log into the salsforce instance
 */
var sfdcLogin = function () {
    'use strict';

    var deferred = Q.defer();

    console.log('Logging in as ' + process.env.SFDC_USERNAME);

    sfdc_client.login(process.env.SFDC_USERNAME, process.env.SFDC_PASSWORD + process.env.SFDC_TOKEN, function (error, res) {
        if (error) {
            deferred.reject(new Error(error));
        } else {
            console.log('Logged in');
            deferred.resolve();
        }
    });

    return deferred.promise;
};

/**
 * Builds a map of class id to class data
 */
var buildClassIdToClassDataMap = function () {
    'use strict';

    var class_data = {},
        deferred = Q.defer(),
        path_template = lo.template('src/classes/<%= FullName %>.cls');

    console.log('Fetching class information');

    sfdc_client.tooling.sobject('ApexClass').find({Name:['JobMasterDao','JobMasterDaoTest']}).execute(function (error, data) {
        if (error) {
            deferred.reject(new Error(error));
        } else {
            console.log('Got information about ' + lo.size(data) + ' classes');

            lo.forEach(data, function (row) {
                if (row.Body.indexOf('@isTest') === -1) {
                    id_to_class_map[row.Id] = {
                        name: path_template(row),
                        source: row.Body,
                        coverage: []
                    };
                } else {
                    test_class_map[row.Id] = {
                        name: path_template(row),
                        source: row.Body
                    };
                }
            });
            console.log('------------------------------------------------------');
            console.log('------------------------------------------------------');
            console.log(test_class_map);
            deferred.resolve();
        }
    });

    return deferred.promise;
};

/**
 * Runs all tests with the tooling api
 */
var runAllTests = function () {
    'use strict';

    var class_ids = lo.keys(test_class_map),
        deferred = Q.defer();

    //debug start
    //class_ids = ['01p28000004OK7UAAW', '01p28000004OK9NAAW', '01p28000004OK9VAAW'];
    //debug end

    sfdc_client.tooling.runTestsAsynchronous(class_ids, function (error, data) {
        if (error) {
            deferred.reject(new Error(error));
        } else {
            console.log('++++++++++++++++++');
            console.log(test_class_map);
            console.log(data);
            console.log('++++++++++++++++++');
            deferred.resolve(data);
        }
    });

    return deferred.promise;
};

/**
 * Query the test results
 *
 * @param testRunId The id of the test run
 * @param deferred The Q.defer instance
 */
var queryTestResults = function myself(testRunId, deferred) {
    'use strict';

    var isComplete = true;

    console.log('Waiting for tests');

    sfdc_client.query('select Id, Status, ApexClassId from ApexTestQueueItem where ParentJobId = \'' + testRunId + '\'', function (error, data) {
        if (error) {
            deferred.reject(new Error(error));
        } else {
            lo.each(data.records, function (row) {
                if (row.Status === 'Queued' || row.Status === 'Processing') {
                    isComplete = false;
                }
            });

            if (isComplete) {
                deferred.resolve();
            } else {
                myself(testRunId, deferred);
            }
        }
    });
};

/**
 * Waits until all tests are completed
 *
 * @param testRunId The id of the test run
 */
var waitUntilTestsComplete = function (testRunId) {
    'use strict';

    var deferred = Q.defer();

    queryTestResults(testRunId, deferred);

    return deferred.promise;
};

/**
 * Gets the test data and builds an array of the number of times the line was tested
 */
var buildCoverallsCoverage = function () {
    'use strict';

    var max_line, coverage_size, class_id, i,
        deferred = Q.defer();

    console.log('Fetching code coverage information');

    sfdc_client.tooling.sobject('ApexCodeCoverage').find({}).execute(function (error, data) {
        if (error) {
            deferred.reject(new Error(error));
        } else {
            console.log('Got information about ' + lo.size(data) + ' tests');

            lo.forEach(data, function (row) {
                class_id = row.ApexClassOrTriggerId;

                if (lo.has(id_to_class_map, class_id)) {
                    max_line = lo.max(lo.union(row.Coverage.coveredLines, row.Coverage.uncoveredLines));
                    coverage_size = lo.size(id_to_class_map[class_id].coverage);

                    if (max_line > coverage_size) {
                        for (i = coverage_size; i <= max_line; i += 1) {
                            id_to_class_map[class_id].coverage.push(null);
                        }
                    }

                    lo.forEach(row.Coverage.coveredLines, function (line_number) {
                        if (id_to_class_map[class_id].coverage[line_number - 1] === null) {
                            id_to_class_map[class_id].coverage[line_number - 1] = 1;
                        } else {
                            id_to_class_map[class_id].coverage[line_number - 1] += 1;
                        }
                    });

                    lo.forEach(row.Coverage.uncoveredLines, function (line_number) {
                        if (id_to_class_map[class_id].coverage[line_number - 1] === null) {
                            id_to_class_map[class_id].coverage[line_number - 1] = 0;
                        }
                    });
                }
            });

            deferred.resolve();
        }
    });

    return deferred.promise;
};

function summarizeCoverage(){
    //var summaryCoverage = {};
    _.each(id_to_class_map, function(value,key){
        var coveredLines = 0;
        var unCoveredLines = 0;
        _.each(value.coverage, function(e){
            if(e === null){
                return;
            }
            if(e > 0){
                coveredLines++;
            }else{
                unCoveredLines++;
            }
        });
        summaryCoverage[key] = {coveredLines:coveredLines, unCoveredLines:unCoveredLines}
    });
    console.log(summaryCoverage);
}

Q.fcall(sfdcLogin)
    .then(buildClassIdToClassDataMap)
    .then(runAllTests)
    .then(waitUntilTestsComplete)
    .then(buildCoverallsCoverage)
    .then(summarizeCoverage)
    .catch(function (error) {
        'use strict';
        console.log(error);
    })
    .done(function () {
        'use strict';
    });