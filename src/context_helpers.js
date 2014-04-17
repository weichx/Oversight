var contexts = {};
var registerContext = function(context) {
    if(context === Oversight.UseCallingContext) return Oversight.UseCallingContext;
    //for chained functions the context is created on chain creation
    //and so it is already registered
    if(typeof context === 'number') return context;
    //otherwise add an id to this context (making sure it has an observers hash)
    //register the context, then return the generated id which will be
    //used by observify functions to lookup the context they are to be called with.
    if(!context.__observers) context.__observers = {};
    if(!context.__observers.__contextId) {
        context.__observers.__contextId = generateId();
        contexts[context.__observers.__contextId] = context;
    }
    return context.__observers.__contextId;
};

var validateContext = function(thisArg, contextId) {
    if(contextId === Oversight.UseCallingContext) return thisArg;
    return contexts[contextId];
};

var destroyContext = function(target) {
    if(target.__observers) {
        if(target.__observers.__contextId) {
            delete contexts[target.__observers.__contextId];
        }
    }
};