var h_arr = [];

var raf = () => {
  var scroll_div = document.documentElement;
  var start = scroll_div.scrollTop + (scroll_div.clientHeight * -0.5)
  var end = scroll_div.scrollTop + (scroll_div.clientHeight * 1.5)
  var rows = document.querySelectorAll(".image-row");
  var compute_H = 0;
  if (rows.length)
    h_arr.forEach((h, i) => {

      var div_start = compute_H
      var div_end = compute_H + h * scroll_div.offsetWidth
      compute_H = div_end;

      // rows[i].style.background = isOverlap(start, end, div_start, div_end) ? "red" : "blue";
      isOverlap(start, end, div_start, div_end) ? rows[i].classList.add("show") : rows[i].classList.remove("show");

    })

  requestAnimationFrame(raf)
}
raf();

async function main(list) {
  var tag = document.querySelector("#tag");
  tag.innerHTML = `<div class="image-row"></div>`;
  var row = document.body.insertBefore(tag.firstChild, tag);
  var fragment = document.createDocumentFragment();

  var targetWidth = row.offsetWidth;
  var widthSum = 0
  var image_promises = list.map(entery => getImage(entery.file));
  h_arr = [];

  var ts = performance.now()

  for (var promise of image_promises) {
    var img = await promise;
    if (!img) continue
    img.style.width = "0px"
    img.style.flexGrow = img.naturalWidth / img.naturalHeight * 10
    widthSum += img.naturalWidth / img.naturalHeight * TARGET_ROW_HEIGHT;

    if (widthSum <= targetWidth)
      fragment.appendChild(img);
    if (widthSum > targetWidth) {
      widthSum -= img.naturalWidth / img.naturalHeight * TARGET_ROW_HEIGHT;

      var h = TARGET_ROW_HEIGHT / widthSum;
      h_arr.push(h);
      var h_box = document.createElement("div")
      h_box.style.paddingTop = `calc(${h} * 100% + 2px)`
      fragment.appendChild(h_box);

      row.appendChild(fragment);

      tag.innerHTML = `<div class="image-row"></div>`;
      row = document.body.insertBefore(tag.firstChild, tag);
      fragment = document.createDocumentFragment();
      fragment.appendChild(img);
      widthSum = img.naturalWidth / img.naturalHeight * TARGET_ROW_HEIGHT;
    }
  }
  var h = TARGET_ROW_HEIGHT / widthSum;
  h_arr.push(h);
  var h_box = document.createElement("div")
  h_box.style.paddingTop = `calc(${h} * 100% + 2px)`
  fragment.appendChild(h_box);
  row.appendChild(fragment);

  console.log(performance.now() - ts)

  // for(let w of workers) {
  //   w.terminate();
  // }
}
