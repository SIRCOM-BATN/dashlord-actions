const jsdom = require("jsdom");
const { fuzzy } = require("fast-fuzzy");
const { execSync } = require("child_process");

const { JSDOM } = jsdom;

const searches = [
  {
    needle: "Accessibilité : non conforme",
  },
  {
    needle: "Accessibilité : partiellement conforme",
  },
  {
    needle: "Accessibilité : totalement conforme",
  },
];

const analyseDom = async (dom, { url = "" } = {}) => {
  const text = dom.window.document.body.textContent;
  // fuzzy find the best match
  const status = searches
    .map(({ needle }) => ({ needle, score: fuzzy(needle, text) }))
    .sort((a, b) => a.score - b.score)
    .reverse();
  // ensure were confident enough
  const result = { mention: null };
  const bestStatus = status[0];
  if (bestStatus.score > 0.9) {
    result.mention = bestStatus.needle;
    // try to find related href if any
    Array.from(dom.window.document.querySelectorAll("a")).filter((a) => {
      if (fuzzy(bestStatus.needle, a.text) > 0.9) {
        // make URL absolute when possible
        const link = a.getAttribute("href");
        if (link && link !== "#") {
          if (link.match(/^https?:\/\//)) {
            result.declarationUrl = link;
          } else if (link.charAt(0) === "/") {
            const host = url.replace(/(https?:\/\/[^/]+).*/, "$1");
            result.declarationUrl = `${host}${link}`;
          } else {
            result.declarationUrl = `${url}/${link}`;
          }
        } else {
          result.declarationUrl = null;
        }
      }
    });
    // loose href search
    if (!result.declarationUrl) {
      Array.from(dom.window.document.querySelectorAll("a")).filter((a) => {
        if (fuzzy("Accessibilité", a.text) > 0.9) {
          // make URL absolute when possible
          const link = a.getAttribute("href");
          if (link && link !== "#") {
            const declarationUrl =
              link.charAt(0) === "/" ? `${url || ""}${link}` : link;
            result.declarationUrl = declarationUrl;
          } else {
            // no href
            result.declarationUrl = null;
          }
        }
      });
    }
    // try to analyse the declaration to find percentage
    if(result.declarationUrl) {
      analyseUrlForPercentage(result);
    }
  }
  return result;
};

const analyseFile = async (filePath, { url } = {}) => {
  const dom = await JSDOM.fromFile(filePath);
  return analyseDom(dom, { url });
};

// warn: this wont work for SPA applications
const analyseUrl = async (url) => {
  const dom = await JSDOM.fromURL(url);
  return analyseDom(dom, { url });
};

const analyseUrlForPercentage = (result) => {
  // get declaration HTML
  if (result.declarationUrl.toLowerCase().match(/\.pdf$/)) {
    // todo: handle PDF
    return result;
  }
  let htmlOutput;
  try {
    htmlOutput = execSync(
      `LANGUAGE=fr npx @socialgouv/get-html ${result.declarationUrl}`
    );
  } catch (e) {
    console.error(`Error: get-html failed for ${result.declarationUrl}`);
    return result;
  }
  let htmlString = htmlOutput.toString().toUpperCase();
  // delete html tags, replaces &NBSP
  htmlString = htmlString.replace(/(<([^>]+)>)/gi,'').replace(/\&NBSP\;/gi,' ');
  // find percentages on the string (page)
  let matchResult = htmlString.match(/([a-zèéà]+) (\d+[.,]?\d+? ?%)/gmi);

  if(null != matchResult && matchResult.length > 0) {
    // default is first element founded
    var elementToParse = matchResult[0];
    if(matchResult.length > 1) {
      // find most pertinent percentage
      matchResult.forEach(element => {
        let word = element.match(/([a-z]+)/gmi);
        // if prefix word is 'rendre', it is the best matching
        if(word[0] == 'RENDRE') {
          elementToParse = element;
        }
      });      
    }
    // set percentage and remove prefix words and spaces
    result.percentage = elementToParse.replace(/à|que|rendre|élève /gi,'').replace(/ /g,'');
  }

  return result;
};

module.exports = { analyseFile, analyseUrl };

if (require.main === module) {
  const url = process.argv[process.argv.length - 2]; // url, to make absolute links
  const filePath = process.argv[process.argv.length - 1]; // file path to analyse
  analyseFile(filePath, { url })
    .then((result) => console.log(JSON.stringify(result)))
    .catch(() => console.log(JSON.stringify({ declaration: undefined })));
}
