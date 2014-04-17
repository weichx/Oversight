Oversight
=========
Oversight is a library for observing method calls and property access.

## Usage

#### Quick Intro

```javascript
  var pointCount = 0;
  var Point = function(x, y) {
    this.x = x;
    this.y = y;
  };
  
  Point = Oversight.observify(Point);
  Oversight.before(Point, function(x, y) {
    console.log('creating a point with coordinates x: ' + x + ', y: ' + y);
  });
  
  Oversight.after(Point, function(x, y) {
    pointCount++;
    console.log('finished creating a point, there are now ' + pointCount + ' points');
  });
  
  var p0 = new Point(1, 1);
  var p1 = new Point(2, 2);
  
  //output
  //creating a point with coordinates x: 1, y: 1
  //finished creating a point, there are now 1 points
  //creating a point with coordinates x: 2, y: 2
  //finished creating a point, there are now 2 points
  
  
```

#### Observer Types
There are a handful of observer types that can be applied to functions
- `around`
- `before`
- `after`
- `afterReturn`

They will always execute in the above order. All observer functions are executed with the same arguments that the original function was invoked with, with the exception of `afterReturn`, which will take the return value of the original function as it's first parameter and the arguments of the original invocation as the remaining parameters.

##### Before
`before` will execute before the original function with the same arguments.
```javascript
var original = function(arg0, arg1) {
  console.log('original', arg0, arg1);
};

original = Oversight.observify(original);
Oversight.before(original, function(arg0, arg1) {
  console.log('before', arg0, arg1);
});

original('a', 'b');
//output
//before a b
//original a b
```

##### After
`after` will execute after the original function with the same arguments.
```javascript
var original = function(arg0, arg1) {
  console.log('original', arg0, arg1);
};

original = Oversight.observify(original);
Oversight.after(original, function(arg0, arg1) {
  console.log('after', arg0, arg1);
});

original('a', 'b');
//output
//original a b
//after a b
```

##### AfterReturn
`afterReturn` will execute after the original function and after any `after` advice. It will be invoked with the first parameter set to the return value of the original function and the rest of the parameters set to the arguments to the original function.
```javascript
var original = function(arg0, arg1) {
  console.log('original', arg0, arg1);
  return 'returnValue';
};

original = Oversight.observify(original);
Oversight.afterReturn(original, function(retn, arg0, arg1) {
  console.log('afterReturn', retn, arg0, arg1);
});

original('a', 'b');
//output
//original a b
//afterReturn returnValue a b
```

## Installation

via npm:
```bash
$ npm install oversight
```

There will three files in `oversight/dist`, one for each of the common script loading methods:
- `oversight-amd.js` for use with require.js
- `oversight-common.js` for use with common js style modules
- `oversight-global.js` injects Oversight into the global scope

Just take the one you like.



## License

MIT
