/**
 * A small function to escape html.
 *
 * @see https://stackoverflow.com/a/6234804/1470607
 * @param {String} unsafe
 * @returns {string}
 */
function escapeHtml(unsafe) {
  return (unsafe || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Tries to extract an attribute from a list of attributes.
 *
 * When the attribute name is found and its value is either (string)'true' or
 * (string)'1' this method will return true, otherwise false.
 *
 *
 *
 * @param {Array.<{name: String, value: String}>} attrs
 * @param {String} name
 * @param {Boolean} defaultValue
 * @returns {Boolean}
 */
function extractBooleanOptionAttr(attrs, name, defaultValue) {
  const value = extractOptionAttr(attrs, name, defaultValue);
  if(value === defaultValue) {
    return value;
  }

  return value === 'true' || value === '1';
}

/**
 * Tries to extract the value of an attribute from a list of attributes.
 *
 * @param {Array.<{name: String, value: String}>} attrs
 * @param {String} name
 * @param {*} defaultValue
 * @returns {*}
 */
function extractOptionAttr(attrs, name, defaultValue) {
  const attr = attrs.find((v) => { return v.name === name; });
  if(attr !== undefined) {
    return attr.value;
  }

  return defaultValue;
}

function hasAttr(attrs, name) {
  return attrs.find((v) => { return v.name === name; }) !== undefined;
}

function trimUntilText(result, line) {
  if (result.length || line.trim().length) {
    result.push(line);
  }
  return result;
}

// Trim both leading and trailing empty lines but leave empty lines within code intact
function trimLeadingAndTrailing(input) {
  const lines = (input || "").split(/\r?\n/);

  const trimmed = lines
      .reduceRight(trimUntilText, [])
      .reduceRight(trimUntilText, []);
  return trimmed.join("\n");
}


module.exports = {
  escapeHtml,
  extractOptionAttr,
  extractBooleanOptionAttr,
  hasAttr,
  trimLeadingAndTrailing
};

