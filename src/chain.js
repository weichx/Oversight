/*
* Chains provide observer 'memory', it enables a node to remember if it should be listening for method calls or
* property access on a given key, even if that key's value is removed or reassigned.
* */
var Chain = function(path, advice, callback, contextId, remover, depth) {
    this.path = path;   //the path of this chain
    this.advice = advice; //before, after, etc
    this.callback = callback; //method to invoke
    this.contextId = contextId; //which context to invoke the callback with
    this.depth = depth || 0;   // how deep is this chain in the path
    this.remover = remover;    // reference to the remover object
    this.keyName = path[this.depth];  //the keyName this chain corresponds to
    this.next = null;          //next item in linked list of chain objects
};

//might not need this but allows matching become more complex if needed later
Chain.prototype.matches = function(keyName) {
    return this.keyName === keyName;
};

//walks down the chain and destroys objects as it goes so long as more chains exist.
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

//walks the chain and created objects as needed, setting up proper observers
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