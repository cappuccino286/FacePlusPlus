var express = require('express');
var router = express.Router();
var request = require('request');
var multer = require('multer');
const storage = multer.memoryStorage();
const { createCanvas, loadImage } = require('canvas');
var upload = multer({ dest: './uploads', storage: storage });

const URL = "https://faceplusplus-faceplusplus.p.rapidapi.com/facepp/v3/detect";
const HEADERS = {
   'Content-Type': "application/x-www-form-urlencoded",
   "X-RapidAPI-Host": "faceplusplus-faceplusplus.p.rapidapi.com",
   "X-RapidAPI-Key": "32b922efb4msh6cbcd9ae7090e69p1cac76jsn8d165c7ddb46"
};
const RETURN_ATTRIBUTES = "gender,age,emotion,skinstatus";
const CANVAS_COLOR = '#28a745';
router.get('/', function (req, res, next) {
   res.render('face-detection');
});

router.post('/', upload.single('imgUpload'), function (req, res, next) {
   if (req.file) {
      var image_base64 = 'data:image/jpeg;base64,' + req.file.buffer.toString("base64");
   } else {
      req.flash('error', "No File Uploaded...");
      res.render('index');
   }
   request.post({
      url: URL,
      headers: HEADERS,
      form: { image_base64: image_base64, return_attributes: RETURN_ATTRIBUTES }
   }, function (err, response, body) {
      var body = JSON.parse(body);
      if (response.statusCode == 200) {
         loadImage(image_base64).then((image) => {
            var faces = body.faces;
            var new_img = hightlightFaces(faces,image);
            res.render('face-detection', { url_img: image_base64, new_img: new_img, faces: faces });
         });
      } else {
         req.flash('statusCode', response && response.statusCode);
         req.flash('error', body.error_message);
         res.redirect('index');
      }
   });
});

router.post('/face-detection-url', function (req, res) {
   var image_url = req.body.image_url;
   request.post({
      url: URL,
      headers: HEADERS,
      form: { image_url: image_url, return_attributes: RETURN_ATTRIBUTES }
   }, function (err, response, body) {
      var body = JSON.parse(body);
      if (response.statusCode == 200) {
         loadImage(image_url).then((image) => {
            var faces = body.faces;
            console.log(faces);
            var new_img = hightlightFaces(faces,image);
            res.render('face-detection', { url_img: image_url, new_img: new_img, faces: faces });
         });
      } else {
         req.flash('statusCode', response && response.statusCode);
         req.flash('error', body.error_message);
         res.redirect('/index');
      }
   });
});
function hightlightFaces(faces,image) {
   const canvas = createCanvas(image.width, image.height)
   const context = canvas.getContext('2d');
   context.drawImage(image, 0, 0, image.width, image.height)
   // Now draw boxes around all the faces

   context.strokeStyle = CANVAS_COLOR;

   faces.forEach((face, i) => {
      context.lineWidth = '5';
      var face_rectangle = face.face_rectangle;
      context.beginPath();
      let origX = face_rectangle.left;
      let origY = face_rectangle.top;
      context.lineTo(origX, origY);
      context.lineTo(origX + face_rectangle.width, origY);
      context.lineTo(origX + face_rectangle.width, origY + face_rectangle.height);
      context.lineTo(origX, origY + face_rectangle.height);
      context.lineTo(origX, origY);

      // Text zone
      var textWidth = 80;
      var textHeight = 30;
      context.font = '20px Impact';
      context.fillStyle = CANVAS_COLOR;
      
      context.fillRect(origX+30, origY + face_rectangle.height+30, textWidth, textHeight);
      
      var strFace = "Face " +(i+1);
      context.fillStyle = "#FFF";
      context.textAlign = "center";
      context.fillText(strFace, origX+30+textWidth/2, origY + face_rectangle.height+40+textHeight/2);
      context.stroke();

      context.lineWidth = '2';
      context.moveTo(origX, origY + face_rectangle.height);
      context.lineTo(origX+30, origY + face_rectangle.height+textHeight);
      context.stroke();
   });
   const fs = require('fs');
   console.log(image);
   console.log(__dirname);
   const out = fs.createWriteStream(__dirname + '/test.png')
   const stream = canvas.createPNGStream();
   stream.pipe(out);
   out.on('finish', () =>  console.log('The PNG file was created.'))
   return canvas.toDataURL();
}
module.exports = router;
