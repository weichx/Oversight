var Oversight = require('../dist/oversight-test.js');
var assert = require('../node_modules/chai/chai.js').assert;
var sinon = require('../node_modules/sinon/lib/sinon.js');

describe('after tests', function () {
    var originalSpy;
    var afterSpy0;
    var afterSpy1;
    var observed;
    var target;

    beforeEach(function () {
        originalSpy = sinon.spy(function () {
            return 'original'
        });
        afterSpy0 = sinon.spy();
        afterSpy1 = sinon.spy();
    });

/*======================================================
        free functions after
 =====================================================*/
    describe('Free function after ->', function () {
        beforeEach(function () {
            observed = Oversight.observify(originalSpy);
        });

        it('will execute an after observer', function () {
            Oversight.after(observed, afterSpy0);
            observed();
            assert.ok(originalSpy.calledOnce, 'should call original');
            assert.ok(afterSpy0.calledOnce, 'should call after');
            assert.ok(afterSpy0.calledAfter(originalSpy), 'should call after original');
        });

        it('will execute multiple after observers', function () {
            Oversight.after(observed, afterSpy0);
            Oversight.after(observed, afterSpy1);
            observed();
            assert.ok(originalSpy.calledBefore(afterSpy0), 'should call original after afters');
            assert.ok(afterSpy0.calledOnce, 'should call after0 once');
            assert.ok(afterSpy1.calledOnce, 'should call after1 once');
        });

        it('will execute after observers in FIFO order', function () {
            Oversight.after(observed, afterSpy0);
            Oversight.after(observed, afterSpy1);
            observed();
            assert.ok(afterSpy1.calledAfter(afterSpy0), 'should call after0 after after1');
            assert.ok(afterSpy0.calledAfter(originalSpy), 'should call after1 after original');
            assert.ok(originalSpy.calledOnce, 'should call original');
        });

        it('will execute after observers with the input arguments', function () {
            Oversight.after(observed, afterSpy0);
            observed(1, 2, 3);
            assert.ok(afterSpy0.calledWith(1, 2, 3));
        });

        it('will execute after observers using the target as a context if none is given', function() {
            assert.notOk(observed.notHereYet);
            Oversight.after(observed, function() {
                this.notHereYet = 5;
            });
            observed();
            assert.equal(5, observed.notHereYet);
        });

        it('will execute after observers with the given context', function() {
            var ctx = {};
            Oversight.after(observed, function(){
                this.nowImHere = 5;
            }, ctx);
            observed();
            assert.equal(5, ctx.nowImHere);
        });
    });


/*======================================================
        target functions after
 =====================================================*/
    describe('target function after ->', function () {
        beforeEach(function () {
            target = {
                fn: originalSpy
            }
        });

        it('will execute an after observer', function () {
            Oversight.after(target, 'fn', afterSpy0);
            target.fn();
            assert.ok(afterSpy0.calledOnce, 'should call after0');
            assert.ok(afterSpy0.calledAfter(originalSpy), 'should call after0 after original');
            assert.ok(originalSpy.calledOnce, 'should call original');
        });

        it('will execute multiple after observers', function () {
            Oversight.after(target, 'fn', afterSpy0);
            Oversight.after(target, 'fn', afterSpy1);
            target.fn();
            assert.ok(originalSpy.calledBefore(afterSpy0), 'should call original before afters');
            assert.ok(afterSpy0.calledOnce, 'should call after0 once');
            assert.ok(afterSpy1.calledOnce, 'should call after1 once');
        });

        it('will execute afters in LIFO order', function () {
            Oversight.after(target, 'fn', afterSpy0);
            Oversight.after(target, 'fn', afterSpy1);
            target.fn();
            assert.ok(afterSpy1.calledAfter(afterSpy0), 'should call after0 after after1');
            assert.ok(afterSpy0.calledAfter(originalSpy), 'should call after1 after original');
            assert.ok(originalSpy.calledOnce, 'should call original');
        });

        it('will execute after observers with the input arguments', function () {
            Oversight.after(target, 'fn', afterSpy0);
            target.fn(1, 2, 3);
            assert.ok(afterSpy0.calledWith(1, 2, 3));
        });

        it('will execute after observers using the target as a context if none is given', function() {
            assert.notOk(target.notHereYet);
            Oversight.after(target, 'fn', function() {
                this.notHereYet = 5;
            });
            target.fn();
            assert.equal(5, target.notHereYet);
        });

        it('will execute after observers with the given context', function() {
            var ctx = {};
            Oversight.after(target, 'fn', function(){
                this.nowImHere = 5;
            }, ctx);
            target.fn();
            assert.equal(5, ctx.nowImHere);
        });
    });

/*======================================================
        chain functions after
 =====================================================*/
    describe('chained function after ->', function () {
        beforeEach(function () {
            target = {
                prop: {
                    fn: originalSpy
                }
            };
        });

        it('will execute an after observer', function () {
            Oversight.after(target, 'prop.fn', afterSpy0);
            target.prop.fn();
            assert.ok(afterSpy0.calledOnce, 'should call after0');
            assert.ok(afterSpy0.calledAfter(originalSpy), 'should call after0 after original');
            assert.ok(originalSpy.calledOnce, 'should call original');
        });

        it('will execute multiple after observers', function () {
            Oversight.after(target, 'prop.fn', afterSpy0);
            Oversight.after(target, 'prop.fn', afterSpy1);
            target.prop.fn();
            assert.ok(originalSpy.calledBefore(afterSpy0), 'should call original after afters');
            assert.ok(afterSpy0.calledOnce, 'should call after0 once');
            assert.ok(afterSpy1.calledOnce, 'should call after1 once');
        });

        it('will execute afters in LIFO order', function () {
            Oversight.after(target, 'prop.fn', afterSpy0);
            Oversight.after(target, 'prop.fn', afterSpy1);
            target.prop.fn();
            assert.ok(afterSpy1.calledAfter(afterSpy0), 'should call after0 after after1');
            assert.ok(afterSpy0.calledAfter(originalSpy), 'should call after1 after original');
            assert.ok(originalSpy.calledOnce, 'should call original');
        });

        it('will execute after observers with the input arguments', function () {
            Oversight.after(target, 'prop.fn', afterSpy0);
            target.prop.fn(1, 2, 3);
            assert.ok(afterSpy0.calledWith(1, 2, 3));
        });

        it('will execute after observers using the target as a context if none is given', function() {
            assert.notOk(target.notHereYet);
            Oversight.after(target, 'prop.fn', function() {
                this.notHereYet = 5;
            });
            target.prop.fn();
            assert.equal(5, target.notHereYet);
        });

        it('will execute after observers with the given context', function() {
            var ctx = {};
            Oversight.after(target, 'prop.fn', function(){
                this.nowImHere = 5;
            }, ctx);
            target.prop.fn();
            assert.equal(5, ctx.nowImHere);
        });
    });
});