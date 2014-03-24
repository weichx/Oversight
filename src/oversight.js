var Chain = function(path, advice, callback, context, remover, depth) {
    this.path = path;
    this.advice = advice;
    this.callback = callback;
    this.context = context;
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
        Oversight.makeKeyObservable(target, this.path[this.depth]);
        if(this.depth === this.path.length - 1) {
            Oversight[this.advice](target, this.path[this.depth], this.callback, this.context, this.remover);
        } else {
            var observers = target.__observers;
            observers.__chains = observers.__chains || [];
            observers.__chains.push(this);
            this.next = new Chain(this.path, this.advice, this.callback, this.context, this.remover, ++this.depth);
            this.next.walkAndCreate(target[this.keyName]);
        }
    }
};

var JoinPoint = {
    stack:  [],
    topStackItem: null,
    setup: function(context, fnStack, args) {
        this.topStackItem = {
            context: context,
            functionStack: fnStack,
            functionStackPointer: 0,
            args: args
        };
        this.stack.push(this.topStackItem);
    },
    teardown: function() {
        this.stack.pop();
        this.topStackItem = null;
    }
};

var Errors = {
    //todo this might also be because advice was not provided if result of addObserver
    targetNotObservable: function () {
        return "Target is not observable. The target of an observer function must of type `function` or `object`. " +
            "If you are observing a free function (any function that is not invoked via obj.myFn) use `var fn = Oversight.observify(fn)`" +
            " on your function first, then use the returned reference as input to Oversight observe functions.";
    },
    invalidFreeFunctionAdvice: function (advice) {
        return 'The given function advice: ' + advice + ', is not valid. Free functions ' +
            'can only take function advice: [before, after, afterReturn, around]';
    },
    invalidTargetFunctionAdvice: function (advice) {
        return 'The given function advice: ' + advice + ', is not valid. Valid advice for ' +
            'this target object is: '
            + Oversight.functionAdvice.concat(Oversight.propertyAdvice).join(" ") + '.';

    },
    targetNotObjectOrFunction: function () {
        return 'The target of an observer function must be a function or object';
    },
    targetOfSetGetNotObjectOrFunction: function (target) {
        return 'The target of a `set` or `get` function must be a function or an object. Your target was: ' + target;
    },
    missingCallback: function () {
        return 'You must provide a callback to all observer functions!'
    }
};
var createRemover = function (advice, key) {
    return {
        removalId: generateNextObserverId(),
        advice: advice,
        key: key
    };
};

var createObserverObject = function (removalId, fn, ctx) {
    return {
        removalId: removalId,
        fn: fn,
        ctx: ctx
    };
};

var Oversight = {};
Oversight.functionAdvice = ['before', 'after', 'around', 'afterReturn'];
Oversight.propertyAdvice = ['onGet', 'onSet', 'aroundSet', 'aroundGet'];

Oversight.proceed = function() {
    var stackItem = JoinPoint.topStackItem;
    if (!stackItem) return undefined;
    var nextFn = stackItem.functionStack[stackItem.functionStackPointer++];
    if (nextFn) {
        if (arguments.length != 0) stackItem.args = arguments;
        return nextFn.fn.apply(nextFn.context, stackItem.args);
    }
    return undefined;
};

Oversight.assert = function (condition, msg) {
    if (!condition) throw  new Error(msg);
};

Oversight.makeKeyObservable = function (target, key) {
    if (!target.__observers) target.__observers = Object.create(null);
    if (!target.__observers[key]) target.__observers[key] = Object.create(null);
};

Oversight.addAdviceToKey = function (target, key, advice) {
    if (!target.__observers[key][advice]) target.__observers[key][advice] = [];
};

Oversight.onGet = function (target, prop, fn, ctx, remover) {
    remover = remover || createRemover('onGet', prop);
    this.makeKeyObservable(target, prop);
    this.addAdviceToKey(target, prop, 'onGet');
    target.__observers[prop].onGet.push(createObserverObject(remover.removalId, fn, ctx));
    return remover;
};

