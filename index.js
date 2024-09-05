import puppeteer from "puppeteer";
import Express from "express";

const app = Express();
app.set("port", 9101);
app.use(Express.json())


const openWebPage = async (url, doc) => {
  const browser = await puppeteer.launch(
    { args: ["--no-sandbox", "--disable-setuid-sandbox"], headless: true}
  );
  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');
  await page.goto(url);
  await page.waitForSelector("#btnAceptar");  
  await page.type("#txtRuc", doc);
  await page.click("#btnAceptar");
  console.log("page opened 1");
  await new Promise(r => setTimeout(r, 3000));
  const output = await page.evaluate(async () => {
    const elemento = document.querySelectorAll('.list-group-item-heading');
    const text = document.querySelectorAll('.list-group-item-text');
    const data1 = [...elemento].map((e, idx) => {
      const element1 = e.innerText;
      return {
        element1
      };
    })
    const data2 = [...text].map((e, idx) => {
      const element2 = e.innerText;
      return {
        element2
      };
    })
    return {
      data1,
      data2
    }
  })
  console.log("page opened222");
  console.log(output);
  await browser.close();
  return output;
}

// const browserP = puppeteer.launch({
//   args: ["--no-sandbox", "--disable-setuid-sandbox"],headless: true
// });
  
  app.post("/sunat", async (req, res) => {
    let body_filtros = req.body;
   const resp = await openWebPage('https://e-consultaruc.sunat.gob.pe/cl-ti-itmrconsruc/FrameCriterioBusquedaWeb.jsp', body_filtros.documento)
   res.send(resp);
  });

  app.post("/sunarp", (req, res) => {
    let page;
    let body_filtros = req.body;
    console.log(body_filtros);
    (async () => {
      page = await (await browserP).newPage();
      await page.setUserAgent('5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/69.0.3497.100 Safari/537.36');
        await page.goto('https://www.sunarp.gob.pe/seccion/servicios/detalles/0/c3.html');
        await page.click(".jcrm-botondetalle a");
        await page.waitForSelector("#MainContent_btnSearch");  
        await page.waitForTimeout(3000);
        await page.waitForSelector("#g-recaptcha-response");  
        await page.type("#MainContent_txtNoPlaca",body_filtros.documento);
        const captha = body_filtros.captcha;
        await page.evaluate(`document.getElementById("g-recaptcha-response").innerHTML="${captha}";`);
        await page.click("#MainContent_btnSearch");
        await page.waitForTimeout(3000);
        let response = await page.screenshot({ encoding: "base64", fullPage: true });
        let salida ={base64:response};
        res.send(salida);
      
          })()
          .catch(err => res.sendStatus(500))
          .finally(async () => await page.close())
        ;
  });
  
  
app.post("/minsa", (req, res) => {
    let page;
    let body_filtros = req.body;
    console.log(body_filtros);
    (async () => {
    
      page = await (await browserP).newPage();
      await page.setUserAgent('5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/69.0.3497.100 Safari/537.36');
      await page.goto('https://carnetvacunacion.minsa.gob.pe');
      await page.waitForTimeout(2000);
      await page.waitForSelector("#g-recaptcha-response");  
      await page.type("#txtFechaEmision",body_filtros.fechaemision);
      await page.type("#txtFechaNacimiento",body_filtros.fechanacimiento);
      await page.type("#jaFrmRegVacLstTipoDoc","1");// DNI
      await page.type("#jaFrmRegVacTxtNumDoc",body_filtros.documento);
      await page.click("#chkPolitica");
      const response = body_filtros.captcha;
      await page.evaluate(`document.getElementById("g-recaptcha-response").innerHTML="${response}";`);
      await page.waitForSelector("#btnCerrar");
      await page.click("#btnCerrar");
      await page.click("#btnEntrar");
      var apellido =body_filtros.apellido;
      await page.waitForTimeout(3000);
      let salida = await page.evaluate(({apellido}) =>{
          var elemento = document.querySelector('div.col-9')?.innerHTML|| 'Error'; 
        if(elemento.includes(apellido)){
          return "OK";
        }else {
          return "Error";
        } 
      },{apellido});
      console.log(salida);
      let resultado ="";
      if(salida=="OK"){   
        await page.waitForSelector(".jOptVacuna");
        await page.click(".jOptVacuna");
        await page.waitForTimeout(1000);
        await page.waitForSelector("#jaBntCertificado");
        await page.click("#jaBntCertificado");
        await page.waitForTimeout(2000);
        const pages = await (await browserP).pages();
        resultado = await pages[2].screenshot({ encoding: "base64", fullPage: true })
        await pages[2].close();
      }  else{
          resultado="Error";
      }
      res.send(resultado);
    
    })()
      .catch(err => res.sendStatus(500))
      .finally(async () => await page.close())
    ;
  });

  
app.post("/", (req, res) => {
  res.send("tu documento es : "+req.body.documento);
});
    
app.listen(app.get("port"), () => 
  console.log("app running on port", app.get("port"))
);