export enum Tag {
  Align = 'align',
  Alpha = 'alpha',
  Color = 'color',
  Bold = 'b',
  Italic = 'i',
  CSpace = 'cspace',
  Font = 'font',
  Indent = 'indent',
  LineHeight = 'line-height',
  LineIndent = 'line-indent',
  Link = 'link',
  Lowercase = 'lowercase',
  Uppercase = 'uppercase',
  Smallcaps = 'smallcaps',
  Margin = 'margin',
  Mark = 'mark',
  MSpace = 'mspace',
  NoParse = 'noparse',
  NoBR = 'nobr',
  Page = 'page',
  Pos = 'pos',
  Size = 'size',
  Space = 'space',
  Sprite = 'sprite',
  Strikethrough = 's',
  Underline = 'u',
  Style = 'style',
  Sub = 'sub',
  Sup = 'sup',
  VOffset = 'voffset',
  Width = 'width'
}

export const allTags: string[] = [
  Tag.Align,
  Tag.Alpha,
  Tag.Color,
  Tag.Bold,
  Tag.Italic,
  Tag.CSpace,
  Tag.Font,
  Tag.Indent,
  Tag.LineHeight,
  Tag.LineIndent,
  Tag.Link,
  Tag.Lowercase,
  Tag.Uppercase,
  Tag.Smallcaps,
  Tag.Margin,
  Tag.Mark,
  Tag.MSpace,
  Tag.NoParse,
  Tag.NoBR,
  Tag.Page,
  Tag.Pos,
  Tag.Size,
  Tag.Space,
  Tag.Sprite,
  Tag.Strikethrough,
  Tag.Underline,
  Tag.Style,
  Tag.Sub,
  Tag.Sup,
  Tag.VOffset,
  Tag.Width
];

export const tagsWithValue: string[] = [
  Tag.Align,
  Tag.Alpha,
  Tag.Color,
  Tag.CSpace,
  Tag.Font,
  Tag.Indent,
  Tag.LineHeight,
  Tag.LineIndent,
  Tag.Link,
  Tag.Margin,
  Tag.Mark,
  Tag.MSpace,
  Tag.Pos,
  Tag.Size,
  Tag.Space,
  Tag.Sprite,
  Tag.Style,
  Tag.VOffset,
  Tag.Width
];

export type TagCallback = (type: TagRecord, content: string) => string;

export interface TagRecordOptions {
  tag: Tag;
  start: number;
  closureStart: number;
  value?: string;
}

export class TagRecord {
  tag: Tag;
  value?: string;
  start: number;
  closureStart: number;
  end?: number;
  closureEnd?: number;
  children: TagRecord[];

