var Observer = function(removalId, fn, contextId) {
    this.removalId = removalId;
    this.fn = fn;
    this.contextId = contextId;
};