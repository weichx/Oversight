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
            + functionAdvice.concat(propertyAdvice).join(" ") + '.';
    },
    targetNotObjectOrFunction: function () {
        return 'The target of an observer function must be a function or object';
    },
    targetOfSetGetNotObjectOrFunction: function (target) {
        return 'The target of a `set` or `get` function must be a function or an object. Your target was: ' + target;
    },
    missingCallback: function () {
        return 'You must provide a callback to all observer functions!'
    },
    proceedOutsideJoinpoint: function() {
        return 'proceed() cannot be called outside of an around function';
    },
    proceedCalledTwice: function() {
        return 'proceed() cannot be called twice in a given function';
    }
};

var assert = function (condition, msg) {
    if (!condition) throw new Error(msg);
};
