var Oversight = require('../dist/oversight-test.js');
var assert = require('../node_modules/chai/chai.js').assert;
var sinon = require('../node_modules/sinon/lib/sinon.js');

describe('onSet tests', function() {
    var originalSpy;
    var observed;
    var target;
    var onSetSpy0;
    var onSetSpy1;

    beforeEach(function() {
        originalSpy = sinon.spy(function () {
            return 'original'
        });
        onSetSpy0 = sinon.spy();
        onSetSpy1 = sinon.spy();
    });
    /*======================================================
     free functions onSet
     =====================================================*/
    describe('Free function onSet -> ', function() {
        beforeEach(function() {
            observed = Oversight.observify(originalSpy);
            observed.something = 'someProperty';
        });

        it('will execute an onSet observer', function() {
            Oversight.onSet(observed, 'something', onSetSpy0);
            Oversight.unboundSet(observed, 'something', 'somethingElse');
            assert.ok(onSetSpy0.calledOnce, 'should call onSetSpy0 one time');
        });

        it('will execute multiple onSet observers', function() {
            Oversight.onSet(observed, 'something', onSetSpy0);
            Oversight.onSet(observed, 'something', onSetSpy1);
            Oversight.unboundSet(observed, 'something', 'somethingElse');
            assert.ok(onSetSpy0.calledOnce, 'should call onSetSpy0');
            assert.ok(onSetSpy1.calledOnce, 'should call onSetSpy1');
        });

        it('will execute onSetObservers in FIFO order', function() {
            Oversight.onSet(observed, 'something', onSetSpy0);
            Oversight.onSet(observed, 'something', onSetSpy1);
            Oversight.unboundSet(observed, 'something', 'somethingElse');
            assert.ok(onSetSpy0.calledOnce, 'should call onSetSpy0');
            assert.ok(onSetSpy1.calledOnce, 'should call onSetSpy1');
            assert.ok(onSetSpy0.calledBefore(onSetSpy1));
        });

        it('will execute an onSet observer with the correct parameters', function() {
            var oldValue = observed.something;
            var newValue = 'somethingElse';
            Oversight.onSet(observed, 'something', onSetSpy0);
            Oversight.unboundSet(observed, 'something', newValue);
            assert.ok(onSetSpy0.calledOnce, 'should call onSetSpy0 one time');
            assert.ok(onSetSpy0.calledWith(newValue, oldValue), 'should have passed in the correct new and old values');
        });

        it('will execute onSet observers using the target as a context if none is given', function() {
            assert.notOk(observed.notHereYet);
            Oversight.onSet(observed, 'something', function() {
                this.notHereYet = 5;
            });
            Oversight.unboundSet(observed, 'something', null);
            assert.equal(observed.notHereYet, 5);
        });

        it('will execute onSet observers with the given context', function() {
            var ctx = {};
            Oversight.onSet(observed, 'something', function() {
                this.notHereYet = 5;
            }, ctx);
            Oversight.unboundSet(observed, 'something', null);
            assert.equal(ctx.notHereYet, 5);
        });

        it('will execute onSet observers when the new value is null or undefined', function() {
            Oversight.onSet(observed, 'something', onSetSpy0);
            Oversight.unboundSet(observed, 'something', null);
            assert.ok(onSetSpy0.calledOnce);
            Oversight.unboundSet(observed, 'something', undefined);
            assert.ok(onSetSpy0.calledTwice);
        });    
    });

    /*======================================================
     target functions onSet
     =====================================================*/
    
    describe('target function onSet -> ', function() {
        beforeEach(function() {
            target = {
                something: 'someProperty',
                fn: originalSpy
            };
        });

        it('will execute an onSet observer', function() {
            Oversight.onSet(target, 'something', onSetSpy0);
            Oversight.unboundSet(target, 'something', 'somethingElse');
            assert.ok(onSetSpy0.calledOnce, 'should call onSetSpy0 one time');
        });

        it('will execute multiple onSet observers', function() {
            Oversight.onSet(target, 'something', onSetSpy0);
            Oversight.onSet(target, 'something', onSetSpy1);
            Oversight.unboundSet(target, 'something', 'somethingElse');
            assert.ok(onSetSpy0.calledOnce, 'should call onSetSpy0');
            assert.ok(onSetSpy1.calledOnce, 'should call onSetSpy1');
        });

        it('will execute onSetObservers in FIFO order', function() {
            Oversight.onSet(target, 'something', onSetSpy0);
            Oversight.onSet(target, 'something', onSetSpy1);
            Oversight.unboundSet(target, 'something', 'somethingElse');
            assert.ok(onSetSpy0.calledOnce, 'should call onSetSpy0');
            assert.ok(onSetSpy1.calledOnce, 'should call onSetSpy1');
            assert.ok(onSetSpy0.calledBefore(onSetSpy1));
        });

        it('will execute an onSet observer with the correct parameters', function() {
            var oldValue = target.something;
            var newValue = 'somethingElse';
            Oversight.onSet(target, 'something', onSetSpy0);
            Oversight.unboundSet(target, 'something', newValue);
            assert.ok(onSetSpy0.calledOnce, 'should call onSetSpy0 one time');
            assert.ok(onSetSpy0.calledWith(newValue, oldValue), 'should have passed in the correct new and old values');
        });

        it('will execute onSet observers using the target as a context if none is given', function() {
            assert.notOk(target.notHereYet);
            Oversight.onSet(target, 'something', function() {
                this.notHereYet = 5;
            });
            Oversight.unboundSet(target, 'something', null);
            assert.equal(target.notHereYet, 5);
        });

        it('will execute onSet observers with the given context', function() {
            var ctx = {};
            Oversight.onSet(target, 'something', function() {
                this.notHereYet = 5;
            }, ctx);
            Oversight.unboundSet(target, 'something', null);
            assert.equal(ctx.notHereYet, 5);
        });

        it('will execute onSet observers when the new value is null or undefined', function() {
            Oversight.onSet(target, 'something', onSetSpy0);
            Oversight.unboundSet(target, 'something', null);
            assert.ok(onSetSpy0.calledOnce);
            Oversight.unboundSet(target, 'something', undefined);
            assert.ok(onSetSpy0.calledTwice);
        });
    });

    /*======================================================
     chained functions onSet
     =====================================================*/
    beforeEach(function() {
        target = {
            prop: {
                something: 'something'
            }
        };
    });

    it('will execute an onSet observer', function() {
        Oversight.onSet(target, 'prop.something', onSetSpy0);
        Oversight.unboundSet(target.prop, 'something', 'somethingElse');
        assert.ok(onSetSpy0.calledOnce, 'should call onSetSpy0 one time');
    });

    it('will execute multiple onSet observers', function() {
        Oversight.onSet(target, 'prop.something', onSetSpy0);
        Oversight.onSet(target, 'prop.something', onSetSpy1);
        Oversight.unboundSet(target.prop, 'something', 'somethingElse');
        assert.ok(onSetSpy0.calledOnce, 'should call onSetSpy0');
        assert.ok(onSetSpy1.calledOnce, 'should call onSetSpy1');
    });

    it('will execute onSetObservers in FIFO order', function() {
        Oversight.onSet(target, 'prop.something', onSetSpy0);
        Oversight.onSet(target, 'prop.something', onSetSpy1);
        Oversight.unboundSet(target.prop, 'something', 'somethingElse');
        assert.ok(onSetSpy0.calledOnce, 'should call onSetSpy0');
        assert.ok(onSetSpy1.calledOnce, 'should call onSetSpy1');
        assert.ok(onSetSpy0.calledBefore(onSetSpy1));
    });

    it('will execute an onSet observer with the correct parameters', function() {
        var oldValue = target.prop.something;
        var newValue = 'somethingElse';
        Oversight.onSet(target, 'prop.something', onSetSpy0);
        Oversight.unboundSet(target.prop, 'something', newValue);
        assert.ok(onSetSpy0.calledOnce, 'should call onSetSpy0 one time');
        assert.ok(onSetSpy0.calledWith(newValue, oldValue), 'should have passed in the correct new and old values');
    });

    it('will execute onSet observers using the target as a context if none is given', function() {
        assert.notOk(target.notHereYet);
        Oversight.onSet(target, 'prop.something', function() {
            this.notHereYet = 5;
        });
        Oversight.unboundSet(target.prop, 'something', null);
        assert.equal(target.notHereYet, 5);
    });

    it('will execute onSet observers with the given context', function() {
        var ctx = {};
        Oversight.onSet(target, 'prop.something', function() {
            this.notHereYet = 5;
        }, ctx);
        Oversight.unboundSet(target.prop, 'something', null);
        assert.equal(ctx.notHereYet, 5);
    });

    it('will execute onSet observers when the new value is null or undefined', function() {
        Oversight.onSet(target, 'prop.something', onSetSpy0);
        Oversight.unboundSet(target.prop, 'something', null);
        assert.ok(onSetSpy0.calledOnce);
        Oversight.unboundSet(target.prop, 'something', undefined);
        assert.ok(onSetSpy0.calledTwice);
    });
});