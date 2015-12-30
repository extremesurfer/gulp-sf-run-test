var fs = require('fs-extra');
var XMLHelper = require('./build/lib/XMLHelper');
var _ = require('underscore');

var xmlHelper = new XMLHelper();

var readStream = fs.createReadStream('./package.xml');
xmlHelper.parsePackageXML(readStream)
.then(function(apexMembers){
    console.log(apexMembers);
});



