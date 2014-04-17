var Oversight = require('../dist/oversight-test.js');
var assert = require('../node_modules/chai/chai.js').assert;
var sinon = require('../node_modules/sinon/lib/sinon.js');

describe('observify tests', function () {
    it('will not observify an already observified function', function () {
        var original = function () {
        };
        var fn = Oversight.observify(original);
        var fn2 = Oversight.observify(fn);
        assert.equal(fn, fn2);
    });

    it('will observify target function keys with function listeners', function () {
        var target = {
            fn: function () {
            }
        };
        assert.notOk(target.fn.__observified);
        Oversight.before(target, 'fn', function () {
        });
        assert.ok(target.__observers['fn'].__observified);
    });

    it('will not observify value fn of target fn', function() {
        var target = {
            fn: function(){}
        };
        assert.notOk(target.fn.__observified);
        Oversight.before(target, 'fn', function() {

        });
        assert.notOk(target.__observers['fn'].__observers);
    });

    it('will invoke observified functions after target functions', function () {
        var target = {
            fn: function () {
            }
        };
        target.fn = Oversight.observify(target.fn);
        assert.ok(target.fn.__observers, 'should be observified');
        var beforeSpy0 = sinon.spy();
        var beforeSpy1 = sinon.spy();
        Oversight.before(target.fn, beforeSpy0);
        Oversight.before(target, 'fn', beforeSpy1);
        target.fn();
        assert.ok(beforeSpy0.calledOnce, 'should invoke beforeSpy0');
        assert.ok(beforeSpy1.calledOnce, 'should invoke beforeSpy1');
        assert.ok(beforeSpy0.calledAfter(beforeSpy1), 'should call beforeSpy1 before beforeSpy0')
    });

    it('will not call the original method twice when resetting an observified function key', function() {
        var originalSpy = sinon.spy();
        var afterSpy = sinon.spy();
        var target = {
            fn: originalSpy
        };
        Oversight.after(target, 'fn', afterSpy);
        Oversight.unboundSet(target, 'fn', null);
        Oversight.unboundSet(target, 'fn', originalSpy);
        assert.ok(target.__observers['fn'].around.length === 1, 'should have only one around');
    });
});