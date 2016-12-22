export function randomPick (list) {
  return list[Math.floor(Math.random() * list.length)]
}

export function randomBetween (low, high) {
  return Math.floor(Math.random() * high) + low
}

export function randomCenter (v) {
  return (v * (Math.random() - 0.5))
}
