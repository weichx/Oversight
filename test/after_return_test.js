var Oversight = require('../dist/oversight-test.js');
var assert = require('../node_modules/chai/chai.js').assert;
var sinon = require('../node_modules/sinon/lib/sinon.js');

describe('afterReturn tests', function () {
    var originalSpy;
    var afterReturnSpy0;
    var afterReturnSpy1;
    var observed;
    var target;

    beforeEach(function () {
        originalSpy = sinon.spy(function () {
            return 'original'
        });
        afterReturnSpy0 = sinon.spy();
        afterReturnSpy1 = sinon.spy();
    });

/*======================================================
        free functions afterReturn
 =====================================================*/

    describe('Free function afterReturn ->', function () {
        beforeEach(function () {
            observed = Oversight.observify(originalSpy);
        });

        it('will execute an afterReturn observer', function () {
            Oversight.afterReturn(observed, afterReturnSpy0);
            observed();
            assert.ok(originalSpy.calledOnce, 'should call original');
            assert.ok(afterReturnSpy0.calledOnce, 'should call afterReturn');
            assert.ok(afterReturnSpy0.calledAfter(originalSpy), 'should call afterReturn original');
        });

        it('will execute multiple afterReturn observers', function () {
            Oversight.afterReturn(observed, afterReturnSpy0);
            Oversight.afterReturn(observed, afterReturnSpy1);
            observed();
            assert.ok(originalSpy.calledBefore(afterReturnSpy0), 'should call original afterReturn afterReturns');
            assert.ok(afterReturnSpy0.calledOnce, 'should call afterReturn0 once');
            assert.ok(afterReturnSpy1.calledOnce, 'should call afterReturn1 once');
        });

        it('will execute afterReturn observers in FIFO order', function () {
            Oversight.afterReturn(observed, afterReturnSpy0);
            Oversight.afterReturn(observed, afterReturnSpy1);
            observed();
            assert.ok(afterReturnSpy1.calledAfter(afterReturnSpy0), 'should call afterReturn0 afterReturn afterReturn1');
            assert.ok(afterReturnSpy0.calledAfter(originalSpy), 'should call afterReturn1 afterReturn original');
            assert.ok(originalSpy.calledOnce, 'should call original');
        });

        it('will execute afterReturn observers with the return value and input arguments', function () {
            Oversight.afterReturn(observed, afterReturnSpy0);
            observed(1, 2, 3);
            assert.ok(afterReturnSpy0.calledWith('original', 1, 2, 3));
        });

        it('will execute afterReturn observers using the target as a context if none is given', function() {
            assert.notOk(observed.notHereYet);
            Oversight.afterReturn(observed, function() {
                this.notHereYet = 5;
            });
            observed();
            assert.equal(5, observed.notHereYet, 'should have called observer with context `observed`');
        });

        it('will execute afterReturn observers with the given context', function() {
            var ctx = {};
            Oversight.after(observed, function(){
                this.nowImHere = 5;
            }, ctx);
            observed();
            assert.equal(5, ctx.nowImHere, 'should have called observer with context: ctx');
        });

    });

/*======================================================
        target functions afterReturn
 =====================================================*/

    describe('target function afterReturn ->', function () {
        beforeEach(function () {
            target = {
                fn: originalSpy
            }
        });

        it('will execute a afterReturn observer', function () {
            Oversight.afterReturn(target, 'fn', afterReturnSpy0);
            target.fn();
            assert.ok(afterReturnSpy0.calledOnce, 'should call afterReturn0');
            assert.ok(afterReturnSpy0.calledAfter(originalSpy), 'should call afterReturn0 afterReturn original');
            assert.ok(originalSpy.calledOnce, 'should call original');
        });

        it('will execute multiple afterReturn observers', function () {
            Oversight.afterReturn(target, 'fn', afterReturnSpy0);
            Oversight.afterReturn(target, 'fn', afterReturnSpy1);
            target.fn();
            assert.ok(originalSpy.calledBefore(afterReturnSpy0), 'should call original before afterReturns');
            assert.ok(afterReturnSpy0.calledOnce, 'should call afterReturn0 once');
            assert.ok(afterReturnSpy1.calledOnce, 'should call afterReturn1 once');
        });

        it('will execute afterReturns in LIFO order', function () {
            Oversight.afterReturn(target, 'fn', afterReturnSpy0);
            Oversight.afterReturn(target, 'fn', afterReturnSpy1);
            target.fn();
            assert.ok(afterReturnSpy1.calledAfter(afterReturnSpy0), 'should call afterReturn0 afterReturn afterReturn1');
            assert.ok(afterReturnSpy0.calledAfter(originalSpy), 'should call afterReturn1 afterReturn original');
            assert.ok(originalSpy.calledOnce, 'should call original');
        });

        it('will execute afterReturn observers with the return value and input arguments', function () {
            Oversight.afterReturn(target, 'fn', afterReturnSpy0);
            target.fn(1, 2, 3);
            assert.ok(afterReturnSpy0.calledWith('original', 1, 2, 3));
        });

        it('will execute afterReturn observers using the target as a context if none is given', function() {
            assert.notOk(target.notHereYet);
            Oversight.afterReturn(target, 'fn', function() {
                this.notHereYet = 5;
            });
            target.fn();
            assert.equal(5, target.notHereYet);
        });

        it('will execute afterReturn observers with the given context', function() {
            var ctx = {};
            Oversight.afterReturn(target, 'fn', function(){
                this.nowImHere = 5;
            }, ctx);
            target.fn();
            assert.equal(5, ctx.nowImHere);
        });
    });

/*======================================================
            chained functions afterReturn
 =====================================================*/

    describe('chained function afterReturn ->', function () {
        beforeEach(function () {
            target = {
                prop: {
                    fn: originalSpy
                }
            };
        });

        it('will execute a afterReturn observer', function () {
            Oversight.afterReturn(target, 'prop.fn', afterReturnSpy0);
            target.prop.fn();
            assert.ok(afterReturnSpy0.calledOnce, 'should call afterReturn0');
            assert.ok(afterReturnSpy0.calledAfter(originalSpy), 'should call afterReturn0 afterReturn original');
            assert.ok(originalSpy.calledOnce, 'should call original');
        });

        it('will execute multiple afterReturn observers', function () {
            Oversight.afterReturn(target, 'prop.fn', afterReturnSpy0);
            Oversight.afterReturn(target, 'prop.fn', afterReturnSpy1);
            target.prop.fn();
            assert.ok(originalSpy.calledBefore(afterReturnSpy0), 'should call original afterReturn afterReturns');
            assert.ok(afterReturnSpy0.calledOnce, 'should call afterReturn0 once');
            assert.ok(afterReturnSpy1.calledOnce, 'should call afterReturn1 once');
        });

        it('will execute afterReturns in LIFO order', function () {
            Oversight.afterReturn(target, 'prop.fn', afterReturnSpy0);
            Oversight.afterReturn(target, 'prop.fn', afterReturnSpy1);
            target.prop.fn();
            assert.ok(afterReturnSpy1.calledAfter(afterReturnSpy0), 'should call afterReturn0 afterReturn afterReturn1');
            assert.ok(afterReturnSpy0.calledAfter(originalSpy), 'should call afterReturn1 afterReturn original');
            assert.ok(originalSpy.calledOnce, 'should call original');
        });

        it('will execute afterReturn observers with the return value and input arguments', function () {
            Oversight.afterReturn(target, 'prop.fn', afterReturnSpy0);
            target.prop.fn(1, 2, 3);
            assert.ok(afterReturnSpy0.calledWith('original', 1, 2, 3));
        });

        it('will execute afterReturn observers using the target as a context if none is given', function() {
            assert.notOk(target.notHereYet);
            Oversight.afterReturn(target, 'prop.fn', function() {
                this.notHereYet = 5;
            });
            target.prop.fn();
            assert.equal(5, target.notHereYet);
        });

        it('will execute afterReturn observers with the given context', function() {
            var ctx = {};
            Oversight.afterReturn(target, 'prop.fn', function(){
                this.nowImHere = 5;
            }, ctx);
            target.prop.fn();
            assert.equal(5, ctx.nowImHere);
        });
    });
});