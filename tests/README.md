node-ar Unit Tests
==================
The format of these tests are fairly simple:

* Each test is a single archive file, ending in *.a.
* The contents of the file archive are in the folder with the same name as the archive.
* Content after a '-' in the filename of the archive file is ignored when matching the directory, allowing us to have multiple variants of the same files.

Examples:

<table>
  <tr>
    <th>Archive File</th>
    <th>Folder</th>
  </tr>
  <tr>
    <td>foo_bar.a</td>
    <td>foo_bar</td>
  </tr>
  <tr>
    <td>foo_bar-gnu.a</td>
    <td>foo_bar</td>
  </tr>
</table>

