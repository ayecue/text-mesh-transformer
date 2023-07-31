import { Tag } from './types';

export type TagCallback = (tag: TagRecordOpen, content: string) => string;

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

  constructor(options: TagRecordOptions) {
    this.raw = options.raw;
    this.type = options.type;
    this.start = options.start;
    this.end = options.end;
  }
}

export interface TagRecordOpenOptions extends TagRecordOptions {
  attributes?: Record<string, string>;
}

export class TagRecordOpen extends TagRecord {
  readonly attributes: Record<string, string>;
  readonly children: TagRecordClose[];
  parent: TagRecordOpen | null;
  next: TagRecordClose | null;
  content: string;

  constructor(options: TagRecordOpenOptions) {
    super(options);
    this.attributes = options.attributes ?? {};
    this.children = [];
    this.parent = null;
    this.next = null;
    this.content = '';
  }

  isWrappedBy(type: Tag): boolean {
    let current: TagRecordOpen | null = this;

    while ((current = current.parent)) {
      if (current.type === type) return true;
    }

    return false;
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
