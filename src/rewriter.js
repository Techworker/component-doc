const RewritingStream = require("parse5-html-rewriting-stream");
const stripIndent = require("strip-indent");

const {
    escapeHtml,
    extractOptionAttr,
    extractBooleanOptionAttr,
    hasAttr,
    trimLeadingAndTrailing,
} = require("./util");

/**
 * The rewriter that will take the tag and replaces it with the configured
 * or defined vue component.
 *
 * @param {Object} rootOptions
 *
 * @returns {RewritingStream|Writable}
 */
module.exports = (rootOptions) => {
    const rewriter = new RewritingStream();

    /**
     * A flag indicating whether we are in the component itself.
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
     * The current result content, so the code that will be interpreted by vue.
     *
     * @type {string}
     */
    let currentResult = '';

    /**
     * Listen to a start tag.
     */
    rewriter.on('startTag', (node, raw) => {
        // check against the tag that we want to rewrite
        if (node.tagName !== rootOptions.tag) {

            // if we are inside of a component, we'll save the output for
            // later
            if(inComponentDocTag) {
                currentResult += raw;
            }

            // either emit the escaped version of the tag or the raw version
            // check for nested component tags
            if(!inComponentDocTag) {
                rewriter.emitRaw(raw);
            }
            return;
        }

        if(inComponentDocTag) {
            nestingLevel++;
            currentResult += raw;
            return;
        }

        // flag as in-component
        inComponentDocTag = true;

        // reset the current result
        currentResult = '';

        // get options from node and either use these or the default options
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

        languageIsBind = false;
        if(hasAttr(node.attrs, ':language')) {
            options.language = extractOptionAttr(node.attrs, ':language', rootOptions.language);
            languageIsBind = true;
        }

        // change the name of the node and filter out all internal
        // attributes
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
            // append the data
            currentResult += raw;
            return;
        }

        rewriter.emitRaw(raw);
    });

    /**
     * Listen to closing tags
     */
    rewriter.on('endTag', (node, raw) => {

        if (node.tagName !== options.tag) {
            // save to result

            // escape if necessary
            if(inComponentDocTag) {
                currentResult += raw;
            } else {
                rewriter.emitRaw(raw);
            }

            return;
        }

        if(nestingLevel > 0) {
            nestingLevel--;
            currentResult += raw;
            return;
        }

        // we are out now, reset the flag
        inComponentDocTag = false;

        // close the code template
        if(!options.omitCodeSlot) {
            // start the code slot
            rewriter.emitRaw("\n");
            rewriter.emitStartTag({
                attrs: [{name: 'v-slot:' + options.codeSlot, value: ''}],
                tagName: "template",
                selfClosing: false,
            });

            let escaped = escapeHtml(currentResult);
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

        // create the template tag for the result slot
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
                currentResult = stripIndent(currentResult);
            }
            if(options.trim) {
                currentResult = trimLeadingAndTrailing(currentResult);
            }

            rewriter.emitRaw(currentResult);

            // close result slot
            rewriter.emitEndTag({
                attrs: [],
                tagName: "template",
                selfClosing: false,
            });
            rewriter.emitRaw("\n");
        }

        // transform node tag name and write it.
        node.tagName = options.component;
        rewriter.emitEndTag(node);
    });

    return rewriter;
};
