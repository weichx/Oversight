var Oversight = require('../src/oversight');
var assert = require('../node_modules/chai/chai.js').assert;
var sinon = require('../node_modules/sinon/lib/sinon.js');

describe('Free function observers -> ', function() {
    var unobserved;
    beforeEach(function() {
        unobserved = function() {
            return 'original';
        };
    });

    it('correctly calls observify on a free function', function() {
        var observed = Oversight.observify(unobserved);
        assert.ok(observed);
        assert.notEqual(unobserved, observed);
        assert.ok(observed.__observified);
        assert.ok(observed.__observers);
    });

    it('returns the original functions return value', function() {
        assert.ok(unobserved);
        var retn = unobserved();
        var observed = Oversight.observify(unobserved);
        assert.equal(retn, observed());
    });

    it('correctly retains the prototype of an input function', function() {
        unobserved.prototype.something = 2;
        var observed = Oversight.observify(unobserved);
        assert.equal(unobserved.prototype, observed.prototype);
        unobserved.prototype.somethingElse = 4;
        assert.equal(unobserved.prototype.somethingElse, observed.prototype.somethingElse);
    });

    it('correctly retains any `static` level values on the input function available at observify time', function() {
        unobserved.somethingStatic = 5;
        var observed = Oversight.observify(unobserved);
        assert.equal(observed.somethingStatic, unobserved.somethingStatic);
    });

    it('correctly returns an instance object when called with new', function() {
        unobserved = function(x) {
            this.x = x;
            this.y = 10;
        };
        var observed = Oversight.observify(unobserved);
        var obj = new observed(5);
        assert.ok(obj);
        assert.equal(obj.x, 5);
        assert.equal(obj.y, 10);
    });

    it('can handle handle an unchained before function', function() {
        var called = false;
        var original = function() { assert.ok(called); };
        var beforeFn = function() { called = true; };
        var observed = Oversight.observify(original);
        Oversight.addObserver(observed, 'before', beforeFn);
        observed();
    });
    
    it('can handle handle an unchained after function', function() {
        var called = false;
        var after  = false;
        var original = function() { called = true; assert.notOk(after); };
        var afterFn = function() { assert.ok(called); after = true; };
        var observed = Oversight.observify(original);
        Oversight.addObserver(observed, 'after', afterFn);
        observed();
        assert.ok(after);
    });

    it('can handle handle an unchained afterReturn function', function() {
        var originalSpy = sinon.spy(function(){ return 'Original'});
        var afterReturnSpy = sinon.spy();
        var observed = Oversight.observify(originalSpy);
        Oversight.addObserver(observed, 'afterReturn', afterReturnSpy);
        observed();
        assert.ok(originalSpy.calledOnce);
        assert.ok(afterReturnSpy.calledOnce);
        assert.ok(afterReturnSpy.calledWith('Original'));
        assert.ok(afterReturnSpy.calledAfter(originalSpy));
    });

    it('does not overwrite observers when adding another', function() {
        var i = 0;
        var original = function() { i++; };
        var before1 = function() { i++; };
        var before2 = function() { i++; };
        var observed = Oversight.observify(original);
        Oversight.addObserver(observed, 'before', before1);
        Oversight.addObserver(observed, 'before', before2);
        observed();
        assert.equal(i, 3);
    });

    it('can use removers to remove observer functions', function() {
        var i = 0;
        var original = function() { i++; };
        var before = function() { i++; };
        var observed = Oversight.observify(original);
        var remover = Oversight.addObserver(observed, 'before', before);
        observed();
        assert.equal(i, 2);
        Oversight.remove(observed, remover);
        observed();
        assert.equal(i, 3);
    });

    it('only removes what should be removed', function() {
        var i = 0;
        var original = function() { i++; };
        var before = function() { i++; };
        var observed = Oversight.observify(original);
        var remover1 = Oversight.addObserver(observed, 'before', before);
        var remover2 = Oversight.addObserver(observed, 'before', before);
        observed();
        assert.equal(i, 3);
        Oversight.remove(observed, remover1);
        observed();
        assert.equal(i, 5);
    });

    it('fails on non observified functions', function() {
        assert.throws(function() {
            Oversight.addObserver(unobserved, 'before', function(){});
        }, Oversight.Errors.targetNotObservable());
    });

    it('fails without a callback', function() {
        var observed = Oversight.observify(unobserved);
        assert.throws(function() {
            Oversight.addObserver(observed, 'before');
        }, Oversight.Errors.missingCallback());
    });

    it('fails on non function or invalid advice', function() {
        var observed = Oversight.observify(unobserved);
        assert.throws(function() {
            Oversight.addObserver(observed, 'not_valid', function(){});
        }, Oversight.Errors.invalidFreeFunctionAdvice('not_valid'));

        assert.throws(function() {
            Oversight.addObserver(observed, 'onGet', function(){});
        }, Oversight.Errors.invalidFreeFunctionAdvice('onGet'));
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
        Oversight.addObserver(observed, 'afterReturn', afterReturnFn);
        observed();
        assert.ok(asserted);
    });

    it('calls advice in the correct order', function() {
        var beforeCalled = false;
        var afterCalled = false;
        var afterReturnCalled = false;
        var originalCalled = false;
        var before = function() {
            assert.notOk(beforeCalled);
            assert.notOk(afterCalled);
            assert.notOk(afterReturnCalled);
            assert.notOk(originalCalled);
            beforeCalled = true;
        };
        var after = function() {
            assert.notOk(afterCalled);
            assert.notOk(afterReturnCalled);
            assert.ok(beforeCalled);
            assert.ok(originalCalled);
            afterCalled = true;
        };
        var afterReturn = function() {
            assert.notOk(afterReturnCalled);
            assert.ok(afterCalled);
            assert.ok(beforeCalled);
            assert.ok(originalCalled);
            afterReturnCalled = true;
        };
        var original = function() {
            assert.ok(beforeCalled);
            assert.notOk(originalCalled);
            assert.notOk(afterCalled);
            assert.notOk(afterReturnCalled);
            originalCalled = true;
        };
        var observed = Oversight.observify(original);
        Oversight.addObserver(observed, 'after', after);
        Oversight.addObserver(observed, 'before', before);
        Oversight.addObserver(observed, 'afterReturn', afterReturn);
        observed();
        assert.ok(beforeCalled);
        assert.ok(afterCalled);
        assert.ok(afterReturnCalled);
        assert.ok(originalCalled);
    });

    it('can handle an unchained around function');

});


//to test
//removal of chains

//to implement
//removeAllObservers();
//around
//join point
//destroy() -> probably uses a registry and intercepts context