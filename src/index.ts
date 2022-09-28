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

export const tagsWithoutValue: string[] = [
  Tag.Bold,
  Tag.Italic,
  Tag.Lowercase,
  Tag.Uppercase,
  Tag.NoParse,
  Tag.NoBR,
  Tag.Strikethrough,
  Tag.Underline,
  Tag.Sub,
  Tag.Sup
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

export default function (str: string, callback: TagCallback): string {
  const regexp = new RegExp(
    `<(${tagsWithoutValue.join('|')})>|<(${tagsWithValue.join(
      '|'
    )})=([^>]+)>|</(${allTags.join('|')})>`,
    'gi'
  );
  const tags: TagRecord[] = [];
  const openTags: TagRecord[] = [];
  let lastIndex = 0;
  let match;

  while ((match = regexp.exec(str))) {
    const [markup, tagWithoutValue, tagWithValue, tagValue, tagClose] = match;

    if (tagWithoutValue) {
      openTags.push(
        new TagRecord({
          tag: tagWithoutValue as Tag,
          start: match.index + markup.length,
          closureStart: match.index
        })
      );
    } else if (tagWithValue) {
      openTags.push(
        new TagRecord({
          tag: tagWithValue as Tag,
          value: tagValue,
          start: match.index + markup.length,
          closureStart: match.index
        })
      );
    } else if (tagClose) {
      const lastTag = openTags[openTags.length - 1];

      if (tagClose === lastTag.tag) {
        openTags.pop();

        if (openTags.length > 0) {
          const before = openTags[openTags.length - 1];
          before.children.push(lastTag);
        } else {
          tags.push(lastTag);
        }

        lastTag.end = match.index;
        lastTag.closureEnd = match.index + markup.length;
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
