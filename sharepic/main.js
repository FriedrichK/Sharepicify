

class PicCreator {
  constructor(selector, template, exportRender = function() {}) {
    const self = this;

    this.e = document.querySelector(selector);

    this.template = template;

    this.fonts = template.fonts;

    this.document = get(this.template.document);

    this.toolsList.innerHTML = "";

    this.previewContainer.innerHTML = "";

    (async () => {
      const doc = await this.document;




      this.previewContainer.innerHTML = doc;

      (async () => {
        const fontSheet = document.createElement("style");
        fontSheet.classList.add("font-sheet");

        const fontFaces = (self.fonts || []).map(async fontObj => {

          const result = await request(fontObj.src, "arraybuffer");
          const byteArray = new Uint8Array(result.response);
          const base64Str = Uint8ToBase64(byteArray);

          const dataURL = 'data:' + fontObj.mime + ";base64," + base64Str;

          return `
            @font-face {
              font-family: "${ fontObj.name }";
              src: url("${ dataURL }");
            }
          `;
        });

        //fontSheet.innerHTML = ;

        const fontsStr = (await Promise.all(fontFaces)).join("\n");

        fontSheet.innerHTML = fontsStr;

        this.previewSVG.insertBefore(fontSheet, this.previewMain);
      })();

      const data = {
        width: 1200,
        height: 1200,
        get ratio() {
          return this.width / this.height;
        }
      };

      for (let field of this.template.fields) {
        try {
          data[field.key] = "default" in field ? field.default : field.properties.items[0].value;
        }
        catch (e) {

        }



        const settingLi = PicCreator.createSetting(field, function(value) {
          // Value return

          dataController[field.key] = value;

          setTimeout(function() {
            self.replaceURLsWithData();
          }, 500);

        });
        this.toolsList.append(settingLi);
      }



      this.toolsList.append(PicCreator.createElement("li", {
        childs: [
          PicCreator.createElement("div", {
            className: "label",
            childs: [
              PicCreator.createElement("span", {}, "Export")
            ]
          }),
          PicCreator.createElement("div", {
            className: "controls",
            childs: Export.map(function(exportMethod) {
              return PicCreator.createElement("button", {
                eventListeners: [
                  {
                    type: "click",
                    async callback(event) {
                      const result = await exportMethod.convert(self.previewContainer.getElementsByTagName("svg")[0]);


                      exportRender(result);

                    }
                  }
                ]
              }, exportMethod.name)
            })
          })
        ]
      }));



      const dataController = new Vue({
        el: this.previewMain,
        data: data,
        methods: {
          textInfo: PicCreator.textInfo
        }
      });

      this.replaceURLsWithData();



    })();





  }
  async replaceURLsWithData() {
    const images = getElementByMethod(this.previewMain, e => {
      const href = e.getAttributeNS('http://www.w3.org/1999/xlink', 'href');
      return href ? href.search(/\./) > -1 : false;
    });
    for (let img of images) {
      const href = img.getAttributeNS('http://www.w3.org/1999/xlink', 'href');


      const result = await request(href, "arraybuffer");
      const byteArray = new Uint8Array(result.response);
      const base64Str = Uint8ToBase64(byteArray);

      const headers = parseHeaders(result.headers);

      const dataURL = 'data:' + headers["content-type"] + ";base64," + base64Str;

      img.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', dataURL);

      //const mime =
    }
  }

