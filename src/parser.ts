import { allTags, Tag, tagsWithValue } from './types';

export enum TagElementType {
  Open,
  Close
}

export class TagElement {
  readonly tag: Tag;
  readonly type: TagElementType;

  constructor(tag: Tag, type: TagElementType) {
    this.tag = tag;
    this.type = type;
  }
}

export class TagElementWithAttributes extends TagElement {
  readonly attributes: Record<string, string>;

  constructor(tag: Tag, type: TagElementType) {
    super(tag, type);
    this.attributes = {};
  }

  setAttribute(name: string, value: string) {
    this.attributes[name] = value;
    return this;
  }
}

export enum ElementType {
  Tag,
  Newline,
  EOF,
  Noop
}

export interface ParserResult {
  type: ElementType;
}

export interface ParserResultWithNewline {
  type: ElementType.Newline;
  index: number;
}

export interface ParserResultWithBody extends ParserResult {
  type: ElementType.Tag;
  item: {
    element: TagElement | TagElementWithAttributes;
    raw: string;
    start: number;
    end: number;
  };
}

export const isParserResultWithBody = (
  item: ParserResult
): item is ParserResultWithBody => {
  return item.type === ElementType.Tag;
};

export const isParserResultWithNewline = (
  item: ParserResult
): item is ParserResultWithNewline => {
  return item.type === ElementType.Newline;
};

export class Parser {
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

  private parseName(): string {
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
      /[0-9a-f]/i.test(this.buffer[this.index]);
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

  private parseOpeningTag(): TagElement | TagElementWithAttributes | null {
    this.skipWhitespace();

    if (this.buffer[this.index] === '#') {
      this.index++;

      const tagElement = new TagElementWithAttributes(
        Tag.Color,
        TagElementType.Open
      );
      tagElement.setAttribute('value', '#' + this.parseHexCode());

      return tagElement;
    }

    const tag = this.parseName();

    if (!allTags.has(tag)) {
      return null;
    }

    if (!tagsWithValue.has(tag)) {
      return new TagElement(tag as Tag, TagElementType.Open);
    }

    const tagElement = new TagElementWithAttributes(
      tag as Tag,
      TagElementType.Open
    );

    if (this.buffer[this.index] === '=') {
      this.index++;
      tagElement.setAttribute('value', this.parseValue());
      this.skipWhitespace();
    }

    while (this.index < this.buffer.length && this.buffer[this.index] !== '>') {
      const attributeName = this.parseName();
      if (attributeName === '') return null;
      if (this.buffer[this.index] !== '=') return null;
      this.index++;
      const attributeValue = this.parseValue();
      tagElement.setAttribute(attributeName, attributeValue);
      this.skipWhitespace();
    }

    return tagElement;
  }

  private parseClosingTag(): TagElement | null {
    this.skipWhitespace();

    const tag = this.parseName();

    if (!allTags.has(tag)) {
      return null;
    }

    this.skipWhitespace();

    return new TagElement(tag as Tag, TagElementType.Close);
  }

  next(): ParserResult | ParserResultWithBody | ParserResultWithNewline {
    const lastIndex = this.index;
    const sub = this.buffer.substring(lastIndex);
    const startIndex = sub.search(/<|\n/);

    if (startIndex === -1) {
      return {
        type: ElementType.EOF
      };
    }

    this.index = startIndex + lastIndex + 1;
    const next = sub.substring(startIndex);

    if (next.startsWith('\n')) {
      return {
        type: ElementType.Newline,
        index: this.index - 1
      };
    }

    let element: TagElement | TagElementWithAttributes | null;

    if (this.buffer[this.index] === '/') {
      this.index++;
      element = this.parseClosingTag();
    } else {
      element = this.parseOpeningTag();
    }

    if (element === null) {
      return {
        type: ElementType.Noop
      };
    }

    if (this.buffer[this.index] !== '>') {
      return {
        type: ElementType.Noop
      };
    }

    this.index++;

    return {
      type: ElementType.Tag,
      item: {
        element,
        raw: this.buffer.slice(startIndex + lastIndex, this.index),
        start: startIndex + lastIndex,
        end: this.index
      }
    };
  }
}
