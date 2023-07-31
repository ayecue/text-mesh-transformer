import { Tag } from './types';

export type TagCallback = (type: TagRecord) => string;

export interface TagRecordOptions {
  type: Tag;
  start: number;
  end: number;
  attributes?: Record<string, string>;
}

export class TagRecord {
  readonly type: Tag;
  readonly start: number;
  readonly end: number;

  constructor(options: TagRecordOptions) {
    this.type = options.type;
    this.start = options.start;
    this.end = options.end;
  }
}

export interface TagRecordOpenOptions extends TagRecordOptions {
  attributes?: Record<string, string>;
  next?: TagRecordClose;
}

export class TagRecordOpen extends TagRecord {
  readonly attributes: Record<string, string>;
  next: TagRecordClose | null;

  constructor(options: TagRecordOpenOptions) {
    super(options);
    this.attributes = options.attributes ?? {};
    this.next = options.next ?? null;
  }
}

export interface TagRecordCloseOptions extends TagRecordOptions {
  previous: TagRecordOpen;
}

export class TagRecordClose extends TagRecord {
  previous: TagRecordOpen;

  constructor(options: TagRecordCloseOptions) {
    super(options);
    this.previous = options.previous;
  }
}
