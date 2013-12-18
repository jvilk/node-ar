/**
 * Contains information from a file's header.
 */
interface ARFile {
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
