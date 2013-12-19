ar
==

A Node library for reading [Unix archive files](http://en.wikipedia.org/wiki/Ar_\(Unix\)).

Usage
=====
```javascript
var ar = require('ar'),
    fs = require('fs'),
    path = require('path');


// Extracts all of the files in "some_archive.a" to the folder "./output".
var outputDir = "./output";
if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);

var archive = new ar.Archive(fs.readFileSync('some_archive.a'));
var files = archive.getFiles();
for (var i = 0; i < files.length; i++) {
  var file = files[i];
  fs.writeFileSync(path.resolve(outputDir, file.name()), file.fileData());
}
```

Status
======

* Supports the BSD variant of the common archive format, which is used by BSD
  `ar` and Debian packages.
  * For some reason, GNU `ar` from GNU binutils (at least from Mac Homebrew)
    also uses the BSD format.
* Does not support AIX (big), AIX (small), GNU `ar`, and other archive variants.
  If you want support for alternative formats, please make your case in a GitHub
  issue, or implement it yourself in a PR!
