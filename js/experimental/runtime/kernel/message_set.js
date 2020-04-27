goog.module('protobuf.runtime.MessageSet');

const InternalMessage = goog.require('protobuf.binary.InternalMessage');
const Kernel = goog.require('protobuf.runtime.Kernel');

/**
 * @implements {InternalMessage}
 * @final
 */
class MessageSet {
  /**
   * @param {!Kernel} kernel
   * @return {!MessageSet}
   */
  static fromKernel(kernel) {
    return new MessageSet(kernel);
  }

  /**
   * @return {!MessageSet}
   */
  static createEmpty() {
    return MessageSet.fromKernel(Kernel.createEmpty());
  }

  /**
   * @param {!Kernel} kernel
   * @private
   */
  constructor(kernel) {
    /** @const {!Kernel} @private */
    this.kernel_ = kernel;

    /** @private {?Map<number, !MessageSet.Item>} */
    this.index_ = null;
  }

  /** @return {!Iterable<!MessageSet.Item>} */
  getItems() {
    return this.getIndex_().values();
  }

  /**
   * @param {number} index
   * @return {!MessageSet.Item}
   */
  getItemElement(index) {
    return this.kernel_.getRepeatedGroupElement(
        1, MessageSet.Item.fromKernel, index);
  }

  /**
   * @return {number}
   */
  getItemCount() {
    return this.getIndex_().size;
  }

  // code helpers for code gen

  /**
   * @param {number} typeId
   * @param {function(!Kernel):T} instanceCreator
   * @param {number=} pivot
   * @return {?T}
   * @template T
   */
  getMessageOrNull(typeId, instanceCreator, pivot) {
    const item = this.findItem_(typeId);
    return item && item.getMessageOrNull(instanceCreator, pivot);
  }

  /**
   * @param {number} typeId
   * @param {number=} pivot
   * @return {?Kernel}
   * @template T
   */
  getMessageAccessorOrNull(typeId, pivot) {
    const item = this.findItem_(typeId);
    return item && item.getMessageAccessorOrNull(pivot);
  }

  /**
   * @param {number} typeId
   * @param {function(!Kernel):T} instanceCreator
   * @param {number=} pivot
   * @return {T}
   * @template T
   */
  getMessageAttach(typeId, instanceCreator, pivot) {
    let item = this.findItem_(typeId);
    if (item) {
      return item.getMessageAttach(instanceCreator, pivot);
    }
    const message = instanceCreator(Kernel.createEmpty());
    this.setMessage(typeId, message);
    return message;
  }

  /**
   * @param {number} typeId
   */
  clearMessage(typeId) {
    if (this.getIndex_().delete(typeId)) {
      this.setItems_();
    }
  }

  /**
   * @param {number} typeId
   * @return {boolean}
   */
  hasMessage(typeId) {
    return this.getIndex_().has(typeId);
  }

  /**
   * @param {number} typeId
   * @param {!InternalMessage} value
   */
  setMessage(typeId, value) {
    const item = this.findItem_(typeId);
    if (item) {
      item.setMessage(value);
    } else {
      this.getIndex_().set(typeId, MessageSet.Item.create(typeId, value));
      this.setItems_();
    }
  }

  /**
   * @return {!Kernel}
   * @override
   */
  internalGetKernel() {
    return this.kernel_;
  }

  /**
   * @return {!Map<number, !MessageSet.Item>}
   * @private
   */
  getIndex_() {
    if (this.index_) {
      return this.index_;
    }
    const index = new Map();
    let totalCount = 0;
    for (const item of this.kernel_.getRepeatedGroupIterable(
             1, MessageSet.Item.fromKernel)) {
      index.set(item.getTypeId(), item);
      totalCount++;
    }
    this.index_ = index;
    // Normalize the entries.
    if (totalCount > index.size) {
      this.setItems_();
    }
    return index;
  }

  /** @private */
  setItems_() {
    this.kernel_.setRepeatedGroupIterable(1, this.index_.values());
  }

  /**
   * @param {number} typeId
   * @return {?MessageSet.Item}
   * @private
   */
  findItem_(typeId) {
    return this.getIndex_().get(typeId);
  }
}

/**
 * @implements {InternalMessage}
 * @final
 */
MessageSet.Item = class {
  /**
   * @param {number} typeId
   * @param {!InternalMessage} value
   * @return {!MessageSet.Item}
   */
  static create(typeId, value) {
    const kernel = Kernel.createEmpty();
    kernel.setInt32(2, typeId);
    kernel.setMessage(3, value);
    return new MessageSet.Item(kernel);
  }

  /**
   * @param {!Kernel} kernel
   * @return {!MessageSet.Item}
   */
  static fromKernel(kernel) {
    return new MessageSet.Item(kernel);
  }

  /**
   * @param {!Kernel} kernel
   * @private
   */
  constructor(kernel) {
    /** @const {!Kernel} @private */
    this.kernel_ = kernel;
  }

  /**
   * @param {function(!Kernel):T} instanceCreator
   * @param {number=} pivot
   * @return {T}
   * @template T
   */
  getMessage(instanceCreator, pivot) {
    return this.kernel_.getMessage(3, instanceCreator, pivot);
  }

  /**
   * @param {function(!Kernel):T} instanceCreator
   * @param {number=} pivot
   * @return {?T}
   * @template T
   */
  getMessageOrNull(instanceCreator, pivot) {
    return this.kernel_.getMessageOrNull(3, instanceCreator, pivot);
  }

  /**
   * @param {function(!Kernel):T} instanceCreator
   * @param {number=} pivot
   * @return {T}
   * @template T
   */
  getMessageAttach(instanceCreator, pivot) {
    return this.kernel_.getMessageAttach(3, instanceCreator, pivot);
  }

  /**
   * @param {number=} pivot
   * @return {?Kernel}
   */
  getMessageAccessorOrNull(pivot) {
    return this.kernel_.getMessageAccessorOrNull(3, pivot);
  }

  /**
   * @param {!InternalMessage} value
   */
  setMessage(value) {
    this.kernel_.setMessage(3, value);
  }

  /** @return {number} */
  getTypeId() {
    return this.kernel_.getInt32WithDefault(2);
  }

  /**
   * @return {!Kernel}
   * @override
   */
  internalGetKernel() {
    return this.kernel_;
  }
};

exports = MessageSet;