  get toolsList() {
    return this.e.getElementsByClassName("tools")[0].getElementsByTagName("ul")[0];
  }
  get previewContainer() {
    return this.e.getElementsByClassName("preview")[0];
  }
  get previewSVG() {
    return this.previewContainer.getElementsByTagName("svg")[0];
  }
  get previewMain() {
    return this.previewSVG.getElementsByClassName("main")[0];
  }
  loadTools() {


  }
  static createSetting(field, callback) {
    return PicCreator.createElement("li", {
      childs: [
        PicCreator.createElement("div", {
          className: "label",
          childs: [
            PicCreator.createElement("span", {}, field.description)
          ]
        }),
        PicCreator.createElement("div", {
          className: "controls",
          childs: Components[field.type](field, callback)
        })
      ]
    })
  }
  static textInfo(str, style) {
    //return getTextWidth(str, style);

    const text = document.createElement("span");
    //const text = document.querySelector("#test-text");
    text.style.fontFamily = style.fontFamily;
    text.style.fontSize = style.fontSize;
    text.classList.add("test-text");
    text.innerHTML = str;

    document.body.append(text);

    const bounding = text.getBoundingClientRect();

    const info = {
      width: bounding.width,
      height: bounding.height
    };

    document.body.removeChild(text);

    return info;
  }
  static imageInfo(url) {
    return new Promise(function(resolve, reject) {
      const img = document.createElement("img");
      img.src = url;
      img.classList.add("test-image");

      document.body.append(img);

      img.addEventListener("load", function() {
        const bounding = img.getBoundingClientRect();
        resolve({
          width: bounding.width,
          height: bounding.height,
          ratio: bounding.width / bounding.height
        });
        document.body.removeChild(img);
      });
    });
  }
  static createElement(tagName, options, inner) {
    if (typeof options === "string") options = {
      className: options
    }
    options.attributes = options.attributes == undefined ? {} : options.attributes;
    options.childs = options.childs == undefined ? [] : options.childs;
    if (inner) options.childs.push(document.createTextNode(inner));
    options.eventListeners = options.eventListeners == undefined ? [] : options.eventListeners;
    options.className = options.className == undefined ? "" : options.className;
    var e = document.createElement(tagName);
    e.setAttribute("class", options.className);
    for (var i = 0; i < Object.keys(options.attributes).length; i++) {
      e.setAttribute(Object.keys(options.attributes)[i], options.attributes[Object.keys(options.attributes)[i]]);
    }
    for (let property in options.properties) {
      if (options.properties.hasOwnProperty(property)) {
        e[property] = options.properties[property];
      }
    }
    for (var i = 0; i < options.childs.length; i++) {
      if (typeof options.childs[i] == "string") {
        e.innerHTML += options.childs[i];
      }
      else {
        e.appendChild(options.childs[i]);
      }
    }
    for (var i = 0; i < options.eventListeners.length; i++) {
      e.addEventListener(options.eventListeners[i].type, options.eventListeners[i].callback);
    }
    return e;
  }

}
PicCreator.templates = {};


function get(url, type = null) {
  console.log(url);
  return new Promise(function(resolve, reject) {
    const xhr = new XMLHttpRequest();
    xhr.responseType = type;
    xhr.open("GET", url, true);
    xhr.addEventListener("load", function() {
      resolve(this.response);
    });
    xhr.send();
  });
}

function request(url, type) {
  return new Promise(function(resolve, reject) {
    const xhr = new XMLHttpRequest();
    xhr.responseType = type;
    xhr.open("GET", url, true);
    xhr.addEventListener("load", function() {
      resolve({
        response: this.response,
        headers: this.getAllResponseHeaders()
      });
    });
    xhr.send();
  });
}




