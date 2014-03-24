var Oversight = require('../src/oversight');
var assert = require('../node_modules/chai/chai.js').assert;
var sinon = require('../node_modules/sinon/lib/sinon.js');
describe('Chained observer tests -> ', function () {

    var testEmpty;
    var testFull;
    beforeEach(function () {
        testEmpty = {};
        testFull = {
            level1: {
                level2: {
                    fn: function () {
                        return 'Original';
                    }
                }
            }
        }
    });

    it('correctly observifies key paths when advice is added', function() {
        assert.notOk(testFull.__observers);
        Oversight.addObserver(testFull, 'some.long.path', 'before', function() {});
        assert.ok(testFull.__observers['some']);
    });

    it('returns the original functions return value', function() {
        var originalRetn = testFull.level1.level2.fn();
        Oversight.addObserver(testFull, 'level1.level2.fn', 'before', function(){});
        var modifiedRetn = testFull.level1.level2.fn();
        assert.equal(originalRetn, modifiedRetn);
    });

    it('correctly retains the prototype of an input function', function() {
        testFull.level1.level2.fn.prototype.something = 5;
        var beforeModified = testFull.level1.level2.fn;
        Oversight.addObserver(testFull, 'level1.level2.fn', 'before', function(){});
        assert.notEqual(beforeModified, testFull.level1.level2.fn);
        assert.strictEqual(beforeModified.prototype, testFull.level1.level2.fn.prototype);
    });

    it('correctly retains any function-object level values on the input if input is a function', function() {
        var original = testFull.level1.level2.fn;
        var originalSpy = sinon.spy(original);
        originalSpy.someProperty = 5;
        testFull.level1.level2.fn = originalSpy;
        Oversight.addObserver(testFull, 'level1.level2.fn', 'before', function(){});
        var modified = testFull.level1.level2.fn;
        assert.notEqual(modified, original);
        assert.equal(modified.someProperty, originalSpy.someProperty)
    });

    it('correctly returns an instance object when called with new', function() {
        testFull.level1.level2.point = function(x, y) {
            this.x = x;
            this.y = y;
        };
        testFull.level1.level2.point.prototype.someFn = function() {
            return this.x + this.y;
        };
        var original = testFull.level1.level2.point;
        var beforeSpy = sinon.spy();
        Oversight.addObserver(testFull, 'level1.level2.point', 'before', beforeSpy);
        var point = new testFull.level1.level2.point(5,5);
        assert.ok(beforeSpy.calledOnce);
        assert.ok(point);
        assert.instanceOf(point, original);
        assert.equal(point.x, 5);
        assert.equal(point.y, 5);
        assert.notEqual(original, testFull.level1.level2.point);
        assert.equal(10, point.someFn());
    });

    it('can handle a two level chain', function () {
        var spy = sinon.spy();
        Oversight.addObserver(testFull, 'level1.level2', 'onSet', spy);
        Oversight.unboundSet(testFull.level1, 'level2', {});
        assert.ok(spy.calledOnce);
    });

    it('can handle a three level chain', function() {
        var originalSpy = sinon.spy();
        var beforeSpy = sinon.spy();
        testFull.level1.level2.fn = originalSpy;
        Oversight.addObserver(testFull, 'level1.level2.fn', 'before', beforeSpy);
        testFull.level1.level2.fn();
        assert.ok(originalSpy.calledOnce);
        assert.ok(beforeSpy.calledOnce);
        assert.ok(beforeSpy.calledBefore(originalSpy));
    });

    it('can handle a before function', function() {
        var originalSpy = sinon.spy();
        var beforeSpy = sinon.spy();
        testFull.level1.level2.fn = originalSpy;
        Oversight.addObserver(testFull, 'level1.level2.fn', 'before', beforeSpy);
        testFull.level1.level2.fn();
        assert.ok(originalSpy.calledOnce);
        assert.ok(beforeSpy.calledOnce);
        assert.ok(beforeSpy.calledBefore(originalSpy));
    });

    it('can handle an after function', function() {
        var originalSpy = sinon.spy();
        var afterSpy = sinon.spy();
        testFull.level1.level2.fn = originalSpy;
        Oversight.addObserver(testFull, 'level1.level2.fn', 'after', afterSpy);
        testFull.level1.level2.fn();
        assert.ok(originalSpy.calledOnce);
        assert.ok(afterSpy.calledOnce);
        assert.ok(afterSpy.calledAfter(originalSpy));
    });

    it('can handle an afterReturn function', function() {
        var originalSpy = sinon.spy(function(){ return 'Original'});
        var afterReturnSpy = sinon.spy();
        testFull.level1.level2.fn = originalSpy;
        Oversight.addObserver(testFull, 'level1.level2.fn', 'afterReturn', afterReturnSpy);
        testFull.level1.level2.fn();
        assert.ok(originalSpy.calledOnce);
        assert.ok(afterReturnSpy.calledOnce);
        assert.ok(afterReturnSpy.calledWith('Original'));
        assert.ok(afterReturnSpy.calledAfter(originalSpy));
    });

    it('does not overwrite observers when adding another', function() {
        var originalSpy = sinon.spy();
        var beforeSpy1 = sinon.spy();
        var beforeSpy2 = sinon.spy();
        testFull.level1.level2.fn = originalSpy;
        Oversight.addObserver(testFull, 'level1.level2.fn', 'before', beforeSpy1);
        Oversight.addObserver(testFull, 'level1.level2.fn', 'before', beforeSpy2);
        testFull.level1.level2.fn();
        assert.ok(originalSpy.calledOnce);
        assert.ok(beforeSpy1.calledOnce);
        assert.ok(beforeSpy2.calledOnce);
    });

    it('can handle an observer on a non existent key', function() {
        var beforeSpy = sinon.spy();
        assert.notOk(testEmpty.a);
        Oversight.addObserver(testEmpty, 'a.b.c', 'before', beforeSpy);
        assert.notOk(testEmpty.a);
        Oversight.unboundSet(testEmpty, 'a', {
            b: {
                c: function() {}
            }
        });
        assert.ok(testEmpty.a.b.c);
        testEmpty.a.b.c();
        assert.ok(beforeSpy.calledOnce, 'should have called the before observer');
    });

    it('can handle an observer on a non existent key where a function object is in the chain', function() {
        var beforeSpy = sinon.spy();
        var originalSpy = sinon.spy();
        var fn = function(){};
        fn.c = originalSpy;
        assert.notOk(testEmpty.a);
        Oversight.addObserver(testEmpty, 'a.b.c', 'before', beforeSpy);
        Oversight.unboundSet(testEmpty, 'a', {
            b: fn
        });
        testEmpty.a.b.c();
        assert.ok(beforeSpy.calledOnce);
        assert.ok(beforeSpy.calledBefore(fn.c));
        assert.ok(originalSpy.calledOnce);
    });

    it('it can handle multiple observers on a chained key', function(){
        var beforeSpy1 = sinon.spy();
        var beforeSpy2 = sinon.spy();
        var originalSpy = sinon.spy();
        var fn = function(){};
        fn.c = originalSpy;
        assert.notOk(testEmpty.a);
        Oversight.addObserver(testEmpty, 'a.b.c', 'before', beforeSpy1);
        Oversight.addObserver(testEmpty, 'a.b.c', 'before', beforeSpy2);
        Oversight.unboundSet(testEmpty, 'a', {
            b: fn
        });
        testEmpty.a.b.c();
        assert.ok(beforeSpy1.calledOnce);
        assert.ok(beforeSpy1.calledBefore(originalSpy));
        assert.ok(beforeSpy2.calledOnce);
        assert.ok(beforeSpy2.calledBefore(originalSpy));
        assert.ok(originalSpy.calledOnce);
    });

    it('can handle multiple observers on a chained key from different origins', function() {
        var beforeSpy1 = sinon.spy();
        var beforeSpy2 = sinon.spy();
        var originalSpy = sinon.spy();
        var fn = function(){};
        fn.c = originalSpy;
        var t0 = {};
        var t1 = {
            a: {
                b: fn
            }
        };
        assert.notOk(testEmpty.a);
        Oversight.addObserver(t0, 'a.b.c', 'before', beforeSpy1);
        Oversight.addObserver(t1, 'a.b.c', 'before', beforeSpy2);
        Oversight.unboundSet(t0, 'a', {
            b: fn
        });
        t0.a.b.c();
        assert.ok(beforeSpy1.calledOnce);
        assert.ok(beforeSpy1.calledBefore(originalSpy));
        assert.ok(beforeSpy2.calledOnce);
        assert.ok(beforeSpy2.calledBefore(originalSpy));
        assert.ok(originalSpy.calledOnce);
    });

    it('allows chained observers to be removed', function() {

    });

    it('behaves properly when setting a link in a chain to null', function() {

    });

    it('behaves property when setting a link in a chain to another value', function() {

    });

    it('behaves property when setting a link in a chain to the same value', function() {

    });

    it('will invoke the given observer functions with the provided context', function() {

    });

    it('will invoke the given observer functions with the original target as the context if non is provided', function() {

    });

    it('will return the original function if `get` is called on a key, even if chained', function() {

    });

    it('properly removes all listeners and chains when removeAllObservers is called', function() {

    });

    it('only respects valid advice', function() {

    });

    it('executes observers in the right order', function() {

    });

    it('will not double observify functions', function() {

    });

    it('will invoke observer functions with the correct arguments', function() {

    });

    it('will remove all downstream chains when an item in the chain is removed', function() {

    });

    it('will not remove any upstream chains when an item in the chain is removed', function() {

    });

    //it can handle 2 levels
    //it can handle 3 levels
    //executes in order
    //it can handle adding observer to empty key
    //it can remove observer from empty key
    //calling removeAllListeners on anything in the chain destroys the down stream listeners
    //calling removeAllListeners on anything in the chain does not destroy the upstream listeners
    //it handles before, after, onSet, onGet, afterReturn
    //it returns the right value
    //it can be constructed
    //it has the right prototype
    //it has function-object level variables
    //it obeys the provided context
    //it can handle a non existent key observer
    //it can remove
    //it can destroy all
    //it only respects valid advice
    //it('returns the original function when calling `get` on an observed key that is a fn, which may be an observed fn');
    //it('executes observers in [around, before, original, after, afterReturn, around] order');
    //it does the right thing with context
});