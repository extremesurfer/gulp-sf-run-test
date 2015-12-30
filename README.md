# gulp-sf-run-test
gulp task for running apex-tests

## Usage


First install `gulp-sf-run-test` as a development dependency:

```shell
npm install gulp-sf-run-test --save-dev
```

Create .env file that saves credential information of your Salesforce account:

```bash
SFDC_HOST=your Salesforce host. https://ap2.salesforce.com, for example.
SFDC_USERNAME=your Salesforce username. satoshi.haga.github@gmail.com, for example.
SFDC_PASSWORD=your Salesorce password.
SFDC_TOKEN=your Salesforce security token if required.

```

Then, add it to your gulpfile.js:

```javascript
var sfTest = require('gulp-sf-run-test');
```

Then create a task that uses it:
 - package.xml : Salesforce standard manifest file.

```javascript
gulp.task('sf-test', function(){
    return gulp.src('./src/package.xml')
        .pipe(sfTest())
        .pipe(gulp.dest('./result/'));
});
```

Example of package.xml. Please make sure that both of production and test classes are needed:

```xml

<?xml version="1.0" encoding="UTF-8"?>
<Package xmlns="http://soap.sforce.com/2006/04/metadata">
    <types>
        <members>XXXXXX</members>
        <members>XXXXXXTest</members>
        <members>YYYYYY</members>
        <members>YYYYYYTest</members>
        <name>ApexClass</name>
    </types>
    <version>34.0</version>
</Package>
```

Example of test result:

```csv
className,coveredRate,
XXXXXX,52,
YYYYYY,43,
```
