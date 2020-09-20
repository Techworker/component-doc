const RewritingStream = require("parse5-html-rewriting-stream");

// utility to strip indentations
const stripIndent = require("strip-indent");

// import helpers
const {
    escapeHtml,
    extractOptionAttr,
    extractBooleanOptionAttr,
    hasAttr,
    trimLeadingAndTrailing,
} = require("./util");

/**
 * The rewriter will loop through the source and rewrite the contents
 * of the configured tag.
 *
 * @param {Object} rootOptions
 *
 * @returns {RewritingStream|Writable}
 */
module.exports = (rootOptions) => {
    const rewriter = new RewritingStream();

    /**
     * A flag indicating whether we are in the component-tag that we want to
     * rewrite.
     *
     * @type {boolean}
     */
    let inComponentDocTag = false;

    /**
     * The current options.
     *
     * @type {Object}
     */
    let options = Object.assign({}, rootOptions);

    /**
     * A value indicating whether the user used :language instead of language.
     *
     * @type {boolean}
     */
    let languageIsBind = false;

    /**
     * The nesting level of the tag.
     *
     * @type {number}
     */
    let nestingLevel = 0;

    /**
     * The content of the tag.
     *
     * @type {string}
     */
    let content = '';

    /**
     * Listen to a start tag.
     */
    rewriter.on('startTag', (node, raw) => {
        // check against the tag that we want to rewrite
        if (node.tagName !== rootOptions.tag) {

            // if we are inside of a component, we'll save the output for later
            if(inComponentDocTag) {
                content += raw;
            } else {
                // else, simply output what was found
                rewriter.emitRaw(raw);
            }
            return;
        }

        // make sure we can highlight ourself
        if(inComponentDocTag) {
            nestingLevel++;
            content += raw;
            return;
        }

        // flag as in-component
        inComponentDocTag = true;

        // reset the current content
        content = '';

        // get options from the attributes and either use these or the default options
        options = Object.assign(rootOptions, {
            trim: extractBooleanOptionAttr(node.attrs, 'trim', rootOptions.trim),
            dedent: extractBooleanOptionAttr(node.attrs, 'dedent', rootOptions.dedent),
            omitCodeSlot: extractBooleanOptionAttr(node.attrs, 'omit-code-slot', rootOptions.omitCodeSlot),
            omitResultSlot: extractBooleanOptionAttr(node.attrs, 'omit-result-slot', rootOptions.omitResultSlot),
            language: extractOptionAttr(node.attrs, 'language', rootOptions.language),
            component: extractOptionAttr(node.attrs, 'component', rootOptions.component),
            codeSlot: extractOptionAttr(node.attrs, 'code-slot', rootOptions.codeSlot),
            resultSlot: extractOptionAttr(node.attrs, 'result-slot', rootOptions.resultSlot),
            debug: extractBooleanOptionAttr(node.attrs, 'debug', rootOptions.debug),
        });

        // keep :language attributes
        languageIsBind = false;
        if(hasAttr(node.attrs, ':language')) {
            options.language = extractOptionAttr(node.attrs, ':language', rootOptions.language);
            languageIsBind = true;
        }

        // change the name of the node and filter out all internal attributes
        node.tagName = options.component;
        node.attrs = node.attrs.filter((attr) => {
            return ['trim', 'dedent', 'language', ':language', 'component', 'debug',
                    'code-slot', 'result-slot', 'omit-code-slot', 'omit-result-slot']
                .indexOf(attr.name) === -1;
        });

        // add the language property.
        node.attrs.push({
            name: (languageIsBind ? ':' : '') + 'language',
            value: options.language
        });

        // start the new node
        rewriter.emitStartTag(node);
    });

    /**
     * Listen to text.
     */
    rewriter.on('text', (node, raw) => {
        if(inComponentDocTag) {
            // append raw contents if we are inside of the component
            content += raw;
            return;
        }

        rewriter.emitRaw(raw);
    });

    /**
     * Listen to closing tags
     */
    rewriter.on('endTag', (node, raw) => {

        if (node.tagName !== options.tag) {

            // when we are inside of the component, we'll simply save the raw value..
            if(inComponentDocTag) {
                content += raw;
            } else {
                // ..otherwise will write it out
                rewriter.emitRaw(raw);
            }

            return;
        }

        // if we have a nesting level > 0 (a options.tag in a options.tag), we will
        // simply save the content and decrease the nesting level
        if(nestingLevel > 0) {
            nestingLevel--;
            content += raw;
            return;
        }

        // we are out now, reset the flag
        inComponentDocTag = false;

        // create the code slot
        if(!options.omitCodeSlot) {
            rewriter.emitRaw("\n");
            rewriter.emitStartTag({
                attrs: [{name: 'v-slot:' + options.codeSlot, value: ''}],
                tagName: "template",
                selfClosing: false,
            });

            let escaped = escapeHtml(content);
            if(options.dedent) {
                escaped = stripIndent(escaped);
            }
            if(options.trim) {
                escaped = trimLeadingAndTrailing(escaped);
            }

            rewriter.emitRaw(escaped);

            rewriter.emitEndTag({
                attrs: [],
                tagName: "template",
                selfClosing: false,
            });
            rewriter.emitRaw("\n");
        }

        // create the result slot
        if(!options.omitResultSlot) {
            if(options.omitCodeSlot) {
                rewriter.emitRaw("\n");
            }
            rewriter.emitStartTag({
                attrs: [{name: 'v-slot:' + options.resultSlot, value: ''}],
                tagName: "template",
                selfClosing: false,
            });

            // emit the collected raw data
            if(options.dedent) {
                content = stripIndent(content);
            }
            if(options.trim) {
                content = trimLeadingAndTrailing(content);
            }

            rewriter.emitRaw(content);

            // close result slot
            rewriter.emitEndTag({
                attrs: [],
                tagName: "template",
                selfClosing: false,
            });
            rewriter.emitRaw("\n");
        }

        // transform node name and write it.
        node.tagName = options.component;
        rewriter.emitEndTag(node);
    });

    return rewriter;
};
