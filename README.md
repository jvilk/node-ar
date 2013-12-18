node-ar
=======

A Node library for reading [Unix archive files](http://en.wikipedia.org/wiki/Ar_\(Unix\)).

Status
======

* Supports the BSD variant of the common archive format, which is used by BSD ar
  and Debian packages.
  * I initially wanted to support GNU AR, but I found out that the GNU AR that
    I installed from GNU binutils through Mac Homebrew does not create GNU AR
    archives.
* Does not support AIX (big), AIX (small), GNU AR, and other archive variants.
  If you want support for alternative formats, please make your case in a GitHub
  issue, or implement it yourself in a PR!
