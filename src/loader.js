const { Duplex } = require("stream");
const { getOptions } = require("loader-utils");

const getRewriter = require("./rewriter");

/**
 * A webpack loader that will transform a special tag and it's contents
 * to a vue component.
 *
 * @param source
 * @param map
 * @param meta
 * @returns {Promise<*>}
 */
module.exports = async function(source, map, meta) {
    let options = getOptions(this);

    // set proper defaults
    options.tag = options.tag || 'v-component-doc';
    options.rewriteToComponent = options.rewriteToComponent || 'v-component-doc-prism';
    options.codeSlot = options.codeSlot || 'code';
    options.resultSlot = options.resultSlot || 'result';
    options.language = options.language || 'html';
    options.dedent = !!(options.dedent || true);
    options.trim = !!(options.trim || true);

    // check if this file contains the tag we want to transform
    if (source.indexOf(options.tag) === -1) {
        return source;
    }

    const resolveLoader = this.async();
    const chunks = [];
    const stream = Duplex.from(source).pipe(getRewriter(options));
    stream.on("data", (chunk) => chunks.push(chunk));
    stream.on("error", (error) => resolveLoader(error));
    stream.on("end", () => {
        const combined = chunks.join("");
        resolveLoader(null, combined, map, meta);
    });
};
