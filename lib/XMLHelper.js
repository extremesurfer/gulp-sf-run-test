/**
 * * XMLHelper
 * * @author Satoshi Haga
 * * @date 2015/12/30
 **/
'use strict';

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var Promise = require('bluebird');
var xml2js = require('xml2js');
var parseString = Promise.promisify(xml2js.parseString);
var _ = require('underscore');

var XMLHelper = (function () {
    function XMLHelper() {
        _classCallCheck(this, XMLHelper);
    }

    _createClass(XMLHelper, [{
        key: 'parsePackageXML',

        /**
         * * parsePackageXML
         * * parse package.xml
         * * @param {String} str contents of package.xml
         * * @return {Promise} promise instance including array of apex classes
         **/
        value: function parsePackageXML(str) {
            return parseString(str).then(function (xmlObj) {
                var apexTypes = _.find(xmlObj.Package.types, function (type) {
                    return type.name[0] === 'ApexClass';
                });
                return apexTypes.members;
            });
        }
    }]);

    return XMLHelper;
})();

module.exports = XMLHelper;