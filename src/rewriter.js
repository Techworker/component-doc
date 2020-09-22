const RewritingStream = require("parse5-html-rewriting-stream");

// utility to strip indentations
const stripIndent = require("strip-indent");

// import helpers
const {
    escapeHtml,
    extractOptionAttr,
    extractBooleanOptionAttr,
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

    let generated = '';

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
                emitRaw(raw);
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
        content = generated = '';

        // get options from the attributes and either use these or the default options
        options = Object.assign(rootOptions, {
            trim: extractBooleanOptionAttr(node.attrs, 'trim', rootOptions.trim),
            dedent: extractBooleanOptionAttr(node.attrs, 'dedent', rootOptions.dedent),
            omitCodeSlot: extractBooleanOptionAttr(node.attrs, 'omit-code-slot', rootOptions.omitCodeSlot),
            omitResultSlot: extractBooleanOptionAttr(node.attrs, 'omit-result-slot', rootOptions.omitResultSlot),
            component: extractOptionAttr(node.attrs, 'component', rootOptions.component),
            codeSlot: extractOptionAttr(node.attrs, 'code-slot', rootOptions.codeSlot),
            resultSlot: extractOptionAttr(node.attrs, 'result-slot', rootOptions.resultSlot),
            debug: extractBooleanOptionAttr(node.attrs, 'debug', rootOptions.debug),
        });

        // change the name of the node and filter out all internal attributes
        node.tagName = options.component;
        node.attrs = node.attrs.filter((attr) => {
            return ['trim', 'dedent', 'component', 'debug',
                'code-slot', 'result-slot', 'omit-code-slot', 'omit-result-slot']
                .indexOf(attr.name) === -1;
        });

        // start the new tag
        emitStartTag(node, options.debug);
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

        emitRaw(raw);
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
                emitRaw(raw);
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
            emitRaw("\n", options.debug);
            emitStartTag({
                attrs: [{name: 'v-slot:' + options.codeSlot, value: ''}],
                tagName: "template",
                selfClosing: false,
            }, options.debug);

            let escaped = escapeHtml(content);
            if(options.dedent) {
                escaped = stripIndent(escaped);
            }
            if(options.trim) {
                escaped = trimLeadingAndTrailing(escaped);
            }

            do {
                escaped = escaped.replace("\n", '<br />');
            } while(escaped.indexOf("\n") > -1);

            emitRaw(escaped, options.debug);

            emitEndTag({
                attrs: [],
                tagName: "template",
                selfClosing: false,
            }, options.debug);
            emitRaw("\n", options.debug);
        }

        // create the result slot
        if(!options.omitResultSlot) {
            if(options.omitCodeSlot) {
                emitRaw("\n", options.debug);
            }
            emitStartTag({
                attrs: [{name: 'v-slot:' + options.resultSlot, value: ''}],
                tagName: "template",
                selfClosing: false,
            }, options.debug);

            // emit the collected raw data
            if(options.dedent) {
                content = stripIndent(content);
            }
            if(options.trim) {
                content = trimLeadingAndTrailing(content);
            }

            emitRaw(content, options.debug);

            // close result slot
            emitEndTag({
                attrs: [],
                tagName: "template",
                selfClosing: false,
            }, options.debug);
            emitRaw("\n", options.debug);
        }

        // transform node name and write it.
        node.tagName = options.component;
        emitEndTag(node, options.debug);
        if(options.debug === true) {
            emitRaw("\n");
            rewriter.emitComment({
                text: 'DEBUG:'
            });
            emitRaw("\n");
            rewriter.emitComment({
                text: generated
            });
        }
    });

    let tmpDebug = false;

    function emitStartTag(token, debug = false) {
        tmpDebug = debug;
        rewriter.emitStartTag(token);
        tmpDebug = false;
    }

    function emitEndTag(token, debug = false) {
        tmpDebug = debug;
        rewriter.emitEndTag(token);
        tmpDebug = false;
    }
    function emitRaw(raw, debug = false) {
        tmpDebug = debug;
        rewriter.emitRaw(raw);
        tmpDebug = false;
    }

    rewriter.on('data', (chunk) => {
        if(tmpDebug) {
            generated += chunk;
        }
    });

    return rewriter;
};