const Components = {
  file(field, callback) {
    return [
      PicCreator.createElement("button", {
        className: "btn",
        eventListeners: [
          {
            type: "click",
            callback(event) {
              this.parentNode.getElementsByTagName("input")[0].click();
            }
          }
        ]
      }, "Bild auswählen"),
      PicCreator.createElement("input", {
        attributes: {
          type: "file"
        },
        eventListeners: [
          {
            type: "change",
            callback(event) {
              const file = event.target.files[0];

              const reader = new FileReader();
              reader.addEventListener("load", async function(event) {
                const dataURL = event.target.result;
                //callback({});

                const imgInfo = await PicCreator.imageInfo(dataURL);

                console.log(imgInfo);

                callback({
                  info: imgInfo,
                  data: dataURL
                });
              });

              reader.readAsDataURL(file);


            }
          }
        ]
      })
    ];
  },
  number(field, callback) {
    return [
      PicCreator.createElement("input", {
        attributes: {
          type: field.properties.kind == "slider" ? "range" : "number",
          value: field.properties.value,
          max: field.properties.max,
          min: field.properties.min,
          step: field.properties.step
        },
        eventListeners: [
          {
            type: "input",
            callback(event) {
              callback(parseFloat(this.value));
            }
          }
        ]
      })
    ];
  },
  text(field, callback) {
    return [
      PicCreator.createElement("textarea", {

        eventListeners: [
          {
            type: "input",
            callback(event) {
              const lines = this.value.split("\n");

              callback(lines);
            }
          }
        ]
      }, field.default.join("\n"))
    ];
  },
  line(field, callback) {
    return [
      PicCreator.createElement("input", {
        attributes: {
          type: "text",
          value: field.default
        },
        eventListeners: [
          {
            type: "input",
            callback(event) {
              callback(this.value);
            }
          }
        ]
      })
    ]
  },
  selection(field, callback) {
    return [
      PicCreator.createElement("div", {
        className: "selection",
        childs: field.properties.items.map(item => {
          return PicCreator.createElement("div", {
            className: "selection-item",
            properties: {
              item: item
            },
            childs: [
              PicCreator.createElement("div", {
                className: "selection-item-inner",
                attributes: {
                  style: "background-image: url('" + ({
                    value: item.render || item.value,
                    file: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxzdmcgd2lkdGg9IjYwJSIgaGVpZ2h0PSI2MCUiIHk9IjIwJSIgeD0iMjAlIiB2aWV3Qm94PSIwIDAgMzE1LjU4IDMxNS41OCI+ICAgIAk8cGF0aCBmaWxsPSIjZmZmIiBkPSJNMzEwLjU4LDMzLjMzMUg1Yy0yLjc2MSwwLTUsMi4yMzgtNSw1djIzOC45MThjMCwyLjc2MiwyLjIzOSw1LDUsNWgzMDUuNThjMi43NjMsMCw1LTIuMjM4LDUtNVYzOC4zMzEgIAkJQzMxNS41OCwzNS41NjksMzEzLjM0MywzMy4zMzEsMzEwLjU4LDMzLjMzMXogTTI4NS41OCwyNDIuMzg2bC02OC43NjYtNzEuMjE0Yy0wLjc2LTAuNzg1LTIuMDAzLTAuODM2LTIuODIzLTAuMTE0bC00Ny42OTUsNDEuOTc5ICAJCWwtNjAuOTYyLTc1LjA2MWMtMC4zOTYtMC40OS0wLjk3NS0wLjc3LTEuNjMtMC43NTZjLTAuNjMxLDAuMDEzLTEuMjIsMC4zMTYtMS41OTcsMC44MjJMMzAsMjM0Ljc5N1Y2My4zMzFoMjU1LjU4VjI0Mi4zODZ6Ii8+ICAJPHBhdGggZD0iTTIxMC4wNTksMTM1LjU1NWMxMy41MzgsMCwyNC41MjktMTAuOTgyLDI0LjUyOS0yNC41MzFjMC0xMy41NDUtMTAuOTkxLTI0LjUzMy0yNC41MjktMjQuNTMzICAJCWMtMTMuNTQ5LDAtMjQuNTI4LDEwLjk4OC0yNC41MjgsMjQuNTMzQzE4NS41MzEsMTI0LjU3MiwxOTYuNTExLDEzNS41NTUsMjEwLjA1OSwxMzUuNTU1eiIgZmlsbD0iI2ZmZiIvPiAgICA8L3N2Zz48L3N2Zz4="
                  })[item.type] + "')"
                }
              })
            ],
            eventListeners: [
              {
                type: "click",
                async callback() {
                  const self = this;

                  const typeHandlers = {
                    value() {
                      return new Promise(function(resolve, reject) {
                        resolve(self.item.value);

                      });
                    },
                    file() {
                      return new Promise(function(resolve, reject) {
                        //const fileInput = document.createElement("input");
                        const fileInput = document.querySelector("#hidden-file-input");
                        //fileInput.type = "file";

                        //console.log(fileInput);
                        //alert(fileInput);


                        fileInput.addEventListener("change", function(event) {
                          console.log("!");
                          const file = event.target.files[0];
                          //console.log(file);
                          //alert(file);

                          const reader = new FileReader();
                          reader.addEventListener("load", async function(event) {
                            const dataURL = event.target.result;

                            //console.log(dataURL.length);
                            //alert(dataURL.length);

                            const imgInfo = await PicCreator.imageInfo(dataURL);

                            //console.log(imgInfo);
                            //alert(imgInfo);

                            resolve({
                              info: imgInfo,
                              type: "dataURL",
                              value: dataURL
                            });
                          });

                          reader.readAsDataURL(file);
                        })

                        fileInput.click();

                      });
                    }
                  }

                  const result = await typeHandlers[item.type]();

                  console.log(result);

                  callback(result);
                }
              }
            ]
          })
        })
      })
    ];
  }
};


