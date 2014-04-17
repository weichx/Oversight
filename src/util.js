var generateId = (function () {
    var id = 0;
    return function generateIdClosure() {
        return id++;
    }
})();

var generateFnAdviceFn = function (advice) {
    return function(target, prop, callback, context, remover) {
        return addObserver(target, advice, prop, callback, context, remover);
    };
};