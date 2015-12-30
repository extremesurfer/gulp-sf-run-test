/**
 * * XMLHelper
 * * @author Satoshi Haga
 * * @date 2015/12/30
 **/
var Promise = require('bluebird');
var xml2js = require('xml2js');
var parseString = Promise.promisify(xml2js.parseString);
var _ = require('underscore');

class XMLHelper{

    /**
     * * parsePackageXML
     * * parse package.xml
     * * @param {Stream} fileStream Read Stream for package.xml
     * * @return {Promise} promise instance including array of apex classes
     **/
    parsePackageXML(fileStream){
        return new Promise((resolve,reject)=>{
            let str = '';
            fileStream.on('data', (chunk)=>{str += chunk;});
            fileStream.on('end', ()=>{
                resolve(str);
            });
            fileStream.on('error', (err)=>{
                reject(err);
            });
        }).then((str)=>{
            return parseString(str);
        }).then((xmlObj)=>{
            var apexTypes = _.find(xmlObj.Package.types, (type)=>{return (type.name[0] === 'ApexClass')});
            return apexTypes.members;
        });
    }
}

module.exports = XMLHelper;
