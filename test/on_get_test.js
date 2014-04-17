var Oversight = require('../dist/oversight-test.js');
var assert = require('../node_modules/chai/chai.js').assert;
var sinon = require('../node_modules/sinon/lib/sinon.js');

describe('onGet tests', function () {
    var originalSpy;
    var observed;
    var target;
    var onGetSpy0;
    var onGetSpy1;

    beforeEach(function () {
        originalSpy = sinon.spy(function () {
            return 'original'
        });
        onGetSpy0 = sinon.spy();
        onGetSpy1 = sinon.spy();
    });
    /*======================================================
     free functions onGet
     =====================================================*/
    describe('Free function onGet -> ', function () {
        beforeEach(function () {
            observed = Oversight.observify(originalSpy);
            observed.something = 'someProperty';
        });

        it('will execute an onGet observer', function () {
            Oversight.onGet(observed, 'something', onGetSpy0);
            Oversight.unboundGet(observed, 'something');
            assert.ok(onGetSpy0.calledOnce, 'should call onGetSpy0 one time');
        });

        it('will execute multiple onGet observers', function () {
            Oversight.onGet(observed, 'something', onGetSpy0);
            Oversight.onGet(observed, 'something', onGetSpy1);
            Oversight.unboundGet(observed, 'something');
            assert.ok(onGetSpy0.calledOnce, 'should call onGetSpy0');
            assert.ok(onGetSpy1.calledOnce, 'should call onGetSpy1');
        });

        it('will execute onGetObservers in FIFO order', function () {
            Oversight.onGet(observed, 'something', onGetSpy0);
            Oversight.onGet(observed, 'something', onGetSpy1);
            Oversight.unboundGet(observed, 'something');
            assert.ok(onGetSpy0.calledOnce, 'should call onGetSpy0');
            assert.ok(onGetSpy1.calledOnce, 'should call onGetSpy1');
            assert.ok(onGetSpy0.calledBefore(onGetSpy1));
        });

        it('will execute an onGet observer with the correct parameters', function () {
            var value = observed.something;
            Oversight.onGet(observed, 'something', onGetSpy0);
            Oversight.unboundGet(observed, 'something');
            assert.ok(onGetSpy0.calledOnce, 'should call onGetSpy0 one time');
            assert.ok(onGetSpy0.calledWith(value), 'should have passed in the correct value');
        });

        it('will execute onGet observers using the target as a context if none is given', function () {
            assert.notOk(observed.notHereYet);
            Oversight.onGet(observed, 'something', function () {
                this.notHereYet = 5;
            });
            Oversight.unboundGet(observed, 'something');
            assert.equal(observed.notHereYet, 5);
        });

        it('will execute onGet observers with the given context', function () {
            var ctx = {};
            Oversight.onGet(observed, 'something', function () {
                this.notHereYet = 5;
            }, ctx);
            Oversight.unboundGet(observed, 'something');
            assert.equal(ctx.notHereYet, 5);
        });
    });

    /*======================================================
     target functions onGet
     =====================================================*/

    describe('target function onGet -> ', function () {
        beforeEach(function () {
            target = {
                something: 'someProperty',
                fn: originalSpy
            };
        });

        it('will execute an onGet observer', function () {
            Oversight.onGet(target, 'something', onGetSpy0);
            Oversight.unboundGet(target, 'something');
            assert.ok(onGetSpy0.calledOnce, 'should call onGetSpy0 one time');
        });

        it('will execute multiple onGet observers', function () {
            Oversight.onGet(target, 'something', onGetSpy0);
            Oversight.onGet(target, 'something', onGetSpy1);
            Oversight.unboundGet(target, 'something');
            assert.ok(onGetSpy0.calledOnce, 'should call onGetSpy0');
            assert.ok(onGetSpy1.calledOnce, 'should call onGetSpy1');
        });

        it('will execute onGetObservers in FIFO order', function () {
            Oversight.onGet(target, 'something', onGetSpy0);
            Oversight.onGet(target, 'something', onGetSpy1);
            Oversight.unboundGet(target, 'something');
            assert.ok(onGetSpy0.calledOnce, 'should call onGetSpy0');
            assert.ok(onGetSpy1.calledOnce, 'should call onGetSpy1');
            assert.ok(onGetSpy0.calledBefore(onGetSpy1));
        });

        it('will execute an onGet observer with the correct parameters', function () {
            var value = target.something;
            Oversight.onGet(target, 'something', onGetSpy0);
            Oversight.unboundGet(target, 'something');
            assert.ok(onGetSpy0.calledOnce, 'should call onGetSpy0 one time');
            assert.ok(onGetSpy0.calledWith(value), 'should have passed in the correct value');
        });

        it('will execute onGet observers using the target as a context if none is given', function () {
            assert.notOk(target.notHereYet);
            Oversight.onGet(target, 'something', function () {
                this.notHereYet = 5;
            });
            Oversight.unboundGet(target, 'something');
            assert.equal(target.notHereYet, 5);
        });

        it('will execute onGet observers with the given context', function () {
            var ctx = {};
            Oversight.onGet(target, 'something', function () {
                this.notHereYet = 5;
            }, ctx);
            Oversight.unboundGet(target, 'something');
            assert.equal(ctx.notHereYet, 5);
        });
    });

    /*======================================================
     chained functions onGet
     =====================================================*/

    describe('chained function onGet -> ', function () {
        beforeEach(function () {
            target = {
                prop: {
                    something: 'something'
                }
            };
        });

        it('will execute an onGet observer', function () {
            Oversight.onGet(target, 'prop.something', onGetSpy0);
            Oversight.unboundGet(target.prop, 'something');
            assert.ok(onGetSpy0.calledOnce, 'should call onGetSpy0 one time');
        });

        it('will execute multiple onGet observers', function () {
            Oversight.onGet(target, 'prop.something', onGetSpy0);
            Oversight.onGet(target, 'prop.something', onGetSpy1);
            Oversight.unboundGet(target.prop, 'something');
            assert.ok(onGetSpy0.calledOnce, 'should call onGetSpy0');
            assert.ok(onGetSpy1.calledOnce, 'should call onGetSpy1');
        });

        it('will execute onGetObservers in FIFO order', function () {
            Oversight.onGet(target, 'prop.something', onGetSpy0);
            Oversight.onGet(target, 'prop.something', onGetSpy1);
            Oversight.unboundGet(target.prop, 'something');
            assert.ok(onGetSpy0.calledOnce, 'should call onGetSpy0');
            assert.ok(onGetSpy1.calledOnce, 'should call onGetSpy1');
            assert.ok(onGetSpy0.calledBefore(onGetSpy1));
        });

        it('will execute an onGet observer with the correct parameters', function () {
            var value = target.prop.something;
            Oversight.onGet(target, 'prop.something', onGetSpy0);
            Oversight.unboundGet(target.prop, 'something');
            assert.ok(onGetSpy0.calledOnce, 'should call onGetSpy0 one time');
            assert.ok(onGetSpy0.calledWith(value), 'should have passed in the correct value');
        });

        it('will execute onGet observers using the target as a context if none is given', function () {
            assert.notOk(target.notHereYet);
            Oversight.onGet(target, 'prop.something', function () {
                this.notHereYet = 5;
            });
            Oversight.unboundGet(target.prop, 'something');
            assert.equal(target.notHereYet, 5);
        });

        it('will execute onGet observers with the given context', function () {
            var ctx = {};
            Oversight.onGet(target, 'prop.something', function () {
                this.notHereYet = 5;
            }, ctx);
            Oversight.unboundGet(target.prop, 'something');
            assert.equal(ctx.notHereYet, 5);
        });

        //should it execute with prop === undefined?
        it('will execute onGet observers when the requested property is not defined or null', function () {
            assert.notOk(target.prop.notHere);
            Oversight.onGet(target.prop, 'notHere', onGetSpy0);
            Oversight.unboundGet(target.prop, 'notHere');
            assert.ok(onGetSpy0.calledOnce);
            assert.ok(onGetSpy0.calledWith(undefined));
        });
    });
});