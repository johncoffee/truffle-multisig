import chalk from 'chalk'

const {yellow, red, blue, greenBright, grey} = chalk

export function shorten (adders: string) {
  return `${adders.substr(0,4)}..${adders.substr(-2)}`
}
