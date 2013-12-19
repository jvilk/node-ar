var fs = require('fs'),
    path = require('path');

// Removes a directory if it exists.
// Throws an exception if deletion fails.
function removeDir(dir) {
  if (fs.existsSync(dir) && fs.statSync(dir).isDirectory()) {
    // Delete its contents, since you can't delete non-empty folders.
    // :(
    var files = fs.readdirSync(dir);
    for (var i = 0; i < files.length; i++) {
      var fname = dir + path.sep + files[i];
      if (fs.statSync(fname).isDirectory()) {
        removeDir(fname);
      } else {
        removeFile(fname);
      }
    }
    fs.rmdirSync(dir);
  }
}

// Removes a file if it exists.
// Throws an exception if deletion fails.
function removeFile(file) {
  if (fs.existsSync(file) && fs.statSync(file).isFile()) {
    fs.unlinkSync(file);
  }
}

module.exports = function(grunt) {
  grunt.initConfig({
    // Metadata.
    pkg: grunt.file.readJSON('package.json'),
    ts: {
      options: {
        sourcemap: true,
        module: 'commonjs',
        comments: true
      },
      release: {
        src: ["node-ar.ts"],
        outDir: 'lib',
        options: {
          declaration: true
        }
      },
      test: {
        // In-place compilation
        src: ["tests/runner.ts"],
      }
    },
    shell: {
      test: {
        options: {
          stdout: true
        },
        command: 'node tests/runner.js'
      }
    }
  });

  grunt.loadNpmTasks('grunt-ts');
  grunt.loadNpmTasks('grunt-shell');

  grunt.registerTask('clean', 'Removes all built files.', function() {
    removeDir('./lib');
    removeFile('./tests/runner.js');
  });

  // release build (default)
  grunt.registerTask('default', ['ts:release']);
  // test
  grunt.registerTask('test', ['ts:test', 'shell:test']);
};