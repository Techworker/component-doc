# vue-component-usage-loader 

A webpack loader to help you write usage examples in your tech-documentation 
for your vue components.

The loader will transform a custom tag with your usage example..

```html
<vue-component-usage>
    <my-button label="Click-Me" border="rounded" />
</vue-component-usage>
```

..into a new component which contains the highlightable code and the
code itself ready to be executed/compiled by Vue (in this example 
`vue-component-usage-prism`).

```html
<vue-component-usage-prism>
    <template v-slot:code>
        &lt;my-button label=&quot;Click-Me&quot; border=&quot;rounded&quot; /&gt;
    </template>
    <template v-slot:result>
        <my-button label="Click-Me" border="rounded" />
    </template>
</vue-component-usage>
```

## Installation

```bash
$ yarn add vue-component-usage-loader --dev
// or..
$ npm install vue-component-usage-loader --save-dev
```

### Configuration

All options can be set globally when registering the loader in your 
`vue.config.js`. Add the loader via `chainWebpack`.

``` javascript
// vue.config.js
const vueComponentLoader = require("vue-component-usage-loader");
module.exports = {
    // ..
    chainWebpack: (chainableWebpackConfig) => {
        vueComponentLoader(chainableWebpackConfig, {
            // your options here..
        });
    },
    // ..
```

### Configuration Options

All options can be set globally using the webpack registration (see above).
These options can be overwritten (except `tag`) with each component usage by 
setting attributes on the component.

Let's say you set the `trim` option to true globally, but for one instance
you don't want to use trim. In that case you can overwrite the global option
by setting the `trim` attribute to `false`.
 
 ```html
<vue-component-usage trim="false">..</vue-component-usage>
```


#### options.tag 
The tag the loader should search for and indidcates a rewritable usage 
example.

 - Attribute: This value can only be set via configuration.
 - Default: `vue-component-usage`

#### options.component 
The resulting component tag that will contain the 2 resulting slots.

 - Attribute: `component="my-custom-component"`
 - Default: no default, required.

#### options.codeSlot 
The name of the slot in your component which will retrieve the highlightable code.

 - Attribute: `code-slot="custom"`
 - Default: `code`

#### options.regionSlot 
The name of the slot in your component which will retrieve the vue/html code.

 - Attribute: `result-slot="custom"`
 - Default: `result`

#### options.dedent 
A flag indicating whether the code should be dedented or not.

 - Attribute: `dedent="true/false"`
 - Default: `true`

#### options.trim 
A flag indicating whether empty lines at the beginning and at the end of
the code should be get removed.

 - Attribute: `trim="true/false"`
 - Default: `true`

#### options.omitCodeSlot 
A flag indicating whether the code-slot should be ignored.

 - Attribute: `omit-code-slot="true/false"`
 - Default: `false`

#### options.omitResultSlot 
A flag indicating whether the result-slot should be ignored.

 - Attribute: `omit-result-slot="true/false"`
 - Default: `false`

#### options.debug 
A flag indicating whether an additional HTML comment with the rewritten contents
should get written right behind the rewritten component. This can be useful to 
debug your highlighter components.

 - Attribute: `debug="true/false"`
 - Default: `false`

## Developing usage components

The loader itself does not ship with a highlight-component, but it is 
pretty easy to create one on your own.

In case you created one on your own and want to share the project, please
get in touch with me by creating a github issue. Thanks!

### Attributes

All core option attributes (trim, dedent, component, debug, code-slot, 
result-slot, omit-code-slot, omit-result-slot) will be removed from the
rewritten component tag. All others will stay.

Imaging the following tag:

```html
<vue-component-usage trim="false" foo="bar">..
```

This tag will be rewritten with your component option 
(eg `<vue-component-usage-prism>`) in the following form.

```html
<vue-component-usage-prism foo="bar">..
```

### Debugging

By setting the debug option to true, you might be able to find out
what goes wrong when something won't work as it's supposed to. When
true, the loader will append the rewritten vue component as a HTML
comment tag so you can see what was generated by the loader.

### Example

The simplest version can look like this:

```html
<template>
  <!-- First display the usage-code itself. -->
  <p><strong>Usage</strong></p>
  <pre><code><slot name="code"></slot></code></pre>

  <!-- Then let vue "execute" the code. -->
  <p><strong>The Result</strong></p>
  <slot name="result"></slot>
</template>
```

## Credits

This project was inspired by https://github.com/Etheryte/vue-raw-pre. Thx! 