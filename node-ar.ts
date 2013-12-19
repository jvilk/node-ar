/// <reference path="bower_components/DefinitelyTyped/node/node.d.ts" />
import fs = require('fs');
import path = require('path');

/**
 * Contains information from a file's header.
 */
export interface ARFile {
  name(): string;
  date(): Date;
  uid(): number;
  gid(): number;
  mode(): number;
  fileSize(): number;
  headerSize(): number;
  totalSize(): number;
  fileData(): NodeBuffer;
}

export class Archive {
  private files: ARFile[] = [];
  constructor(private data: NodeBuffer) {
    // Verify that it begins with "!<arch>\n".
    if (data.toString('utf8', 0, 8) !== "!<arch>\n") {
      throw new Error("Invalid archive file: Missing magic header '!<arch>\\n'");
    }
    this.createFiles();
  }
  /**
   * Detects the header type of each file, and creates an ARFile representing
   * each.
   * Currently only supports BSD-style headers.
   */
  private createFiles() {
    // Should only be called once.
    if (this.files.length > 0) return;

    var offset = 8, file: ARFile;
    while (offset < this.data.length) {
      file = new BSDARFile(this.data.slice(offset));
      this.files.push(file);
      offset += file.totalSize();
    }
  }

  /**
   * Get an array of the files in the archive.
   */
  public getFiles(): ARFile[] { return this.files; }
  /**
   * Extracts all of the files in the archive to the given path.
   */
  public extractAllTo(dirPath: string): void {
    var i, file;
    if (!fs.existsSync(dirPath)) {
      throw new Error("Extraction path must exist.");
    }
    for (i = 0; i < this.files.length; i++) {
      file = this.files[i];
      fs.writeFileSync(path.resolve(dirPath, file.name()), file.data());
    }
  }
}

/**
 * Given something of size *size* bytes that needs to be aligned by *alignment*
 * bytes, returns the total number of padding bytes that need to be appended to
 * the end of the data.
 */
function getPaddingBytes(size: number, alignment: number): number {
  return (alignment - (size % alignment)) % alignment;
}

/**
 * Trims trailing whitespace from the given string (both ends, although we
 * only really need the RHS).
 */
function trimWhitespace(str: string): string {
  return String.prototype.trim ? str.trim() : str.replace(/^\s+|\s+$/gm, '');
}

/**
 * Trims trailing NULL characters.
 */
function trimNulls(str: string): string {
  return str.replace(/\0/g, '');
}

/**
 * All archive variants share this header before files, but the variants differ
 * in how they handle odd cases (e.g. files with spaces, long filenames, etc).
 *
 * char    ar_name[16]; File name
 * char    ar_date[12]; file member date
 * char    ar_uid[6]    file member user identification
 * char    ar_gid[6]    file member group identification
 * char    ar_mode[8]   file member mode (octal)
 * char    ar_size[10]; file member size
 * char    ar_fmag[2];  header trailer string
 */
export class ARCommonFile implements ARFile {
  constructor(public data: NodeBuffer) {
    if (this.fmag() !== "`\n") {
      throw new Error("Record is missing header trailer string; instead, it has: " + this.fmag());
    }
  }
  public name(): string {
    // The name field is padded by whitespace, so trim any lingering whitespace.
    return trimWhitespace(this.data.toString('utf8', 0, 16));
  }
  public date(): Date { return new Date(parseInt(this.data.toString('ascii', 16, 28), 10)); }
  public uid(): number { return parseInt(this.data.toString('ascii', 28, 34), 10); }
  public gid(): number { return parseInt(this.data.toString('ascii', 34, 40), 10); }
  public mode(): number { return parseInt(this.data.toString('ascii', 40, 48), 8); }
  /**
   * Total size of the file. Does not include padding bytes.
   */
  public fileSize(): number { return parseInt(this.data.toString('ascii', 48, 58), 10); }
  private fmag(): string { return this.data.toString('ascii', 58, 60); }
  /**
   * Total size of the header, including padding bytes.
   */
  public headerSize(): number {
    // The common header is already two-byte aligned.
    return 60;
  }
  /**
   * Total size of this file record (header + header padding + file data +
   * padding before next archive member).
   */
  public totalSize(): number {
    var headerSize = this.headerSize(), fileSize = this.fileSize();
    // All archive members are 2-byte aligned, so there's padding bytes after
    // the data section.
    return headerSize + fileSize + getPaddingBytes(fileSize, 2);
  }
  /**
   * Returns a *slice* of the backing buffer that has all of the file's data.
   */
  public fileData(): NodeBuffer {
    var headerSize = this.headerSize();
    return this.data.slice(headerSize, headerSize + this.fileSize());
  }
}

/**
 * BSD variant of the file header.
 */
export class BSDARFile extends ARCommonFile implements ARFile {
  private appendedFileName: boolean;
  constructor(data: NodeBuffer) {
    super(data);
    // Check if the filename is appended to the header or not.
    this.appendedFileName = super.name().substr(0, 3) === "#1/";
  }
  /**
   * Returns the number of bytes that the appended name takes up in the content
   * section.
   */
  private appendedNameSize(): number {
    if (this.appendedFileName) {
      return parseInt(super.name().substr(3), 10);
    }
    return 0;
  }
  /**
   * BSD ar stores extended filenames by placing the string "#1/" followed by
   * the file name length in the file name field.
   *
   * Note that this is unambiguous, as '/' is not a valid filename character.
   */
  public name(): string {
    var length, name = super.name(), headerSize;
    if (this.appendedFileName) {
      length = this.appendedNameSize();
      // The filename is stored right after the header.
      headerSize = super.headerSize();
      // Unfortunately, even though they give us the *explicit length*, they add
      // NULL bytes and include that in the length, so we must strip them out.
      name = trimNulls(this.data.toString('utf8', headerSize, headerSize + length));
    }
    return name;
  }
  /**
   * Returns a *slice* of the backing buffer that has all of the file's data.
   * For BSD archives, we need to add in the size of the file name, which,
   * unfortunately, is included in the fileSize number.
   */
  public fileData(): NodeBuffer {
    var headerSize = this.headerSize(),
        appendedNameSize = this.appendedNameSize();
    return this.data.slice(headerSize + appendedNameSize,
                           headerSize + this.fileSize() - appendedNameSize);
  }
}

