import {
  Parser,
  ParserResult,
  TagElementType,
  TagElementWithAttributes
} from './parser';
import { TagCallback, TagRecordClose, TagRecordOpen } from './tag-record';
import { tagsWithNoBody } from './types';

export {
  TagCallback,
  TagRecord,
  TagRecordClose,
  TagRecordOpen,
  TagRecordOpenOptions,
  TagRecordOptions
} from './tag-record';
export { allTags, Tag, tagsWithValue } from './types';

export function transform(str: string, callback: TagCallback): string {
  const tokenizer = new Parser(str);
  const tags: TagRecordClose[] = [];
  const openTags: TagRecordOpen[] = [];
  let match: ParserResult;

  while ((match = tokenizer.next())) {
    if (match.isEnd) break;
    if (!match.item) continue;

    const { element, raw, start, end } = match.item;

    if (element.type === TagElementType.Open) {
      if (element instanceof TagElementWithAttributes) {
        const tagWithAttr = new TagRecordOpen({
          type: element.tag,
          raw,
          attributes: element.attributes,
          start,
          end
        });
        openTags.push(tagWithAttr);
      } else {
        const tagWithoutAttr = new TagRecordOpen({
          type: element.tag,
          raw,
          start,
          end
        });
        openTags.push(tagWithoutAttr);
      }

      if (tagsWithNoBody.includes(element.tag)) {
        const lastTag = openTags.pop()!;

        const closingTag = new TagRecordClose({
          type: element.tag,
          raw: '',
          start: end,
          end,
          previous: lastTag as TagRecordOpen
        });
        lastTag.next = closingTag;
        lastTag.content = '';

        if (openTags.length > 0) {
          const before = openTags[openTags.length - 1];
          before.children.unshift(closingTag);
          lastTag.parent = before;
        } else {
          tags.push(closingTag);
        }
      }
    } else if (element.type === TagElementType.Close) {
      const lastTag = openTags[openTags.length - 1];

      if (element.tag === lastTag?.type) {
        openTags.pop();

        const closingTag = new TagRecordClose({
          type: element.tag,
          raw,
          start,
          end,
          previous: lastTag as TagRecordOpen
        });
        lastTag.next = closingTag;
        lastTag.content = str.slice(lastTag.end, closingTag.start);

        if (openTags.length > 0) {
          const before = openTags[openTags.length - 1];
          before.children.unshift(closingTag);
          lastTag.parent = before;
        } else {
          tags.push(closingTag);
        }
      }
    }
  }

  let remainingTag: TagRecordOpen | undefined;

  while ((remainingTag = openTags.pop())) {
    const closingTag = new TagRecordClose({
      type: remainingTag.type,
      raw: '',
      start: str.length,
      end: str.length,
      previous: remainingTag
    });
    remainingTag.next = closingTag;
    remainingTag.content = str.slice(remainingTag.end, closingTag.start);

    if (openTags.length > 0) {
      const before = openTags[openTags.length - 1] as TagRecordOpen;
      before.children.unshift(closingTag);
      remainingTag.parent = before;
    } else {
      tags.push(closingTag);
    }
  }

  const flatTags = [];
  let currentTag: TagRecordClose | undefined;

  while ((currentTag = tags.shift())) {
    flatTags.push(currentTag);

    const queue = [...currentTag.previous.children];
    let childTag: TagRecordClose | undefined;

    while ((childTag = queue.pop())) {
      flatTags.push(childTag);
      queue.push(...childTag.previous.children);
    }
  }

  let output = str;

  while ((currentTag = flatTags.pop())) {
    const offset = currentTag.previous.parent?.end ?? 0;
    const content = currentTag.previous.parent?.content ?? output;
    const childContent = currentTag.previous.content;

    const startClosureIndex = currentTag.previous.start - offset;
    const endClosureIndex = Math.min(currentTag.end - offset, output.length);

    const left = content.substring(0, startClosureIndex);
    const right = content.substring(endClosureIndex);

    if (currentTag.previous.parent) {
      const transformed = callback(currentTag.previous, childContent);
      currentTag.previous.parent.content = left + transformed + right;
    } else {
      const transformed = callback(currentTag.previous, childContent);
      output = left + transformed + right;
    }
  }

  return output;
}
