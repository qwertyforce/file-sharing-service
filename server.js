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


app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());
app.use(cors());
app.use(fileUpload({
    limits: {
        fileSize: 100 * 1024 * 1024
    },
    abortOnLimit: true
}));
app.disable('x-powered-by');
const port = 8081;
//  https.createServer({                                      //Uncomment if you want to use https 
//       key: fs.readFileSync('key.pem'),
//       cert: fs.readFileSync('cert.pem')
//     }, app).listen(port);
// console.log(`Server is listening on port ${port}`);
app.listen(port, () => {
    console.log(`Server is listening on port ${port}`);
});
app.use(function(req, res, next) {
    if (req.originalUrl && req.originalUrl.split("/").pop() === 'favicon.ico') {
        return res.sendStatus(204);
    }
    return next();
});



app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html') //You can comment this and try to hide shortener web interface  (serve frontend from another domain for example)
})

app.post('/upload', (req, res) => {
    console.log("hit")
    if (!req.files || Object.keys(req.files).length === 0) {
        return res.status(400).send('No files were uploaded.');
    }
    let sampleFile = req.files.data;
    crypto.randomBytes(16, (err, buf) => {
        if (err) throw err;
        let id = buf.toString("base64").replace(/\/|=/g, '');
        console.log(id);
        var archive = archiver('zip', {zlib: {level: 9}});
        if (!(sampleFile instanceof Array)) {
            sampleFile=[sampleFile]
        }
            // console.log(req.files);
            sampleFile.forEach(function(ele, key) {
                archive.append(ele.data, {
                    name: ele.name
                });
            });
        var output = fs.createWriteStream(__dirname + `/download/${id}.zip`);
         archive.pipe(output);
         archive.finalize();
         res.send(id);
    })

});
app.get('/:id', (req, res) => {
    let id = req.params.id;
    console.log(id)
    if(id==="script.js" || id==="style.css"){
    res.sendFile(__dirname + `/${id}`)
    return
    }
    
    const file = path.join(__dirname,"download",`${id}.zip`)
    console.log(file)
    res.download(file,function (err) {
  if (err) {
   return res.sendStatus(404);
  }
});  

    
  });