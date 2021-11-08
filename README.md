# jestor

[![NPM version][npm-version-image]][npm-url] [![NPM downloads][npm-downloads-image]][npm-url] [![MIT License][license-image]][license-url] [![Coverage][codecov-image]][codecov-url]

Utility for creating mock implementations for Jest mocks.

## Usage

First add `jestor` as a devDependency.

```bash
npm install jestor --save-dev
```

or if you prefer Yarn:

```bash
yarn add jestor --dev
```

After that you can import `jestor` in your tests and use it in any test file:

```javascript
import { jestor } from 'jestor'

it('should return 4 whan called with 44', function () {
  const mock = jest.fn()

  // define mock implementation using jestor api
  jestor(mock).whenCalledWith(44).return(4)

  expect(mock(44)).toBe(4)
})
```

Proceed to [API](#api) section to see what else `jestor` can do for you.

### API

`jestor` function accepts Jest mock as a single argument and returns an object with the following methods: `whenCalledWith` and `followRules` for defining single and multiple rules correspondingly.

#### Describing single rule

The best case for `whenCalledWith` is when you want to define only one rule:

```javascript
import { jestor } from 'jestor'

it('should return 4 whan called with 44', function () {
  const mock = jest.fn()

  // whenCalledWith allows to define only a single rule
  jestor(mock).whenCalledWith(44).return(4)

  expect(mock(44)).toBe(4)
})
```

#### Describing multiple rules

If you want to define multiple rules, `followRules` should be used.  
It accepts a function, which define what mock should do when the given condition is met:

```javascript
it('should allow to define multiple rules', function () {
  const spy = jest.fn()
  jestor(spy).followRules((rules) => {
    rules.whenCalledWith(1).return(false)
    rules.whenCalledWith(2).return(true)
    rules.whenCalledWith('foo').resolveWith('foo')
    rules.whenCalledWith('bar').rejectWith('bar')
  })

  expect(spy(1)).toBe(false)
  expect(spy(2)).toBe(true)

  const foo = await spy('foo')
  expect(foo).toBe('foo')

  await spy('bar').catch((e) => {
    expect(e).toBe('bar')
  })
})
```

#### Describing conditions

As you've probably noticed, `whenCalledWith` is used directly in case of single rule, and inside callback function in case of multiple rules.  
In both cases `whenCalledWith` is used for defining conditions for the arguments mock receives.

You can pass multiple arguments to `whenCalledWith`:

```javascript
import { jestor } from 'jestor'

it('should return 6 whan called with 2 and 3', function () {
  const mock = jest.fn()

  // whenCalledWith accepts multiple arguments
  jestor(mock).whenCalledWith(2, 3).return(6)

  expect(mock(2, 3)).toBe(6)
})
```

You can pass any asymmetrical [Expect](https://jestjs.io/docs/en/expect) matcher to `whenCalledWith`.  
That includes matchers like [`anything`](https://jestjs.io/docs/en/expect#expectanything), [`any`](https://jestjs.io/docs/en/expect#expectanyconstructor), [`arrayContaining`](https://jestjs.io/docs/en/expect#expectarraycontainingarray), etc.

For example:

```javascript
import { jestor } from 'jestor'

it('should return 6 whan called with string and 3', function () {
  const mock = jest.fn()

  // whenCalledWith also accepts expect matchers
  jestor(mock).whenCalledWith(expect.any(String), 3).return(6)

  expect(mock('foo', 3)).toBe(6)
  expect(mock('baz', 3)).toBe(6)
})
```

#### Describing mock behavior

The `whenCalledWith` function returns an object which can be used to specify mock behavior - i.e. what should happen when mock is called with the given arguments.  
For example, in `jestor(mock).whenCalledWith(2, 3).return(6)` sentence the part `.return(6)` describes mock behavior when it is called with arguments `2` and `3`.

You can use the following behaviors:

##### `.return(val)`

Describes that the value `val` should be returned when mock is called:

```javascript
import { jestor } from 'jestor'

it('should return 6 whan called with string and 3', function () {
  const mock = jest.fn()

  // tell jestor to return 6 when mock is called with 3
  jestor(mock).whenCalledWith(3).return(6)

  expect(mock(3)).toBe(6)
  expect(mock(2)).not.toBe(6)
})
```

##### `.resolveWith(val)`

Describes that the the promise resolved with `val` should be returned when mock is called:

```javascript
import { jestor } from 'jestor'

it('should return resolved promise when resolveWith is used', function () {
  const mock = jest.fn()

  // tell jestor to return promise resolved with 6 when mock is called with 3
  jestor(mock).whenCalledWith(3).resolveWith(6)

  const promise = mock(3)

  // assert that we got a promise
  expect(promise.then).toBeDefined()

  // when called with value other than 3, we'll not get a promise,
  // as there is no jestor rule defined
  expect(mock(2)).toBe(undefined)

  // assert if we really got a promise resolved with 6
  const result = await promise
  expect(result).toBe(6)
})
```

##### `.rejectWith(val)`

Describes that the the promise rejected with `val` should be returned when mock is called:

```javascript
import { jestor } from 'jestor'

it('should return rejected promise when rejectWith is used', function () {
  const mock = jest.fn()

  // tell jestor to return rejected promise
  jestor(mock).whenCalledWith(2).rejectWith('failure')

  // assert if we really got a promise rejected with 'failure'
  const err = await mock(2).catch((e) => e)
  expect(err).toBe('failure')
})
```

##### `.throw(val)`

Describes that value `val` should be thrown when mock is called:

```javascript
import { jestor } from 'jestor'

it('should throw an exception when throw is used', function () {
  const mock = jest.fn()

  // tell jestor to throw
  jestor(mock).whenCalledWith(2).throw('exception')

  // assert if we really got an exception
  jestor(mock).whenCalledWith(2).throw('exception')
  expect(() => {
    spy(2)
  }).toThrow('exception')
})
```

## Rationale

Let's imagine you have a mock, returned by `jest.fn()` and want to define its implementation in a way that you specify what to return based on received arguments. Something like this:

```javascript
describe('my function', function() {
  it('should return a value', function() {
    const mock = jest.fn()
    mock.mockImplementation((obj1, obj2) => {
      if (obj1 === 'Alice') {
        return 'human'
      }
      if (typeof obj1 === 'number' && typeof obj2 === 'number') {
        return 'numbers'
      }
      if (typeof obj1 === 'function') {
        return 'function'
      }
    }))
  })
})
```

Writing such mock implementation is unpleasant experience, you end up writing a bunch of `if` statements and code quickly become messy.

Here is when `jestor` comes to rescue. With `jestor` test written above can be written as:

```javascript
import { jestor } from 'jestor'

describe('my function', function () {
  it('should return a value', function () {
    const mock = jest.fn()
    jestor(mock).followRules((rules) => {
      rules.whenCalledWith('Alice').return('human')
      rules.whenCalledWith(expect.any(Number), expect.any(Number)).return('numbers')
      rules.whenCalledWith(expect.any(Function)).return('function')
    })
  })
})
```

## Why `jestor`

It should have been named `jester`, as jester is a person who jests.  
However, the names `jester`, `jestr` and even `jster` have been taken. As well as `mocker` and `jocker`.

## License

MIT (http://www.opensource.org/licenses/mit-license.php)

[license-image]: http://img.shields.io/badge/license-MIT-blue.svg?style=flat
[license-url]: LICENSE
[npm-url]: https://www.npmjs.org/package/jestor
[npm-version-image]: https://img.shields.io/npm/v/jestor.svg?style=flat
[npm-downloads-image]: https://img.shields.io/npm/dm/jestor.svg?style=flat
[codecov-url]: https://codecov.io/gh/bhovhannes/jestor
[codecov-image]: https://img.shields.io/codecov/c/github/bhovhannes/jestor.svg
