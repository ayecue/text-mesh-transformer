import { Tag } from './types';

export type TagCallback = (type: TagRecord, content: string) => string;

export interface TagRecordOptions {
  tag: Tag;
  start: number;
  closureStart: number;
  attributes?: Record<string, string>;
}

export class TagRecord {
  tag: Tag;
  attributes: Record<string, string>;
  start: number;
  closureStart: number;
  end?: number;
  closureEnd?: number;
  children: TagRecord[];

  constructor(options: TagRecordOptions) {
    this.tag = options.tag;
    this.attributes = options.attributes ?? {};
    this.start = options.start;
    this.closureStart = options.closureStart;
    this.children = [];
  }

  render(content: string, callback: TagCallback) {
    for (const child of this.children) {
      const startIndex = child.start - this.start;
      const endIndex = child.end
        ? Math.min(child.end - this.start, content.length)
        : content.length;
      const startClosureIndex = child.closureStart - this.start;
      const endClosureIndex = child.closureEnd
        ? Math.min(child.closureEnd - this.start, content.length)
        : content.length;
      const childContent = content.substring(startIndex, endIndex);
      const left = content.substring(0, startClosureIndex);
      const right = content.substring(endClosureIndex, content.length);

      content = left + child.render(childContent, callback) + right;
    }

    return callback(this, content);
  }
}
