const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const crypto = require('crypto');
const cors = require('cors')
const https = require('https');
const fs = require('fs');
const path = require('path');
const fileUpload = require('express-fileupload');
var archiver = require('archiver');


app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.use(cors());
app.use(fileUpload({
  limits: { fileSize: 50 * 1024 * 1024 },
}));
app.disable('x-powered-by');
var Links = {};
const port=7777;
//  https.createServer({                                      //Uncomment if you want to use https 
//       key: fs.readFileSync('key.pem'),
//       cert: fs.readFileSync('cert.pem')
//     }, app).listen(port);
// console.log(`Server is listening on port ${port}`);
app.listen(port, () => {          
    console.log(`Server is listening on port ${port}`);
});
app.use( function(req, res, next) {
  if (req.originalUrl && req.originalUrl.split("/").pop() === 'favicon.ico') {
    return res.sendStatus(204);
  }
  return next();
});
function handle_link(req,res,id){
    var link=Links[id];
   if (link.error_before!==0) {
    Links[id].error_before-=1;
    res.sendStatus(404)
    return
   }
   if(link.destroy_after!==0){
     Links[id].destroy_after-=1;
     res.redirect(link.url);
   }else{
    delete Links[id]
    res.sendStatus(404)
   }
}

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'))        //You can comment this and try to hide shortener web interface  (serve frontend from another domain for example)
})

app.post('/link', (req, res) => {
    console.log(req.body)
    if (!req.body) {
        return res.status(400);
    }
    let Url = req.body.url.trim();
    let preview_protection = (req.body.preview_protection.trim()==="true") ? 1 : 0;
    let destroy_after=parseInt(req.body.destroy_after.trim());
    let error_before=parseInt(req.body.error_before.trim());

    if(!Url.includes('://')){
      Url=`http://${Url}`
    }
    crypto.randomBytes(16, (err, buf) => {
        if (err) throw err;
        let id = buf.toString("base64").replace(/\/|=/g, '');
        Links[id] = {
            url:Url,
            preview_protection:preview_protection,
            destroy_after:destroy_after || 1,
            error_before:error_before || 0
        };
        console.log(id);
        res.send(id)
    });
});

app.post('/upload', (req, res) => {
   console.log("hit")
   if (!req.files || Object.keys(req.files).length === 0) {
    return res.status(400).send('No files were uploaded.');
  }
   let sampleFile = req.files.data;
 if(!(sampleFile instanceof Array)){
       sampleFile.mv(path.resolve(`./${sampleFile.name}`), function(err) {
        if (err){
          console.log(err);
        }else{
 
        }
      });
    }else{

var archive = archiver('zip', {
  zlib: { level: 9 } // Sets the compression level.
});
var output = fs.createWriteStream(__dirname + '/example.zip');
archive.pipe(output);
    console.log(req.files);
    sampleFile.forEach(function(ele, key) {
      archive.append(ele.data, { name: ele.name });
    });
    archive.finalize();


    }


});
app.get('/:id', (req, res) => {
    console.log(`Referer header presented - ${req.headers.referer!==undefined}`)
    let id = req.params.id;
    var link = Links[id]
    console.log(link)
    if (link) {
        if (link.preview_protection===1){
           if(req.headers.referer!==undefined){
             handle_link(req,res,id);
           }
           else{
              res.sendStatus(404);
           }
        }else{
             handle_link(req,res,id);
        }
    } else {
        res.sendStatus(404);
    }
});
