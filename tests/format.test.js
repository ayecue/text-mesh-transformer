const TextMeshParser = require('../dist/index.js');
const transform = TextMeshParser.default;
const Tag = TextMeshParser.Tag;

const testCallback = (openTag, content) => {
  switch (openTag.tag) {
    case Tag.Color: {
      return `[myColor=${openTag.value}]${content}[/myColor]`;
    }
    case Tag.Underline:
      return `[underline]${content}[/underline]`;
    case Tag.Italic:
      return `[italic]${content}[/italic]`;
    case Tag.Bold:
      return `[bold]${content}[/bold]`;
  }

  return content;
};

describe('transform', function () {
  test('simple', function () {
    const result = transform(`
    was <color=red>test <color=blue><u><b>wd</b></u></color> xad
    `, testCallback);

    expect(result).toMatchSnapshot();
  });

  test('without close tags', function () {
    const result = transform(`
    was <color=red>test <color=blue><u><b>wd xad
    `, testCallback);

    expect(result).toMatchSnapshot();
  });

  test('unknown tags', function () {
    const result = transform(`
    was <color=red>test <unknown>wd xad
    `, testCallback);

    expect(result).toMatchSnapshot();
  });

  test('invalid closing of tag', function () {
    const result = transform(`
    was <color=red>test <b>wd xad</color>
    `, testCallback);

    expect(result).toMatchSnapshot();
  });
});