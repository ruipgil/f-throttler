const zeroJitter = () => 0

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
