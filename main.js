
var raf = () => {
  var scroll_div = document.documentElement;
  var top = (scroll_div.clientHeight * -0.5)
  var bottom = (scroll_div.clientHeight * 1.5)
  var rows = document.querySelectorAll(".image-row");
  if (rows.length)
    rows.forEach(row => {
      var rect = row.getBoundingClientRect();
      var div_top = rect.top
      var div_bottom = rect.bottom

      isOverlap(top, bottom, div_top, div_bottom)
        ? row.classList.add("show")
        : row.classList.remove("show");
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
  var h_box = document.createElement("div")
  h_box.style.paddingTop = `calc(${h} * 100% + 2px)`
  fragment.appendChild(h_box);
  row.appendChild(fragment);

  console.log(performance.now() - ts)

  // for(let w of workers) {
  //   w.terminate();
  // }
}
