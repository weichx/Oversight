var JoinPoint = {
    stackItem: null,
    setup: function(context, fnStack, args) {
        this.stackItem = {
            context: context,
            functionStack: fnStack,
            functionStackPointer: 0,
            calledFor: {},
            args: args
        };
    },
    teardown: function() {
        this.stackItem = null;
    }
};

Oversight.proceed = function() {
    var stackItem = JoinPoint.stackItem;
    if (stackItem) {
        var nextFn = stackItem.functionStack[stackItem.functionStackPointer++];
        assert(!stackItem.calledFor[stackItem.functionStackPointer], Errors.proceedCalledTwice());
        if (nextFn) {
            stackItem.calledFor[stackItem.functionStackPointer] = true;
            if (arguments.length !== 0) stackItem.args = arguments;
            var ctx = validateContext(stackItem.context, nextFn.contextId);
            var retn;
            if(ctx) {
                retn = nextFn.fn.apply(ctx, stackItem.args);
                stackItem.functionStackPointer--;
            } else {
                //todo some trickery here with splicing --  make sure to test it
                //splice it here
            }
            return retn;
        }
    }
    assert(false, Errors.proceedOutsideJoinpoint());
    return undefined;
};