var Oversight = {};

//constant declaring that whichever context called a given callback should be used
Oversight.UseCallingContext = -1; //'CALLING_CONTEXT';
var functionAdvice = ['before', 'after', 'around', 'afterReturn'];
var propertyAdvice = ['onGet', 'onSet', 'aroundSet', 'aroundGet'];

//ensures that a key in an object is observable.
var makeKeyObservable = function (target, key) {
    if (!target.__observers) target.__observers = Object.create(null);
    if (!target.__observers[key]) target.__observers[key] = Object.create(null);
};

//modifies an object's advice array to include `key` if it was missing.
var addAdviceToKey = function (target, key, advice) {
    if (!target.__observers[key][advice]) target.__observers[key][advice] = [];
};

//invokes apply for each observer type in `observerList` using `args` as arguments
//and `thisArg` for context.
var invokeApply = function(thisArg, observerList, args) {
    var i = observerList && observerList.length;
    var obj, ctx;
    while (i--) {
        obj = observerList[i];
        ctx = validateContext(thisArg, obj.contextId);
        if(ctx) {
            obj.fn.apply(ctx, args);
        } else {
            //if there is no context object, avoid a NullReferenceException by removing that observer
            observerList.splice(i, 1);
        }
    }
};

//invokes call for each observer type in `observerList` using `args` as arguments
//and `thisArg` for context.
var invokeCall = function(thisArg, observerList, arg0, arg1) {
    var i = observerList && observerList.length;
    var obj, ctx;
    while (i--) {
        obj = observerList[i];
        ctx = validateContext(thisArg, obj.contextId);
        if(ctx) {
            obj.fn.call(ctx, arg0, arg1);
        } else {
            //if there is no context object, avoid a NullReferenceException by removing that observer
            observerList.splice(i, 1);
        }
    }
};

//generate observer functions
Oversight.after = generateFnAdviceFn('after');
Oversight.before = generateFnAdviceFn('before');
Oversight.afterReturn = generateFnAdviceFn('afterReturn');
Oversight.around = generateFnAdviceFn('around');
Oversight.onGet = generateFnAdviceFn('onGet');
Oversight.onSet = generateFnAdviceFn('onSet');

//called on functions that are not attached to objects, similar to a C style free function
var observeFreeFunction = function (target, advice, callback, context, remover) {
    assert(target.__observers, Errors.targetNotObservable());
    assert(functionAdvice.indexOf(advice) !== -1, Errors.invalidFreeFunctionAdvice(advice));
    assert(typeof callback === 'function', Errors.missingCallback());

    var contextId = registerContext(context); //register context and use that reference to pass it around
    remover = remover || new Remover(advice);   //create a remover if we need one
    if (!target.__observers[advice]) target.__observers[advice] = [];
    var action = (advice === 'before') ? 'push' : 'unshift'; //based on the action, we need to either push this action
    //to the front of the queue or end to retain proper execution order.
    target.__observers[advice][action](new Observer(remover.removalId, callback, contextId));
    return remover;
};

//called on functions that are attached to objects
var observeTargetedFunction = function (target, path, advice, callback, context) {
    assert(typeof callback === 'function', Errors.missingCallback());
    assert(functionAdvice.indexOf(advice) !== -1 ||  propertyAdvice.indexOf(advice) !== -1,
        Errors.invalidTargetFunctionAdvice(advice)
    );
    if(!target.__observers) target.__observers = {};
    var contextId = registerContext(context); //register context and use that reference to pass it around
    var splitPath = path.split('.'); //we need the path as a string array for chains to work
    var remover = new Remover(advice, splitPath[splitPath.length - 1]);
    //if the path is part of a chain (ie one.two), create sub chains
    if (splitPath.length !== 1) {
        var chain = new Chain(splitPath, advice, callback, contextId, remover);
        chain.walkAndCreate(target);
    } else {
        //otherwise, just observify the key normally if needed
        makeKeyObservable(target, path);
        addAdviceToKey(target, path, advice);
        remover = remover || new Remover(advice, path);
        var action = (advice === 'before') ? 'push' : 'unshift' ;
        target.__observers[path][advice][action](new Observer(remover.removalId, callback, contextId));
        if (typeof target[path] === 'function' && !target.__observers[path].__observified) {
            target[path] = Oversight.observify(target, path, target[path]);
        }
    }
    return remover;
};

