//generic unique Id generator
var generateId = (function () {
    var id = 0;
    return function generateIdClosure() {
        return id++;
    }
})();

//function that generates advice functions
var generateFnAdviceFn = function (advice) {
    return function(target, prop, callback, context, remover) {
        return addObserver(target, advice, prop, callback, context, remover);
    };
};