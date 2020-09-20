<template>
  <!-- First display the usage-code itself. -->
  <p><strong>Usage</strong></p>
  <pre><code><slot name="code"></slot></code></pre>

  <!-- Then let vue "execute" the code. -->
  <p><strong>The Result</strong></p>
  <slot name="result"></slot>
</template>