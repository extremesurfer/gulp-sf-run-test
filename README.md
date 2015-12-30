# gulp-sf-run-test
gulp task for running apex-tests

## Usage


First install `gulp-sf-run-test` as a development dependency:

```shell
npm install gulp-sf-run-test --save-dev
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

Example of package.xml. Please make sure that both of production and test classes are needed.  

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
