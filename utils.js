function getRandomInt(max) {
  return Math.floor(Math.random() * max);
}

function isOverlap(a1, a2, b1, b2) {
  var a_before_b = (a1 <= b1 && a1 <= b2) &&
    (a2 <= b1 && a2 <= b2)

  var a_after_b = (a1 >= b1 && a1 >= b2) &&
    (a2 >= b1 && a2 >= b2)

  var not_overlap = a_before_b || a_after_b

  return !not_overlap

}