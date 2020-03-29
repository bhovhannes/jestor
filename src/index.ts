interface IJestorBehavior {
  return(value: any): void
  resolveWith(value: any): void
  rejectWith(value: any): void
  throw(value: any): void
}

type JestorRuleGetter = (ruleBuilder: { whenCalledWith(...args: any[]): IJestorBehavior }) => any[]

interface IJestor {
  whenCalledWith(...args: any[]): IJestorBehavior
  followRules(ruleGetter: JestorRuleGetter): void
}

export function jestor(jestMock: jest.Mock): IJestor {
  const rules = []
  return {
    followRules: (ruleGetter) => {
      ruleGetter({
        whenCalledWith: getRuleBuilder((rule) => rules.push(rule)),
      })
      return jestMock.mockImplementation((...actualArgs) => {
        for (let i = rules.length - 1; i >= 0; --i) {
          const rule = rules[i]
          const result = rule.matcher(actualArgs)
          if (result) {
            return rule.valueWrapper(rule.returnValue)
          }
        }
      })
    },
    whenCalledWith: getRuleBuilder((rule) => {
      rules.length = 0
      return jestMock.mockImplementation((...actualArgs) => {
        const result = rule.matcher(actualArgs)
        if (result) {
          return rule.valueWrapper(rule.returnValue)
        }
      })
    }),
  }
}

const equals = (function () {
  let jestEqual = (a: any, b: any) => {}
  try {
    const MATCHER_NAME = '__matcherToGetEquals'
    expect.extend({
      [MATCHER_NAME]: function () {
        jestEqual = this.equals
        return {
          pass: true,
          message: () => '',
        }
      },
    })
    expect(1)[MATCHER_NAME]()
    delete expect[MATCHER_NAME]
    // @ts-ignore  TS2304: Cannot find name 'global'.
    delete global[Symbol.for('$$jest-matchers-object')].matchers[MATCHER_NAME]
  } catch (e) {
    // eslint-disable-next-line no-empty
  }
  return jestEqual
})()

function getRuleMatcher(args) {
  return (actualArgs) =>
    actualArgs.length === args.length &&
    actualArgs.every((actualArg, i) => {
      const arg = args[i]
      return typeof arg.asymmetricMatch === 'function'
        ? arg.asymmetricMatch(actualArg)
        : equals(arg, actualArg)
    })
}

function getRuleBuilder(collectRule) {
  return (...expectedArgs) => {
    const rule = {
      matcher: getRuleMatcher(expectedArgs),
      valueWrapper: undefined,
      returnValue: undefined,
    }
    return {
      return: (returnValue) => {
        rule.valueWrapper = (v) => v
        rule.returnValue = returnValue
        collectRule(rule)
      },

      resolveWith: (value) => {
        rule.valueWrapper = (v) => Promise.resolve(v)
        rule.returnValue = value
        collectRule(rule)
      },

      rejectWith: (value) => {
        rule.valueWrapper = (v) => Promise.reject(v)
        rule.returnValue = value
        collectRule(rule)
      },

      throw: (value) => {
        rule.valueWrapper = (v) => {
          throw v
        }
        rule.returnValue = value
        collectRule(rule)
      },
    }
  }
}
