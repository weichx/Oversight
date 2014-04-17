var Oversight = require('../dist/oversight-test.js');
var assert = require('../node_modules/chai/chai.js').assert;
var sinon = require('../node_modules/sinon/lib/sinon.js');


describe('Joinpoint tests', function() {
    var originalSpy;
    var aroundSpy0;
    var aroundSpy1;
    var target;
    beforeEach(function() {

        originalSpy = sinon.spy(function(arg0, arg1) {
            return 'original';
        });

        aroundSpy0 = sinon.spy(function() {
            return Oversight.proceed();
        });

        aroundSpy1 = sinon.spy(function() {
            return Oversight.proceed();
        });
        target = {
            fn: originalSpy
        }
    });
    it('will properly execute the next item in fn stack on proceed()', function() {
        Oversight.around(target, 'fn', function() {
            return Oversight.proceed();
        });
        target.fn();
        assert.ok(originalSpy.calledOnce);
    });

    it('will not execute the next fn if proceed is not called', function() {
        Oversight.around(target, 'fn', function() {});
        assert.notOk(originalSpy.calledOnce);
    });

    it('will change the input arguments when parameters are passed to proceed', function() {
        Oversight.around(target, 'fn', function() {
            return Oversight.proceed('a', 'b', 'c');
        });
        target.fn();
        assert.ok(originalSpy.calledOnce);
        assert.ok(originalSpy.calledWith('a', 'b', 'c'));
    });

    it('will return the original value if all joinpoint functions return proceed()', function() {
        var original = 'original';
        Oversight.around(target, 'fn', aroundSpy0);
        Oversight.around(target, 'fn', aroundSpy1);
        var retn = target.fn();
        assert.equal(retn, original);
        assert.ok(originalSpy.calledOnce);
        assert.ok(aroundSpy0.calledOnce);
        assert.ok(aroundSpy1.calledOnce);
    });

    it('will return the first joinpoint functions return value', function() {
        var a0 = function() {
            return 'not original';
        };
        Oversight.around(target, 'fn', a0);
        var retn = target.fn();
        assert.equal(retn, 'not original');
    });

    it('will throw an error if proceed() is called twice in the same scope', function() {
        Oversight.around(target, 'fn', function() {
            Oversight.proceed();
            Oversight.proceed();
        });
        assert.throws(target.fn, Oversight.Errors.proceedCalledTwice());
    });

    it('will throw an error if proceed() is called outside of joinpoint function', function() {
        assert.throws(Oversight.proceed, Oversight.Errors.proceedOutsideJoinpoint());
    });
});