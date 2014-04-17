var Oversight = require('../dist/oversight-test.js');
var assert = require('../node_modules/chai/chai.js').assert;
var sinon = require('../node_modules/sinon/lib/sinon.js');


describe('around tests', function () {
    var originalSpy;
    var aroundSpy0;
    var aroundSpy1;
    var observed;
    var target;
    beforeEach(function () {
        originalSpy = sinon.spy(function () {
            return 'original'
        });
        aroundSpy0 = sinon.spy(function () {
            return Oversight.proceed();
        });
        aroundSpy1 = sinon.spy(function () {
            return Oversight.proceed();
        });
    });

    /*======================================================
     free functions around
     =====================================================*/

    describe('Free function around -> ', function () {
        beforeEach(function () {
            observed = Oversight.observify(originalSpy);
        });

        it('will execute an around observer', function () {
            Oversight.around(observed, aroundSpy0);
            observed();
            assert.ok(originalSpy.calledOnce, 'should call original');
            assert.ok(aroundSpy0.calledOnce, 'should call around');
            assert.ok(aroundSpy0.calledBefore(originalSpy), 'should call before original');
        });

        it('will execute multiple around observers', function () {
            Oversight.around(observed, aroundSpy0);
            Oversight.around(observed, aroundSpy1);
            observed();
            assert.ok(originalSpy.calledOnce, 'should call original');
            assert.ok(aroundSpy0.calledOnce, 'should call around0');
            assert.ok(aroundSpy1.calledOnce, 'should call around1');
            assert.ok(aroundSpy1.calledBefore(originalSpy), 'around1 should call before original');
            assert.ok(aroundSpy0.calledBefore(originalSpy), 'around0 should call before original');
        });

        it('will execute around observers in LIFO order', function () {
            Oversight.around(observed, aroundSpy0);
            Oversight.around(observed, aroundSpy1);
            observed();
            assert.ok(originalSpy.calledOnce, 'should call original');
            assert.ok(aroundSpy0.calledOnce, 'should call around0');
            assert.ok(aroundSpy1.calledOnce, 'should call around1');
            assert.ok(aroundSpy1.calledBefore(aroundSpy0), 'should call after0 after after1');
            assert.ok(aroundSpy0.calledBefore(originalSpy), 'should call after1 after original');
        });

        it('will execute around observers with the input arguments', function () {
            Oversight.around(observed, aroundSpy0);
            observed('a', 'b', 'c');
            assert.ok(originalSpy.calledOnce, 'should call original');
            assert.ok(aroundSpy0.calledOnce, 'should call around');
            assert.ok(aroundSpy0.calledWith('a', 'b', 'c'));
        });

        it('will execute around observers using the target as a context if none is given', function () {
            assert.notOk(observed.notHereYet);
            Oversight.around(observed, function() {
                this.notHereYet = 5;
                return Oversight.proceed();
            });
            observed();
            assert.equal(5, observed.notHereYet, 'should have called observer with ctx == observified');
            assert.ok(originalSpy.calledOnce, 'should call original');
        });

        it('will execute around observers with the given context', function () {
            var ctx = {};
            Oversight.around(observed, function() {
                this.nowImHere = 5;
            }, ctx);
            observed();
            assert.equal(5, ctx.nowImHere, 'should have called observer with ctx == ctx');
        });
    });

    /*======================================================
     target functions around
     =====================================================*/
    describe("target function around -> ", function () {
        beforeEach(function() {
            target = {
                fn: originalSpy
            }
        });
        it('will execute an around observer', function () {
            Oversight.around(target, 'fn', aroundSpy0);
            target.fn();
            assert.ok(originalSpy.calledOnce, 'should call original');
            assert.ok(aroundSpy0.calledOnce, 'should call around');
            assert.ok(aroundSpy0.calledBefore(originalSpy), 'should call before original');
        });

        it('will execute multiple around observers', function () {
            Oversight.around(target, 'fn', aroundSpy0);
            Oversight.around(target, 'fn', aroundSpy1);
            target.fn();
            assert.ok(originalSpy.calledOnce, 'should call original');
            assert.ok(aroundSpy0.calledOnce, 'should call around0');
            assert.ok(aroundSpy1.calledOnce, 'should call around1');
            assert.ok(aroundSpy1.calledBefore(originalSpy), 'around1 should call before original');
            assert.ok(aroundSpy0.calledBefore(originalSpy), 'around0 should call before original');
        });

        it('will execute around observers in LIFO order', function () {
            Oversight.around(target, 'fn', aroundSpy0);
            Oversight.around(target, 'fn', aroundSpy1);
            target.fn();
            assert.ok(originalSpy.calledOnce, 'should call original');
            assert.ok(aroundSpy0.calledOnce, 'should call around0');
            assert.ok(aroundSpy1.calledOnce, 'should call around1');
            assert.ok(aroundSpy1.calledBefore(aroundSpy0), 'should call after0 after after1');
            assert.ok(aroundSpy0.calledBefore(originalSpy), 'should call after1 after original');
        });

        it('will execute around observers with the input arguments', function () {
            Oversight.around(target, 'fn', aroundSpy0);
            target.fn('a', 'b', 'c');
            assert.ok(originalSpy.calledOnce, 'should call original');
            assert.ok(aroundSpy0.calledOnce, 'should call around');
            assert.ok(aroundSpy0.calledWith('a', 'b', 'c'));
        });

        it('will execute around observers using the target as a context if none is given', function () {
            assert.notOk(target.notHereYet);
            Oversight.around(target, 'fn', function() {
                this.notHereYet = 5;
                return Oversight.proceed();
            });
            target.fn();
            assert.equal(5, target.notHereYet, 'should have called observer with ctx == observified');
            assert.ok(originalSpy.calledOnce, 'should call original');
        });

        it('will execute around observers with the given context', function () {
            var ctx = {};
            Oversight.around(target, 'fn', function() {
                this.nowImHere = 5;
            }, ctx);
            target.fn();
            assert.equal(5, ctx.nowImHere, 'should have called observer with ctx == ctx');
        });
    });

    /*======================================================
     chain functions around
     =====================================================*/

    describe("chain function around -> ", function () {
        beforeEach(function() {
            target = {
                prop: {
                    fn: originalSpy
                }
            };
        });

        it('will execute an around observer', function () {
            Oversight.around(target, 'prop.fn', aroundSpy0);
            target.prop.fn();
            assert.ok(originalSpy.calledOnce, 'should call original');
            assert.ok(aroundSpy0.calledOnce, 'should call around');
            assert.ok(aroundSpy0.calledBefore(originalSpy), 'should call before original');
        });

        it('will execute multiple around observers', function () {
            Oversight.around(target, 'prop.fn', aroundSpy0);
            Oversight.around(target, 'prop.fn', aroundSpy1);
            target.prop.fn();
            assert.ok(originalSpy.calledOnce, 'should call original');
            assert.ok(aroundSpy0.calledOnce, 'should call around0');
            assert.ok(aroundSpy1.calledOnce, 'should call around1');
            assert.ok(aroundSpy1.calledBefore(originalSpy), 'around1 should call before original');
            assert.ok(aroundSpy0.calledBefore(originalSpy), 'around0 should call before original');
        });

        it('will execute around observers in LIFO order', function () {
            Oversight.around(target, 'prop.fn', aroundSpy0);
            Oversight.around(target, 'prop.fn', aroundSpy1);
            target.prop.fn();
            assert.ok(originalSpy.calledOnce, 'should call original');
            assert.ok(aroundSpy0.calledOnce, 'should call around0');
            assert.ok(aroundSpy1.calledOnce, 'should call around1');
            assert.ok(aroundSpy1.calledBefore(aroundSpy0), 'should call after0 after after1');
            assert.ok(aroundSpy0.calledBefore(originalSpy), 'should call after1 after original');
        });

        it('will execute around observers with the input arguments', function () {
            Oversight.around(target, 'prop.fn', aroundSpy0);
            target.prop.fn('a', 'b', 'c');
            assert.ok(originalSpy.calledOnce, 'should call original');
            assert.ok(aroundSpy0.calledOnce, 'should call around');
            assert.ok(aroundSpy0.calledWith('a', 'b', 'c'));
        });

        it('will execute around observers using the target as a context if none is given', function () {
            assert.notOk(target.notHereYet);
            Oversight.around(target, 'prop.fn', function() {
                this.notHereYet = 5;
                return Oversight.proceed();
            });
            target.prop.fn();
            assert.equal(5, target.notHereYet, 'should have called observer with ctx == observified');
            assert.ok(originalSpy.calledOnce, 'should call original');
        });

        it('will execute around observers with the given context', function () {
            var ctx = {};
            Oversight.around(target, 'prop.fn', function() {
                this.nowImHere = 5;
            }, ctx);
            target.prop.fn();
            assert.equal(5, ctx.nowImHere, 'should have called observer with ctx == ctx');
        });
    });
});