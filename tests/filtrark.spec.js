import { Filtrark } from '../lib/filtrark.js'

describe('Filtrark', () => {
  let filtrark = null
  beforeEach(function () {
    filtrark = new Filtrark()
  })

  it('converts a filter tuple into a comparison expression', function () {
    const testTuples = [
      [['field', '=', 99], obj => obj.field === 99, { field: 99 }],
      [['field', '!=', 99], obj => obj.field !== 99, { field: 99 }],
      [['field', '>', 99], obj => obj.field > 99, { field: 99 }],
      [['field', '<', 99], obj => obj.field < 99, { field: 99 }],
      [['field', '>=', 99], obj => obj.field >= 99, { field: 99 }],
      [['field', '<=', 99], obj => obj.field <= 99, { field: 99 }],
      [
        ['field', 'ilike', 'ABC123'],
        obj => obj.field.toLowerCase().indexOf('ABC123') >= 0,
        { field: 'ABC123' }
      ]
    ]

    for (const testTuple of testTuples) {
      const filterTuple = testTuple[0]
      const expectedFunction = (
        /** @type {(obj: Object) => boolean} */ (testTuple[1]))
      const mockObj = testTuple[2]

      const resultFunction = filtrark._parseTuple(filterTuple)
      const result = expectedFunction(mockObj)
      expect(resultFunction(mockObj)).toEqual(result)
    }
  })

  it('joins by default multiple terms with an and', function () {
    const stack = [obj => obj.field2 !== 8, obj => obj.field === 7]

    const expectedFunction = obj => {
      return obj.field === 7 && obj.field2 !== 8
    }

    const resultStack = filtrark._defaultJoin(stack)
    const resultFunction = resultStack[0]

    const mockObject = { field: 7, field2: 8 }

    expect(resultFunction(mockObject)).toEqual(
      expectedFunction(mockObject)
    )
  })

  it('parses a full stack of comparison terms with operators', function () {
    const testDomains = [
      [[['field', '=', 7]], obj => obj.field === 7, { field: 7 }],
      [[['field2', '!=', 8]], obj => obj.field2 !== 8, { field2: 8 }],
      [
        [['field', '=', 7], ['field2', '!=', 8]],
        obj => obj.field2 !== 8 && obj.field === 7,
        { field: 7, field2: 8 }
      ],
      [
        [['field', '=', 7], ['field2', '!=', 8], ['field3', '>=', 9]],
        obj => obj.field2 !== 8 && obj.field === 7 && obj.field3 >= 9,
        { field: 7, field2: 8, field3: 9 }
      ],
      [
        ['|', ['field', '=', 7], ['field2', '!=', 8]],
        obj => obj.field2 !== 8 || obj.field === 7,
        { field: 5, field2: 4 }
      ],
      [
        [
          '|',
          ['field', '=', 7],
          '!',
          ['field2', '!=', 8],
          ['field3', '>=', 9]
        ],
        obj =>
          obj.field === 7 || (!(obj.field2 !== 8) && obj.field3 >= 9),
        { field: 7, field2: 8, field3: 9 }
      ],
      [['!', ['field', '=', 7]], obj => !(obj.field === 7), { field: 7 }]
    ]

    for (const testDomain of testDomains) {
      const result = filtrark.parse(testDomain[0])
      const expected = /** @type {(obj: Object) => boolean} */ (testDomain[1])
      const obj = testDomain[2]

      expect(result(obj)).toEqual(expected(obj))
    }
  })

  it('Domain is []', function () {
    const domain = []
    const result = filtrark.parse(domain)
    expect(result({})).toBe(true)
  })

  it('Domain contains ilike operator', function () {
    const domains = [[[['field', 'ilike', 7]]]]
    for (const domain of domains) {
      const result = filtrark.parse(domain[0])
      expect(result).toBeTruthy()
    }
  })
})