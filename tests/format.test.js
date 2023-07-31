const { transform, Tag, TagRecordOpen, TagRecordClose } = require('../dist/index.js');

const testCallback = (tag, context) => {
  if (tag.type !== Tag.NoParse && context.noParse) {
    return tag.raw;
  }

  if (tag instanceof TagRecordOpen) {
    switch (tag.type) {
      case Tag.Color: {
        return `[myColor=${tag.attributes.value}]`;
      }
      case Tag.Mark: {
        return `[myMark=${tag.attributes.value}]`;
      }
      case Tag.Underline:
        return `[underline]`;
      case Tag.Italic:
        return `[italic]`;
      case Tag.Bold:
        return `[bold]`;
      case Tag.Font:
        return `[font="${tag.attributes.value}"]`;
      case Tag.Sprite:
        return `[sprite="${tag.attributes.value}", "${tag.attributes.foo}"]`;
      case Tag.NoParse:
        context.noParse = true;
        return '';
    }
  } else if (tag instanceof TagRecordClose) {
    switch (tag.type) {
      case Tag.Color: {
        return `[/myColor]`;
      }
      case Tag.Mark: {
        return `[/myMark]`;
      }
      case Tag.Underline:
        return `[/underline]`;
      case Tag.Italic:
        return `[/italic]`;
      case Tag.Bold:
        return `[/bold]`;
      case Tag.Font:
        return `[/font]`;
      case Tag.Sprite:
        return `[/sprite]`;
      case Tag.NoParse:
        context.noParse = false;
        return '';
    }
  }

  return '';
};

describe('transform', function () {
  test('simple', function () {
    const result = transform(`
    was <color=red>test <color=blue><u><b>wd</b></u></color> xad
    `, testCallback);

    expect(result).toMatchSnapshot();
  });

  test('tag with two attributes', function () {
    const result = transform(`
    was <sprite=0 foo=somename>test </sprite> xad
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

  test('style with value in quotes', function () {
    const result = transform(`
    was <font=" my test  value">test</font>
    `, testCallback);

    expect(result).toMatchSnapshot();
  });

  test('color shorthand', function () {
    const result = transform(`
    was <#333666>test</color>
    `, testCallback);

    expect(result).toMatchSnapshot();
  });

  test('context', function () {
    const result = transform(`
    was <noparse><#333666>test</color>
    `, testCallback);

    expect(result).toMatchSnapshot();
  });

  test('multiline', function () {
    const result = transform(`
    <color=red>
    title - text

    -a --abc - <b>description</b>
    -a --abc - <b>description</b>
    -a --abc - <b>description</b>
    -a --abc - <b>description</b>
    </color>
    `, testCallback);

    expect(result).toMatchSnapshot();
  });

  test('multiline 2', function() {
    const result = transform(`<b><u>tedit</u></b>
    <color=yellow>1 | 	</color><mark=#ff00aa>$
    2 | 	<color=#FFF>test</color> = <color=#E11584>function</color>()
    3 | 		<color=#FFF>myTest</color> = <color=#F9D71C>"hello world"</color>
    4 | 		<color=#009dc4>print</color>(<color=#FFF>myTest</color>)
    5 | 	<color=#E11584>end function</color>
    6 | 	
    7 | 	<color=#FFF>test</color>
    8 | 
    `, testCallback);

    expect(result).toMatchSnapshot();
  })
});
