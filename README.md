# text-mesh-transformer

[![text-mesh-transformer](https://circleci.com/gh/ayecue/text-mesh-transformer.svg?style=svg)](https://circleci.com/gh/ayecue/text-mesh-transformer)

# Install

```
npm i text-mesh-transformer
```

# Description

Transformer for [TextMesh Pro Rich Text](http://digitalnativestudios.com/textmeshpro/docs/rich-text) tags.

# Usage

```js
const { transform, Tag, TagRecordOpen, TagRecordClose } = require('./dist/index.js');

async function main() {
  const ansiStyles = (await import('ansi-styles')).default;

  const str = transform(`
    foo <color=red>test <color=blue><u><b>moo</b></u></color> bar
  `, (tag) => {
    if (tag instanceof TagRecordOpen) {
      switch (tag.type) {
        case Tag.Color: {
          if (tag.attributes.value in ansiStyles) {
            return ansiStyles[tag.attributes.value].open;
          }
          break;
        }
        case Tag.Underline:
          return ansiStyles.modifier.underline.open;
        case Tag.Italic:
          return ansiStyles.modifier.italic.open;
        case Tag.Bold:
          return ansiStyles.modifier.bold.open;
      }
    } else if (tag instanceof TagRecordClose) {
      switch (tag.type) {
        case Tag.Color: {
          if (tag.previous.attributes.value in ansiStyles) {
            return ansiStyles[tag.previous.attributes.value].close;
          }
          break;
        }
        case Tag.Underline:
          return ansiStyles.modifier.underline.close;
        case Tag.Italic:
          return ansiStyles.modifier.italic.close;
        case Tag.Bold:
          return ansiStyles.modifier.bold.close;
      }
    }

    return '';
  });

  console.log(str); //returns styled console.log string
}

main();
```
