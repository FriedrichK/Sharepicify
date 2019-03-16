//const app = new PicCreator('.app', PicCreator.templates["fff"]);

//console.log(app);

var svgViewController;

const templateUrls = [
  "sharepic/templates/fff/template.json",
  "sharepic/templates/date/template.json",
  "sharepic/templates/sentence/template.json",
  "sharepic/templates/logo/template.json",
  //"sharepic/templates/widescreen/template.json"
];



(async () => {
  const templates = (await Promise.all(templateUrls.map(get))).map(JSON.parse);

  const nav = new Vue({
    el: '.navigation',
    data: {
      show: true,
      selected: 0,
      templates: templates
    },
    methods: {
      selectTemplate(event) {
        const templateItem = event.target.closest("li");
        const templateIndex = Array.from(templateItem.parentNode.children).indexOf(templateItem);

        this.selected = templateIndex;

        svgViewController = new PicCreator('.app', this.templates[this.selected], exportController.render);
      }
    }
  });

  svgViewController = new PicCreator('.app', nav.templates[nav.selected], exportController.render);



})();

const exportController = new Vue({
  el: '.export',
  data: {
    show: false,
    src: 'http://lokalo.de/wp-content/uploads/2019/01/fridayforfuture_trier.jpg'
  },
  methods: {
    close() {
      this.show = false;
    },
    render(dataURL) {
      console.log(dataURL.length);

      this.show = true;


      this.src = dataURL;
    }
  }
});




function get(url) {
  return new Promise(function(resolve, reject) {
    const xhr = new XMLHttpRequest();
    xhr.open("GET", url, true);
    xhr.addEventListener("load", function() {
      resolve(this.response);
    });
    xhr.send();
  });
}
