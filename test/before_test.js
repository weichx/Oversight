var Oversight = require('../dist/oversight-test.js');
var assert = require('../node_modules/chai/chai.js').assert;
var sinon = require('../node_modules/sinon/lib/sinon.js');

describe('before tests', function () {
    var originalSpy;
    var beforeSpy0;
    var beforeSpy1;
    var observed;
    var target;

    beforeEach(function() {
        originalSpy = sinon.spy(function() { return 'original' });
        beforeSpy0  = sinon.spy();
        beforeSpy1  = sinon.spy();
    });

/*======================================================
        free functions before
 =====================================================*/
    describe('Free function before ->', function () {
        beforeEach(function() {
            observed = Oversight.observify(originalSpy);
        });

        it('will execute a before observer', function() {
            Oversight.before(observed, beforeSpy0);
            observed();
            assert.ok(originalSpy.calledOnce);
            assert.ok(beforeSpy0.calledOnce);
            assert.ok(beforeSpy0.calledBefore(originalSpy));
        });

        it('will execute multiple before observers', function() {
            Oversight.before(observed, beforeSpy0);
            Oversight.before(observed, beforeSpy1);
            observed();
            assert.ok(originalSpy.calledAfter(beforeSpy0), 'should call original after befores');
            assert.ok(beforeSpy0.calledOnce, 'should call before0 once');
            assert.ok(beforeSpy1.calledOnce, 'should call before1 once');
        });

        it('will execute before observers in LIFO order', function() {
            Oversight.before(observed, beforeSpy0);
            Oversight.before(observed, beforeSpy1);
            observed();
            assert.ok(beforeSpy1.calledBefore(beforeSpy0), 'should call before0 before before1');
            assert.ok(beforeSpy0.calledBefore(originalSpy), 'should call before1 before original');
            assert.ok(originalSpy.calledOnce, 'should call original');
        });

        it('will execute before observers with the input arguments', function() {
            Oversight.before(observed, beforeSpy0);
            observed(1,2,3);
            assert.ok(beforeSpy0.calledWith(1, 2, 3));
        });

        it('will execute before observers using the target as a context if none is given', function() {
            assert.notOk(observed.notHereYet);
            Oversight.before(observed, function() {
                this.notHereYet = 5;
            });
            observed();
            assert.equal(5, observed.notHereYet);
        });

        it('will execute before observers with the given context', function() {
            var ctx = {};
            Oversight.before(observed, function(){
                this.nowImHere = 5;
            }, ctx);
            observed();
            assert.equal(5, ctx.nowImHere);
        });

    });

/*======================================================
        target functions before
 =====================================================*/
    describe('target function before ->', function () {
        beforeEach(function() {
            target = {
                fn: originalSpy
            }
        });

        it('will execute a before observer', function() {
            Oversight.before(target, 'fn', beforeSpy0);
            target.fn();
            assert.ok(beforeSpy0.calledOnce, 'should call before0');
            assert.ok(beforeSpy0.calledBefore(originalSpy), 'should call before0 before original');
            assert.ok(originalSpy.calledOnce, 'should call original');
        });

        it('will execute multiple before observers', function() {
            Oversight.before(target, 'fn', beforeSpy0);
            Oversight.before(target, 'fn', beforeSpy1);
            target.fn();
            assert.ok(originalSpy.calledAfter(beforeSpy0), 'should call original after befores');
            assert.ok(beforeSpy0.calledOnce, 'should call before0 once');
            assert.ok(beforeSpy1.calledOnce, 'should call before1 once');
        });

        it('will execute befores in LIFO order', function() {
            Oversight.before(target, 'fn', beforeSpy0);
            Oversight.before(target, 'fn', beforeSpy1);
            target.fn();
            assert.ok(beforeSpy1.calledBefore(beforeSpy0), 'should call before0 before before1');
            assert.ok(beforeSpy0.calledBefore(originalSpy), 'should call before1 before original');
            assert.ok(originalSpy.calledOnce, 'should call original');
        });

        it('will execute before observers with the input arguments', function() {
            Oversight.before(target, 'fn', beforeSpy0);
            target.fn(1, 2, 3);
            assert.ok(beforeSpy0.calledWith(1, 2, 3));
        });

        it('will execute before observers using the target as a context if none is given', function() {
            assert.notOk(target.notHereYet);
            Oversight.before(target, 'fn', function() {
                this.notHereYet = 5;
            });
            target.fn();
            assert.equal(5, target.notHereYet);
        });

        it('will execute before observers with the given context', function() {
            var ctx = {};
            Oversight.before(target, 'fn', function(){
                this.nowImHere = 5;
            }, ctx);
            target.fn();
            assert.equal(5, ctx.nowImHere);
        });
    });

/*======================================================
            Chain functions before
  =====================================================*/
    describe('chained function before ->', function () {
        beforeEach(function() {
            target = {
                prop: {
                    fn: originalSpy
                }
            };
        });

        it('will execute a before observer', function() {
            Oversight.before(target, 'prop.fn', beforeSpy0);
            target.prop.fn();
            assert.ok(beforeSpy0.calledOnce, 'should call before0');
            assert.ok(beforeSpy0.calledBefore(originalSpy), 'should call before0 before original');
            assert.ok(originalSpy.calledOnce, 'should call original');
        });

        it('will execute multiple before observers', function() {
            Oversight.before(target, 'prop.fn', beforeSpy0);
            Oversight.before(target, 'prop.fn', beforeSpy1);
            target.prop.fn();
            assert.ok(originalSpy.calledAfter(beforeSpy0), 'should call original after befores');
            assert.ok(beforeSpy0.calledOnce, 'should call before0 once');
            assert.ok(beforeSpy1.calledOnce, 'should call before1 once');
        });

        it('will execute befores in LIFO order', function() {
            Oversight.before(target, 'prop.fn', beforeSpy0);
            Oversight.before(target, 'prop.fn', beforeSpy1);
            target.prop.fn();
            assert.ok(beforeSpy1.calledBefore(beforeSpy0), 'should call before0 before before1');
            assert.ok(beforeSpy0.calledBefore(originalSpy), 'should call before1 before original');
            assert.ok(originalSpy.calledOnce, 'should call original');
        });

        it('will execute before observers with the input arguments', function() {
            Oversight.before(target, 'prop.fn', beforeSpy0);
            target.prop.fn(1,2,3);
            assert.ok(beforeSpy0.calledWith(1, 2, 3));
        });

        it('will execute before observers using the target as a context if none is given', function() {
            assert.notOk(target.notHereYet);
            Oversight.before(target, 'prop.fn', function() {
                this.notHereYet = 5;
            });
            target.prop.fn();
            assert.equal(5, target.notHereYet);
        });

        it('will execute before observers with the given context', function() {
            var ctx = {};
            Oversight.before(target, 'prop.fn', function(){
                this.nowImHere = 5;
            }, ctx);
            target.prop.fn();
            assert.equal(5, ctx.nowImHere);
        });
    });
});