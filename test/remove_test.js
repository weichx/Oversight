var Oversight = require('../dist/oversight-test.js');
var assert = require('../node_modules/chai/chai.js').assert;
var sinon = require('../node_modules/sinon/lib/sinon.js');

//can remove stuff
//removed fns dont fire
//destroy chains
//only remove what should be

describe('removal tests', function () {
    var originalSpy;
    var original;
    var observed;
    var target;

    beforeEach(function () {
        original = function () {
            return 'original';
        };
        originalSpy = sinon.spy(original);
    });

    /*======================================================
     free functions remove
     =====================================================*/
    describe('free function remove -> ', function () {
        beforeEach(function () {
            observed = Oversight.observify(originalSpy);
        });

        it('will return a remover from advice functions', function () {
            var advice = ['before', 'after', 'afterReturn', 'around'];
            advice.forEach(function (advice) {
                var remover = Oversight[advice](observed, function () {
                });
                assert.ok(remover, 'remover exists');
                assert.ok(remover.removalId);
                assert.equal(remover.advice, advice);
            });
        });

        it('will not fire removed function observers', function () {
            var advice = ['before', 'after', 'afterReturn', 'around'];
            advice.forEach(function (advice) {
                var spy = sinon.spy();
                var remover = Oversight[advice](observed, spy);
                Oversight.remove(observed, remover);
                observed();
                assert.notOk(spy.called, advice + ' observer should not have been called');
            });
        });

        it('will only remove the functions that should be removed', function () {
            var advice = ['before', 'after', 'afterReturn', 'around'];
            advice.forEach(function (advice) {
                var spy0 = sinon.spy();
                var spy1 = sinon.spy();
                var remover0 = Oversight[advice](observed, spy0);
                var remover1 = Oversight[advice](observed, spy1);
                Oversight.remove(observed, remover0);
                observed();
                assert.notOk(spy0.called, 'should not call spy0');
                assert.ok(spy1.calledOnce, 'should called spy1 since it was not removed');
            });
        });
    });

    /*======================================================
     target functions remove
     =====================================================*/

    describe('target function remove -> ', function () {
        beforeEach(function () {
            target = {
                fn: originalSpy
            }
        });

        it('will return a remover from advice functions', function () {
            var advice = ['before', 'after', 'afterReturn', 'around', 'onGet', 'onSet'];
            advice.forEach(function (advice) {
                var remover = Oversight[advice](target, 'fn', function () {
                });
                assert.ok(remover, 'remover exists');
                assert.ok(remover.removalId);
                assert.equal(remover.advice, advice);
            });
        });

        it('will not fire removed function observers', function () {
            var advice = ['before', 'after', 'afterReturn', 'around'];
            advice.forEach(function (advice) {
                var spy = sinon.spy();
                var remover = Oversight[advice](target, 'fn', spy);
                Oversight.remove(target, remover);
                target.fn();
                assert.notOk(spy.called, advice + ' observer should not have been called');
            });
            var spy = sinon.spy();
            var remover = Oversight.onGet(target, 'fn', spy);
            Oversight.remove(target, remover);
            Oversight.unboundGet(target, 'fn');
            assert.notOk(spy.called);
            remover = Oversight.onSet(target, 'fn', spy);
            Oversight.remove(target, remover);
            assert.notOk(spy.called);
        });

        it('will only remove the functions that should be removed', function () {
            var advice = ['before', 'after', 'afterReturn', 'around'];
            advice.forEach(function (advice) {
                var spy0 = sinon.spy();
                var spy1 = sinon.spy();
                var remover0 = Oversight[advice](target, 'fn', spy0);
                var remover1 = Oversight[advice](target, 'fn', spy1);
                Oversight.remove(target, remover0);
                target.fn();
                assert.notOk(spy0.called, 'should not call spy0');
                assert.ok(spy1.calledOnce, 'should called spy1 since it was not removed');
            });
            var spy0 = sinon.spy();
            var spy1 = sinon.spy();
            var remover0 = Oversight.onGet(target, 'fn', spy0);
            var remover1 = Oversight.onGet(target, 'fn', spy1);
            Oversight.remove(target, remover0);
            Oversight.unboundGet(target, 'fn');
            assert.notOk(spy0.called, 'should not call spy0');
            assert.ok(spy1.calledOnce, 'should called spy1 since it was not removed');
            spy0 = sinon.spy();
            spy1 = sinon.spy();
            remover0 = Oversight.onSet(target, 'fn', spy0);
            remover1 = Oversight.onSet(target, 'fn', spy1);
            Oversight.remove(target, remover0);
            Oversight.unboundSet(target, 'fn', null);
            assert.notOk(spy0.called, 'should not call spy0');
            assert.ok(spy1.calledOnce, 'should called spy1 since it was not removed');
        });
    });

    /*describe('remove all observers test', function() {
        it('will destroy all observers on a free function', function() {
            var unobserved = sinon.spy();
            var observed = Oversight.observify(unobserved);
            var beforeSpy = sinon.spy();
            var afterSpy  = sinon.spy();
            Oversight.before(observed, beforeSpy);
            Oversight.after(observed, afterSpy);
            Oversight.removeAllObservers(observed);
            observed();
            assert.notOk(beforeSpy.called);
            assert.notOk(afterSpy.called);
        });

        it('will destroy all observers on a targeted function', function() {

        });

        it('will destroy all observers on a chained function', function() {
           //make sure chains are traversed and destroyed
        });
    });*/
});
