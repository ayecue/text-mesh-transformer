import {
  Parser,
  ParserResult,
  TagElementType,
  TagElementWithAttributes
} from './parser';
import {
  TagCallback,
  TagRecord,
  TagRecordClose,
  TagRecordOpen
} from './tag-record';

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
  const tags: TagRecord[] = [];
  const openTags: TagRecord[] = [];
  let match: ParserResult;

  while ((match = tokenizer.next())) {
    if (match.isEnd) break;
    if (!match.item) continue;

    const { element, start, end } = match.item;

    if (element.type === TagElementType.Open) {
      if (element instanceof TagElementWithAttributes) {
        const tagWithAttr = new TagRecordOpen({
          type: element.tag,
          attributes: element.attributes,
          start,
          end
        });
        tags.push(tagWithAttr);
        openTags.push(tagWithAttr);
      } else {
        const tagWithoutAttr = new TagRecordOpen({
          type: element.tag,
          start,
          end
        });
        tags.push(tagWithoutAttr);
        openTags.push(tagWithoutAttr);
      }
    } else if (element.type === TagElementType.Close) {
      const lastTag = openTags[openTags.length - 1];

      if (element.tag === lastTag.type) {
        openTags.pop();

        const closingTag = new TagRecordClose({
          type: element.tag,
          start,
          end,
          previous: lastTag as TagRecordOpen
        });

        (lastTag as TagRecordOpen).next = closingTag;

        tags.push(closingTag);
      }
    }
  }

  let remainingTag: TagRecord | undefined;

  while ((remainingTag = openTags.pop())) {
    const closingTag = new TagRecordClose({
      type: remainingTag.type,
      start: str.length,
      end: str.length,
      previous: remainingTag as TagRecordOpen
    });

    (remainingTag as TagRecordOpen).next = closingTag;

    tags.push(closingTag);
  }

  let output = str;
  let currentTag: TagRecord | undefined;

  while ((currentTag = tags.pop())) {
    const left = output.substring(0, currentTag.start);
    const right = output.substring(currentTag.end, output.length);

    output = left + callback(currentTag) + right;
  }

  return output;
}
