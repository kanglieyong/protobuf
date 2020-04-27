goog.module('protobuf.binary.tag');

const BufferDecoder = goog.require('protobuf.binary.BufferDecoder');
const WireType = goog.require('protobuf.binary.WireType');

/**
 * Returns wire type stored in a tag.
 * Protos store the wire type as the first 3 bit of a tag.
 * @param {number} tag
 * @return {!WireType}
 */
function tagToWireType(tag) {
  return /** @type {!WireType} */ (tag & 0x07);
}

/**
 * Returns the length, in bytes, of the field in the tag stream, less the tag
 * itself. Note: This may move the cursor in the bufferDecoder.
 * @param {!BufferDecoder} bufferDecoder
 * @param {number} start
 * @param {!WireType} wireType
 * @return {number}
 * @private
 */
function getTagLength(bufferDecoder, start, wireType) {
  switch (wireType) {
    case WireType.VARINT:
      bufferDecoder.setCursor(start);
      bufferDecoder.skipVarint();
      return bufferDecoder.cursor() - start;
    case WireType.FIXED64:
      return 8;
    case WireType.DELIMITED:
      const dataLength = bufferDecoder.getUnsignedVarint32At(start);
      return dataLength + bufferDecoder.cursor() - start;
    case WireType.START_GROUP:
      return getGroupTagLength(bufferDecoder, start);
    case WireType.FIXED32:
      return 4;
    default:
      throw new Error(`Invalid wire type: ${wireType}`);
  }
}

/**
 * Find the end tag of a group tag.
 * Note that we do not have to deal with recursive tags since those get skipped
 * in the indexer.
 * @param {!BufferDecoder} bufferDecoder
 * @param {number} start
 * @return {number}
 * @private
 */
function getGroupTagLength(bufferDecoder, start) {
  // On a start group we need to keep skipping fields until we find a
  // corresponding stop group
  let cursor = start;
  while (cursor < bufferDecoder.endIndex()) {
    const tag = bufferDecoder.getUnsignedVarint32At(cursor);
    const wireType = tagToWireType(tag);
    if (wireType === WireType.END_GROUP) {
      return bufferDecoder.cursor() - start;
    }
    cursor = bufferDecoder.cursor() +
        getTagLength(bufferDecoder, bufferDecoder.cursor(), wireType);
  }
  throw new Error('No end group found');
}

/**
 * @param {number} value
 * @return {number}
 */
function get32BitVarintLength(value) {
  let size = 1;
  while (value >= 128) {
    size++;
    value >>= 7;
  }
  return size;
}

exports = {
  getGroupTagLength,
  get32BitVarintLength,
  getTagLength,
  tagToWireType,
};
