# vue-component-usage-loader 

A webpack loader to help you write usage examples for your vue components.

## Installation

### Yarn 

```
yarn add vue-component-usage-loader --dev
```

### NPM

```
npm install vue-component-usage-loader --save-dev
```

## Usage


## How it works

This webpack-loader preprocesses the `<template>` part of your `.vue` components
and rewrites a special node and it's contents. 

 - It will search for a specialized html tag - referred to by `sht` from now on.
 - It renames the `sht` to another html tag.
 - it will create a custom `<template v-slot:code>` tag with the escaped content of the `sht`.
 - it will create a custom `<template v-slot:result>` tag with the original content of the `sht`.

Too complicated? Here are some examples to the rescue.


Let's say you are writing a documentation about your `superbutton` component and you
want to showcase it. Normally you'd have to do something like this:

```html
This is my component. Please set attr x to.. 

Example Code:
<pre><code>&lt;superbutton&gt;Click me&lt;/superbutton&gt;</code></pre>

Result:
<superbutton>Click me</superbutton>
```

You could even simplify the process by creating a component, that will do the escaping 
and so on like this:

```
This is my component. Please set attr x to.. 
<my-documentation-component>
    <superbutton>Click me</superbutton>
</my-documentation-component>
```

But this will lead 