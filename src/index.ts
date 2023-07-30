import {
  Parser,
  ParserResult,
  TagElementType,
  TagElementWithAttributes
} from './parser';
import { TagCallback, TagRecord } from './tag-record';

export { allTags, Tag, tagsWithValue } from './types';

export function transform(str: string, callback: TagCallback): string {
  const tokenizer = new Parser(str);
  const tags: TagRecord[] = [];
  const openTags: TagRecord[] = [];
  let match: ParserResult;

  while ((match = tokenizer.next())) {
    if (match.isEnd) break;
    if (!match.item) continue;

    const { element, start, end } = match.item;

    if (element.type === TagElementType.Open) {
      if (element instanceof TagElementWithAttributes) {
        openTags.push(
          new TagRecord({
            tag: element.tag,
            attributes: element.attributes,
            start: end,
            closureStart: start
          })
        );
      } else {
        openTags.push(
          new TagRecord({
            tag: element.tag,
            start: end,
            closureStart: start
          })
        );
      }
    } else if (element.type === TagElementType.Close) {
      const lastTag = openTags[openTags.length - 1];

      if (element.tag === lastTag.tag) {
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