const Export = [
  {
    name: "PNG",
    convert(svg) {
      return new Promise(function(resolve, reject) {
        const viewBox = svg.getAttribute("viewBox").split(" ").map(numberStr => parseInt(numberStr));

        var c = document.getElementById("render-canvas");

        c.width = viewBox[2];
        c.height = viewBox[3];
        var ctx = c.getContext("2d");

        const img = document.createElement("img");
        img.src = 'data:image/svg+xml;base64,' + Base64.encode(svg.outerHTML);

        const loadScreen = document.querySelector(".load-screen");

        img.addEventListener("load", function() {
          ctx.drawImage(img, 0, 0);

          loadScreen.classList.add("show");


          setTimeout(function() {
            const dataURL = c.toDataURL("image/png");

            resolve(dataURL);

            loadScreen.classList.remove("show");
          }, 2500);
        });
      });
    }
  },
  {
    name: "SVG",
    convert(svg) {
      return new Promise(function(resolve, reject) {
        const dataURL = 'data:image/svg+xml;base64,' + Base64.encode(svg.outerHTML);

        resolve(dataURL);
      });
    }
  }
];


function getTextWidth(text, font) {
    // re-use canvas object for better performance
    var canvas = getTextWidth.canvas || (getTextWidth.canvas = document.createElement("canvas"));
    var context = canvas.getContext("2d");
    context.font = font;
    var metrics = context.measureText(text);
    return metrics.width;
}


// Create Base64 Object
const Base64 = {_keyStr:"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",encode:function(e){var t="";var n,r,i,s,o,u,a;var f=0;e=Base64._utf8_encode(e);while(f<e.length){n=e.charCodeAt(f++);r=e.charCodeAt(f++);i=e.charCodeAt(f++);s=n>>2;o=(n&3)<<4|r>>4;u=(r&15)<<2|i>>6;a=i&63;if(isNaN(r)){u=a=64}else if(isNaN(i)){a=64}t=t+this._keyStr.charAt(s)+this._keyStr.charAt(o)+this._keyStr.charAt(u)+this._keyStr.charAt(a)}return t},decode:function(e){var t="";var n,r,i;var s,o,u,a;var f=0;e=e.replace(/[^A-Za-z0-9\+\/\=]/g,"");while(f<e.length){s=this._keyStr.indexOf(e.charAt(f++));o=this._keyStr.indexOf(e.charAt(f++));u=this._keyStr.indexOf(e.charAt(f++));a=this._keyStr.indexOf(e.charAt(f++));n=s<<2|o>>4;r=(o&15)<<4|u>>2;i=(u&3)<<6|a;t=t+String.fromCharCode(n);if(u!=64){t=t+String.fromCharCode(r)}if(a!=64){t=t+String.fromCharCode(i)}}t=Base64._utf8_decode(t);return t},_utf8_encode:function(e){e=e.replace(/\r\n/g,"\n");var t="";for(var n=0;n<e.length;n++){var r=e.charCodeAt(n);if(r<128){t+=String.fromCharCode(r)}else if(r>127&&r<2048){t+=String.fromCharCode(r>>6|192);t+=String.fromCharCode(r&63|128)}else{t+=String.fromCharCode(r>>12|224);t+=String.fromCharCode(r>>6&63|128);t+=String.fromCharCode(r&63|128)}}return t},_utf8_decode:function(e){var t="";var n=0;var r=c1=c2=0;while(n<e.length){r=e.charCodeAt(n);if(r<128){t+=String.fromCharCode(r);n++}else if(r>191&&r<224){c2=e.charCodeAt(n+1);t+=String.fromCharCode((r&31)<<6|c2&63);n+=2}else{c2=e.charCodeAt(n+1);c3=e.charCodeAt(n+2);t+=String.fromCharCode((r&15)<<12|(c2&63)<<6|c3&63);n+=3}}return t}}


function getElementByMethod(e, handler) {
  const results = [];
  function loop(e) {
    for (let child of e.children) {
      if (handler(child)) {
        results.push(child);
      }
      loop(child);
    }
  }
  loop(e);
  return results;
}

function Uint8ToBase64(u8Arr){
  var CHUNK_SIZE = 0x8000; //arbitrary number
  var index = 0;
  var length = u8Arr.length;
  var result = '';
  var slice;
  while (index < length) {
    slice = u8Arr.subarray(index, Math.min(index + CHUNK_SIZE, length));
    result += String.fromCharCode.apply(null, slice);
    index += CHUNK_SIZE;
  }
  return btoa(result);
}

function parseHeaders(headersStr) {
  const headers = {};
  for (let headerLine of headersStr.split("\n")) {
    const lineMatch = headerLine.match(/([^\:]*):\s{0,}(.*)/);
    if (lineMatch) {
      headers[lineMatch[1]] = lineMatch[2];
    }
  }
  return headers;
}
