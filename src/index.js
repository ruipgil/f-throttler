const zeroJitter = () => 0

/**
 * Throttle execution of functions
 *
 * @param  {!Array<function:Promise>} functions Funtions to execute
 * @param  {Object} options Options object. In the form:
 *  {
 *    jitter: Function(Number=, Number=),
 *    interval: Number,
 *    concurrency: Number
 *  }
 *  where:
 *  - jitter: is a function that returns a number, it will be
 *    used to delay the execution of the function. The default
 *    function no jitter
 *  - interval: minimum number of milliseconds between requests
 *  - concurrency: maximum number of function to execute concurrently.
 *    Note that function that Javascript doesn't allow the execution
 *    of concurrent functions. In fact the concurrency refers to the
 *    number of promises being execute. Imagine that you set the
 *    concurrency to 2 and pass an array of functions to execute,
 *    that will make requests to webpages. With `f-throttler` you are
 *    able to have two requests at the same time, altough the code
 *    that handles it will run one at a time.
 */
const throttler = (promises, { jitter = zeroJitter, concurrency = 1, interval = 0 }) => new Promise((resolve, reject) => {
  const { length } = promises

  let error = null
  let cursor = 0
  let results = new Array(length)
  let executing = 0
  let lastRequest = null

  const exec = (position) => {
    const promise = promises[position]
    executing += 1

    if (interval && lastRequest) {
      const diff = (Date.now() - lastRequest)
      if (diff <= interval) {
        executing -= 1
        setTimeout(() => exec(position), diff)
        return
      }
    }

    const run = () => {
      lastRequest = Date.now()
      promise(position)
        .then((result) => {
          results[position] = result

          executing -= 1

          if (error) {
            return
          }

          if (cursor === (length - 1) && executing === 0) {
            resolve(results)
            return
          }

          if (!promises[cursor + 1]) {
            return
          }

          cursor += 1
          exec(cursor)
        })
        .catch((err) => {
          if (!error) {
            reject(err)
          }
        })
    }

    setTimeout(run, jitter(position, length))
  }

  for (let i = 0; i < concurrency; i++) {
    cursor = i
    exec(cursor)
  }
})

export default throttler
