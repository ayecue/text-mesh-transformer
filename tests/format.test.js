const { transform, Tag } = require('../dist/index.js');

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

  test('two top level tags', function () {
    const result = transform(`
    was <color=red>test</color> <color=blue><b>wd xad
    `, testCallback);

    expect(result).toMatchSnapshot();
  });

  test('two top level tags with inner styles', function () {
    const result = transform(`
    was <color=red>te<u>st</u></color> <color=blue><b>wd xad
    `, testCallback);

    expect(result).toMatchSnapshot();
  });

  test('style without value', function () {
    const result = transform(`
    was <link>test</link>
    `, testCallback);

    expect(result).toMatchSnapshot();
  });
});