var addObserver = function (target, advice, path, callback, context) {
    assert(typeof target === 'object' || typeof target === 'function', Errors.targetNotObjectOrFunction());
    if (typeof path === 'string' && typeof advice === 'string') {
        context = context || target;
        var remover = observeTargetedFunction(target, path, advice, callback, context);
    } else {
        //reshuffle some variables for semantic sense
        context = callback;
        callback = path;
        context = context || target;
        remover = observeFreeFunction(target, advice, callback, context);
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
        invokeApply(this, observers.before, arguments);
        var retn = observers.original.apply(this, arguments);
        invokeApply(this, observers.after, arguments);
        Array.prototype.unshift.call(arguments, retn);
        invokeApply(this, observers.afterReturn, arguments);
        return retn;
    };

    var observified = function() {
        JoinPoint.setup(this, observers.around, arguments);
        var retn = Oversight.proceed();
        JoinPoint.teardown();
        return retn;
    };

    //free function case
    if (arguments.length === 1) {
        if(target.__observers) return target;
        fn = target;
        observified.__observers = {
            __observified: true
        };
        observers = observified.__observers;
    } else {
        observers = target.__observers[key];
        observers.__observified = true;
    }
    for (var item in fn) {
        if (fn.hasOwnProperty(item)) {
            observified[item] = fn[item];
        }
    }
    observers.around = observers.around || [];
    var lastIndex = observers.around.length - 1;
    var observerObject = new Observer(-1, baseObserverFn, Oversight.UseCallingContext);
    //make sure we aren't double adding the baseObserverFn, which can happen if a key was set to a fn, then unset, then reset
    if(observers.around[lastIndex] && observers.around[lastIndex].removalId === -1) {
        observers.around[observers.around.length - 1] = observerObject;
    } else {
        observers.around.push(observerObject);
    }
    observers.original = fn;
    observified.prototype = fn.prototype;
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
    assert(typeof target === 'function' || typeof target === 'object',
        Errors.targetOfSetGetNotObjectOrFunction(target));

    if (target.__observers && target.__observers[prop]) {
        var oldValue = target[prop];
        var observers = target.__observers[prop];
        if (typeof value === 'function') {
            //need a full on observify here to inherit prototype and constructor attributes,
            //close over new variables, and remove the old around[around.length - 1]
            target[prop] = Oversight.observify(target, prop, value);
        } else {
            //make sure we delete the reference to any original fns so it's gc'd if need be
            observers.original = null;
            target[prop] = value;
        }
        var newValue = target[prop];
        var onSetObservers = observers.onSet;
        invokeCall(this, onSetObservers, newValue, oldValue);
        var chains = target.__observers.__chains;
        var i = chains && chains.length;
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
    assert(typeof target === 'function' || typeof target === 'object',
        Errors.targetOfSetGetNotObjectOrFunction(target));

    var retn = target[prop];
    if (target.__observers && target.__observers[prop]) {
        var observers = target.__observers[prop];
        if (typeof retn === 'function' && observers.__observified) {
            retn = observers.original;
        }
        var onGetObservers = observers.onGet;
        invokeCall(this, onGetObservers, retn);
    }
    return retn;
};

//todo consider an onDestroy hook
//todo might need an object to store all it's removers?
Oversight.destroy = function(target) {
    destroyContext(target);
};


//todo this isn't yet functional
Oversight.removeAllObservers = function(target) {
    //remove downward chains
    var chains = target.__observers.chains;
    if(chains) {
        var i = chains.length;
        while(i--) {
            //todo maybe target[prop] instead of target?
            chains[i].next.walkAndDestroy(target);
        }
    }
    delete target.__observers;
};