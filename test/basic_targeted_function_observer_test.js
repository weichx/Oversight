var Oversight = require('../src/oversight');
var assert = require('../node_modules/chai/chai.js').assert;

describe('Targeted unchained function observers -> ', function() {
    var target;
    beforeEach(function() {
        target = {
            fn: function() { return 'original' }
        };
    });

    it('correctly calls observify on keys when function advice is added', function() {
        target = {
            someKey: function() { return 5; }
        };
        Oversight.addObserver(target, 'someKey', 'before', function(){});
        assert.ok(target.someKey);
        assert.ok(target.someKey.__observified);
        assert.equal(target.__observers.someKey.original(), 5);
    });

    it('returns the original functions return value', function() {
        var retn = target.fn();
        assert.ok(retn);
        Oversight.addObserver(target, 'fn', 'before', function(){});
        assert.equal(retn, target.fn());
    });

    it('correctly retains the prototype of an input function', function() {
        var fn = function(){};
        fn.prototype.something = 2;
        target.fn = fn;
        Oversight.addObserver(target, 'fn', 'before', function(){});
        assert.notEqual(target.fn, fn);
        assert.equal(target.fn.prototype, fn.prototype);
        target.fn.prototype.somethingElse = 4;
        assert.equal(target.fn.prototype.somethingElse, fn.prototype.somethingElse);
    });

    it('correctly retains any function-object level values on the input if input is a function', function() {
        var targetFn = function() {};
        targetFn.someStaticProperty = 5;
        target.targetFn = targetFn;
        Oversight.addObserver(target, 'targetFn', 'before', function(){});
        assert.notEqual(targetFn, target.targetFn);
        assert.equal(target.targetFn.someStaticProperty, targetFn.someStaticProperty);
    });

    it('correctly returns an instance object when called with new', function() {
        target.point = function(x) {
            this.x = x;
            this.y = 10;
        };
        target.point.prototype.someFn = function() {
            return this.x + this.y;
        };
        var p = target.point;
        Oversight.addObserver(target, 'point', 'before', function(){});
        assert.notEqual(p, target.point);
        var point = new target.point(5);
        assert.equal(point.someFn(), 15);
        assert.ok(point);
        assert.equal(point.x, 5);
        assert.equal(point.y, 10);
    });

    it('correctly handles an unchained before function', function() {
        var called = false;
        var original = function() { assert.ok(called); };
        var beforeFn = function() { called = true; };
        target.fn = original;
        Oversight.addObserver(target, 'fn', 'before', beforeFn);
        target.fn();
        assert.ok(called);
    });

    it('can handle handle an unchained after function', function() {
        var called = false;
        var after  = false;
        var original = function() { called = true; assert.notOk(after); };
        var afterFn = function() { assert.ok(called); after = true; };
        target.fn = original;
        Oversight.addObserver(target, 'fn', 'after', afterFn);
        target.fn();
        assert.ok(after);
    });

    it('can handle handle an unchained afterReturn function', function() {
        var called = false;
        var afterReturn  = false;
        var original = function() { called = true; assert.notOk(afterReturn); };
        var afterReturnFn = function() { assert.ok(called); afterReturn = true; };
        target.fn = original;
        Oversight.addObserver(target, 'fn', 'afterReturn', afterReturnFn);
        target.fn();
        assert.ok(afterReturn);
    });

    it('can handle an unchained onSet function', function() {
        var i = 0;
        Oversight.addObserver(target, 'fn', 'onSet', function(newValue, oldValue) {
            i = newValue;
        });
        Oversight.unboundSet(target,'fn', 5);
        assert.equal(i, 5);
    });

    it('can handle an unchained onSet with a function key being set, should retain function observers', function() {
        var i = 0;
        Oversight.addObserver(target, 'fn', 'onSet', function(newValue, oldValue) {
        });
        Oversight.addObserver(target, 'fn', 'before', function() {
            i++;
        });
        assert.equal(i, 0);
        target.fn();
        assert.equal(i, 1);
        Oversight.unboundSet(target, 'fn', function() {
            i++;
        });
        target.fn();
        assert.equal(i, 3);
    });

    it('can handle an unchained observer of a non existent key', function() {
        var i = 0;
        Oversight.addObserver(target, 'notHereYet', 'before', function() {
            i++;
        });
        assert.notOk(target.notHereYet);
        Oversight.unboundSet(target, 'notHereYet', function() {
            i++;
        });
        target.notHereYet();
        assert.equal(i, 2);
    });

    it('can handle an unchained onGet observer', function() {
        var got = false;
        Oversight.addObserver(target, 'fn', 'onGet', function() {
            got = true;
        });
        Oversight.unboundGet(target, 'fn');
        assert.ok(got);
    });

    it('correctly returns the original function when onGet is called on an observed function key', function() {
        var original = target.fn;
        Oversight.addObserver(target, 'fn', 'before', function() {});
        assert.notEqual(original, target.fn);
        var retn = Oversight.unboundGet(target, 'fn');
        assert.equal(retn, original);
    });

    it('does not overwrite observers when adding another', function() {
        var i = 0;
        var original = function() { i++; };
        var before1 = function() { i++; };
        var before2 = function() { i++; };
        target.fn = original;
        Oversight.addObserver(target, 'fn', 'before', before1);
        Oversight.addObserver(target, 'fn', 'before', before2);
        target.fn();
        assert.equal(i, 3);
    });

    it('can use removers to remove observer functions', function() {
        var i = 0;
        var original = function() { i++; };
        var before = function() { i++; };
        target.fn = original;
        var remover = Oversight.addObserver(target, 'fn', 'before', before);
        target.fn();
        assert.equal(i, 2);
        Oversight.remove(target, remover);
        target.fn();
        assert.equal(i, 3);
    });

    it('only removes what should be removed', function() {
        var i = 0;
        var original = function() { i++; };
        var before = function() { i++; };
        target.fn = original;
        var remover1 = Oversight.addObserver(target, 'fn', 'before', before);
        var remover2 = Oversight.addObserver(target, 'fn', 'before', before);
        target.fn();
        assert.equal(i, 3);
        Oversight.remove(target, remover1);
        target.fn();
        assert.equal(i, 5);
    });

    it('fails on non objects', function() {
        assert.throws(function() {
            Oversight.addObserver(undefined, 'fn', 'before', function(){});
        }, Oversight.Errors.targetNotObjectOrFunction());
    });

    it('fails on non function or invalid advice', function() {
        assert.throws(function() {
            Oversight.addObserver(target, 'fn', 'not_valid', function(){});
        }, Oversight.Errors.invalidTargetFunctionAdvice('not_valid'));
    });

    it('fails without a callback', function() {
        assert.throws(function() {
            Oversight.addObserver(target, 'fn', 'before');
        }, Oversight.Errors.missingCallback());
    });

    it('injects the return value into the parameter list of afterReturn callbacks', function() {
        var retn = 'Oversight is awesome!';
        var asserted = false;
        var original = function() { return retn; };
        var afterReturnFn = function(returnValue) {
            assert.equal(returnValue, retn);
            asserted = true;
        };
        var observed = Oversight.observify(original);
        target.fn = original;
        Oversight.addObserver(target, 'fn', 'afterReturn', afterReturnFn);
        target.fn();
        assert.ok(asserted);
    });

});