Oversight.onSet = function (target, prop, fn, ctx, remover) {
    remover = remover || createRemover('onSet', prop);
    this.makeKeyObservable(target, prop);
    this.addAdviceToKey(target, prop, 'onSet');
    target.__observers[prop].onSet.push(createObserverObject(remover.removalId, fn, ctx));
    return remover;
};

var generateFnAdviceFn = function (advice) {
    return function (target, prop, fn, ctx, remover) {
        this.makeKeyObservable(target, prop);
        this.addAdviceToKey(target, prop, advice);
        remover = remover || createRemover(advice, prop);
        target.__observers[prop][advice].push(createObserverObject(remover.removalId, fn, ctx));
        if (typeof target[prop] === 'function' && !target[prop].__observified) {
            target[prop] = Oversight.observify(target, prop, target[prop]);
        }
        return remover;
    }
};

Oversight.after = generateFnAdviceFn('after');
Oversight.before = generateFnAdviceFn('before');
Oversight.afterReturn = generateFnAdviceFn('afterReturn');

var generateNextObserverId = (function () {
    var id = 0;
    return function generateNextObserverIdClosure() {
        return id++;
    }
})();

//private
Oversight.observeFreeFunction = function (target, advice, callback, context, remover) {
    Oversight.assert(target.__observers, Errors.targetNotObservable());
    Oversight.assert(Oversight.functionAdvice.indexOf(advice) !== -1, Errors.invalidFreeFunctionAdvice(advice));
    Oversight.assert(typeof callback === 'function', Errors.missingCallback());

    remover = remover || createRemover(advice);
    if (!target.__observers[advice]) target.__observers[advice] = [];
    target.__observers[advice].push(createObserverObject(remover.removalId, callback, context));
    return remover;
};

//private
Oversight.observeTargetedFunction = function (target, path, advice, callback, context) {
    Oversight.assert(
        Oversight.functionAdvice.indexOf(advice) !== -1 ||
            Oversight.propertyAdvice.indexOf(advice) !== -1,
        Errors.invalidTargetFunctionAdvice(advice)
    );
    Oversight.assert(typeof callback === 'function', Errors.missingCallback());

    var splitPath = path.split('.');
    var remover = createRemover(advice, splitPath[splitPath.length - 1]);
    if (splitPath.length !== 1) {
        var chain = new Chain(splitPath, advice, callback, context, remover);
        chain.walkAndCreate(target);
    } else {
        Oversight[advice](target, path, callback, context, remover);
    }
    return remover;
};

//private? probably better to call this through Oversight.before, after, etc
Oversight.addObserver = function (target, path, advice, callback, context) {
    Oversight.assert(typeof target === 'object' || typeof target === 'function', Errors.targetNotObjectOrFunction());
    //context = Oversight.register(target, context); register context and use that reference to pass it around
    var remover;
    if (typeof path === 'string' && typeof advice === 'string') {
        remover = Oversight.observeTargetedFunction(target, path, advice, callback, context);
    } else {
        //reshuffle some variables for semantic sense
        context = callback;
        callback = advice;
        advice = path;
        remover = Oversight.observeFreeFunction(target, advice, callback, context);
    }
    return remover;
};

Oversight.remove = function (target, remover) {
    if (target.__observers) {
        var advice = remover.advice;
        var removalId = remover.removalId;
        var key = remover.key;
        var searchList = (key) ? target.__observers[key][advice] : target.__observers[advice];
        var i = searchList && searchList.length;
        while (i--) {
            if (searchList[i].removalId === removalId) {
                searchList.splice(i, 1);
            }
        }
    }
};

