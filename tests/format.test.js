const { transform, Tag } = require('../dist/index.js');

const testCallback = (openTag, content) => {
  switch (openTag.tag) {
    case Tag.Color: {
      return `[myColor=${openTag.attributes.value}]${content}[/myColor]`;
    }
    case Tag.Mark: {
      return `[myMark=${openTag.attributes.value}]${content}[/myMark]`;
    }
    case Tag.Underline:
      return `[underline]${content}[/underline]`;
    case Tag.Italic:
      return `[italic]${content}[/italic]`;
    case Tag.Bold:
      return `[bold]${content}[/bold]`;
    case Tag.Font:
      return `[font="${openTag.attributes.value}"]${content}[/font]`;
    case Tag.Sprite:
      return `[sprite="${openTag.attributes.value}", "${openTag.attributes.foo}"]${content}[/sprite]`;
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
