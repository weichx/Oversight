var Oversight = require('../dist/oversight-test.js');
var assert = require('../node_modules/chai/chai.js').assert;
var sinon = require('../node_modules/sinon/lib/sinon.js');

describe('set tests', function() {
    it('can be used to set properties on any object', function() {
        var obj = {};
        Oversight.unboundSet(obj, 'prop', 1);
        assert.equal(obj.prop, 1, 'obj.prop should be 1');
    });

    it('can be used to set properties on functions', function() {
        var fn = function(){};
        Oversight.unboundSet(fn, 'prop', 1);
        assert.equal(fn.prop, 1, 'fn.prop should be 1');
    });

    it('will call onSet observers if any exist', function() {
        var target = {};
        var onSetSpy = sinon.spy();
        Oversight.onSet(target, 'prop', onSetSpy);
        Oversight.unboundSet(target, 'prop', null);
        assert.ok(onSetSpy.calledOnce);
        assert.ok(onSetSpy.calledWith(null));
    });

    it('will build up chains of objects and fns that respect declared observers', function() {
        var target = {};
        var afterSpy = sinon.spy();
        Oversight.after(target, 'a.b.c.fn', afterSpy);
        Oversight.unboundSet(target, 'a', {
            b: {
                c: {
                    fn: function(){}
                }
            }
        });
        target.a.b.c.fn();
        assert.ok(afterSpy.calledOnce);
    });

    it('will tear down chains of objects and functions', function() {
        var target = {};
        var a = {
            b: {
                c: {
                    fn: function(){}
                }
            }
        };
        var afterSpy = sinon.spy();
        Oversight.after(target, 'a.b.c.fn', afterSpy);
        Oversight.unboundSet(target, 'a', a);
        assert.ok(a.__observers);
        assert.ok(a.__observers.__chains);
        assert.equal(a.__observers.__chains.length, 1, 'one chain should be created');
        Oversight.unboundSet(target, 'a', {});
        assert.equal(a.__observers.__chains.length, 0, 'chain should have been torn down');
    });

    it('will destroy the original function when setting an observified fn to another value', function() {
        var original = function(){};
        var target = {
            fn: original
        };
        Oversight.after(target, 'fn', function(){});
        assert.equal(original, target.__observers['fn'].original, 'make sure old fn is there');
        Oversight.unboundSet(target, 'fn', 1);
        assert.equal(null, target.__observers['fn'].original, 'set key to integer, old fn should be destroyed');
    });
});