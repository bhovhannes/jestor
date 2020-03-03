import { jester } from './index'

describe('jester', function() {
  it(`should allow to specify multiple rules using followRules`, async function() {
    const spy = jest.fn()
    jester(spy).followRules(rules => [
      rules.whenCalledWith(1).return(false),
      rules.whenCalledWith(2).return(true),
      rules.whenCalledWith('foo').resolveWith('foo'),
      rules.whenCalledWith('bar').rejectWith('bar')
    ])

    expect(spy(1)).toBe(false)
    expect(spy(2)).toBe(true)

    const foo = await spy('foo')
    expect(foo).toBe('foo')

    await spy('bar').catch(e => {
      expect(e).toBe('bar')
    })
  })

  it(`should support asymmetric expect matchers inside rules`, function() {
    const spy = jest.fn()
    jester(spy)
      .whenCalledWith(expect.any(Object), 7, expect.anything())
      .return(true)
    expect(spy({}, 7, 'foo')).toBe(true)
    expect(spy('foo')).toBeUndefined()
  })

  it(`should use jest equals for comparing rule arguments`, function() {
    const spy = jest.fn()
    jester(spy)
      .whenCalledWith({ foo: [1] })
      .return(4)
    expect(spy({ foo: [1] })).toBe(4)
  })

  it(`should allow to specify a rule returning a value`, function() {
    const spy = jest.fn()
    jester(spy)
      .whenCalledWith(44)
      .return(4)
    expect(spy(44)).toBe(4)
  })

  it(`should allow to specify a rule returning a promise resolved with the given value`, async function() {
    const spy = jest.fn()
    jester(spy)
      .whenCalledWith(44)
      .resolveWith('success')
    const foo = await spy(44)
    expect(foo).toBe('success')
  })

  it(`should allow to specify a rule returning a promise rejected with the given value`, async function() {
    const spy = jest.fn()
    jester(spy)
      .whenCalledWith(44)
      .rejectWith('failure')
    const err = await spy(44).catch(e => e)
    expect(err).toBe('failure')
  })

  it(`should allow to specify a rule throwing an exception`, function() {
    const spy = jest.fn()
    jester(spy)
      .whenCalledWith(44)
      .throw('exception')
    expect(() => {
      spy(44)
    }).toThrow('exception')
  })
})
