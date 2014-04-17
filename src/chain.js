var Chain = function(path, advice, callback, contextId, remover, depth) {
    this.path = path;
    this.advice = advice;
    this.callback = callback;
    this.contextId = contextId;
    this.depth = depth || 0;
    this.remover = remover;
    this.keyName = path[this.depth];
    this.next = null;
};

Chain.prototype.matches = function(keyName) {
    return this.keyName === keyName;
};

Chain.prototype.walkAndDestroy = function(target) {
    if(target) {
        var chains = target.__observers.__chains;
        var i = chains.indexOf(this);
        chains.splice(i, 1);
        if(this.depth === this.path.length - 1) {
            Oversight.remove(target[this.keyName], this.remover);
        } else {
            this.next.walkAndDestroy(target[this.keyName]);
        }
    }
};

Chain.prototype.walkAndCreate = function(target) {
    if(target) {
        makeKeyObservable(target, this.path[this.depth]);
        if(this.depth === this.path.length - 1) {
            Oversight[this.advice](target, this.path[this.depth], this.callback, this.contextId, this.remover);
        } else {
            var observers = target.__observers;
            observers.__chains = observers.__chains || [];
            observers.__chains.push(this);
            this.next = new Chain(this.path, this.advice, this.callback, this.contextId, this.remover, ++this.depth);
            this.next.walkAndCreate(target[this.keyName]);
        }
    }
};