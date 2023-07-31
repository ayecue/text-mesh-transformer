import { Tag } from './types';

export type TagContext = Record<string, any>;
export type TagCallback = (type: TagRecord, context: TagContext) => string;

export interface TagRecordOptions {
  raw: string;
  type: Tag;
  start: number;
  end: number;
  attributes?: Record<string, string>;
}

export class TagRecord {
  readonly raw: string;
  readonly type: Tag;
  readonly start: number;
  readonly end: number;
  out: string;

  constructor(options: TagRecordOptions) {
    this.raw = options.raw;
    this.type = options.type;
    this.start = options.start;
    this.end = options.end;
    this.out = '';
  }

  transform(context: TagContext, callback: TagCallback) {
    this.out = callback(this, context);
    return this;
  }
}

export interface TagRecordOpenOptions extends TagRecordOptions {
  attributes?: Record<string, string>;
}

export class TagRecordOpen extends TagRecord {
  readonly attributes: Record<string, string>;

  constructor(options: TagRecordOpenOptions) {
    super(options);
    this.attributes = options.attributes ?? {};
  }
}

export interface TagRecordCloseOptions extends TagRecordOptions {
  previous: TagRecordOpen;
}

export class TagRecordClose extends TagRecord {
  readonly previous: TagRecordOpen;

  constructor(options: TagRecordCloseOptions) {
    super(options);
    this.previous = options.previous;
  }
}
