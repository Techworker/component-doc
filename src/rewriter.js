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
 * @param {Object} options
 *
 * @returns {RewritingStream|Writable}
 */
module.exports = (options) => {
    const rewriter = new RewritingStream();

    /**
     * A flag indicating whether we are in the component itself.
     * @type {boolean}
     */
    let inComponentDocTag = false;

    /**
     * A value indicating whether the escaped vue html code should be trimmed.
     *
     * @type {boolean}
     */
    let currentTrim = options.trim;

    /**
     * A value inidcating whether the code should be dedented.
     *
     * @type {boolean}
     */
    let currentDedent = options.dedent;

    /**
     * The highlight language.
     *
     * @type {string}
     */
    let currentLanguage = options.language;

    /**
     * A flag
     * @type {boolean}
     */
    let currentLanguageIsBind = false;

    /**
     * The name of the code slot.
     *
     * @type {string}
     */
    let currentCodeSlot = options.codeSlot;

    /**
     * The name of the result slot.
     *
     * @type {string}
     */
    let currentResultSlot = options.resultSlot;

    /**
     * The name of the resulting component.
     *
     * @type {String}
     */
    let currentComponent = options.component;

    /**
     * A flag indicating that there should be not code slot.
     *
     * @type {Boolean}
     */
    let currentOmitCodeSlot = options.omitCodeSlot;

    /**
     * A flag indicating that there should be not result slot.
     *
     * @type {Boolean}
     */
    let currentOmitResultSlot = options.omitResultSlot;

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
        if (node.tagName !== options.tag) {

            // if we are inside of a component, we'll save the output for
            // later
            if(inComponentDocTag) {
                currentResult += raw;
            }

            // either emit the escaped version of the tag or the raw version
            // check for nested component tags
            if(!inComponentDocTag) {
                rewriter.emitRaw(inComponentDocTag ? escapeHtml(raw) : raw);
                return;
            }
        }

        // flag as in-component
        inComponentDocTag = true;

        // reset the current result
        currentResult = '';

        // get options from node and either use these or the default options
        currentTrim = extractBooleanOptionAttr(node.attrs, 'trim', options.trim);
        currentDedent = extractBooleanOptionAttr(node.attrs, 'dedent', options.dedent);
        currentOmitCodeSlot = extractBooleanOptionAttr(node.attrs, 'omit-code-slot', options.omitCodeSlot);
        currentOmitResultSlot = extractBooleanOptionAttr(node.attrs, 'omit-result-slot', options.omitResultSlot);

        currentLanguage = extractOptionAttr(node.attrs, 'language', options.language);
        currentLanguage = extractOptionAttr(node.attrs, ':language', currentLanguage);
        currentLanguageIsBind = hasAttr(node.attrs, ':language');

        currentComponent = extractOptionAttr(node.attrs, 'component', options.component);

        currentCodeSlot = extractOptionAttr(node.attrs, 'code-slot', options.codeSlot);
        currentResultSlot = extractOptionAttr(node.attrs, 'result-slot', options.resultSlot);

        // change the name of the node and filter out all internal
        // attributes
        node.tagName = currentComponent;
        node.attrs = node.attrs.filter((attr) => {
            return ['trim', 'dedent', 'language', ':language', 'component',
                    'code-slot', 'result-slot', 'omit-code-slot', 'omit-result-slot']
                .indexOf(attr.name) === -1;
        });

        // add the language property.
        node.attrs.push({
            name: (currentLanguageIsBind ? ':' : '') + 'language',
            value: currentLanguage
        });

        // start the new node
        rewriter.emitStartTag(node);

        // start the code slot
        if(!currentOmitCodeSlot) {
            rewriter.emitRaw("\n  ");
            rewriter.emitStartTag({
                attrs: [{name: 'v-slot:' + currentCodeSlot, value: ''}],
                tagName: "template",
                selfClosing: false,
            });
        }
    });

    /**
     * Listen to text.
     */
    rewriter.on('text', (node, raw) => {
        if(inComponentDocTag) {
            // append the data
            currentResult += raw;

            // dedent if required
            if (currentDedent) {
                raw = stripIndent(raw);
            }

            // trim if required
            if (currentTrim) {
                raw = trimLeadingAndTrailing(raw);
            }
        }

        if(!currentOmitCodeSlot) {
            rewriter.emitRaw(raw);
        }
    });

    /**
     * Listen to closing tags
     */
    rewriter.on('endTag', (node, raw) => {

        if (node.tagName !== options.tag) {
            // save to result
            currentResult += raw;

            // escape if necessary
            if(!currentOmitCodeSlot) {
                rewriter.emitRaw(inComponentDocTag ? escapeHtml(raw) : raw);
            }
            return;
        }

        // we are out now, reset the flag
        inComponentDocTag = false;

        // close the code template
        if(!currentOmitCodeSlot) {
            rewriter.emitEndTag({
                attrs: [],
                tagName: "template",
                selfClosing: false,
            });
        }

        // create the template tag for the result slot
        if(!currentOmitResultSlot) {
            rewriter.emitRaw("\n  ");
            rewriter.emitStartTag({
                attrs: [{name: 'v-slot:' + currentResultSlot, value: ''}],
                tagName: "template",
                selfClosing: false,
            });

            // emit the collected raw data
            rewriter.emitRaw(currentResult);

            // close result slot
            rewriter.emitEndTag({
                attrs: [],
                tagName: "template",
                selfClosing: false,
            });
        }
        rewriter.emitRaw("\n");

        // transform node tag name and write it.
        node.tagName = currentComponent;
        rewriter.emitEndTag(node);
    });

    return rewriter;
};
