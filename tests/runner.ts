/// <reference path="../bower_components/DefinitelyTyped/node/node.d.ts" />
/**
 * node-ar test runner command line utility
 *
 * Run with no arguments to run all of the tests.
 * Run with one or more archive file names to run particular tests.
 */
import ar = require('../node-ar');
import fs = require('fs');
import path = require('path');
import util = require('util');
var glob = require('glob'),
    cwd = process.cwd();

// Change to the test runner directory.
process.chdir(__dirname);

/**
 * Pads the number with zeroes so it is length long as a string.
 */
function padNumber(num: number, length: number): string {
  var numStr = "" + num;
  while (numStr.length < length) {
    numStr = "0" + numStr;
  }
  return numStr;
}

/**
 * Appends dots to the string until it is length long.
 */
function appendDots(str: string, length: number): string {
  while (str.length < length) {
    str = str + ".";
  }
  return str;
}

class Test {
  private archive: ar.Archive;
  private dirPath: string;
  /**
   * Constructs a new unit test.
   * Filename is the name of an archive file.
   */
  constructor(private filename: string) {}

  /**
   * Compares the ar file against the real file on the hard drive.
   */
  private testFile(arFile: ar.ARFile, filePath: string) {
    var realFileContents: NodeBuffer = fs.readFileSync(filePath),
        arFileContents: NodeBuffer = arFile.fileData(), i: number;
    if (realFileContents.length !== arFileContents.length) {
      throw new Error("Archive file's length does not match file: " +
        arFileContents.length + " bytes vs " + realFileContents.length +
        " bytes.");
    }
    // Compare contents, byte-by-byte. Yeah, this isn't efficient, but our tests
    // are small.
    for (i = 0; i < arFileContents.length; i++) {
      if (arFileContents.readUInt8(i) !== realFileContents.readUInt8(i)) {
        throw new Error("Archive file and file differ at byte " + i + ".");
      }
    }
    // All good!
  }

  /**
   * Run after archive initialization. Iterates over all of the files in the
   * archive, tests each against the folder's files, and ensures that no files
   * are missing.
   */
  private testFiles() {
    var files: string[] = fs.readdirSync(this.dirPath),
        arFiles: ar.ARFile[] = this.archive.getFiles(),
        i: number, file: ar.ARFile, name: string, nameIdx: number;
    for (i = 0; i < arFiles.length; i++) {
      file = arFiles[i];
      name = file.name();
      nameIdx = files.indexOf(name);
      if (nameIdx === -1) {
        throw new Error("Archive file contains extraneous file \"" + name + "\".");
      }
      this.testFile(file, path.resolve(this.dirPath, name));
      // Remove this file, since we've tested it.
      files.splice(nameIdx, 1);
    }
    if (files.length > 0) {
      throw new Error("Archive file is missing the following files: " + files.toString());
    }
  }

  /**
   * Runs the test, prints out status, and returns true if it passed.
   */
  public run(testNumber: number, totalTests: number): boolean {
    var dirName: string;
    // Outputs a 76 character-wide line, without a newline. Leaves 4 characters
    // for test status.
    util.print(appendDots(["[", padNumber(testNumber, 2), "/",
                          padNumber(totalTests, 2), "] ",
                          this.filename, " "].join(''), 76));
    try {
      this.archive = new ar.Archive(fs.readFileSync(this.filename));
      dirName = path.basename(this.filename);
      // Strip extension.
      dirName = dirName.substr(0, dirName.length - 2);
      // Strip characters after first -.
      if (dirName.indexOf('-') !== -1) {
        dirName = dirName.substr(0, dirName.indexOf('-'));
      }
      this.dirPath = path.resolve(path.dirname(this.filename), dirName);
      if (!fs.existsSync(this.dirPath)) {
        throw new Error("Cannot find test data in folder \"" + this.dirPath + "\"");
      }
      this.testFiles();
      util.print("..OK\n");
      return true;
    } catch (e) {
      util.print("FAIL\n");
      console.log("\t" + e);
      return false;
    }
  }
}

class TestSuite {
  private tests: Test[] = [];
  /**
   * Creates a test suite for the given set of files.
   */
  constructor(filenames: string[]) {
    var i;
    for (i = 0; i < filenames.length; i++) {
      this.tests.push(new Test(filenames[i]));
    }
  }

  /**
   * Run all of the tests in the suite.
   */
  public run(): void {
    var i, length = this.tests.length, passed = 0;
    console.log("Running " + length + " tests...");
    for (i = 0; i < length; i++) {
      if (this.tests[i].run(i+1, length)) passed++;
    }
    console.log("Tests complete! " + passed + "/" + this.tests.length + " (" + ((passed / this.tests.length)*100) + "%) passed.");
  }
}

// Locate all of the archive files.
glob("*.a", function (er, files: string[]) {
  if (er != null) throw er;
  (new TestSuite(files)).run();
  // Change back to the directory the user ran the script from.
  process.chdir(cwd);
});