  constructor(options: TagRecordOptions) {
    this.tag = options.tag;
    this.value = options.value;
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

export enum TokenType {
  Open,
  Close
}

export interface TokenTagResult {
  tag: Tag;
  value?: string;
  type: TokenType;
}

export interface TokenResult extends TokenTagResult {
  start: number;
  end: number;
}

export class Tokenizer {
  private buffer: string;
  private index: number;

  constructor(buffer: string) {
    this.buffer = buffer;
    this.index = 0;
  }

  private skipWhitespace() {
    for (
      ;
      this.index < this.buffer.length && this.buffer[this.index] === ' ';
      this.index++
    );
  }

  private parseTag(): string {
    const startIndex = this.index;
    for (
      ;
      this.index < this.buffer.length && /[a-z-]/.test(this.buffer[this.index]);
      this.index++
    );
    return this.buffer.slice(startIndex, this.index);
  }

  private parseHexCode(): string {
    const startIndex = this.index;
    for (
      ;
      this.index < this.buffer.length &&
      /[0-9a-f]/.test(this.buffer[this.index]) &&
      this.index - startIndex < 6;
      this.index++
    );
    return this.buffer.slice(startIndex, this.index);
  }

  private parseValue(): string {
    let startIndex = this.index;

    if (this.buffer[this.index] === '"') {
      startIndex++;
      this.index++;
      for (
        ;
        this.index < this.buffer.length && this.buffer[this.index] !== '"';
        this.index++
      );
      this.index++;
      return this.buffer.slice(startIndex, this.index - 1);
    } else if (this.buffer[this.index] === '#') {
      this.index++;
      return '#' + this.parseHexCode();
    }

    for (
      ;
      this.index < this.buffer.length &&
      this.buffer[this.index] !== ' ' &&
      this.buffer[this.index] !== '>';
      this.index++
    );
    return this.buffer.slice(startIndex, this.index);
  }

  private parseOpeningTag(): TokenTagResult | null {
    this.skipWhitespace();

    let tag = null;
    let value;

    if (this.buffer[this.index] === '#') {
      this.index++;
      tag = Tag.Color;
      value = '#' + this.parseHexCode();
    } else {
      tag = this.parseTag();

      if (!allTags.includes(tag)) {
        return null;
      }

      if (tagsWithValue.includes(tag) && this.buffer[this.index] === '=') {
        this.index++;
        value = this.parseValue();
      }
    }

    return {
      tag: tag as Tag,
      value,
      type: TokenType.Open
    };
  }

  private parseClosingTag(): TokenTagResult | null {
    this.skipWhitespace();

    const tag = this.parseTag();

    if (!allTags.includes(tag)) {
      return null;
    }

    this.skipWhitespace();

    return {
      tag: tag as Tag,
      type: TokenType.Close
    };
  }

  next(): TokenResult | null {
    const startIndex = this.buffer.indexOf('<', this.index);

    if (startIndex === -1) {
      return null;
    }

    this.index = startIndex + 1;
    let result;

    if (this.buffer[this.index] === '/') {
      this.index++;
      result = this.parseClosingTag();
    } else {
      result = this.parseOpeningTag();
    }

    if (result === null) {
      return null;
    }

    if (this.buffer[this.index] !== '>') {
      return null;
    }

    this.index++;

    return {
      tag: result!.tag,
      value: result?.value,
      type: result!.type,
      start: startIndex,
      end: this.index
    };
  }
}

export function transform(str: string, callback: TagCallback): string {
  const tokenizer = new Tokenizer(str);
  const tags: TagRecord[] = [];
  const openTags: TagRecord[] = [];
  let match: TokenResult | null;

  while ((match = tokenizer.next())) {
    const { tag, value, type, start, end } = match;

    if (type === TokenType.Open) {
      if (!value) {
        const record = new TagRecord({
          tag,
          start: end,
          closureStart: start
        });

        openTags.push(record);
      } else if (value) {
        openTags.push(
          new TagRecord({
            tag,
            value,
            start: end,
            closureStart: start
          })
        );
      }
    } else if (type === TokenType.Close) {
      const lastTag = openTags[openTags.length - 1];

      if (tag === lastTag.tag) {
        openTags.pop();

        if (openTags.length > 0) {
          const before = openTags[openTags.length - 1];
          before.children.unshift(lastTag);
        } else {
          tags.push(lastTag);
        }

        lastTag.end = start;
        lastTag.closureEnd = end;
      }
    }
  }

  let remainingTag: TagRecord | undefined;

  while ((remainingTag = openTags.pop())) {
    if (openTags.length > 0) {
      const before = openTags[openTags.length - 1];
      before.children.unshift(remainingTag);
    } else {
      tags.push(remainingTag);
    }
  }

  let output = str;
  let currentTag: TagRecord | undefined;

  while ((currentTag = tags.pop())) {
    const startIndex = currentTag.start;
    const endIndex = currentTag.end
      ? Math.min(currentTag.end, output.length)
      : output.length;
    const startClosureIndex = currentTag.closureStart;
    const endClosureIndex = currentTag.closureEnd
      ? Math.min(currentTag.closureEnd, output.length)
      : output.length;
    const content = output.substring(startIndex, endIndex);
    const left = output.substring(0, startClosureIndex);
    const right = output.substring(endClosureIndex, output.length);

    output = left + currentTag.render(content, callback) + right;
  }

  return output;
}