Oversight.observify = function (target, key, fn) {
    var observers = null;

    //todo use a flag to generate this function, would let us use call instead of apply for massive speed boost
    //todo use another flag to generate this function and unroll it
    var baseObserverFn = function observifiedFunction() {
        var before = observers.before;
        var after = observers.after;
        var afterReturn = observers.afterReturn;
        var i = before && before.length;
        var obj = null;
        while (i--) {
            obj = before[i];
            obj.fn.apply(obj.ctx, arguments);
        }
        var retn = observers.original.apply(this, arguments);
        i = after && after.length;
        while (i--) {
            obj = after[i];
            obj.fn.apply(obj.ctx, arguments);
        }
        Array.prototype.unshift.call(arguments, retn);
        i = afterReturn && afterReturn.length;
        while (i--) {
            obj = afterReturn[i];
            obj.fn.apply(obj.ctx, arguments);
        }
        return retn;
    };

    var observified = function() {
        JoinPoint.setup(this, observers.aroundStack, arguments);
        var retn = Oversight.proceed();
        JoinPoint.teardown();
        return retn;
    };

    //free function case
    if (arguments.length === 1) {
        observified.__observers = {
            original: target,
            aroundStack: [{removalId:NaN, ctx:null, fn:baseObserverFn}]
        };
        observers = observified.__observers;
        observified.prototype = target.prototype;
        for (var item in target) {
            if (target.hasOwnProperty(item)) {
                observified[item] = target[item];
            }
        }
    } else {
        observers = target.__observers[key];
        observers.aroundStack = [{removalId:NaN, ctx:null, fn:baseObserverFn}];
        observers.original = fn;
        observified.prototype = fn.prototype;
        for (item in fn) {
            if (fn.hasOwnProperty(item)) {
                observified[item] = fn[item];
            }
        }
    }
    observified.__observified = true;
    return observified;
};
//todo| consider a partial version of `set` and `get` that could be 'plugged in' to
//todo| another library's set and get. this partial version does the observers but
//todo| does not actually do any value setting. Fires as an around of other set/get
//important to note that set/get family of functions only accept keys, not paths
//this is because we may encounter something undefined along the way and do not
//want to assume an object should be there. Also for performance, set/get should
//be as fast as possible and splitting an input string and traversing the path
//adds extra bloat to this code which should be lean.
Oversight.unboundSet = function (target, prop, value) {
    Oversight.assert(typeof target === 'function' || typeof target === 'object',
        Errors.targetOfSetGetNotObjectOrFunction(target));

    if (target.__observers && target.__observers[prop]) {
        var oldValue = target[prop];
        var observers = target.__observers[prop];
        //todo can optimize this somewhat for replacing a fn with another fn
        if (typeof value === 'function') {
            target[prop] = Oversight.observify(target, prop, value);
        } else {
            observers.original = null;
            target[prop] = value;
        }
        var newValue = target[prop];
        var onSetObservers = observers.onSet;
        var i = onSetObservers && onSetObservers.length;
        while (i--) {
            var obj = onSetObservers[i];
            obj.fn.call(obj.context, newValue, oldValue);
        }
        var chains = target.__observers.__chains;
        i = chains && chains.length;
        while(i--) {
            if(chains[i].matches(prop)) {
                chains[i].next.walkAndDestroy(oldValue);
                chains[i].next.walkAndCreate(newValue);
            }
        }
    } else {
        target[prop] = value;
    }
};

Oversight.unboundGet = function (target, prop) {
    Oversight.assert(
        typeof target === 'function' || typeof target === 'object',
        Errors.targetOfSetGetNotObjectOrFunction(target)
    );

    var retn = target[prop];
    if (target.__observers && target.__observers[prop]) {
        var observers = target.__observers[prop];
        if (typeof retn === 'function' && retn.__observified) {
            retn = observers.original;
        }
        var onGetObservers = observers.onGet;
        if (onGetObservers) {
            var i = onGetObservers.length;
            while (i--) {
                var obj = onGetObservers[i];
                obj.fn.call(obj.context, retn);
            }
        }
    }
    return retn;
};

Oversight.Errors = Errors;
var module = module || {};
module.exports = Oversight;